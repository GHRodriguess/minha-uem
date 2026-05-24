from rest_framework import serializers
from .models import PerfilAcademico, Curso, Materia, Horario, AnoLetivo, ConfiguracaoMateria, Avaliacao, ConfiguracaoGeralClassroom, VinculoGoogleClassroom, ArquivoMateriaClassroom, AnotacaoMateria, RegistroFalta
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

class AnotacaoMateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnotacaoMateria
        fields = ['id', 'content']

class ConfiguracaoMateriaSerializer(serializers.ModelSerializer):
    avaliacoes = AvaliacaoSerializer(many=True, read_only=True)
    notes = AnotacaoMateriaSerializer(many=True, read_only=True)
    media_atual = serializers.SerializerMethodField()
    quanto_falta = serializers.SerializerMethodField()
    proportional_average = serializers.SerializerMethodField(method_name='obter_media_proporcional')
    required_exam_grade = serializers.SerializerMethodField(method_name='obter_nota_exame_necessaria')
    approval_status = serializers.SerializerMethodField(method_name='obter_status_aprovacao')
    total_weights_sum = serializers.SerializerMethodField(method_name='obter_soma_pesos_total')
    graded_weights_sum = serializers.SerializerMethodField(method_name='obter_soma_pesos_com_nota')
    current_weighted_sum = serializers.SerializerMethodField(method_name='obter_soma_ponderada_atual')

    class Meta:
        model = ConfiguracaoMateria
        fields = [
            'id', 'media_minima', 'avaliacoes', 'notes', 'media_atual', 'quanto_falta',
            'proportional_average', 'required_exam_grade', 'approval_status',
            'total_weights_sum', 'graded_weights_sum', 'current_weighted_sum'
        ]

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

    def obter_media_proporcional(self, obj):
        avaliacoes_com_nota = obj.avaliacoes.filter(nota__isnull=False)
        if not avaliacoes_com_nota.exists():
            return 0.0
        soma_ponderada = sum(a.nota * a.peso for a in avaliacoes_com_nota)
        soma_pesos_com_nota = sum(a.peso for a in avaliacoes_com_nota)
        if soma_pesos_com_nota == 0:
            return 0.0
        return round(float(soma_ponderada / soma_pesos_com_nota), 2)

    def obter_nota_exame_necessaria(self, obj):
        media_projetada = self.get_media_atual(obj)
        if 3.0 <= media_projetada < float(obj.media_minima):
            nota_necessaria = 10.0 - media_projetada
            return round(nota_necessaria, 2)
        return 0.0

    def obter_status_aprovacao(self, obj):
        avaliacoes_sem_nota = obj.avaliacoes.filter(nota__isnull=True)
        media = self.get_media_atual(obj)
        if not avaliacoes_sem_nota.exists():
            if media >= float(obj.media_minima):
                return 'APROVADO'
            elif media >= 3.0:
                return 'EXAME'
            else:
                return 'REPROVADO'
        else:
            if media >= float(obj.media_minima):
                return 'APROVADO'
            avaliacoes_com_nota = obj.avaliacoes.filter(nota__isnull=False)
            if not avaliacoes_com_nota.exists():
                return 'EM_ANDAMENTO'
            soma_ponderada_atual = float(sum(a.nota * a.peso for a in avaliacoes_com_nota))
            soma_pesos_total = float(sum(a.peso for a in obj.avaliacoes.all()))
            soma_pesos_restante = float(sum(a.peso for a in avaliacoes_sem_nota))
            maximo_soma_ponderada = soma_ponderada_atual + (10.0 * soma_pesos_restante)
            if soma_pesos_total > 0:
                maxima_media_possivel = maximo_soma_ponderada / soma_pesos_total
            else:
                maxima_media_possivel = 0.0
            if maxima_media_possivel < 3.0:
                return 'REPROVADO'
            elif maxima_media_possivel < float(obj.media_minima):
                return 'EXAME'
            else:
                return 'EM_ANDAMENTO'

    def obter_soma_pesos_total(self, obj):
        soma_pesos = sum(a.peso for a in obj.avaliacoes.all())
        return float(soma_pesos)

    def obter_soma_pesos_com_nota(self, obj):
        avaliacoes_com_nota = obj.avaliacoes.filter(nota__isnull=False)
        soma_pesos = sum(a.peso for a in avaliacoes_com_nota)
        return float(soma_pesos)

    def obter_soma_ponderada_atual(self, obj):
        avaliacoes_com_nota = obj.avaliacoes.filter(nota__isnull=False)
        soma_ponderada = sum(a.nota * a.peso for a in avaliacoes_com_nota)
        return float(soma_ponderada)

class MateriaSerializer(serializers.ModelSerializer):
    horarios = serializers.SerializerMethodField()
    faltas_atuais = serializers.SerializerMethodField()
    detalhes_faltas = serializers.SerializerMethodField()
    configuracao_notas = serializers.SerializerMethodField()
    max_absences = serializers.SerializerMethodField(method_name='obter_maximo_faltas')
    remaining_absences = serializers.SerializerMethodField(method_name='obter_faltas_restantes')
    current_attendance_percentage = serializers.SerializerMethodField(method_name='obter_frequencia_atual_porcentagem')
    classes_per_week = serializers.SerializerMethodField(method_name='obter_aulas_por_semana')
    weeks_tolerated_absences = serializers.SerializerMethodField(method_name='obter_semanas_toleradas_faltas')
    absences_risk_zone = serializers.SerializerMethodField(method_name='obter_zona_risco_faltas')

    class Meta:
        model = Materia
        fields = [
            'id', 'codigo', 'nome', 'horarios', 'faltas_atuais', 'detalhes_faltas', 'configuracao_notas',
            'max_absences', 'remaining_absences', 'current_attendance_percentage',
            'classes_per_week', 'weeks_tolerated_absences', 'absences_risk_zone'
        ]

    def get_horarios(self, obj):
        horarios_mapeamento = self.context.get('horarios_mapeamento')
        if horarios_mapeamento is not None:
            horarios = horarios_mapeamento.get(obj.id, [])
            return HorarioSerializer(horarios, many=True).data
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return []
        horarios = ano_letivo.horarios.filter(materia=obj)
        return HorarioSerializer(horarios, many=True).data

    def get_faltas_atuais(self, obj):
        faltas_mapeamento = self.context.get('faltas_mapeamento')
        if faltas_mapeamento is not None:
            return faltas_mapeamento.get(obj.id, 0)
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
        detalhes_mapeamento = self.context.get('detalhes_mapeamento')
        if detalhes_mapeamento is not None:
            return detalhes_mapeamento.get(obj.id, [])
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
        configs_mapeamento = self.context.get('configs_mapeamento')
        if configs_mapeamento is not None:
            config = configs_mapeamento.get(obj.id)
            if config:
                return ConfiguracaoMateriaSerializer(config).data
            return None
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

    def obter_maximo_faltas(self, obj):
        horarios_mapeamento = self.context.get('horarios_mapeamento')
        if horarios_mapeamento is not None:
            horarios = horarios_mapeamento.get(obj.id, [])
            if not horarios:
                return 0
            return horarios[0].maximo_faltas
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return 0
        horarios = ano_letivo.horarios.filter(materia=obj)
        if not horarios.exists():
            return 0
        return horarios.first().maximo_faltas

    def obter_faltas_restantes(self, obj):
        max_faltas = self.obter_maximo_faltas(obj)
        faltas = self.get_faltas_atuais(obj)
        return max(0, max_faltas - faltas)

    def obter_frequencia_atual_porcentagem(self, obj):
        max_faltas = self.obter_maximo_faltas(obj)
        if max_faltas == 0:
            return 100.0
        faltas = self.get_faltas_atuais(obj)
        total_aulas = max_faltas * 4
        frequencia = ((total_aulas - faltas) / total_aulas) * 100
        return round(max(0.0, min(100.0, frequencia)), 2)

    def obter_aulas_por_semana(self, obj):
        horarios_mapeamento = self.context.get('horarios_mapeamento')
        if horarios_mapeamento is not None:
            return len(horarios_mapeamento.get(obj.id, []))
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return 0
        return ano_letivo.horarios.filter(materia=obj).count()

    def obter_semanas_toleradas_faltas(self, obj):
        restantes = self.obter_faltas_restantes(obj)
        semanais = self.obter_aulas_por_semana(obj)
        if semanais == 0:
            return 0
        return restantes // semanais

    def obter_zona_risco_faltas(self, obj):
        restantes = self.obter_faltas_restantes(obj)
        semanais = self.obter_aulas_por_semana(obj)
        if restantes <= 2 or (semanais > 0 and restantes < semanais):
            return True
        return False

class ConfiguracaoMateriaResumidaSerializer(serializers.ModelSerializer):
    avaliacoes = AvaliacaoSerializer(many=True, read_only=True)

    class Meta:
        model = ConfiguracaoMateria
        fields = ['id', 'avaliacoes']


class MateriaResumidaSerializer(serializers.ModelSerializer):
    horarios = serializers.SerializerMethodField()
    faltas_atuais = serializers.SerializerMethodField()
    configuracao_notas = serializers.SerializerMethodField()
    max_absences = serializers.SerializerMethodField(method_name='obter_maximo_faltas')

    class Meta:
        model = Materia
        fields = [
            'id', 'codigo', 'nome', 'horarios', 'faltas_atuais', 'configuracao_notas',
            'max_absences'
        ]

    def get_horarios(self, obj):
        horarios_mapeamento = self.context.get('horarios_mapeamento')
        if horarios_mapeamento is not None:
            horarios = horarios_mapeamento.get(obj.id, [])
            return HorarioSerializer(horarios, many=True).data
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return []
        horarios = ano_letivo.horarios.filter(materia=obj)
        return HorarioSerializer(horarios, many=True).data

    def get_faltas_atuais(self, obj):
        faltas_mapeamento = self.context.get('faltas_mapeamento')
        if faltas_mapeamento is not None:
            return faltas_mapeamento.get(obj.id, 0)
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

    def get_configuracao_notas(self, obj):
        incluir_avaliacoes = self.context.get('incluir_avaliacoes', False)
        if not incluir_avaliacoes:
            return None
        configs_mapeamento = self.context.get('configs_mapeamento')
        if configs_mapeamento is not None:
            config = configs_mapeamento.get(obj.id)
            if config:
                return ConfiguracaoMateriaResumidaSerializer(config).data
            return None
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
            return ConfiguracaoMateriaResumidaSerializer(config).data
        return None

    def obter_maximo_faltas(self, obj):
        horarios_mapeamento = self.context.get('horarios_mapeamento')
        if horarios_mapeamento is not None:
            horarios = horarios_mapeamento.get(obj.id, [])
            if not horarios:
                return 0
            return horarios[0].maximo_faltas
        perfil = self.context.get('perfil')
        ano_letivo = self.context.get('ano_letivo')
        if not perfil or not ano_letivo:
            return 0
        horarios = ano_letivo.horarios.filter(materia=obj)
        if not horarios.exists():
            return 0
        return horarios.first().maximo_faltas


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

        from django.db.models import Sum
        from collections import defaultdict

        faltas_agg = RegistroFalta.objects.filter(
            perfil=obj, 
            ano_letivo=ano_letivo
        ).values('materia_id').annotate(total=Sum('faltas'))
        
        faltas_mapeamento = {f['materia_id']: f['total'] for f in faltas_agg}
        
        faltas_detalhes = RegistroFalta.objects.filter(
            perfil=obj, 
            ano_letivo=ano_letivo
        ).values('materia_id', 'data', 'aula', 'faltas')
        
        detalhes_mapeamento = defaultdict(list)
        for fd in faltas_detalhes:
            detalhes_mapeamento[fd['materia_id']].append({
                'data': fd['data'],
                'aula': fd['aula'],
                'faltas': fd['faltas']
            })
            
        horarios_lista = list(ano_letivo.horarios.all())
        horarios_mapeamento = defaultdict(list)
        for h in horarios_lista:
            horarios_mapeamento[h.materia_id].append(h)
            
        configs_lista = ConfiguracaoMateria.objects.filter(
            perfil=obj,
            ano_letivo=ano_letivo
        ).prefetch_related('avaliacoes', 'notes')
        
        configs_mapeamento = {c.materia_id: c for c in configs_lista}
        
        contexto_materia = {
            'perfil': obj,
            'ano_letivo': ano_letivo,
            'faltas_mapeamento': faltas_mapeamento,
            'detalhes_mapeamento': detalhes_mapeamento,
            'horarios_mapeamento': horarios_mapeamento,
            'configs_mapeamento': configs_mapeamento,
            'incluir_avaliacoes': self.context.get('incluir_avaliacoes', False)
        }
        
        resumido = self.context.get('resumido', True)
        
        if resumido:
            return MateriaResumidaSerializer(
                ano_letivo.materias.all(),
                many=True,
                context=contexto_materia
            ).data
        else:
            return MateriaSerializer(
                ano_letivo.materias.all(), 
                many=True, 
                context=contexto_materia
            ).data

    def get_configurado(self, obj):
        return obj.curso is not None


class ConfiguracaoGeralClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoGeralClassroom
        fields = ['id', 'download_dir', 'folder_options']


class ArquivoMateriaClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArquivoMateriaClassroom
        fields = ['id', 'drive_file_id', 'original_name', 'custom_name', 'selected_folder', 'local_path', 'sync_at', 'is_ignored']


class VinculoGoogleClassroomSerializer(serializers.ModelSerializer):
    arquivos = ArquivoMateriaClassroomSerializer(many=True, read_only=True)

    class Meta:
        model = VinculoGoogleClassroom
        fields = ['id', 'classroom_course_id', 'classroom_course_name', 'ultimo_acesso_mural', 'arquivos']
