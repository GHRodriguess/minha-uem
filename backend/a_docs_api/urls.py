from django.urls import path
from drf_spectacular.views import SpectacularAPIView
from .views import scalar_docs

urlpatterns = [
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', scalar_docs, name='scalar-ui'),
]