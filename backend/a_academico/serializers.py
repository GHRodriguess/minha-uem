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
    faltas_atuais = serializers.SerializerMethodField()
    detalhes_faltas = serializers.SerializerMethodField()

    class Meta:
        model = Materia
        fields = ['id', 'codigo', 'turma', 'nome', 'departamento', 'periodo', 'inicio', 'termino', 'maximo_faltas', 'horarios', 'faltas_atuais', 'detalhes_faltas']

    def get_faltas_atuais(self, obj):
        perfil = self.context.get('perfil')
        if not perfil:
            return 0
        from .models import RegistroFalta
        from django.db.models import Sum
        total = RegistroFalta.objects.filter(perfil=perfil, materia=obj).aggregate(Sum('faltas'))['faltas__sum']
        return total or 0

    def get_detalhes_faltas(self, obj):
        perfil = self.context.get('perfil')
        if not perfil:
            return []
        from .models import RegistroFalta
        return RegistroFalta.objects.filter(perfil=perfil, materia=obj).values('data', 'aula', 'faltas')

class PerfilAcademicoSerializer(serializers.ModelSerializer):
    curso = CursoSerializer(read_only=True)
    materias = MateriaSerializer(many=True, read_only=True)
    configurado = serializers.SerializerMethodField()

    class Meta:
        model = PerfilAcademico
        fields = ['curso', 'materias', 'configurado']

    def get_configurado(self, obj):
        return obj.curso is not None
