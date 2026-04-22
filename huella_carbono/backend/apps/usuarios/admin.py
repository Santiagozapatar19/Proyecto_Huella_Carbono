from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'rol', 'area', 'activo']
    list_filter = ['rol', 'activo', 'area']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['first_name']

    fieldsets = UserAdmin.fieldsets + (
        ('Información del Sistema', {
            'fields': ('rol', 'area', 'cargo', 'activo')
        }),
    )
