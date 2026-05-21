from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginGoogle

urlpatterns = [
    path('google/', LoginGoogle.as_view(), name='login_google'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

