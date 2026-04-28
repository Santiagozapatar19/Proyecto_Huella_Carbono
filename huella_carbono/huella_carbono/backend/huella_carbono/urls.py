from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('', RedirectView.as_view(url='/api/docs/', permanent=False)),

    # Admin
    path('admin/', admin.site.urls),

    # Documentación API (Swagger)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Apps
    path('api/auth/', include('apps.usuarios.urls')),
    path('api/recoleccion/', include('apps.recoleccion.urls')),
    path('api/calculo/', include('apps.calculo.urls')),
    path('api/visualizacion/', include('apps.visualizacion.urls')),
    path('api/reduccion/', include('apps.reduccion.urls')),
    path('api/reportes/', include('apps.reportes.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
