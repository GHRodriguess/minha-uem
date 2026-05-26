from django.contrib import admin
from .models import (
    Curso, Materia, Horario, PerfilAcademico, AnoLetivo, 
    RegistroFalta, ConfiguracaoMateria, Avaliacao, 
    ConfiguracaoGeralClassroom, VinculoGoogleClassroom, 
    ArquivoMateriaClassroom, ChamadoSuporte, MensagemChamado
)

admin.site.register([
    Curso, Materia, Horario, PerfilAcademico, AnoLetivo, 
    RegistroFalta, ConfiguracaoMateria, Avaliacao, 
    ConfiguracaoGeralClassroom, VinculoGoogleClassroom, 
    ArquivoMateriaClassroom, ChamadoSuporte, MensagemChamado
])