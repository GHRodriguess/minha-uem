from django.urls import path
from .views import PerfilAcademicoView, UploadHorarioView, ControleFaltaView

urlpatterns = [
    path('perfil/', PerfilAcademicoView.as_view(), name='perfil-academico'),
    path('upload-horario/', UploadHorarioView.as_view(), name='upload-horario'),
    path('faltas/', ControleFaltaView.as_view(), name='controle-faltas'),
]
