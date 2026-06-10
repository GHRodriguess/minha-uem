from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from a_academico.models import (
    PerfilAcademico, 
    ChamadoSuporte, 
    MensagemChamado, 
    Curso, 
    Materia, 
    Noticia
)
from a_academico.serializers import (
    ChamadoSuporteSerializer, 
    MensagemChamadoSerializer, 
    UsuarioAdminSerializer, 
    NoticiaSerializer
)
from .base import obter_perfil_ativo


class ListarCriarChamadoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        is_admin_mode = request.query_params.get('admin', 'false') == 'true'
        if is_admin_mode and (request.user.is_staff or request.user.is_superuser):
            chamados = ChamadoSuporte.objects.all().order_by('-updated_at')
        else:
            chamados = ChamadoSuporte.objects.filter(user=request.user).order_by('-updated_at')
        
        serializer = ChamadoSuporteSerializer(chamados, many=True, context={'list_mode': True})
        return Response(serializer.data)

    def post(self, request):
        title = request.data.get('title')
        category = request.data.get('category', 'OUTRO')
        message_content = request.data.get('message')

        if not title or not message_content:
            return Response({"erro": "Titulo e mensagem sao obrigatorios."}, status=status.HTTP_400_BAD_REQUEST)

        chamado = ChamadoSuporte.objects.create(
            user=request.user,
            title=title,
            category=category,
            status='ABERTO',
            read_by_user=True,
            read_by_admin=False
        )

        MensagemChamado.objects.create(
            ticket=chamado,
            sender=request.user,
            message=message_content
        )

        serializer = ChamadoSuporteSerializer(chamado)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DetalheChamadoSuporteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            chamado = ChamadoSuporte.objects.get(pk=pk)
        except ChamadoSuporte.DoesNotExist:
            return Response({"erro": "Chamado nao encontrado."}, status=status.HTTP_404_NOT_FOUND)

        is_admin = request.user.is_staff or request.user.is_superuser
        if chamado.user != request.user and not is_admin:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        is_admin_mode = request.query_params.get('admin', 'false') == 'true'
        if is_admin_mode and is_admin:
            chamado.read_by_admin = True
        else:
            chamado.read_by_user = True
        
        chamado.save()

        serializer = ChamadoSuporteSerializer(chamado)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            chamado = ChamadoSuporte.objects.get(pk=pk)
        except ChamadoSuporte.DoesNotExist:
            return Response({"erro": "Chamado nao encontrado."}, status=status.HTTP_404_NOT_FOUND)

        is_admin = request.user.is_staff or request.user.is_superuser
        if chamado.user != request.user and not is_admin:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        message_content = request.data.get('message')
        if not message_content:
            return Response({"erro": "Mensagem e obrigatoria."}, status=status.HTTP_400_BAD_REQUEST)

        is_admin_mode = request.query_params.get('admin', 'false') == 'true'
        
        if is_admin_mode and is_admin:
            chamado.read_by_user = False
            chamado.read_by_admin = True
        else:
            chamado.read_by_admin = False
            chamado.read_by_user = True
        
        chamado.save()

        mensagem = MensagemChamado.objects.create(
            ticket=chamado,
            sender=request.user,
            message=message_content
        )

        serializer = MensagemChamadoSerializer(mensagem)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AtualizarStatusChamadoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            chamado = ChamadoSuporte.objects.get(pk=pk)
        except ChamadoSuporte.DoesNotExist:
            return Response({"erro": "Chamado nao encontrado."}, status=status.HTTP_404_NOT_FOUND)

        is_admin = request.user.is_staff or request.user.is_superuser
        if chamado.user != request.user and not is_admin:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if not new_status or new_status not in ['ABERTO', 'RESOLVIDO']:
            return Response({"erro": "Status invalido."}, status=status.HTTP_400_BAD_REQUEST)

        chamado.status = new_status
        chamado.save()

        serializer = ChamadoSuporteSerializer(chamado)
        return Response(serializer.data)


class VisualizarEstatisticasAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        total_users = User.objects.count()
        active_profiles = PerfilAcademico.objects.count()
        total_courses = Curso.objects.count()
        total_subjects = Materia.objects.count()
        open_tickets = ChamadoSuporte.objects.filter(status='ABERTO').count()
        resolved_tickets = ChamadoSuporte.objects.filter(status='RESOLVIDO').count()

        return Response({
            'total_users': total_users,
            'active_profiles': active_profiles,
            'total_courses': total_courses,
            'total_subjects': total_subjects,
            'open_tickets': open_tickets,
            'resolved_tickets': resolved_tickets
        })


class ListarUsuariosAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        usuarios = User.objects.all().select_related('perfil_academico', 'perfil_academico__curso').prefetch_related('perfil_academico__materias').order_by('-date_joined')
        serializer = UsuarioAdminSerializer(usuarios, many=True)
        return Response(serializer.data)


class AlternarAcessoAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"erro": "Usuario nao encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({"erro": "Voce nao pode alterar seus proprios acessos."}, status=status.HTTP_400_BAD_REQUEST)

        target_user.is_staff = not target_user.is_staff
        target_user.save()

        serializer = UsuarioAdminSerializer(target_user)
        return Response(serializer.data)


class ListarCriarNoticiaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        noticias = Noticia.objects.all().order_by('-created_at')
        serializer = NoticiaSerializer(noticias, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title')
        content = request.data.get('content')
        category = request.data.get('category', 'GERAL')

        if not title or not content:
            return Response({"erro": "Titulo e conteudo sao obrigatorios."}, status=status.HTTP_400_BAD_REQUEST)

        noticia = Noticia.objects.create(
            title=title,
            content=content,
            category=category,
            author=request.user
        )

        serializer = NoticiaSerializer(noticia)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DetalheNoticiaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            noticia = Noticia.objects.get(pk=pk)
        except Noticia.DoesNotExist:
            return Response({"erro": "Noticia nao encontrada."}, status=status.HTTP_404_NOT_FOUND)

        serializer = NoticiaSerializer(noticia)
        return Response(serializer.data)

    def patch(self, request, pk):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        try:
            noticia = Noticia.objects.get(pk=pk)
        except Noticia.DoesNotExist:
            return Response({"erro": "Noticia nao encontrada."}, status=status.HTTP_404_NOT_FOUND)

        serializer = NoticiaSerializer(noticia, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        try:
            noticia = Noticia.objects.get(pk=pk)
        except Noticia.DoesNotExist:
            return Response({"erro": "Noticia nao encontrada."}, status=status.HTTP_404_NOT_FOUND)

        noticia.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
