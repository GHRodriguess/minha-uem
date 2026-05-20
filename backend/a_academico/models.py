from django.db import models
from django.contrib.auth.models import User

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
