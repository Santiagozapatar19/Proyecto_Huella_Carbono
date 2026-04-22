from django.contrib.auth.models import AbstractUser
from django.db import models


class Rol(models.TextChoices):
    ADMIN = 'admin', 'Administrador'
    ANALISTA = 'analista', 'Analista Ambiental'
    RESPONSABLE_AREA = 'responsable_area', 'Responsable de Área'
    VISUALIZADOR = 'visualizador', 'Visualizador'


class Usuario(AbstractUser):
    """Usuario personalizado del sistema."""
    email = models.EmailField(unique=True)
    rol = models.CharField(max_length=20, choices=Rol.choices, default=Rol.VISUALIZADOR)
    area = models.CharField(max_length=100, blank=True, help_text='Área de la empresa a la que pertenece')
    cargo = models.CharField(max_length=100, blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['first_name', 'last_name']

    def __str__(self):
        return f'{self.get_full_name()} ({self.email})'

    @property
    def nombre_completo(self):
        return self.get_full_name()

    def tiene_permiso_escritura(self):
        return self.rol in [Rol.ADMIN, Rol.ANALISTA, Rol.RESPONSABLE_AREA]
