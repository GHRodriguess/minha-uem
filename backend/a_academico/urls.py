from django.urls import path
from .views import PerfilAcademicoView, UploadHorarioView, ControleFaltaView, ConfiguracaoMateriaView, AvaliacaoView

urlpatterns = [
    path('perfil/', PerfilAcademicoView.as_view(), name='perfil'),
    path('upload-horario/', UploadHorarioView.as_view(), name='upload_horario'),
    path('controle-falta/', ControleFaltaView.as_view(), name='controle_falta'),
    path('configuracao-notas/', ConfiguracaoMateriaView.as_view(), name='configuracao_notas'),
    path('avaliacoes/', AvaliacaoView.as_view(), name='avaliacoes'),
    path('avaliacoes/<int:pk>/', AvaliacaoView.as_view(), name='avaliacao_detalhe'),
]

