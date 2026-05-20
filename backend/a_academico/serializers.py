from rest_framework import serializers
from .models import PerfilAcademico, Curso, Materia, Horario, AnoLetivo

class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ['id', 'codigo', 'nome']

class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Horario
        fields = ['bloco', 'aula', 'dia', 'inicio', 'fim', 'sala', 'turma', 'departamento', 'periodo', 'data_inicio', 'data_termino', 'maximo_faltas']

class AnoLetivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnoLetivo
        fields = ['id', 'ano']

class MateriaSerializer(serializers.ModelSerializer):
    horarios = serializers.SerializerMethodField()
    faltas_atuais = serializers.SerializerMethodField()
    detalhes_faltas = serializers.SerializerMethodField()

    class Meta:
        model = Materia
        fields = ['id', 'codigo', 'nome', 'horarios', 'faltas_atuais', 'detalhes_faltas']

    def get_horarios(self, obj):
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return []
        horarios = ano_letivo.horarios.filter(materia=obj)
        return HorarioSerializer(horarios, many=True).data

    def get_faltas_atuais(self, obj):
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return 0
        from .models import RegistroFalta
        from django.db.models import Sum
        total = RegistroFalta.objects.filter(
            perfil=perfil, 
            materia=obj, 
            ano_letivo=ano_letivo
        ).aggregate(Sum('faltas'))['faltas__sum']
        return total or 0

    def get_detalhes_faltas(self, obj):
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return []
        from .models import RegistroFalta
        return RegistroFalta.objects.filter(
            perfil=perfil, 
            materia=obj, 
            ano_letivo=ano_letivo
        ).values('data', 'aula', 'faltas')

class PerfilAcademicoSerializer(serializers.ModelSerializer):
    curso = CursoSerializer(read_only=True)
    materias = serializers.SerializerMethodField()
    anos = AnoLetivoSerializer(many=True, read_only=True)
    configurado = serializers.SerializerMethodField()

    class Meta:
        model = PerfilAcademico
        fields = ['curso', 'materias', 'anos', 'configurado']

    def get_materias(self, obj):
        ano_id = self.context.get('ano_id')
        if ano_id:
            ano_letivo = obj.anos.filter(id=ano_id).first()
        else:
            ano_letivo = obj.anos.order_by('-ano').first()
        
        if not ano_letivo:
            return []
            
        return MateriaSerializer(
            ano_letivo.materias.all(), 
            many=True, 
            context={'perfil': obj, 'ano_letivo': ano_letivo}
        ).data

    def get_configurado(self, obj):
        return obj.curso is not None
