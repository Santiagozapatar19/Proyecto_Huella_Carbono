from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, RegistroUsuarioView, PerfilView, ListaUsuariosView

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('registro/', RegistroUsuarioView.as_view(), name='registro'),
    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('usuarios/', ListaUsuariosView.as_view(), name='lista_usuarios'),
]
