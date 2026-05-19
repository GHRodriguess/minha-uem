from django.contrib import admin
from .models import Curso, Materia, Horario, PerfilAcademico

# Register your models here.
admin.site.register([Curso, Materia, Horario, PerfilAcademico])