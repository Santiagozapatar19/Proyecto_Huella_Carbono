from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import (
    Periodo,
    RegistroEnergia, RegistroCombustible, RegistroLogistica,
    RegistroComprasConsumibles, RegistroResiduos,
)
from .serializers import (
    PeriodoSerializer,
    RegistroEnergiaSerializer, RegistroCombustibleSerializer,
    RegistroLogisticaSerializer, RegistroComprasConsumiblesSerializer,
    RegistroResiduosSerializer,
)
from .filters import (
    RegistroEnergiaFilter, RegistroCombustibleFilter,
    RegistroLogisticaFilter, RegistroComprasFilter, RegistroResiduosFilter,
)


class PeriodoViewSet(viewsets.ModelViewSet):
    queryset = Periodo.objects.all()
    serializer_class = PeriodoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['anio', 'mes', 'cerrado']

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cierra un período para que no se puedan hacer más ediciones."""
        periodo = self.get_object()
        if periodo.cerrado:
            return Response({'detail': 'El período ya está cerrado.'}, status=400)
        periodo.cerrado = True
        periodo.save()
        return Response({'detail': f'Período {periodo} cerrado exitosamente.'})

    @action(detail=True, methods=['get'])
    def resumen(self, request, pk=None):
        """Resumen de registros por tipo en el período."""
        periodo = self.get_object()
        return Response({
            'periodo': str(periodo),
            'energia': {
                'registros': periodo.registros_energia.count(),
                'total_kwh': periodo.registros_energia.aggregate(t=Sum('consumo_kwh'))['t'] or 0,
            },
            'combustible': {
                'registros': periodo.registros_combustible.count(),
                'total_litros': periodo.registros_combustible.aggregate(t=Sum('cantidad_litros'))['t'] or 0,
            },
            'logistica': {
                'registros': periodo.registros_logistica.count(),
                'total_km': periodo.registros_logistica.aggregate(t=Sum('distancia_km'))['t'] or 0,
            },
            'compras': {
                'registros': periodo.registros_compras.count(),
                'total_kg': periodo.registros_compras.aggregate(t=Sum('peso_total_kg'))['t'] or 0,
            },
            'residuos': {
                'registros': periodo.registros_residuos.count(),
                'total_kg': periodo.registros_residuos.aggregate(t=Sum('cantidad_kg'))['t'] or 0,
            },
        })


class RegistroEnergiaViewSet(viewsets.ModelViewSet):
    """HU-01: CRUD completo de registros de energía."""
    queryset = RegistroEnergia.objects.select_related('periodo', 'registrado_por').all()
    serializer_class = RegistroEnergiaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = RegistroEnergiaFilter
    search_fields = ['sede', 'area', 'proveedor', 'numero_factura']
    ordering_fields = ['fecha_registro', 'consumo_kwh', 'costo_cop']

    def get_queryset(self):
        user = self.request.user
        # Visualizadores solo ven su área
        if user.rol == 'visualizador' and user.area:
            return self.queryset.filter(area=user.area)
        return self.queryset

    @action(detail=False, methods=['get'])
    def por_sede(self, request):
        """Agrupado por sede."""
        qs = self.filter_queryset(self.get_queryset())
        data = qs.values('sede').annotate(
            total_kwh=Sum('consumo_kwh'),
            registros=Count('id')
        ).order_by('-total_kwh')
        return Response(list(data))


class RegistroCombustibleViewSet(viewsets.ModelViewSet):
    """HU-02: CRUD de registros de combustible."""
    queryset = RegistroCombustible.objects.select_related('periodo', 'registrado_por').all()
    serializer_class = RegistroCombustibleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = RegistroCombustibleFilter
    search_fields = ['placa_o_equipo', 'area', 'proveedor']
    ordering_fields = ['fecha_registro', 'cantidad_litros', 'costo_cop']

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Agrupado por tipo de combustible."""
        qs = self.filter_queryset(self.get_queryset())
        data = qs.values('tipo_combustible').annotate(
            total_litros=Sum('cantidad_litros'),
            registros=Count('id')
        ).order_by('-total_litros')
        return Response(list(data))


class RegistroLogisticaViewSet(viewsets.ModelViewSet):
    """HU-02: CRUD de registros de logística."""
    queryset = RegistroLogistica.objects.select_related('periodo', 'registrado_por').all()
    serializer_class = RegistroLogisticaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = RegistroLogisticaFilter
    search_fields = ['origen', 'destino', 'proveedor_logistico']
    ordering_fields = ['fecha_registro', 'distancia_km']


class RegistroComprasConsumiblesViewSet(viewsets.ModelViewSet):
    """HU-03: CRUD de registros de compras y consumibles."""
    queryset = RegistroComprasConsumibles.objects.select_related('periodo', 'registrado_por').all()
    serializer_class = RegistroComprasConsumiblesSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = RegistroComprasFilter
    search_fields = ['descripcion', 'proveedor', 'area']
    ordering_fields = ['fecha_registro', 'cantidad', 'costo_cop']

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Agrupado por categoría."""
        qs = self.filter_queryset(self.get_queryset())
        data = qs.values('categoria').annotate(
            total_kg=Sum('peso_total_kg'),
            registros=Count('id')
        ).order_by('-total_kg')
        return Response(list(data))


class RegistroResiduosViewSet(viewsets.ModelViewSet):
    """HU-04: CRUD de registros de residuos generados."""
    queryset = RegistroResiduos.objects.select_related('periodo', 'registrado_por').all()
    serializer_class = RegistroResiduosSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = RegistroResiduosFilter
    search_fields = ['descripcion', 'area', 'sede', 'gestor_externo']
    ordering_fields = ['fecha_registro', 'cantidad_kg']

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Agrupado por tipo de residuo."""
        qs = self.filter_queryset(self.get_queryset())
        data = qs.values('tipo_residuo').annotate(
            total_kg=Sum('cantidad_kg'),
            registros=Count('id')
        ).order_by('-total_kg')
        return Response(list(data))
