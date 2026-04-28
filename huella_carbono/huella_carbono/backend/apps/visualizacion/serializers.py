from rest_framework import serializers
from .models import Anomalia


class AnomaliaSerializer(serializers.ModelSerializer):
    periodo_label      = serializers.StringRelatedField(source='periodo', read_only=True)
    revisada_por_nombre= serializers.StringRelatedField(source='revisada_por', read_only=True)

    class Meta:
        model  = Anomalia
        fields = [
            'id', 'periodo', 'periodo_label', 'fuente', 'descripcion',
            'area', 'sede', 'valor_actual', 'valor_promedio', 'desviacion_pct',
            'unidad', 'severidad', 'estado', 'comentario',
            'detectada_en', 'revisada_por_nombre', 'fecha_revision',
        ]
        read_only_fields = ['id', 'detectada_en', 'revisada_por_nombre']


class AnomaliaUpdateSerializer(serializers.ModelSerializer):
    """Solo los campos que puede editar el responsable al revisar."""
    class Meta:
        model  = Anomalia
        fields = ['estado', 'comentario']
