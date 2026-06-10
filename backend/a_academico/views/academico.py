from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from a_academico.models import (
    PerfilAcademico, 
    Materia, 
    AnoLetivo, 
    RegistroFalta, 
    ConfiguracaoMateria, 
    Avaliacao, 
    AnotacaoMateria
)
from a_academico.serializers import (
    PerfilAcademicoSerializer, 
    MateriaSerializer, 
    ConfiguracaoMateriaSerializer, 
    AvaliacaoSerializer, 
    AnotacaoMateriaSerializer
)
from a_academico.services import ServicoExtracaoHorario
from .base import obter_perfil_ativo

class PerfilAcademicoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        perfil, _ = obter_perfil_ativo(request)
        ano_id = request.query_params.get('ano_id')
        resumido = request.query_params.get('resumido', 'true') == 'true'
        incluir_avaliacoes = request.query_params.get('incluir_avaliacoes') == 'true'
        serializer = PerfilAcademicoSerializer(
            perfil, 
            context={
                'perfil': perfil, 
                'ano_id': ano_id, 
                'resumido': resumido,
                'incluir_avaliacoes': incluir_avaliacoes
            }
        )
        return Response(serializer.data)


class MateriaDetalheView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, materia_id):
        try:
            perfil, _ = obter_perfil_ativo(request)
            ano_id = request.query_params.get('ano_id')
            
            if ano_id:
                ano_letivo = perfil.anos.filter(id=ano_id).first()
            else:
                ano_letivo = perfil.anos.order_by('-ano').first()
                
            if not ano_letivo:
                return Response({"erro": "Nenhum ano letivo configurado."}, status=status.HTTP_400_BAD_REQUEST)
                
            materia = ano_letivo.materias.get(id=materia_id)
            serializer = MateriaSerializer(
                materia, 
                context={'perfil': perfil, 'ano_letivo': ano_letivo}
            )
            return Response(serializer.data)
        except Materia.DoesNotExist:
            return Response({"erro": "Materia nao encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UploadHorarioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"erro": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_file = request.FILES['file']
        confirmar = request.data.get('confirmar') == 'true'
        perfil, user_ativo = obter_perfil_ativo(request)
        servico = ServicoExtracaoHorario(pdf_file, user_ativo)
        
        try:
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
            perfil, _ = obter_perfil_ativo(request)
            materia = Materia.objects.get(id=materia_id)
            
            if ano_id:
                ano_letivo = AnoLetivo.objects.get(id=ano_id, perfil=perfil)
            else:
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


class ConfiguracaoMateriaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, materia_id, ano_id):
        perfil, _ = obter_perfil_ativo(self.request)
        ano_letivo = AnoLetivo.objects.get(id=ano_id, perfil=perfil)
        materia = Materia.objects.get(id=materia_id)
        config, _ = ConfiguracaoMateria.objects.get_or_create(
            perfil=perfil,
            materia=materia,
            ano_letivo=ano_letivo
        )
        return config

    def get(self, request):
        materia_id = request.query_params.get('materia_id')
        ano_id = request.query_params.get('ano_id')
        if not materia_id or not ano_id:
            return Response({"erro": "materia_id e ano_id são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            config = self.get_object(materia_id, ano_id)
            serializer = ConfiguracaoMateriaSerializer(config)
            return Response(serializer.data)
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        materia_id = request.data.get('materia_id')
        ano_id = request.data.get('ano_id')
        if not materia_id or not ano_id:
            return Response({"erro": "materia_id e ano_id são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            config = self.get_object(materia_id, ano_id)
            serializer = ConfiguracaoMateriaSerializer(config, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AvaliacaoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        config_id = request.data.get('configuracao_id')
        if not config_id:
            return Response({"erro": "configuracao_id é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            _, active_user = obter_perfil_ativo(request)
            config = ConfiguracaoMateria.objects.get(id=config_id, perfil__user=active_user)
            serializer = AvaliacaoSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(configuracao=config)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ConfiguracaoMateria.DoesNotExist:
            return Response({"erro": "Configuração não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            _, active_user = obter_perfil_ativo(request)
            avaliacao = Avaliacao.objects.get(pk=pk, configuracao__perfil__user=active_user)
            serializer = AvaliacaoSerializer(avaliacao, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Avaliacao.DoesNotExist:
            return Response({"erro": "Avaliação não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            _, active_user = obter_perfil_ativo(request)
            avaliacao = Avaliacao.objects.get(pk=pk, configuracao__perfil__user=active_user)
            avaliacao.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Avaliacao.DoesNotExist:
            return Response({"erro": "Avaliação não encontrada."}, status=status.HTTP_404_NOT_FOUND)


class AnotacaoMateriaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        config_id = request.data.get('configuracao_id')
        if not config_id:
            return Response({"erro": "configuracao_id é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            _, active_user = obter_perfil_ativo(request)
            config = ConfiguracaoMateria.objects.get(id=config_id, perfil__user=active_user)
            serializer = AnotacaoMateriaSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(subject_config=config)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ConfiguracaoMateria.DoesNotExist:
            return Response({"erro": "Configuração não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            _, active_user = obter_perfil_ativo(request)
            note = AnotacaoMateria.objects.get(pk=pk, subject_config__perfil__user=active_user)
            serializer = AnotacaoMateriaSerializer(note, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except AnotacaoMateria.DoesNotExist:
            return Response({"erro": "Anotação não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            _, active_user = obter_perfil_ativo(request)
            note = AnotacaoMateria.objects.get(pk=pk, subject_config__perfil__user=active_user)
            note.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AnotacaoMateria.DoesNotExist:
            return Response({"erro": "Anotação não encontrada."}, status=status.HTTP_404_NOT_FOUND)
