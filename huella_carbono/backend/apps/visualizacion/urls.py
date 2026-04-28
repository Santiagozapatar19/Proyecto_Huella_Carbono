from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TableroViewSet, AnomaliaViewSet

router = DefaultRouter()
router.register('tablero',   TableroViewSet,  basename='tablero')
router.register('anomalias', AnomaliaViewSet, basename='anomalia')

urlpatterns = [path('', include(router.urls))]
