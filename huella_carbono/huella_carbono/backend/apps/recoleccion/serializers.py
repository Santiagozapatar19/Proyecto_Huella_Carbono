from rest_framework import serializers
from .models import (
    Periodo,
    RegistroEnergia, RegistroCombustible, RegistroLogistica,
    RegistroComprasConsumibles, RegistroResiduos,
)


class PeriodoSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = Periodo
        fields = ['id', 'anio', 'mes', 'cerrado', 'label', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']

    def get_label(self, obj) -> str:
        meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
        return f'{meses[obj.mes - 1]} {obj.anio}'

    def create(self, validated_data):
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)


# ── HU-01 ─────────────────────────────────────────────────────────

class RegistroEnergiaSerializer(serializers.ModelSerializer):
    periodo_label = serializers.StringRelatedField(source='periodo', read_only=True)
    registrado_por_nombre = serializers.StringRelatedField(source='registrado_por', read_only=True)

    class Meta:
        model = RegistroEnergia
        fields = '__all__'
        read_only_fields = ['id', 'registrado_por', 'fecha_registro', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)


# ── HU-02 ─────────────────────────────────────────────────────────

class RegistroCombustibleSerializer(serializers.ModelSerializer):
    periodo_label = serializers.StringRelatedField(source='periodo', read_only=True)
    registrado_por_nombre = serializers.StringRelatedField(source='registrado_por', read_only=True)

    class Meta:
        model = RegistroCombustible
        fields = '__all__'
        read_only_fields = ['id', 'registrado_por', 'fecha_registro', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)


class RegistroLogisticaSerializer(serializers.ModelSerializer):
    periodo_label = serializers.StringRelatedField(source='periodo', read_only=True)
    registrado_por_nombre = serializers.StringRelatedField(source='registrado_por', read_only=True)

    class Meta:
        model = RegistroLogistica
        fields = '__all__'
        read_only_fields = ['id', 'registrado_por', 'fecha_registro', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)


# ── HU-03 ─────────────────────────────────────────────────────────

class RegistroComprasConsumiblesSerializer(serializers.ModelSerializer):
    periodo_label = serializers.StringRelatedField(source='periodo', read_only=True)
    registrado_por_nombre = serializers.StringRelatedField(source='registrado_por', read_only=True)

    class Meta:
        model = RegistroComprasConsumibles
        fields = '__all__'
        read_only_fields = ['id', 'registrado_por', 'fecha_registro', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)


# ── HU-04 ─────────────────────────────────────────────────────────

class RegistroResiduosSerializer(serializers.ModelSerializer):
    periodo_label = serializers.StringRelatedField(source='periodo', read_only=True)
    registrado_por_nombre = serializers.StringRelatedField(source='registrado_por', read_only=True)

    class Meta:
        model = RegistroResiduos
        fields = '__all__'
        read_only_fields = ['id', 'registrado_por', 'fecha_registro', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)
