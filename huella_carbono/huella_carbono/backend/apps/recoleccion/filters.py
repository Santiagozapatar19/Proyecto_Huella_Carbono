import django_filters
from .models import (
    RegistroEnergia, RegistroCombustible,
    RegistroLogistica, RegistroComprasConsumibles, RegistroResiduos,
)


class RegistroEnergiaFilter(django_filters.FilterSet):
    anio = django_filters.NumberFilter(field_name='periodo__anio')
    mes  = django_filters.NumberFilter(field_name='periodo__mes')

    class Meta:
        model = RegistroEnergia
        fields = ['periodo', 'tipo_energia', 'sede', 'area', 'anio', 'mes']


class RegistroCombustibleFilter(django_filters.FilterSet):
    anio = django_filters.NumberFilter(field_name='periodo__anio')
    mes  = django_filters.NumberFilter(field_name='periodo__mes')

    class Meta:
        model = RegistroCombustible
        fields = ['periodo', 'tipo_combustible', 'tipo_vehiculo', 'area', 'anio', 'mes']


class RegistroLogisticaFilter(django_filters.FilterSet):
    anio = django_filters.NumberFilter(field_name='periodo__anio')
    mes  = django_filters.NumberFilter(field_name='periodo__mes')

    class Meta:
        model = RegistroLogistica
        fields = ['periodo', 'tipo_transporte', 'anio', 'mes']


class RegistroComprasFilter(django_filters.FilterSet):
    anio = django_filters.NumberFilter(field_name='periodo__anio')
    mes  = django_filters.NumberFilter(field_name='periodo__mes')

    class Meta:
        model = RegistroComprasConsumibles
        fields = ['periodo', 'categoria', 'area', 'origen_nacional', 'anio', 'mes']


class RegistroResiduosFilter(django_filters.FilterSet):
    anio = django_filters.NumberFilter(field_name='periodo__anio')
    mes  = django_filters.NumberFilter(field_name='periodo__mes')

    class Meta:
        model = RegistroResiduos
        fields = ['periodo', 'tipo_residuo', 'metodo_disposicion', 'area', 'sede', 'anio', 'mes']
