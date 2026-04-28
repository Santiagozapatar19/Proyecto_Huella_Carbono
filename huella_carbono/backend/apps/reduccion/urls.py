from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanReduccionViewSet, IniciativaViewSet, EvidenciaViewSet, AlertaViewSet

router = DefaultRouter()
router.register('planes',     PlanReduccionViewSet, basename='plan')
router.register('iniciativas',IniciativaViewSet,    basename='iniciativa')
router.register('evidencias', EvidenciaViewSet,     basename='evidencia')
router.register('alertas',    AlertaViewSet,        basename='alerta')

urlpatterns = [path('', include(router.urls))]
