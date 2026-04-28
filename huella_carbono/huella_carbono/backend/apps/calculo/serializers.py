from rest_framework import serializers
from .models import ResultadoCalculo, LineaBase


class ResultadoCalculoSerializer(serializers.ModelSerializer):
    periodo_label      = serializers.StringRelatedField(source='periodo', read_only=True)
    calculado_por_nombre = serializers.StringRelatedField(source='calculado_por', read_only=True)
    resumen_fuentes    = serializers.ReadOnlyField()

    class Meta:
        model  = ResultadoCalculo
        fields = [
            'id', 'periodo', 'periodo_label',
            'total_tco2e', 'energia_tco2e', 'combustible_tco2e',
            'logistica_tco2e', 'compras_tco2e', 'residuos_tco2e',
            'resumen_fuentes', 'detalle_json',
            'calculado_por_nombre', 'fecha_calculo',
        ]
        read_only_fields = fields


class LineaBaseSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.StringRelatedField(source='creado_por', read_only=True)

    class Meta:
        model  = LineaBase
        fields = ['id', 'nombre', 'anio', 'total_tco2e', 'descripcion',
                  'creado_por_nombre', 'fecha_creacion']
        read_only_fields = ['id', 'creado_por_nombre', 'fecha_creacion']

    def create(self, validated_data):
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)
