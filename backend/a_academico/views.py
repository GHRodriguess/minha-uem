from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import PerfilAcademico, RegistroFalta, Materia, AnoLetivo
from .serializers import PerfilAcademicoSerializer
from .services import ServicoExtracaoHorario

class PerfilAcademicoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        perfil, created = PerfilAcademico.objects.get_or_create(user=request.user)
        ano_id = request.query_params.get('ano_id')
        serializer = PerfilAcademicoSerializer(perfil, context={'perfil': perfil, 'ano_id': ano_id})
        return Response(serializer.data)

class UploadHorarioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"erro": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_file = request.FILES['file']
        confirmar = request.data.get('confirmar') == 'true'
        servico = ServicoExtracaoHorario(pdf_file, request.user)
        
        try:
            perfil, _ = PerfilAcademico.objects.get_or_create(user=request.user)
            
            # Se não houver confirmação, verifica se o ano já existe
            if not confirmar:
                analise = servico.processar(apenas_analisar=True)
                ano_detectado = analise.get("ano")
                
                if ano_detectado and AnoLetivo.objects.filter(perfil=perfil, ano=ano_detectado).exists():
                    return Response({
                        "conflito": True,
                        "ano": ano_detectado,
                        "mensagem": f"Já existem dados para o ano {ano_detectado}. Deseja sobrescrever?"
                    }, status=status.HTTP_200_OK)

            perfil_atualizado = servico.processar()
            serializer = PerfilAcademicoSerializer(perfil_atualizado, context={'perfil': perfil_atualizado})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"erro": f"Erro ao processar PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ControleFaltaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        materia_id = request.data.get('materia_id')
        data_falta = request.data.get('data')
        aula_num = request.data.get('aula')
        quantidade = request.data.get('faltas')
        ano_id = request.data.get('ano_id')

        if materia_id is None or data_falta is None or aula_num is None or quantidade is None:
            return Response({"erro": "materia_id, data, aula e faltas são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            perfil, _ = PerfilAcademico.objects.get_or_create(user=request.user)
            materia = Materia.objects.get(id=materia_id)
            
            # Se ano_id não for fornecido, tenta encontrar o AnoLetivo mais adequado pela data
            from .models import AnoLetivo
            if ano_id:
                ano_letivo = AnoLetivo.objects.get(id=ano_id, perfil=perfil)
            else:
                from datetime import datetime
                data_dt = datetime.strptime(data_falta, '%Y-%m-%d').date()
                ano_letivo = perfil.anos.filter(horarios__data_inicio__lte=data_dt, horarios__data_termino__gte=data_dt).first()
                if not ano_letivo:
                    ano_letivo = perfil.anos.order_by('-ano').first()

            registro, created = RegistroFalta.objects.get_or_create(
                perfil=perfil, 
                materia=materia, 
                data=data_falta,
                aula=aula_num,
                defaults={'ano_letivo': ano_letivo}
            )
            
            if not created:
                registro.ano_letivo = ano_letivo

            if int(quantidade) <= 0:
                registro.delete()
                faltas_result = 0
            else:
                registro.faltas = int(quantidade)
                registro.save()
                faltas_result = registro.faltas

            return Response({"materia_id": materia.id, "data": data_falta, "aula": aula_num, "faltas": faltas_result})
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)
