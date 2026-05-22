from rest_framework import serializers
from .models import PerfilAcademico, Curso, Materia, Horario, AnoLetivo, ConfiguracaoMateria, Avaliacao, ConfiguracaoGeralClassroom, VinculoGoogleClassroom, ArquivoMateriaClassroom
from django.db.models import Sum, F

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

class AvaliacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avaliacao
        fields = ['id', 'nome', 'tipo', 'peso', 'nota', 'data', 'ordem']

class ConfiguracaoMateriaSerializer(serializers.ModelSerializer):
    avaliacoes = AvaliacaoSerializer(many=True, read_only=True)
    media_atual = serializers.SerializerMethodField()
    quanto_falta = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracaoMateria
        fields = ['id', 'media_minima', 'avaliacoes', 'media_atual', 'quanto_falta']

    def get_media_atual(self, obj):
        avaliacoes = obj.avaliacoes.filter(nota__isnull=False)
        if not avaliacoes.exists():
            return 0
        
        soma_ponderada = sum(a.nota * a.peso for a in avaliacoes)
        soma_pesos = sum(a.peso for a in obj.avaliacoes.all())
        
        if soma_pesos == 0:
            return 0
            
        return round(float(soma_ponderada / soma_pesos), 2)

    def get_quanto_falta(self, obj):
        avaliacoes_com_nota = obj.avaliacoes.filter(nota__isnull=False)
        avaliacoes_sem_nota = obj.avaliacoes.filter(nota__isnull=True)
        
        if not avaliacoes_sem_nota.exists():
            media = self.get_media_atual(obj)
            return max(0, float(obj.media_minima) - media) if media < float(obj.media_minima) else 0

        soma_ponderada_atual = sum(a.nota * a.peso for a in avaliacoes_com_nota)
        soma_pesos_total = sum(a.peso for a in obj.avaliacoes.all())
        soma_pesos_restante = sum(a.peso for a in avaliacoes_sem_nota)
        
        if soma_pesos_total == 0:
            return 0
            
        necessario_total = float(obj.media_minima) * float(soma_pesos_total)
        falta_pontos = necessario_total - float(soma_ponderada_atual)
        
        if falta_pontos <= 0:
            return 0
            
        media_necessaria_restante = falta_pontos / float(soma_pesos_restante)
        return round(media_necessaria_restante, 2)

class MateriaSerializer(serializers.ModelSerializer):
    horarios = serializers.SerializerMethodField()
    faltas_atuais = serializers.SerializerMethodField()
    detalhes_faltas = serializers.SerializerMethodField()
    configuracao_notas = serializers.SerializerMethodField()

    class Meta:
        model = Materia
        fields = ['id', 'codigo', 'nome', 'horarios', 'faltas_atuais', 'detalhes_faltas', 'configuracao_notas']

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

    def get_configuracao_notas(self, obj):
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return None
        
        config = ConfiguracaoMateria.objects.filter(
            perfil=perfil,
            materia=obj,
            ano_letivo=ano_letivo
        ).first()
        
        if config:
            return ConfiguracaoMateriaSerializer(config).data
        return None

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


class ConfiguracaoGeralClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoGeralClassroom
        fields = ['id', 'download_dir', 'folder_options']


class ArquivoMateriaClassroomSerializer(serializers.ModelSerializer):
    is_downloaded = serializers.SerializerMethodField(method_name='obter_esta_baixado')

    class Meta:
        model = ArquivoMateriaClassroom
        fields = ['id', 'drive_file_id', 'original_name', 'custom_name', 'selected_folder', 'is_downloaded', 'local_path', 'sync_at', 'is_ignored']

    def obter_esta_baixado(self, obj):
        import os
        return bool(obj.local_path and os.path.exists(obj.local_path))


class VinculoGoogleClassroomSerializer(serializers.ModelSerializer):
    arquivos = ArquivoMateriaClassroomSerializer(many=True, read_only=True)

    class Meta:
        model = VinculoGoogleClassroom
        fields = ['id', 'classroom_course_id', 'classroom_course_name', 'arquivos']
