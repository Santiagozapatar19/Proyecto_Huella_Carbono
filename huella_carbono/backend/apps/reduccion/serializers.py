from rest_framework import serializers
from .models import PlanReduccion, Iniciativa, EvidenciaIniciativa, AlertaDesviacion


class IniciativaResumenSerializer(serializers.ModelSerializer):
    score_priorizacion = serializers.ReadOnlyField()
    avance_pct         = serializers.ReadOnlyField()
    responsable_nombre = serializers.StringRelatedField(source='responsable', read_only=True)

    class Meta:
        model  = Iniciativa
        fields = [
            'id', 'nombre', 'fuente_impacto', 'area', 'sede',
            'impacto', 'factibilidad', 'costo_estimado_cop',
            'reduccion_estimada_tco2e', 'reduccion_real_tco2e',
            'estado', 'responsable_nombre', 'avance_pct',
            'score_priorizacion', 'fecha_inicio_plan', 'fecha_fin_plan',
        ]


class IniciativaSerializer(serializers.ModelSerializer):
    score_priorizacion = serializers.ReadOnlyField()
    avance_pct         = serializers.ReadOnlyField()
    responsable_nombre = serializers.StringRelatedField(source='responsable', read_only=True)

    class Meta:
        model  = Iniciativa
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class PlanReduccionSerializer(serializers.ModelSerializer):
    iniciativas         = IniciativaResumenSerializer(many=True, read_only=True)
    responsable_nombre  = serializers.StringRelatedField(source='responsable', read_only=True)
    creado_por_nombre   = serializers.StringRelatedField(source='creado_por', read_only=True)
    meta_tco2e          = serializers.ReadOnlyField()
    total_iniciativas   = serializers.ReadOnlyField()
    iniciativas_completadas = serializers.ReadOnlyField()

    class Meta:
        model  = PlanReduccion
        fields = [
            'id', 'nombre', 'descripcion', 'anio_objetivo',
            'meta_reduccion_pct', 'linea_base_tco2e', 'meta_tco2e',
            'estado', 'responsable', 'responsable_nombre',
            'creado_por_nombre', 'fecha_inicio', 'fecha_fin',
            'total_iniciativas', 'iniciativas_completadas',
            'iniciativas', 'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'creado_por_nombre', 'fecha_creacion', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)


class EvidenciaSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.StringRelatedField(source='registrado_por', read_only=True)

    class Meta:
        model  = EvidenciaIniciativa
        fields = '__all__'
        read_only_fields = ['id', 'registrado_por', 'fecha_registro']

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)


class AlertaSerializer(serializers.ModelSerializer):
    iniciativa_nombre = serializers.StringRelatedField(source='iniciativa', read_only=True)

    class Meta:
        model  = AlertaDesviacion
        fields = '__all__'
        read_only_fields = ['id', 'fecha']
