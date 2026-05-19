from django.urls import path
from .views import LoginGoogle

urlpatterns = [
    path('google/', LoginGoogle.as_view(), name='login_google'),
]
