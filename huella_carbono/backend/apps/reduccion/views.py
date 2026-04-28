from datetime import date, timedelta
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from .models import PlanReduccion, Iniciativa, EvidenciaIniciativa, AlertaDesviacion
from .serializers import (
    PlanReduccionSerializer, IniciativaSerializer,
    EvidenciaSerializer, AlertaSerializer,
)


def generar_alertas(iniciativa):
    """Genera alertas automáticas para una iniciativa según su estado."""
    alertas = []
    hoy = date.today()

    # Retraso: fecha_fin ya pasó y no está completada
    if iniciativa.fecha_fin_plan < hoy and iniciativa.estado not in ['completada', 'cancelada']:
        dias_retraso = (hoy - iniciativa.fecha_fin_plan).days
        alertas.append(AlertaDesviacion(
            iniciativa=iniciativa,
            tipo='retraso',
            mensaje=f'La iniciativa lleva {dias_retraso} día(s) de retraso respecto al cronograma planificado.',
        ))

    # Sin evidencias en >30 días estando en curso
    if iniciativa.estado == 'en_curso':
        ultima_evidencia = iniciativa.evidencias.first()
        if ultima_evidencia:
            dias_sin_evidencia = (hoy - ultima_evidencia.fecha_registro.date()).days
            if dias_sin_evidencia > 30:
                alertas.append(AlertaDesviacion(
                    iniciativa=iniciativa,
                    tipo='sin_evidencia',
                    mensaje=f'Sin evidencias nuevas hace {dias_sin_evidencia} días. Actualiza el avance.',
                ))
        else:
            alertas.append(AlertaDesviacion(
                iniciativa=iniciativa,
                tipo='sin_evidencia',
                mensaje='Esta iniciativa en curso no tiene ninguna evidencia registrada.',
            ))

    return alertas


class PlanReduccionViewSet(viewsets.ModelViewSet):
    """HU-08: CRUD de planes de reducción."""
    queryset = PlanReduccion.objects.prefetch_related('iniciativas').select_related('responsable', 'creado_por').all()
    serializer_class = PlanReduccionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['estado', 'anio_objetivo']
    search_fields = ['nombre', 'descripcion']

    @action(detail=True, methods=['get'])
    def progreso(self, request, pk=None):
        """Resumen de progreso del plan."""
        plan = self.get_object()
        iniciativas = plan.iniciativas.all()
        total_estimado  = iniciativas.aggregate(t=Sum('reduccion_estimada_tco2e'))['t'] or 0
        total_real      = iniciativas.filter(estado='completada').aggregate(t=Sum('reduccion_real_tco2e'))['t'] or 0

        return Response({
            'plan': plan.nombre,
            'meta_reduccion_pct': float(plan.meta_reduccion_pct),
            'meta_tco2e': plan.meta_tco2e,
            'linea_base_tco2e': float(plan.linea_base_tco2e),
            'reduccion_estimada_tco2e': float(total_estimado),
            'reduccion_real_tco2e': float(total_real or 0),
            'avance_pct': round(float(total_real or 0) / plan.meta_tco2e * 100, 2) if plan.meta_tco2e > 0 else 0,
            'iniciativas': {
                'total':      iniciativas.count(),
                'pendientes': iniciativas.filter(estado='pendiente').count(),
                'en_curso':   iniciativas.filter(estado='en_curso').count(),
                'completadas':iniciativas.filter(estado='completada').count(),
                'canceladas': iniciativas.filter(estado='cancelada').count(),
            },
        })

    @action(detail=True, methods=['get'])
    def cronograma(self, request, pk=None):
        """Lista de iniciativas ordenadas por fecha para el cronograma (Gantt)."""
        plan = self.get_object()
        iniciativas = plan.iniciativas.order_by('fecha_inicio_plan')
        return Response(IniciativaSerializer(iniciativas, many=True).data)


class IniciativaViewSet(viewsets.ModelViewSet):
    """HU-08 + HU-09: CRUD de iniciativas y cambio de estado."""
    queryset = Iniciativa.objects.select_related('plan', 'responsable').all()
    serializer_class = IniciativaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['plan', 'estado', 'fuente_impacto', 'area']
    search_fields = ['nombre', 'descripcion', 'area', 'sede']
    ordering_fields = ['impacto', 'factibilidad', 'reduccion_estimada_tco2e', 'fecha_inicio_plan']

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """
        POST /api/reduccion/iniciativas/{id}/cambiar_estado/
        Body: { "estado": "en_curso" | "completada" | "cancelada",
                "reduccion_real_tco2e": 12.5 }  ← solo si completada
        """
        iniciativa = self.get_object()
        nuevo_estado = request.data.get('estado')
        estados_validos = ['pendiente', 'en_curso', 'completada', 'cancelada']

        if nuevo_estado not in estados_validos:
            return Response({'detail': f'Estado inválido. Opciones: {estados_validos}'}, status=400)

        iniciativa.estado = nuevo_estado
        if nuevo_estado == 'en_curso' and not iniciativa.fecha_inicio_real:
            iniciativa.fecha_inicio_real = date.today()
        if nuevo_estado == 'completada':
            iniciativa.fecha_fin_real = date.today()
            reduccion_real = request.data.get('reduccion_real_tco2e')
            if reduccion_real:
                iniciativa.reduccion_real_tco2e = reduccion_real
        iniciativa.save()

        # Genera alertas automáticas
        alertas = generar_alertas(iniciativa)
        AlertaDesviacion.objects.filter(iniciativa=iniciativa, resuelta=False).delete()
        AlertaDesviacion.objects.bulk_create(alertas)

        return Response(IniciativaSerializer(iniciativa).data)

    @action(detail=True, methods=['get'])
    def alertas(self, request, pk=None):
        """Alertas activas de una iniciativa específica."""
        iniciativa = self.get_object()
        alertas = AlertaDesviacion.objects.filter(iniciativa=iniciativa, resuelta=False)
        return Response(AlertaSerializer(alertas, many=True).data)

    @action(detail=False, methods=['get'])
    def priorizadas(self, request):
        """Iniciativas ordenadas por score impacto × factibilidad."""
        qs = self.filter_queryset(self.get_queryset())
        qs = sorted(qs, key=lambda x: x.score_priorizacion, reverse=True)
        return Response(IniciativaSerializer(qs, many=True).data)

    @action(detail=False, methods=['post'])
    def verificar_alertas(self, request):
        """
        Recorre todas las iniciativas activas y genera alertas nuevas.
        POST /api/reduccion/iniciativas/verificar_alertas/
        """
        iniciativas_activas = Iniciativa.objects.filter(estado__in=['pendiente','en_curso'])
        total_alertas = 0
        for ini in iniciativas_activas:
            AlertaDesviacion.objects.filter(iniciativa=ini, resuelta=False).delete()
            alertas = generar_alertas(ini)
            AlertaDesviacion.objects.bulk_create(alertas)
            total_alertas += len(alertas)
        return Response({'alertas_generadas': total_alertas})


class EvidenciaViewSet(viewsets.ModelViewSet):
    """HU-09: Gestión de evidencias de iniciativas."""
    queryset = EvidenciaIniciativa.objects.select_related('iniciativa', 'registrado_por').all()
    serializer_class = EvidenciaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['iniciativa']

    def get_queryset(self):
        iniciativa_id = self.request.query_params.get('iniciativa')
        if iniciativa_id:
            return self.queryset.filter(iniciativa_id=iniciativa_id)
        return self.queryset


class AlertaViewSet(viewsets.ModelViewSet):
    """HU-09: Alertas de desviación."""
    queryset = AlertaDesviacion.objects.select_related('iniciativa').all()
    serializer_class = AlertaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['tipo', 'resuelta', 'iniciativa']

    @action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        alerta = self.get_object()
        alerta.resuelta = True
        alerta.save()
        return Response({'detail': 'Alerta marcada como resuelta.'})

    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Solo alertas no resueltas."""
        qs = AlertaDesviacion.objects.filter(resuelta=False).select_related('iniciativa')
        return Response(AlertaSerializer(qs, many=True).data)
