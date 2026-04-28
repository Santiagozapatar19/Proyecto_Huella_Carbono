from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Usuario
from .serializers import UsuarioSerializer, UsuarioCreateSerializer, CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login: retorna access + refresh + datos del usuario."""
    serializer_class = CustomTokenObtainPairSerializer


class RegistroUsuarioView(generics.CreateAPIView):
    """Crear nuevo usuario (solo admins)."""
    queryset = Usuario.objects.all()
    serializer_class = UsuarioCreateSerializer
    permission_classes = [permissions.IsAdminUser]


class PerfilView(APIView):
    """Ver y actualizar el perfil del usuario autenticado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UsuarioSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListaUsuariosView(generics.ListAPIView):
    """Listar todos los usuarios (solo admins y analistas)."""
    queryset = Usuario.objects.filter(activo=True)
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol in ['admin', 'analista']:
            return Usuario.objects.filter(activo=True)
        return Usuario.objects.filter(id=user.id)
