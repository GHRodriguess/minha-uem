from django.urls import path
from .views import PerfilAcademicoView, UploadHorarioView

urlpatterns = [
    path('perfil/', PerfilAcademicoView.as_view(), name='perfil-academico'),
    path('upload-horario/', UploadHorarioView.as_view(), name='upload-horario'),
]
