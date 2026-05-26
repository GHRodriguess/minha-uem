from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests

class LoginGoogle(APIView):
    def post(self, request):
        token = request.data.get('token')
        google_access_token = request.data.get('google_access_token')
        
        if not token:
            return Response({'erro': 'Token não fornecido'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            id_info = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
            
            email = id_info.get('email')
            given_name = id_info.get('given_name', '')
            family_name = id_info.get('family_name', '')
            name = id_info.get('name', '')
            
            if not email.endswith('@uem.br'):
                return Response({'erro': 'Acesso restrito ao domínio @uem.br'}, status=status.HTTP_403_FORBIDDEN)
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': given_name or name,
                    'last_name': family_name
                }
            )
            
            from django.utils.timezone import now
            user.last_login = now()
            
            if created or not user.first_name:
                user.first_name = given_name or name
                user.last_name = family_name
            
            user.save()
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'erro': 'Token inválido', 'detalhe': str(e)}, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.permissions import IsAuthenticated

class ObterUsuarioLogadoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils.timezone import now
        user = request.user
        user.last_login = now()
        user.save(update_fields=['last_login'])
        
        return Response({
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff or user.is_superuser
        })

