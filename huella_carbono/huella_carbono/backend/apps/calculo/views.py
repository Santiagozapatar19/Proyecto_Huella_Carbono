from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.recoleccion.models import Periodo
from .models import ResultadoCalculo, LineaBase
from .serializers import ResultadoCalculoSerializer, LineaBaseSerializer
from .motor import calcular_huella_periodo, comparar_periodos


class CalculoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    HU-05: Cálculo automático de huella de carbono.
    Endpoints de lectura + acción de cálculo.
    """
    queryset = ResultadoCalculo.objects.select_related('periodo', 'calculado_por').all()
    serializer_class = ResultadoCalculoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['periodo']

    @action(detail=False, methods=['post'], url_path='calcular/(?P<periodo_id>[^/.]+)')
    def calcular(self, request, periodo_id=None):
        """
        Ejecuta el cálculo de huella para un período específico.
        POST /api/calculo/calcular/{periodo_id}/
        """
        try:
            periodo = Periodo.objects.get(pk=periodo_id)
        except Periodo.DoesNotExist:
            return Response({'detail': 'Período no encontrado.'}, status=404)

        resultado_data = calcular_huella_periodo(periodo)

        # Guarda o actualiza el resultado en BD
        obj, created = ResultadoCalculo.objects.update_or_create(
            periodo=periodo,
            defaults={
                'total_tco2e':       resultado_data['total_tco2e'],
                'energia_tco2e':     resultado_data['resumen'][0]['tco2e'],
                'combustible_tco2e': resultado_data['resumen'][1]['tco2e'],
                'logistica_tco2e':   resultado_data['resumen'][2]['tco2e'],
                'compras_tco2e':     resultado_data['resumen'][3]['tco2e'],
                'residuos_tco2e':    resultado_data['resumen'][4]['tco2e'],
                'detalle_json':      resultado_data,
                'calculado_por':     request.user,
            }
        )

        return Response({
            'creado': created,
            'resultado': ResultadoCalculoSerializer(obj).data,
            'calculo_completo': resultado_data,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def tendencia(self, request):
        """
        Comparación de huella entre todos los períodos con cálculo previo.
        GET /api/calculo/tendencia/
        """
        periodos_ids = ResultadoCalculo.objects.values_list('periodo_id', flat=True).distinct()
        periodos_qs  = Periodo.objects.filter(id__in=periodos_ids)
        data = comparar_periodos(periodos_qs)
        return Response(data)

    @action(detail=False, methods=['get'])
    def resumen_actual(self, request):
        """
        Último cálculo disponible (período más reciente).
        GET /api/calculo/resumen_actual/
        """
        ultimo = ResultadoCalculo.objects.select_related('periodo').first()
        if not ultimo:
            return Response({'detail': 'No hay cálculos registrados aún.'}, status=404)
        return Response(ResultadoCalculoSerializer(ultimo).data)

    @action(detail=False, methods=['get'])
    def factores(self, request):
        """
        Retorna los factores de emisión usados en el sistema.
        GET /api/calculo/factores/
        """
        from .factores_emision import (
            FACTOR_ENERGIA, FACTOR_COMBUSTIBLE, FACTOR_LOGISTICA,
            FACTOR_CONSUMIBLE, FACTOR_RESIDUO,
        )
        return Response({
            'nota': 'Factores en kgCO2e por unidad indicada. Fuente: UPME 2023, IPCC AR6, GHG Protocol.',
            'energia_kwh':       FACTOR_ENERGIA,
            'combustible_litro': FACTOR_COMBUSTIBLE,
            'logistica_tkm':     FACTOR_LOGISTICA,
            'consumible_kg':     FACTOR_CONSUMIBLE,
            'residuo_kg':        FACTOR_RESIDUO,
        })


class LineaBaseViewSet(viewsets.ModelViewSet):
    """CRUD de líneas base de referencia."""
    queryset = LineaBase.objects.all()
    serializer_class = LineaBaseSerializer
    permission_classes = [permissions.IsAuthenticated]
