from django.db import models
from django.contrib.auth.models import User

class Curso(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nome = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.codigo} - {self.nome}"

class Materia(models.Model):
    codigo = models.CharField(max_length=20)
    turma = models.CharField(max_length=10)
    nome = models.CharField(max_length=255)
    departamento = models.CharField(max_length=10)
    periodo = models.CharField(max_length=50)
    inicio = models.DateField()
    termino = models.DateField()
    maximo_faltas = models.IntegerField()

    def __str__(self):
        return f"{self.codigo} - {self.nome} ({self.turma})"

class Horario(models.Model):
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='horarios')
    bloco = models.IntegerField()
    aula = models.IntegerField()
    dia = models.IntegerField()
    inicio = models.TimeField()
    fim = models.TimeField()
    sala = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.materia.nome} - Bloco {self.bloco} - Dia {self.dia} - Aula {self.aula}"

class PerfilAcademico(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil_academico')
    curso = models.ForeignKey(Curso, on_delete=models.SET_NULL, null=True, blank=True)
    materias = models.ManyToManyField(Materia, blank=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"

class RegistroFalta(models.Model):
    perfil = models.ForeignKey(PerfilAcademico, on_delete=models.CASCADE, related_name='registros_falta')
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    data = models.DateField()
    aula = models.IntegerField(default=1)
    faltas = models.IntegerField(default=1)

    class Meta:
        unique_together = ('perfil', 'materia', 'data', 'aula')

    def __str__(self):
        return f"{self.perfil} - {self.materia.codigo} ({self.data} Aula {self.aula})"
