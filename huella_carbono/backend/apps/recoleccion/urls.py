from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PeriodoViewSet,
    RegistroEnergiaViewSet, RegistroCombustibleViewSet,
    RegistroLogisticaViewSet, RegistroComprasConsumiblesViewSet,
    RegistroResiduosViewSet,
)

router = DefaultRouter()
router.register('periodos',     PeriodoViewSet,                    basename='periodo')
router.register('energia',      RegistroEnergiaViewSet,            basename='energia')
router.register('combustible',  RegistroCombustibleViewSet,        basename='combustible')
router.register('logistica',    RegistroLogisticaViewSet,          basename='logistica')
router.register('compras',      RegistroComprasConsumiblesViewSet, basename='compras')
router.register('residuos',     RegistroResiduosViewSet,           basename='residuos')

urlpatterns = [
    path('', include(router.urls)),
]
