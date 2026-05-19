from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import PerfilAcademico
from .serializers import PerfilAcademicoSerializer
from .services import ServicoExtracaoHorario

class PerfilAcademicoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        perfil, created = PerfilAcademico.objects.get_or_create(user=request.user)
        serializer = PerfilAcademicoSerializer(perfil)
        return Response(serializer.data)

class UploadHorarioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"erro": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_file = request.FILES['file']
        servico = ServicoExtracaoHorario(pdf_file, request.user)
        
        try:
            perfil = servico.processar()
            serializer = PerfilAcademicoSerializer(perfil)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"erro": f"Erro ao processar PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
