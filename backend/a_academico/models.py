from django.db import models
from django.contrib.auth.models import User
import uuid

class Curso(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nome = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.codigo} - {self.nome}"

class Materia(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nome = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.codigo} - {self.nome}"

class Horario(models.Model):
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='horarios')
    turma = models.CharField(max_length=10)
    departamento = models.CharField(max_length=10)
    periodo = models.CharField(max_length=50)
    data_inicio = models.DateField()
    data_termino = models.DateField()
    maximo_faltas = models.IntegerField()
    bloco = models.IntegerField()
    aula = models.IntegerField()
    dia = models.IntegerField()
    inicio = models.TimeField()
    fim = models.TimeField()
    sala = models.CharField(max_length=50)

    class Meta:
        unique_together = ('materia', 'turma', 'aula', 'dia')

    def __str__(self):
        return f"{self.materia.nome} ({self.turma}) - Bloco {self.bloco} - Dia {self.dia} - Aula {self.aula}"

class PerfilAcademico(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil_academico')
    curso = models.ForeignKey(Curso, on_delete=models.SET_NULL, null=True, blank=True)
    materias = models.ManyToManyField(Materia, blank=True)
    horarios = models.ManyToManyField(Horario, blank=True)
    calendar_token = models.UUIDField(default=uuid.uuid4, null=True, blank=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"

class AnoLetivo(models.Model):
    perfil = models.ForeignKey(PerfilAcademico, on_delete=models.CASCADE, related_name='anos')
    ano = models.IntegerField()
    materias = models.ManyToManyField(Materia, blank=True)
    horarios = models.ManyToManyField(Horario, blank=True)

    class Meta:
        unique_together = ('perfil', 'ano')

    def __str__(self):
        return f"{self.ano} - {self.perfil.user.username}"

class RegistroFalta(models.Model):
    perfil = models.ForeignKey(PerfilAcademico, on_delete=models.CASCADE, related_name='registros_falta')
    ano_letivo = models.ForeignKey(AnoLetivo, on_delete=models.CASCADE, related_name='registros_falta', null=True, blank=True)
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    data = models.DateField()
    aula = models.IntegerField(default=1)
    faltas = models.IntegerField(default=1)

    class Meta:
        unique_together = ('perfil', 'materia', 'data', 'aula')

    def __str__(self):
        return f"{self.perfil} - {self.materia.codigo} ({self.data} Aula {self.aula})"

class ConfiguracaoMateria(models.Model):
    perfil = models.ForeignKey(PerfilAcademico, on_delete=models.CASCADE, related_name='configuracoes_materias')
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    ano_letivo = models.ForeignKey(AnoLetivo, on_delete=models.CASCADE, related_name='configuracoes_materias')
    media_minima = models.DecimalField(max_digits=4, decimal_places=2, default=6.0)

    class Meta:
        unique_together = ('perfil', 'materia', 'ano_letivo')

    def __str__(self):
        return f"Config de {self.materia.nome} ({self.ano_letivo.ano}) - {self.perfil.user.username}"

class Avaliacao(models.Model):
    TIPO_CHOICES = [
        ('PROVA', 'Prova'),
        ('TRABALHO', 'Trabalho'),
        ('EXAME', 'Exame'),
        ('TAREFA', 'Tarefa'),
        ('PESQUISA', 'Pesquisa'),
        ('OUTRO', 'Outro'),
    ]

    STATUS_CHOICES = [
        ('A_FAZER', 'A Fazer'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('CONCLUIDO', 'Concluído'),
    ]

    configuracao = models.ForeignKey(ConfiguracaoMateria, on_delete=models.CASCADE, related_name='avaliacoes')
    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='PROVA')
    peso = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    nota = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    data = models.DateField(null=True, blank=True)
    ordem = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='A_FAZER')

    class Meta:
        ordering = ['ordem', 'id']

    def save(self, *args, **kwargs):
        if self.pk:
            old_instance = Avaliacao.objects.filter(pk=self.pk).first()
            if old_instance and old_instance.nota is None and self.nota is not None:
                self.status = 'CONCLUIDO'
        elif self.nota is not None:
            self.status = 'CONCLUIDO'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome} ({self.configuracao.materia.nome})"


class ConfiguracaoGeralClassroom(models.Model):
    profile = models.OneToOneField(PerfilAcademico, on_delete=models.CASCADE, related_name='configuracao_classroom')
    download_dir = models.CharField(max_length=500, default="Downloads/MinhaUEM")
    folder_options = models.CharField(max_length=500, default="documentos,exercicios")

    def __str__(self):
        return f"Config Classroom de {self.profile.user.username}"


class VinculoGoogleClassroom(models.Model):
    subject_config = models.OneToOneField(ConfiguracaoMateria, on_delete=models.CASCADE, related_name='vinculo_classroom')
    classroom_course_id = models.CharField(max_length=100)
    classroom_course_name = models.CharField(max_length=255)
    ultimo_acesso_mural = models.DateTimeField(null=True, blank=True)
    custom_folders = models.CharField(max_length=500, default="", blank=True)
    classroom_alternate_link = models.URLField(max_length=500, null=True, blank=True)

    def __str__(self):
        return f"Vinculo {self.subject_config.materia.nome} -> {self.classroom_course_name}"


class ProfessorClassroom(models.Model):
    classroom_connection = models.ForeignKey(VinculoGoogleClassroom, on_delete=models.CASCADE, related_name='professores')
    google_user_id = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    photo_url = models.URLField(max_length=500, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.classroom_connection.classroom_course_name})"



class ArquivoMateriaClassroom(models.Model):
    classroom_connection = models.ForeignKey(VinculoGoogleClassroom, on_delete=models.CASCADE, related_name='arquivos')
    drive_file_id = models.CharField(max_length=100)
    original_name = models.CharField(max_length=255)
    custom_name = models.CharField(max_length=255, null=True, blank=True)
    selected_folder = models.CharField(max_length=100, default="documentos")
    is_ignored = models.BooleanField(default=False)
    local_path = models.CharField(max_length=500, null=True, blank=True)
    sync_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('classroom_connection', 'drive_file_id')

    def save(self, *args, **kwargs):
        if not self.pk and self.original_name and self.original_name.startswith('.'):
            self.is_ignored = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.custom_name or self.original_name} ({self.classroom_connection.subject_config.materia.nome})"


class VideoMateriaClassroom(models.Model):
    TIPO_CHOICES = [
        ('drive', 'Google Drive'),
        ('youtube', 'YouTube'),
    ]

    classroom_connection = models.ForeignKey(VinculoGoogleClassroom, on_delete=models.CASCADE, related_name='videos')
    video_id = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=255)
    custom_name = models.CharField(max_length=255, null=True, blank=True)
    selected_folder = models.CharField(max_length=100, default='videos')
    is_ignored = models.BooleanField(default=False)
    url = models.URLField(max_length=500, null=True, blank=True)
    thumbnail = models.URLField(max_length=500, null=True, blank=True)
    sync_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('classroom_connection', 'video_id')

    def save(self, *args, **kwargs):
        if not self.pk and self.titulo and self.titulo.startswith('.'):
            self.is_ignored = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.custom_name or self.titulo} ({self.classroom_connection.subject_config.materia.nome})"


class AnotacaoMateria(models.Model):
    subject_config = models.ForeignKey(ConfiguracaoMateria, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()

    def __str__(self):
        return f"Anotacao de {self.subject_config.materia.nome}"


class ChamadoSuporte(models.Model):
    CATEGORIA_CHOICES = [
        ('INTERFACE', 'Interface'),
        ('ACADEMICO', 'Acadêmico'),
        ('CLASSROOM', 'Google Classroom'),
        ('OUTRO', 'Outro'),
    ]

    STATUS_CHOICES = [
        ('ABERTO', 'Aberto'),
        ('RESOLVIDO', 'Resolvido'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chamados_suporte')
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='OUTRO')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ABERTO')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    read_by_user = models.BooleanField(default=True)
    read_by_admin = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.user.username}) - {self.status}"


class MensagemChamado(models.Model):
    ticket = models.ForeignKey(ChamadoSuporte, on_delete=models.CASCADE, related_name='mensagens')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mensagem de {self.sender.username} em {self.ticket.title}"


class Noticia(models.Model):
    CATEGORIA_CHOICES = [
        ('GERAL', 'Geral'),
        ('ACADEMICO', 'Acadêmico'),
        ('CLASSROOM', 'Google Classroom'),
        ('MANUTENCAO', 'Manutenção'),
        ('NOVIDADES', 'Novidades'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='GERAL')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.category})"


class ChaveApiGemini(models.Model):
    profile = models.OneToOneField(PerfilAcademico, on_delete=models.CASCADE, related_name='chave_gemini')
    encrypted_api_key = models.TextField()
    model_name = models.CharField(max_length=50, default="gemini-3.5-flash")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chave Gemini de {self.profile.user.username}"


class HistoricoUsoIA(models.Model):
    profile = models.ForeignKey(PerfilAcademico, on_delete=models.CASCADE, related_name='historico_ia')
    model_name = models.CharField(max_length=50)
    prompt_tokens = models.IntegerField()
    candidate_tokens = models.IntegerField()
    total_tokens = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Uso de {self.model_name} por {self.profile.user.username} em {self.created_at.strftime('%d/%m/%Y %H:%M')}"


class ConversaIA(models.Model):
    profile = models.ForeignKey(PerfilAcademico, on_delete=models.CASCADE, related_name='conversas_ia')
    materia = models.ForeignKey(Materia, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversas_ia')
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.profile.user.username}"


class MensagemConversaIA(models.Model):
    conversa = models.ForeignKey(ConversaIA, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=[('conversa', 'Conversa'), ('user', 'User'), ('model', 'Model')])
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role}: {self.text[:30]}..."






