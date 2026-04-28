from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.recoleccion.models import Periodo
from .models import Anomalia
from .serializers import AnomaliaSerializer, AnomaliaUpdateSerializer
from .analisis import (
    tablero_tendencia, tablero_emision_por_fuente,
    tablero_energia_por_sede, tablero_residuos_por_tipo,
    tablero_costos_por_periodo, analizar_anomalias_periodo,
)


class TableroViewSet(viewsets.ViewSet):
    """
    HU-06: Endpoints de datos para los tableros de visualización.
    Todos son GET, sin modelo propio (calculado en tiempo real desde los datos).
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def tendencia(self, request):
        """Serie temporal de huella total y por fuente."""
        n = int(request.query_params.get('periodos', 12))
        return Response(tablero_tendencia(n))

    @action(detail=False, methods=['get'])
    def emision_por_fuente(self, request):
        """Totales acumulados por fuente de emisión."""
        return Response(tablero_emision_por_fuente())

    @action(detail=False, methods=['get'])
    def energia_por_sede(self, request):
        """Consumo de energía por sede."""
        return Response(tablero_energia_por_sede())

    @action(detail=False, methods=['get'])
    def residuos_por_tipo(self, request):
        """Residuos por tipo y método de disposición."""
        return Response(tablero_residuos_por_tipo())

    @action(detail=False, methods=['get'])
    def costos(self, request):
        """Costos operativos por período."""
        return Response(tablero_costos_por_periodo())

    @action(detail=False, methods=['get'])
    def resumen_general(self, request):
        """Resumen ejecutivo con KPIs principales para el dashboard."""
        from apps.calculo.models import ResultadoCalculo
        from django.db.models import Sum, Count

        ultimo_calculo = ResultadoCalculo.objects.select_related('periodo').first()
        total_anomalias_activas = Anomalia.objects.filter(estado='nueva').count()
        periodos_con_datos = Periodo.objects.count()

        return Response({
            'ultimo_calculo': {
                'periodo': str(ultimo_calculo.periodo) if ultimo_calculo else None,
                'total_tco2e': float(ultimo_calculo.total_tco2e) if ultimo_calculo else 0,
            },
            'anomalias_activas': total_anomalias_activas,
            'periodos_registrados': periodos_con_datos,
            'tendencia_ultimos_3': tablero_tendencia(3),
        })


class AnomaliaViewSet(viewsets.ModelViewSet):
    """
    HU-07: Gestión de anomalías detectadas.
    """
    queryset = Anomalia.objects.select_related('periodo', 'revisada_por').all()
    serializer_class = AnomaliaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['periodo', 'fuente', 'severidad', 'estado']
    ordering_fields = ['desviacion_pct', 'detectada_en', 'severidad']

    def get_serializer_class(self):
        if self.action in ['partial_update', 'update']:
            return AnomaliaUpdateSerializer
        return AnomaliaSerializer

    def perform_update(self, serializer):
        """Registra quién revisó la anomalía y cuándo."""
        data = {}
        if serializer.validated_data.get('estado') in ['revisada', 'resuelta', 'descartada']:
            data['revisada_por'] = self.request.user
            data['fecha_revision'] = timezone.now()
        serializer.save(**data)

    @action(detail=False, methods=['post'], url_path='analizar/(?P<periodo_id>[^/.]+)')
    def analizar(self, request, periodo_id=None):
        """
        POST /api/visualizacion/anomalias/analizar/{periodo_id}/
        Corre el detector de anomalías para el período dado.
        """
        try:
            periodo = Periodo.objects.get(pk=periodo_id)
        except Periodo.DoesNotExist:
            return Response({'detail': 'Período no encontrado.'}, status=404)

        encontradas = analizar_anomalias_periodo(periodo)
        return Response({
            'periodo': str(periodo),
            'anomalias_encontradas': len(encontradas),
            'detalle': encontradas,
        })

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Conteo de anomalías por severidad y estado."""
        return Response({
            'por_severidad': {
                'alta':  Anomalia.objects.filter(severidad='alta').count(),
                'media': Anomalia.objects.filter(severidad='media').count(),
                'baja':  Anomalia.objects.filter(severidad='baja').count(),
            },
            'por_estado': {
                'nueva':      Anomalia.objects.filter(estado='nueva').count(),
                'revisada':   Anomalia.objects.filter(estado='revisada').count(),
                'resuelta':   Anomalia.objects.filter(estado='resuelta').count(),
                'descartada': Anomalia.objects.filter(estado='descartada').count(),
            },
        })
