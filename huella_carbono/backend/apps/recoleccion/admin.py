from django.contrib import admin
from .models import (
    Periodo, RegistroEnergia, RegistroCombustible,
    RegistroLogistica, RegistroComprasConsumibles, RegistroResiduos,
)


@admin.register(Periodo)
class PeriodoAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'anio', 'mes', 'cerrado', 'fecha_creacion']
    list_filter = ['cerrado', 'anio']


@admin.register(RegistroEnergia)
class RegistroEnergiaAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'tipo_energia', 'sede', 'area', 'consumo_kwh', 'costo_cop']
    list_filter = ['tipo_energia', 'periodo__anio', 'sede']
    search_fields = ['sede', 'area', 'proveedor']


@admin.register(RegistroCombustible)
class RegistroCombustibleAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'tipo_combustible', 'placa_o_equipo', 'area', 'cantidad_litros']
    list_filter = ['tipo_combustible', 'tipo_vehiculo', 'periodo__anio']


@admin.register(RegistroLogistica)
class RegistroLogisticaAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'origen', 'destino', 'tipo_transporte', 'distancia_km', 'numero_viajes']
    list_filter = ['tipo_transporte', 'periodo__anio']


@admin.register(RegistroComprasConsumibles)
class RegistroComprasAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'categoria', 'descripcion', 'cantidad', 'unidad', 'peso_total_kg']
    list_filter = ['categoria', 'origen_nacional', 'periodo__anio']
    search_fields = ['descripcion', 'proveedor']


@admin.register(RegistroResiduos)
class RegistroResiduosAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'tipo_residuo', 'area', 'sede', 'cantidad_kg', 'metodo_disposicion']
    list_filter = ['tipo_residuo', 'metodo_disposicion', 'periodo__anio']
