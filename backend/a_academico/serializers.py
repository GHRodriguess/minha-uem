from rest_framework import serializers
from .models import PerfilAcademico, Curso, Materia, Horario

class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ['id', 'codigo', 'nome']

class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Horario
        fields = ['bloco', 'aula', 'dia', 'inicio', 'fim', 'sala']

class MateriaSerializer(serializers.ModelSerializer):
    horarios = HorarioSerializer(many=True, read_only=True)
    class Meta:
        model = Materia
        fields = ['id', 'codigo', 'turma', 'nome', 'departamento', 'periodo', 'inicio', 'termino', 'maximo_faltas', 'horarios']

class PerfilAcademicoSerializer(serializers.ModelSerializer):
    curso = CursoSerializer(read_only=True)
    materias = MateriaSerializer(many=True, read_only=True)
    configurado = serializers.SerializerMethodField()

    class Meta:
        model = PerfilAcademico
        fields = ['curso', 'materias', 'configurado']

    def get_configurado(self, obj):
        return obj.curso is not None
