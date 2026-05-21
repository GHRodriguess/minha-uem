from django.contrib import admin
from .models import Curso, Materia, Horario, PerfilAcademico, AnoLetivo, RegistroFalta, ConfiguracaoMateria, Avaliacao, ConfiguracaoGeralClassroom, VinculoGoogleClassroom, ArquivoMateriaClassroom

# Register your models here.
admin.site.register([Curso, Materia, Horario, PerfilAcademico, AnoLetivo, RegistroFalta, ConfiguracaoMateria, Avaliacao, ConfiguracaoGeralClassroom, VinculoGoogleClassroom, ArquivoMateriaClassroom])