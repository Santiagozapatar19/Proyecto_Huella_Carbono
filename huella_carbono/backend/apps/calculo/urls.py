from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CalculoViewSet, LineaBaseViewSet

router = DefaultRouter()
router.register('', CalculoViewSet, basename='calculo')
router.register('linea-base', LineaBaseViewSet, basename='linea-base')

urlpatterns = [path('', include(router.urls))]
