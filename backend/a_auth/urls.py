from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginGoogle, ObterUsuarioLogadoView

urlpatterns = [
    path('google/', LoginGoogle.as_view(), name='login_google'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', ObterUsuarioLogadoView.as_view(), name='obter_usuario_logado'),
]

