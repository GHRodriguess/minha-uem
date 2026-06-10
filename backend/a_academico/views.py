from django.views import View
from django.db.models import Q
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from .models import PerfilAcademico, RegistroFalta, Materia, AnoLetivo, ConfiguracaoMateria, Avaliacao, ConfiguracaoGeralClassroom, VinculoGoogleClassroom, ArquivoMateriaClassroom, Horario, AnotacaoMateria, ChamadoSuporte, MensagemChamado, Curso, Noticia, ProfessorClassroom, ChaveApiGemini
from .serializers import PerfilAcademicoSerializer, ConfiguracaoMateriaSerializer, AvaliacaoSerializer, ConfiguracaoGeralClassroomSerializer, VinculoGoogleClassroomSerializer, ArquivoMateriaClassroomSerializer, AnotacaoMateriaSerializer, MateriaSerializer, ChamadoSuporteSerializer, MensagemChamadoSerializer, UsuarioAdminSerializer, NoticiaSerializer, ProfessorClassroomSerializer
from .services import ServicoExtracaoHorario, ServicoCriptografia
import requests
import re
import unicodedata

def obter_perfil_ativo(request):
    user = request.user
    impersonate_email = request.headers.get('X-Impersonate-User')
    if impersonate_email and (user.is_staff or user.is_superuser):
        try:
            impersonated_user = User.objects.get(email=impersonate_email)
            perfil, _ = PerfilAcademico.objects.get_or_create(user=impersonated_user)
            return perfil, impersonated_user
        except User.DoesNotExist:
            pass
    perfil, _ = PerfilAcademico.objects.get_or_create(user=user)
    return perfil, user

def normalizar_para_busca(text):
    text_lower = text.lower()
    text_normalized = unicodedata.normalize('NFKD', text_lower)
    text_ascii = ''.join(c for c in text_normalized if not unicodedata.combining(c))
    return re.findall(r'\b\w+\b', text_ascii)

def nomes_sao_compativeis(subject_name, course_name):
    subject_words = normalizar_para_busca(subject_name)
    course_words = normalizar_para_busca(course_name)
    
    if not subject_words or not course_words:
        return False
        
    if subject_words == course_words:
        return True
        
    def eh_subsequencia(sub_seq, main_seq):
        len_sub, len_main = len(sub_seq), len(main_seq)
        for index in range(len_main - len_sub + 1):
            if main_seq[index:index+len_sub] == sub_seq:
                return True
        return False
        
    return eh_subsequencia(subject_words, course_words) or eh_subsequencia(course_words, subject_words)

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



class ConfiguracaoClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = obter_perfil_ativo(request)
        config, _ = ConfiguracaoGeralClassroom.objects.get_or_create(profile=profile)
        serializer = ConfiguracaoGeralClassroomSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = obter_perfil_ativo(request)
        config, _ = ConfiguracaoGeralClassroom.objects.get_or_create(profile=profile)
        serializer = ConfiguracaoGeralClassroomSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListarCursosClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        google_token = request.headers.get('X-Google-Access-Token')
        if not google_token:
            return Response({'erro': 'Token do Google não fornecido'}, status=status.HTTP_400_BAD_REQUEST)

        headers = {'Authorization': f'Bearer {google_token}'}
        response = requests.get('https://classroom.googleapis.com/v1/courses', headers=headers)
        if response.status_code == 401:
            return Response({'erro': 'Token do Google expirado ou inválido', 'codigo': 'GOOGLE_TOKEN_EXPIRADO'}, status=status.HTTP_400_BAD_REQUEST)
        if response.status_code != 200:
            return Response({'erro': 'Erro ao buscar turmas do Google Classroom', 'detalhe': response.text}, status=response.status_code)

        data = response.json()
        courses = data.get('courses', [])
        return Response(courses)


def sincronizar_dados_adicionais_classroom(connection, google_token):
    headers = {'Authorization': f'Bearer {google_token}'}
    course_id = connection.classroom_course_id
    
    course_res = requests.get(f'https://classroom.googleapis.com/v1/courses/{course_id}', headers=headers)
    if course_res.status_code == 200:
        course_data = course_res.json()
        connection.classroom_alternate_link = course_data.get('alternateLink')
        connection.save()

    teachers_res = requests.get(f'https://classroom.googleapis.com/v1/courses/{course_id}/teachers', headers=headers)
    if teachers_res.status_code == 200:
        teachers_data = teachers_res.json().get('teachers', [])
        existing_ids = []
        
        for teacher in teachers_data:
            profile = teacher.get('profile', {})
            user_id = teacher.get('userId')
            if not user_id:
                continue
            
            name = profile.get('name', {}).get('fullName', 'Sem Nome')
            email = profile.get('emailAddress', '')
            photo_url = profile.get('photoUrl')
            
            if photo_url and photo_url.startswith('//'):
                photo_url = 'https:' + photo_url
                
            prof_obj, _ = ProfessorClassroom.objects.update_or_create(
                classroom_connection=connection,
                google_user_id=user_id,
                defaults={
                    'name': name,
                    'email': email,
                    'photo_url': photo_url
                }
            )
            existing_ids.append(prof_obj.id)
            
        connection.professores.exclude(id__in=existing_ids).delete()


class VincularCursoClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        materia_id = request.data.get('materia_id')
        ano_id = request.data.get('ano_id')
        classroom_course_id = request.data.get('classroom_course_id')
        classroom_course_name = request.data.get('classroom_course_name')

        if not all([materia_id, ano_id, classroom_course_id, classroom_course_name]):
            return Response({'erro': 'Campos obrigatórios faltando'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile, _ = obter_perfil_ativo(request)
            ano_letivo = AnoLetivo.objects.get(id=ano_id, perfil=profile)
            materia = Materia.objects.get(id=materia_id)
            subject_config, _ = ConfiguracaoMateria.objects.get_or_create(
                perfil=profile,
                materia=materia,
                ano_letivo=ano_letivo
            )

            connection, created = VinculoGoogleClassroom.objects.update_or_create(
                subject_config=subject_config,
                defaults={
                    'classroom_course_id': classroom_course_id,
                    'classroom_course_name': classroom_course_name
                }
            )
            
            google_token = request.headers.get('X-Google-Access-Token')
            if google_token:
                try:
                    sincronizar_dados_adicionais_classroom(connection, google_token)
                except Exception:
                    pass
            
            serializer = VinculoGoogleClassroomSerializer(connection)
            cache_key = f"classroom_notificacoes_{profile.id}_{ano_id}"
            cache.delete(cache_key)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        materia_id = request.query_params.get('materia_id') or request.data.get('materia_id')
        ano_id = request.query_params.get('ano_id') or request.data.get('ano_id')
        if not materia_id or not ano_id:
            return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile, _ = obter_perfil_ativo(request)
            connection = VinculoGoogleClassroom.objects.get(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            )
            connection.delete()
            cache_key = f"classroom_notificacoes_{profile.id}_{ano_id}"
            cache.delete(cache_key)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


import os
from pathlib import Path

class ExploradorDiretoriosView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        path_str = request.query_params.get('path', '')
        
        # Tenta usar o caminho fornecido, se falhar ou não existir, usa a Home
        try:
            if not path_str:
                base_path = Path.home()
            else:
                base_path = Path(path_str)
                
            if not base_path.exists() or not base_path.is_dir():
                base_path = Path.home()
        except Exception:
            base_path = Path.home()

        try:
            items = []
            
            if base_path != base_path.parent:
                items.append({
                    "nome": "..",
                    "path": str(base_path.parent),
                    "tipo": "diretorio"
                })

            for entry in os.scandir(base_path):
                try:
                    if entry.is_dir() and not entry.name.startswith('.'):
                        items.append({
                            "nome": entry.name,
                            "path": entry.path,
                            "tipo": "diretorio"
                        })
                except (PermissionError, OSError):
                    continue
            
            items.sort(key=lambda x: x["nome"].lower())
            
            return Response({
                "atual": str(base_path),
                "itens": items
            })
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ArquivosMateriaClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        materia_id = request.query_params.get('materia_id')
        ano_id = request.query_params.get('ano_id')
        google_token = request.headers.get('X-Google-Access-Token')

        if not materia_id or not ano_id:
            return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile, _ = obter_perfil_ativo(request)
            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()

            if not connection and google_token:
                materia = Materia.objects.get(id=materia_id)
                ano_letivo = AnoLetivo.objects.get(id=ano_id, perfil=profile)
                config_materia, _ = ConfiguracaoMateria.objects.get_or_create(
                    perfil=profile,
                    materia=materia,
                    ano_letivo=ano_letivo
                )

                if config_materia:
                    headers = {'Authorization': f'Bearer {google_token}'}
                    courses_res = requests.get('https://classroom.googleapis.com/v1/courses', headers=headers)
                    if courses_res.status_code == 401:
                        return Response({'erro': 'Token do Google expirado ou inválido', 'codigo': 'GOOGLE_TOKEN_EXPIRADO'}, status=status.HTTP_400_BAD_REQUEST)
                    if courses_res.status_code == 200:
                        courses_data = courses_res.json().get('courses', [])
                        nome_materia_normalizado = config_materia.materia.nome
                        
                        for course in courses_data:
                            nome_curso_normalizado = course.get('name', '')
                            if nomes_sao_compativeis(nome_materia_normalizado, nome_curso_normalizado):
                                try:
                                    connection, _ = VinculoGoogleClassroom.objects.get_or_create(
                                        subject_config=config_materia,
                                        defaults={
                                            'classroom_course_id': course.get('id'),
                                            'classroom_course_name': course.get('name')
                                        }
                                    )
                                except Exception:
                                    connection = VinculoGoogleClassroom.objects.filter(subject_config=config_materia).first()
                                break

            if not connection:
                return Response({'vinculado': False, 'arquivos': []})

            if google_token:
                if not connection.classroom_alternate_link or not connection.professores.exists() or connection.professores.filter(email='').exists():
                    try:
                        sincronizar_dados_adicionais_classroom(connection, google_token)
                    except Exception:
                        pass

            def limpar_nome_pasta(nome):
                import re
                return re.sub(r'[\/\\:\*\?"<>\|]', '', nome).strip()

            curso_nome = limpar_nome_pasta(profile.curso.nome if profile.curso else "Sem_Curso")
            ano_letivo = str(connection.subject_config.ano_letivo.ano)
            materia_nome = limpar_nome_pasta(connection.subject_config.materia.nome)

            if google_token:
                arquivos_mesclados = self._obter_arquivos_classroom_em_tempo_real(connection, google_token)
                return Response({
                    'vinculado': True,
                    'classroom_course_id': connection.classroom_course_id,
                    'classroom_course_name': connection.classroom_course_name,
                    'curso_nome': curso_nome,
                    'ano_letivo': ano_letivo,
                    'materia_nome': materia_nome,
                    'custom_folders': connection.custom_folders,
                    'classroom_alternate_link': connection.classroom_alternate_link,
                    'professores': ProfessorClassroomSerializer(connection.professores.all(), many=True).data,
                    'arquivos': arquivos_mesclados
                })
            else:
                arquivos = connection.arquivos.all().order_by('-sync_at')
                serializer = ArquivoMateriaClassroomSerializer(arquivos, many=True)
                return Response({
                    'vinculado': True,
                    'classroom_course_id': connection.classroom_course_id,
                    'classroom_course_name': connection.classroom_course_name,
                    'curso_nome': curso_nome,
                    'ano_letivo': ano_letivo,
                    'materia_nome': materia_nome,
                    'custom_folders': connection.custom_folders,
                    'classroom_alternate_link': connection.classroom_alternate_link,
                    'professores': ProfessorClassroomSerializer(connection.professores.all(), many=True).data,
                    'arquivos': serializer.data
                })
        except PermissionError as e:
            if str(e) == 'GOOGLE_TOKEN_EXPIRADO':
                return Response({'erro': 'Token do Google expirado ou inválido', 'codigo': 'GOOGLE_TOKEN_EXPIRADO'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _obter_arquivos_classroom_em_tempo_real(self, connection, token):
        return obter_arquivos_classroom_em_tempo_real(connection, token)


class AtualizarCategoriasVinculoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        materia_id = request.data.get('materia_id')
        ano_id = request.data.get('ano_id')
        custom_folders = request.data.get('custom_folders', '')
        redistributions = request.data.get('redistribuicoes', [])

        if not materia_id or not ano_id:
            return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile, _ = obter_perfil_ativo(request)
            connection = VinculoGoogleClassroom.objects.get(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            )

            connection.custom_folders = custom_folders
            connection.save()

            if redistributions:
                for item in redistributions:
                    file_id = item.get('drive_file_id')
                    new_folder = item.get('new_folder')
                    if file_id and new_folder:
                        ArquivoMateriaClassroom.objects.filter(
                            classroom_connection=connection,
                            drive_file_id=file_id
                        ).update(selected_folder=new_folder)

            return Response({
                'sucesso': True,
                'custom_folders': connection.custom_folders
            })
        except VinculoGoogleClassroom.DoesNotExist:
            return Response({'erro': 'Vínculo do Classroom não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AtualizarArquivoClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, drive_file_id):
        try:
            profile, _ = obter_perfil_ativo(request)
            materia_id = request.data.get('materia_id')
            ano_id = request.data.get('ano_id')
            
            if not materia_id or not ano_id:
                return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)
                
            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()
            
            if not connection:
                return Response({'erro': 'Vínculo do Classroom não encontrado'}, status=status.HTTP_404_NOT_FOUND)

            original_name = request.data.get('original_name', 'Arquivo Sem Nome')
            
            file_obj, created = ArquivoMateriaClassroom.objects.get_or_create(
                drive_file_id=drive_file_id,
                defaults={
                    'classroom_connection': connection,
                    'original_name': original_name,
                    'selected_folder': 'documentos'
                }
            )

            serializer = ArquivoMateriaClassroomSerializer(file_obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ObterConteudoArquivoDriveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, drive_file_id):
        google_token = request.headers.get('X-Google-Access-Token')
        if not google_token:
            return Response({'erro': 'Token do Google não fornecido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import requests
            from django.http import StreamingHttpResponse

            headers = {'Authorization': f'Bearer {google_token}'}
            drive_url = f'https://www.googleapis.com/drive/v3/files/{drive_file_id}?alt=media'
            
            drive_res = requests.get(drive_url, headers=headers, stream=True)

            if drive_res.status_code == 401:
                return Response({'erro': 'Token do Google expirado ou inválido', 'codigo': 'GOOGLE_TOKEN_EXPIRADO'}, status=status.HTTP_400_BAD_REQUEST)

            if drive_res.status_code != 200:
                return Response({
                    'erro': 'Falha ao obter conteúdo da API do Google Drive', 
                    'detalhe': drive_res.text
                }, status=drive_res.status_code)

            content_type = drive_res.headers.get('Content-Type', 'application/octet-stream')
            response = StreamingHttpResponse(
                drive_res.iter_content(chunk_size=8192),
                content_type=content_type
            )
            response['Content-Disposition'] = f'attachment; filename="drive_{drive_file_id}"'
            return response
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BaixarArquivoClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, drive_file_id):
        try:
            profile, _ = obter_perfil_ativo(request)
            materia_id = request.data.get('materia_id')
            ano_id = request.data.get('ano_id')
            original_name = request.data.get('original_name', 'Arquivo Sem Nome')
            local_path = request.data.get('local_path')
            selected_folder = request.data.get('selected_folder', 'documentos')
            
            if not materia_id or not ano_id:
                return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()

            if not connection:
                return Response({'erro': 'Vínculo do Classroom não encontrado'}, status=status.HTTP_404_NOT_FOUND)

            file_obj, created = ArquivoMateriaClassroom.objects.get_or_create(
                drive_file_id=drive_file_id,
                defaults={
                    'classroom_connection': connection,
                    'original_name': original_name,
                    'selected_folder': selected_folder
                }
            )

            if local_path:
                file_obj.local_path = local_path
            file_obj.save()

            serializer = ArquivoMateriaClassroomSerializer(file_obj)
            return Response(serializer.data)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AbrirArquivoLocalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({'erro': 'Abertura direta pelo servidor desativada em produção. Utilize o frontend para abrir localmente.'}, status=status.HTTP_400_BAD_REQUEST)


class AdicionarArquivoLocalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        materia_id = request.data.get('materia_id')
        ano_id = request.data.get('ano_id')
        selected_folder = request.data.get('selected_folder', 'documentos')
        original_name = request.data.get('original_name')
        local_path = request.data.get('local_path')
        
        if not materia_id or not ano_id or not original_name:
            return Response({'erro': 'materia_id, ano_id e original_name são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            profile, _ = obter_perfil_ativo(request)
            
            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()
            
            if not connection:
                config_materia = ConfiguracaoMateria.objects.filter(
                    perfil=profile,
                    materia_id=materia_id,
                    ano_letivo_id=ano_id
                ).first()
                
                if not config_materia:
                    return Response({'erro': 'Matéria não encontrada no perfil do usuário'}, status=status.HTTP_404_NOT_FOUND)
                
                connection = VinculoGoogleClassroom.objects.create(
                    subject_config=config_materia,
                    classroom_course_id='local',
                    classroom_course_name='Arquivos Locais'
                )
                
            import uuid
            drive_file_id = f"local_{uuid.uuid4()}"
            
            file_obj = ArquivoMateriaClassroom.objects.create(
                classroom_connection=connection,
                drive_file_id=drive_file_id,
                original_name=original_name,
                selected_folder=selected_folder,
                local_path=local_path
            )
            
            serializer = ArquivoMateriaClassroomSerializer(file_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SincronizarArquivosLocaisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        materia_id = request.data.get('materia_id')
        ano_id = request.data.get('ano_id')
        local_files = request.data.get('arquivos', [])
        
        if not materia_id or not ano_id:
            return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            profile, _ = obter_perfil_ativo(request)
            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()
            
            if not connection:
                return Response([])
                
            local_paths = {item.get('local_path'): item for item in local_files if item.get('local_path')}
            local_drive_ids = {item.get('drive_file_id'): item for item in local_files if item.get('drive_file_id')}
            
            arquivos = connection.arquivos.all()
            caminhos_pareados = set()
            
            for arq in arquivos:
                downloaded_now = False
                found_path = None
                
                if arq.drive_file_id in local_drive_ids:
                    downloaded_now = True
                    found_path = local_drive_ids[arq.drive_file_id].get('local_path')
                elif arq.local_path in local_paths:
                    downloaded_now = True
                    found_path = arq.local_path
                else:
                    for path_key, item in local_paths.items():
                        if item.get('original_name') == arq.original_name and item.get('selected_folder') == arq.selected_folder:
                            downloaded_now = True
                            found_path = path_key
                            break
                            
                if downloaded_now:
                    if found_path:
                        arq.local_path = found_path
                        arq.save()
                        caminhos_pareados.add(found_path)
                else:
                    if arq.drive_file_id.startswith('local_'):
                        arq.delete()
                    else:
                        arq.local_path = None
                        arq.save()
                
            import uuid
            for item in local_files:
                path_key = item.get('local_path')
                if path_key and path_key not in caminhos_pareados:
                    drive_file_id = item.get('drive_file_id') or f"local_{uuid.uuid4()}"
                    if not connection.arquivos.filter(drive_file_id=drive_file_id).exists():
                        ArquivoMateriaClassroom.objects.create(
                            classroom_connection=connection,
                            drive_file_id=drive_file_id,
                            original_name=item.get('original_name'),
                            selected_folder=item.get('selected_folder', 'documentos'),
                            local_path=path_key
                        )
            
            arquivos_atualizados = connection.arquivos.all().order_by('-sync_at')
            serializer = ArquivoMateriaClassroomSerializer(arquivos_atualizados, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


from django.utils import timezone
import json
import base64
from concurrent.futures import ThreadPoolExecutor

class MuralClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def obter_dados_mural(self, connection, google_token, page_tokens, is_first_page):
        headers = {'Authorization': f'Bearer {google_token}'}
        course_id = connection.classroom_course_id

        ann_token = page_tokens.get('announcements')
        cw_token = page_tokens.get('courseWork')
        cwm_token = page_tokens.get('courseWorkMaterials')

        ann_url = None
        if is_first_page or ann_token:
            ann_url = f'https://classroom.googleapis.com/v1/courses/{course_id}/announcements?pageSize=5'
            if ann_token:
                ann_url += f'&pageToken={ann_token}'

        cw_url = None
        if is_first_page or cw_token:
            cw_url = f'https://classroom.googleapis.com/v1/courses/{course_id}/courseWork?pageSize=5'
            if cw_token:
                cw_url += f'&pageToken={cw_token}'

        cwm_url = None
        if is_first_page or cwm_token:
            cwm_url = f'https://classroom.googleapis.com/v1/courses/{course_id}/courseWorkMaterials?pageSize=5'
            if cwm_token:
                cwm_url += f'&pageToken={cwm_token}'

        def realizar_requisicao(url):
            if not url:
                return {}
            try:
                res = requests.get(url, headers=headers)
                if res.status_code == 401:
                    raise PermissionError("GOOGLE_TOKEN_EXPIRADO")
                if res.status_code == 200:
                    return res.json()
            except Exception:
                pass
            return {}

        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [
                executor.submit(realizar_requisicao, ann_url),
                executor.submit(realizar_requisicao, cw_url),
                executor.submit(realizar_requisicao, cwm_url)
            ]
            results = [f.result() for f in futures]

        return results[0], results[1], results[2]

    def processar_anexos(self, materials_list):
        attachments = []
        if not materials_list:
            return attachments
        for item in materials_list:
            if 'driveFile' in item:
                file_info = item['driveFile']['driveFile']
                attachments.append({
                    'tipo': 'drive',
                    'id': file_info.get('id'),
                    'titulo': file_info.get('title'),
                    'url': file_info.get('alternateLink'),
                    'thumbnail': file_info.get('thumbnailUrl')
                })
            elif 'youtubeVideo' in item:
                video_info = item['youtubeVideo']
                attachments.append({
                    'tipo': 'youtube',
                    'id': video_info.get('id'),
                    'titulo': video_info.get('title'),
                    'url': video_info.get('alternateLink'),
                    'thumbnail': video_info.get('thumbnailUrl')
                })
            elif 'link' in item:
                link_info = item['link']
                attachments.append({
                    'tipo': 'link',
                    'titulo': link_info.get('title') or link_info.get('url'),
                    'url': link_info.get('url'),
                    'thumbnail': link_info.get('thumbnailUrl')
                })
            elif 'form' in item:
                form_info = item['form']
                attachments.append({
                    'tipo': 'form',
                    'titulo': form_info.get('title') or 'Formulário do Google',
                    'url': form_info.get('formUrl'),
                    'thumbnail': form_info.get('thumbnailUrl')
                })
        return attachments

    def get(self, request):
        materia_id = request.query_params.get('materia_id')
        ano_id = request.query_params.get('ano_id')
        google_token = request.headers.get('X-Google-Access-Token')
        page_token_raw = request.query_params.get('pageToken')

        if not materia_id or not ano_id:
            return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        if not google_token:
            return Response({'erro': 'Token do Google não fornecido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile, _ = obter_perfil_ativo(request)
            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()

            if not connection:
                return Response({'vinculado': False, 'mural': [], 'nextPageToken': None})

            page_tokens = {}
            if page_token_raw:
                try:
                    page_tokens = json.loads(base64.b64decode(page_token_raw).decode('utf-8'))
                except Exception:
                    pass

            ultimo_acesso = connection.ultimo_acesso_mural

            ann_data, cw_data, cwm_data = self.obter_dados_mural(connection, google_token, page_tokens, not page_token_raw)

            posts = []

            for item in ann_data.get('announcements', []):
                posts.append({
                    'id': item.get('id'),
                    'tipo': 'aviso',
                    'titulo': (item.get('text', '')[:60] + '...') if len(item.get('text', '')) > 60 else item.get('text', 'Aviso'),
                    'texto': item.get('text'),
                    'data_criacao': item.get('creationTime'),
                    'data_atualizacao': item.get('updateTime'),
                    'link': item.get('alternateLink'),
                    'materiais': self.processar_anexos(item.get('materials'))
                })

            for item in cw_data.get('courseWork', []):
                due_date_info = item.get('dueDate')
                due_time_info = item.get('dueTime')
                due_date_iso = None
                if due_date_info:
                    year = due_date_info.get('year')
                    month = due_date_info.get('month')
                    day = due_date_info.get('day')
                    hour = due_time_info.get('hours', 23) if due_time_info else 23
                    minute = due_time_info.get('minutes', 59) if due_time_info else 59
                    due_date_iso = f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:00Z"

                posts.append({
                    'id': item.get('id'),
                    'tipo': 'tarefa',
                    'titulo': item.get('title'),
                    'texto': item.get('description'),
                    'data_criacao': item.get('creationTime'),
                    'data_atualizacao': item.get('updateTime'),
                    'link': item.get('alternateLink'),
                    'data_entrega': due_date_iso,
                    'materiais': self.processar_anexos(item.get('materials'))
                })

            for item in cwm_data.get('courseWorkMaterial', []):
                posts.append({
                    'id': item.get('id'),
                    'tipo': 'material',
                    'titulo': item.get('title'),
                    'texto': item.get('description'),
                    'data_criacao': item.get('creationTime'),
                    'data_atualizacao': item.get('updateTime'),
                    'link': item.get('alternateLink'),
                    'materiais': self.processar_anexos(item.get('materials'))
                })

            posts.sort(key=lambda x: x.get('data_criacao', ''), reverse=True)

            for post in posts:
                creation_time_str = post.get('data_criacao')
                if creation_time_str:
                    try:
                        from django.utils.dateparse import parse_datetime
                        post_time = parse_datetime(creation_time_str)
                        if ultimo_acesso and post_time:
                            post['nao_lido'] = post_time > ultimo_acesso
                        else:
                            post['nao_lido'] = True
                    except Exception:
                        post['nao_lido'] = True
                else:
                    post['nao_lido'] = False

            connection.ultimo_acesso_mural = timezone.now()
            connection.save()

            cache_key = f"classroom_notificacoes_{profile.id}_{ano_id}"
            cache.delete(cache_key)

            next_tokens = {
                'announcements': ann_data.get('nextPageToken'),
                'courseWork': cw_data.get('nextPageToken'),
                'courseWorkMaterials': cwm_data.get('nextPageToken')
            }

            has_next = any(next_tokens.values())
            next_token_b64 = None
            if has_next:
                next_token_b64 = base64.b64encode(json.dumps(next_tokens).encode('utf-8')).decode('utf-8')

            return Response({
                'vinculado': True,
                'mural': posts,
                'nextPageToken': next_token_b64,
                'ultimo_acesso_mural': ultimo_acesso.isoformat() if ultimo_acesso else None
            })

        except PermissionError as e:
            if str(e) == 'GOOGLE_TOKEN_EXPIRADO':
                return Response({'erro': 'Token do Google expirado ou inválido', 'codigo': 'GOOGLE_TOKEN_EXPIRADO'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MarcarMuralLidoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        materia_id = request.data.get('materia_id')
        ano_id = request.data.get('ano_id')

        if not materia_id or not ano_id:
            return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile, _ = obter_perfil_ativo(request)
            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()

            if connection:
                connection.ultimo_acesso_mural = timezone.now()
                connection.save()
                cache_key = f"classroom_notificacoes_{profile.id}_{ano_id}"
                cache.delete(cache_key)
                return Response({'sucesso': True})
            return Response({'erro': 'Vínculo do Classroom não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class NotificacoesClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ano_id = request.query_params.get('ano_id')
        google_token = request.headers.get('X-Google-Access-Token')

        if not ano_id:
            return Response({'erro': 'ano_id é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        if not google_token:
            return Response({'erro': 'Token do Google não fornecido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import uuid
            from email import message_from_bytes
            
            profile, _ = obter_perfil_ativo(request)
            cache_key = f"classroom_notificacoes_{profile.id}_{ano_id}"
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                response_copy = dict(cached_data)
                response_copy['cached'] = True
                return Response(response_copy)

            connections = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__ano_letivo_id=ano_id
            )

            sub_requests = []
            for conn in connections:
                course_id = conn.classroom_course_id
                sub_requests.append({
                    'conn': conn,
                    'type': 'announcements',
                    'relative_url': f'/v1/courses/{course_id}/announcements?pageSize=3&fields=announcements(id,text,creationTime)'
                })
                sub_requests.append({
                    'conn': conn,
                    'type': 'courseWork',
                    'relative_url': f'/v1/courses/{course_id}/courseWork?pageSize=3&fields=courseWork(id,title,creationTime)'
                })
                sub_requests.append({
                    'conn': conn,
                    'type': 'courseWorkMaterials',
                    'relative_url': f'/v1/courses/{course_id}/courseWorkMaterials?pageSize=3&fields=courseWorkMaterial(id,title,creationTime)'
                })

            sub_responses = {}
            if sub_requests:
                def executar_requisicao(req_info):
                    headers = {'Authorization': f'Bearer {google_token}'}
                    url = f"https://classroom.googleapis.com{req_info['relative_url']}"
                    try:
                        res = requests.get(url, headers=headers)
                        if res.status_code == 401:
                            return req_info, 401, {}
                        if res.status_code == 200:
                            return req_info, 200, res.json()
                        return req_info, res.status_code, {}
                    except Exception:
                        return req_info, 500, {}

                from concurrent.futures import ThreadPoolExecutor
                with ThreadPoolExecutor(max_workers=15) as executor:
                    results = list(executor.map(executar_requisicao, sub_requests))
                
                for req_info, status_code, data in results:
                    if status_code == 401:
                        raise PermissionError("GOOGLE_TOKEN_EXPIRADO")
                    if status_code == 200:
                        conn_id = req_info['conn'].id
                        if conn_id not in sub_responses:
                            sub_responses[conn_id] = {}
                        sub_responses[conn_id][req_info['type']] = data

            global_unread_count = 0
            subject_updates = []

            for conn in connections:
                conn_id = conn.id
                conn_data = sub_responses.get(conn_id, {})
                
                ann_data = conn_data.get('announcements', {})
                cw_data = conn_data.get('courseWork', {})
                cwm_data = conn_data.get('courseWorkMaterials', {})

                items = []

                for item in ann_data.get('announcements', []):
                    items.append({
                        'id': item.get('id'),
                        'tipo': 'aviso',
                        'titulo': (item.get('text', '')[:40] + '...') if len(item.get('text', '')) > 40 else item.get('text', 'Aviso'),
                        'data_criacao': item.get('creationTime')
                    })

                for item in cw_data.get('courseWork', []):
                    items.append({
                        'id': item.get('id'),
                        'tipo': 'tarefa',
                        'titulo': item.get('title'),
                        'data_criacao': item.get('creationTime')
                    })

                for item in cwm_data.get('courseWorkMaterial', []):
                    items.append({
                        'id': item.get('id'),
                        'tipo': 'material',
                        'titulo': item.get('title'),
                        'data_criacao': item.get('creationTime')
                    })

                unread_items = []
                ultimo_acesso = conn.ultimo_acesso_mural

                for item in items:
                    creation_time_str = item.get('data_criacao')
                    if creation_time_str:
                        try:
                            from django.utils.dateparse import parse_datetime
                            post_time = parse_datetime(creation_time_str)
                            if ultimo_acesso and post_time:
                                if post_time > ultimo_acesso:
                                    unread_items.append(item)
                            else:
                                unread_items.append(item)
                        except Exception:
                            pass

                if unread_items:
                    global_unread_count += len(unread_items)
                    subject_updates.append({
                        'materia_id': conn.subject_config.materia.id,
                        'materia_nome': conn.subject_config.materia.nome,
                        'novidades_count': len(unread_items),
                        'mensagens': unread_items
                    })

            from django.conf import settings
            cache_ttl = getattr(settings, 'CLASSROOM_CACHE_TTL', 60)

            response_data = {
                'total_nao_lidos': global_unread_count,
                'atualizacoes': subject_updates,
                'atualizado_em': timezone.now().isoformat()
            }
            cache.set(cache_key, response_data, cache_ttl)

            response_copy = dict(response_data)
            response_copy['cached'] = False
            return Response(response_copy)

        except PermissionError as e:
            if str(e) == 'GOOGLE_TOKEN_EXPIRADO':
                return Response({'erro': 'Token do Google expirado ou inválido', 'codigo': 'GOOGLE_TOKEN_EXPIRADO'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


from django.urls import reverse
from django.http import HttpResponse
from django.utils.timezone import now
from datetime import timedelta
import uuid

def obter_primeira_data_dia(data_inicio, dia_alvo):
    weekday_alvo = dia_alvo - 1
    current = data_inicio
    for _ in range(7):
        if current.weekday() == weekday_alvo:
            return current
        current += timedelta(days=1)
    return data_inicio

def mesclar_aulas_consecutivas(schedules):
    if not schedules:
        return []
    groups = {}
    for schedule in schedules:
        key = (schedule.dia, schedule.materia.id, schedule.data_inicio, schedule.data_termino)
        if key not in groups:
            groups[key] = []
        groups[key].append(schedule)
    merged_schedules = []
    for key, group_list in groups.items():
        group_list.sort(key=lambda s: s.inicio)
        current = None
        for schedule in group_list:
            if current is None:
                current = {
                    'id': schedule.id,
                    'materia': schedule.materia,
                    'turma': schedule.turma,
                    'departamento': schedule.departamento,
                    'periodo': schedule.periodo,
                    'data_inicio': schedule.data_inicio,
                    'data_termino': schedule.data_termino,
                    'bloco': schedule.bloco,
                    'dia': schedule.dia,
                    'inicio': schedule.inicio,
                    'fim': schedule.fim,
                    'sala': schedule.sala,
                }
            else:
                if schedule.inicio == current['fim']:
                    current['fim'] = schedule.fim
                else:
                    merged_schedules.append(current)
                    current = {
                        'id': schedule.id,
                        'materia': schedule.materia,
                        'turma': schedule.turma,
                        'departamento': schedule.departamento,
                        'periodo': schedule.periodo,
                        'data_inicio': schedule.data_inicio,
                        'data_termino': schedule.data_termino,
                        'bloco': schedule.bloco,
                        'dia': schedule.dia,
                        'inicio': schedule.inicio,
                        'fim': schedule.fim,
                        'sala': schedule.sala,
                    }
        if current:
            merged_schedules.append(current)
    return merged_schedules

class ObterInfoAgendaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = obter_perfil_ativo(request)
        if not profile.calendar_token:
            profile.calendar_token = uuid.uuid4()
            profile.save()
        feed_url = request.build_absolute_uri(
            reverse('agenda_feed', kwargs={'token': profile.calendar_token})
        )
        return Response({
            'feed_url': feed_url
        })

class RegenerarTokenAgendaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile, _ = obter_perfil_ativo(request)
        profile.calendar_token = uuid.uuid4()
        profile.save()
        feed_url = request.build_absolute_uri(
            reverse('agenda_feed', kwargs={'token': profile.calendar_token})
        )
        return Response({
            'feed_url': feed_url
        })

class FeedAgendaView(View):
    def get(self, request, token):
        cache_key = f"agenda_ical_{token}"
        cached_ics = cache.get(cache_key)
        if cached_ics is not None:
            response = HttpResponse(cached_ics, content_type="text/calendar; charset=utf-8")
            response['Content-Disposition'] = 'inline; filename="agenda_minha_uem.ics"'
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            return response

        try:
            profile = PerfilAcademico.objects.get(calendar_token=token)
        except PerfilAcademico.DoesNotExist:
            return HttpResponse("Agenda nao encontrada.", status=404, content_type="text/plain")

        lines = []
        lines.append("BEGIN:VCALENDAR")
        lines.append("VERSION:2.0")
        lines.append("PRODID:-//Minha UEM//Agenda Academica//PT")
        lines.append("CALSCALE:GREGORIAN")
        lines.append("METHOD:PUBLISH")
        lines.append("X-WR-CALNAME:Minha UEM - Agenda")
        lines.append("X-WR-TIMEZONE:America/Sao_Paulo")

        horarios = Horario.objects.filter(
            Q(anoletivo__perfil=profile) | Q(perfilacademico=profile)
        ).select_related('materia').distinct()

        merged_schedules = mesclar_aulas_consecutivas(horarios)

        avaliacoes = Avaliacao.objects.filter(
            configuracao__perfil=profile
        ).select_related('configuracao__materia')

        byday_map = {
            1: "MO",
            2: "TU",
            3: "WE",
            4: "TH",
            5: "FR",
            6: "SA",
            7: "SU"
        }

        for horario in merged_schedules:
            first_date = obter_primeira_data_dia(horario['data_inicio'], horario['dia'])
            start_str = f"{first_date.strftime('%Y%m%d')}T{horario['inicio'].strftime('%H%M%S')}"
            end_str = f"{first_date.strftime('%Y%m%d')}T{horario['fim'].strftime('%H%M%S')}"
            until_str = f"{horario['data_termino'].strftime('%Y%m%d')}T235959Z"

            subject_name = horario['materia'].nome
            event_title = subject_name

            desc_lines = []
            desc_lines.append(f"Materia: {subject_name} ({horario['materia'].codigo})")
            desc_lines.append(f"Bloco: {horario['bloco']}")
            desc_lines.append(f"Sala: {horario['sala']}")
            desc_lines.append(f"Turma: {horario['turma']}")
            desc_lines.append(f"Departamento: {horario['departamento']}")
            desc_lines.append(f"Periodo: {horario['periodo']}")
            event_desc = "\\n".join(desc_lines)

            day_code = byday_map.get(horario['dia'], "MO")

            lines.append("BEGIN:VEVENT")
            lines.append(f"UID:class_{horario['id']}_{profile.id}@minhauem.com.br")
            lines.append(f"DTSTAMP:{now().strftime('%Y%m%dT%H%M%SZ')}")
            lines.append(f"DTSTART;TZID=America/Sao_Paulo:{start_str}")
            lines.append(f"DTEND;TZID=America/Sao_Paulo:{end_str}")
            lines.append(f"RRULE:FREQ=WEEKLY;BYDAY={day_code};UNTIL={until_str}")
            lines.append(f"SUMMARY:{event_title}")
            lines.append(f"LOCATION:Bloco {horario['bloco']} - Sala {horario['sala']}")
            lines.append(f"DESCRIPTION:{event_desc}")
            lines.append("END:VEVENT")

        for avaliacao in avaliacoes:
            if not avaliacao.data:
                continue

            next_date = avaliacao.data + timedelta(days=1)
            start_str = avaliacao.data.strftime('%Y%m%d')
            end_str = next_date.strftime('%Y%m%d')

            subject_name = avaliacao.configuracao.materia.nome
            tipo_label = "Prova" if avaliacao.tipo == 'PROVA' else "Trabalho" if avaliacao.tipo == 'TRABALHO' else "Exame" if avaliacao.tipo == 'EXAME' else "Tarefa" if avaliacao.tipo == 'TAREFA' else "Pesquisa" if avaliacao.tipo == 'PESQUISA' else "Outro" if avaliacao.tipo == 'OUTRO' else "Avaliacao"
            event_title = f"[{tipo_label}] {avaliacao.nome} - {subject_name}"

            desc_lines = []
            desc_lines.append(f"Materia: {subject_name}")
            desc_lines.append(f"Tipo: {tipo_label}")
            desc_lines.append(f"Peso: {avaliacao.peso}")
            if avaliacao.nota is not None:
                desc_lines.append(f"Nota Obtida: {avaliacao.nota}")
            else:
                desc_lines.append("Nota: Nao lancada")

            status_concl = "Concluida (Nota Lancada)" if avaliacao.nota is not None else "Pendente"
            desc_lines.append(f"Status: {status_concl}")
            event_desc = "\\n".join(desc_lines)

            lines.append("BEGIN:VEVENT")
            lines.append(f"UID:eval_{avaliacao.id}_{profile.id}@minhauem.com.br")
            lines.append(f"DTSTAMP:{now().strftime('%Y%m%dT%H%M%SZ')}")
            lines.append(f"DTSTART;VALUE=DATE:{start_str}")
            lines.append(f"DTEND;VALUE=DATE:{end_str}")
            lines.append(f"SUMMARY:{event_title}")
            lines.append(f"DESCRIPTION:{event_desc}")
            lines.append("END:VEVENT")

        lines.append("END:VCALENDAR")

        ics_content = "\r\n".join(lines)
        cache.set(cache_key, ics_content, 604800)
        response = HttpResponse(ics_content, content_type="text/calendar; charset=utf-8")
        response['Content-Disposition'] = 'inline; filename="agenda_minha_uem.ics"'
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response


from django.contrib.auth.models import User

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


class ConfiguracaoIAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = obter_perfil_ativo(request)
        has_key = hasattr(profile, 'chave_gemini')
        model_name = profile.chave_gemini.model_name if has_key else "gemini-3.5-flash"

        from django.utils import timezone
        from django.db.models import Count, Sum
        from .models import HistoricoUsoIA

        today = timezone.now().date()
        usage_today = []

        if has_key:
            resumes = HistoricoUsoIA.objects.filter(
                profile=profile,
                created_at__date=today
            ).values('model_name').annotate(
                requests=Count('id'),
                tokens=Sum('total_tokens')
            )
            for r in resumes:
                usage_today.append({
                    'model_name': r['model_name'],
                    'requisicoes': r['requests'],
                    'total_tokens': r['tokens']
                })

        return Response({
            'possui_chave': has_key,
            'model_name': model_name,
            'uso_hoje': usage_today
        })

    def post(self, request):
        profile, _ = obter_perfil_ativo(request)
        api_key = request.data.get('api_key')
        model_name = request.data.get('model_name')

        if api_key:
            is_valid = self.validar_chave_gemini(api_key, model_name or "gemini-3.5-flash")
            if not is_valid:
                return Response({'erro': 'Chave de API do Gemini invalida.'}, status=status.HTTP_400_BAD_REQUEST)

            encrypted_api_key = ServicoCriptografia.criptografar_dado(api_key)
            chave_obj, _ = ChaveApiGemini.objects.update_or_create(
                profile=profile,
                defaults={'encrypted_api_key': encrypted_api_key}
            )
            if model_name:
                chave_obj.model_name = model_name
                chave_obj.save()
            return Response({'sucesso': True})
        elif model_name:
            if not hasattr(profile, 'chave_gemini'):
                return Response({'erro': 'Adicione uma chave de API antes de selecionar o modelo.'}, status=status.HTTP_400_BAD_REQUEST)
            profile.chave_gemini.model_name = model_name
            profile.chave_gemini.save()
            return Response({'sucesso': True})
        else:
            return Response({'erro': 'Nenhum dado para atualizar.'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        profile, _ = obter_perfil_ativo(request)
        if hasattr(profile, 'chave_gemini'):
            profile.chave_gemini.delete()
        return Response({'sucesso': True})

    def validar_chave_gemini(self, api_key: str, model_name: str) -> bool:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": "Ping"}
                    ]
                }
            ]
        }
        headers = {
            "Content-Type": "application/json"
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"DEBUG VALIDADOR GEMINI - Falha na API do Google. Status Code: {response.status_code}")
                print(f"DEBUG VALIDADOR GEMINI - Resposta: {response.text}")
            return response.status_code == 200
        except Exception as e:
            import traceback
            print(f"DEBUG VALIDADOR GEMINI - Erro de conexao: {str(e)}")
            traceback.print_exc()
            return False


def obter_arquivos_classroom_em_tempo_real(connection, token):
    headers = {'Authorization': f'Bearer {token}'}
    course_id = connection.classroom_course_id

    materials_res = requests.get(f'https://classroom.googleapis.com/v1/courses/{course_id}/courseWorkMaterials', headers=headers)
    work_res = requests.get(f'https://classroom.googleapis.com/v1/courses/{course_id}/courseWork', headers=headers)
    announcements_res = requests.get(f'https://classroom.googleapis.com/v1/courses/{course_id}/announcements', headers=headers)

    if materials_res.status_code == 401 or work_res.status_code == 401 or announcements_res.status_code == 401:
        raise PermissionError("GOOGLE_TOKEN_EXPIRADO")

    drive_files = []

    if materials_res.status_code == 200:
        materials_data = materials_res.json().get('courseWorkMaterial', [])
        for material in materials_data:
            for item in material.get('materials', []):
                if 'driveFile' in item:
                    drive_files.append(item['driveFile']['driveFile'])

    if work_res.status_code == 200:
        work_data = work_res.json().get('courseWork', [])
        for work in work_data:
            for item in work.get('materials', []):
                if 'driveFile' in item:
                    drive_files.append(item['driveFile']['driveFile'])

    if announcements_res.status_code == 200:
        announcements_data = announcements_res.json().get('announcements', [])
        for announcement in announcements_data:
            for item in announcement.get('materials', []):
                if 'driveFile' in item:
                    drive_files.append(item['driveFile']['driveFile'])
                elif 'link' in item:
                    url = item['link'].get('url', '')
                    title = item['link'].get('title', 'Arquivo do Drive')
                    match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
                    if not match:
                        match = re.search(r'id=([a-zA-Z0-9_-]+)', url)
                    
                    if match:
                        drive_id = match.group(1)
                        drive_files.append({
                            'id': drive_id,
                            'title': title
                        })

    local_files = {file_obj.drive_file_id: file_obj for file_obj in connection.arquivos.all()}

    result_list = []
    for file_info in drive_files:
        file_id = file_info.get('id')
        title = file_info.get('title')
        if not file_id or not title:
            continue

        if file_id in local_files:
            file_obj = local_files[file_id]
            result_list.append({
                'id': file_obj.id,
                'drive_file_id': file_obj.drive_file_id,
                'original_name': file_obj.original_name,
                'custom_name': file_obj.custom_name,
                'selected_folder': file_obj.selected_folder,
                'local_path': file_obj.local_path,
                'is_ignored': file_obj.is_ignored,
                'sync_at': file_obj.sync_at.isoformat() if file_obj.sync_at else None
            })
        else:
            result_list.append({
                'id': None,
                'drive_file_id': file_id,
                'original_name': title,
                'custom_name': None,
                'selected_folder': 'documentos',
                'local_path': None,
                'is_ignored': title.startswith('.'),
                'sync_at': None
            })

    for local_id, file_obj in local_files.items():
        if local_id.startswith('local_'):
            result_list.append({
                'id': file_obj.id,
                'drive_file_id': file_obj.drive_file_id,
                'original_name': file_obj.original_name,
                'custom_name': file_obj.custom_name,
                'selected_folder': file_obj.selected_folder,
                'local_path': file_obj.local_path,
                'is_ignored': file_obj.is_ignored,
                'sync_at': file_obj.sync_at.isoformat() if file_obj.sync_at else None
            })

    return result_list


def obter_contexto_academico(profile, materia_id=None, google_token=None) -> str:
    from django.utils import timezone
    from django.db.models import Sum
    from .models import Avaliacao, ConfiguracaoMateria

    try:
        now = timezone.localtime(timezone.now())
    except Exception:
        now = timezone.now()

    today = now.date()
    weekday_map = {0: "Segunda-feira", 1: "Terca-feira", 2: "Quarta-feira", 3: "Quinta-feira", 4: "Sexta-feira", 5: "Sabado", 6: "Domingo"}
    current_date_str = f"Hoje e {weekday_map[today.weekday()]}, {today.strftime('%d/%m/%Y')} as {now.strftime('%H:%M')}."

    context = [current_date_str]

    ano_letivo = profile.anos.order_by('-ano').first()
    if not ano_letivo:
        return "\n".join(context)

    days_map = {
        1: "Segunda-feira",
        2: "Terca-feira",
        3: "Quarta-feira",
        4: "Quinta-feira",
        5: "Sexta-feira",
        6: "Sabado",
        7: "Domingo"
    }

    if materia_id:
        materia_ativa = ano_letivo.materias.filter(id=materia_id).first()
        if materia_ativa:
            context.append(f"\n--- CONTEXTO DETALHADO DA DISCIPLINA ATIVA: {materia_ativa.codigo} - {materia_ativa.nome} ---")
            
            schedules = ano_letivo.horarios.filter(materia=materia_ativa).order_by('dia', 'inicio')
            if schedules.exists():
                context.append("Horarios e Aulas:")
                for s in schedules:
                    dia_nome = days_map.get(s.dia, f"Dia {s.dia}")
                    status_ativo = " (Ativa)" if s.data_inicio <= today <= s.data_termino else " (Inativa/Outro Periodo)"
                    context.append(f"  - {dia_nome} | Sala: {s.sala} | Bloco: {s.bloco} | Horario: {s.inicio.strftime('%H:%M')} - {s.fim.strftime('%H:%M')} | Vigencia: {s.data_inicio.strftime('%d/%m/%Y')} ate {s.data_termino.strftime('%d/%m/%Y')}{status_ativo} | Turma: {s.turma}")

            total_faltas = profile.registros_falta.filter(materia=materia_ativa, ano_letivo=ano_letivo).aggregate(Sum('faltas'))['faltas__sum'] or 0
            max_faltas = schedules.first().maximo_faltas if schedules.exists() else 0
            context.append(f"Faltas: {total_faltas}/{max_faltas}")

            config = ConfiguracaoMateria.objects.filter(materia=materia_ativa, perfil=profile, ano_letivo=ano_letivo).first()
            if config:
                context.append(f"Media minima para aprovacao: {config.media_minima}")

                all_evaluations = config.avaliacoes.all()
                graded_evaluations = all_evaluations.filter(nota__isnull=False)
                if graded_evaluations.exists():
                    weighted_sum = sum(a.nota * a.peso for a in graded_evaluations)
                    weights_sum = sum(a.peso for a in graded_evaluations)
                    if weights_sum > 0:
                        current_average = round(float(weighted_sum / weights_sum), 2)
                        context.append(f"Media atual calculada: {current_average}")

                provas = config.avaliacoes.all().order_by('data', 'ordem')
                if provas.exists():
                    context.append("Avaliacoes e Eventos (Provas, Trabalhos, etc.):")
                    for p in provas:
                        data_str = p.data.strftime('%d/%m/%Y') if p.data else "Sem data"
                        status_nota = f"Nota: {p.nota}" if p.nota is not None else "Nota nao lancada"
                        context.append(f"  - {p.nome} ({p.get_tipo_display()}) em {data_str} | Peso: {p.peso} | {status_nota}")

                if hasattr(config, 'vinculo_classroom'):
                    connection = config.vinculo_classroom
                    files_list = []
                    if google_token:
                        try:
                            merged_files = obter_arquivos_classroom_em_tempo_real(connection, google_token)
                            for file_info in merged_files:
                                if not file_info.get('is_ignored'):
                                    file_name = file_info.get('custom_name') or file_info.get('original_name')
                                    file_id = file_info.get('drive_file_id')
                                    files_list.append(f"    * {file_name} (ID: {file_id})")
                        except Exception:
                            pass
                    if not files_list:
                        local_files = connection.arquivos.all()
                        for file_obj in local_files:
                            if not file_obj.is_ignored:
                                files_list.append(f"    * {file_obj.custom_name or file_obj.original_name} (ID: {file_obj.drive_file_id})")
                    if files_list:
                        context.append("Materiais no Classroom:")
                        context.extend(files_list)

    context.append(f"\n--- OUTRAS DISCIPLINAS DISPONIVEIS PARA CONSULTA ---")
    materias = ano_letivo.materias.all()
    for m in materias:
        if materia_id and m.id == int(materia_id):
            continue
        schedules = ano_letivo.horarios.filter(materia=m).order_by('dia', 'inicio')
        total_faltas = profile.registros_falta.filter(materia=m, ano_letivo=ano_letivo).aggregate(Sum('faltas'))['faltas__sum'] or 0
        max_faltas = schedules.first().maximo_faltas if schedules.exists() else 0
        
        horarios_str = []
        for s in schedules:
            dia_nome = days_map.get(s.dia, f"Dia {s.dia}")
            status_ativo = " (Ativa)" if s.data_inicio <= today <= s.data_termino else " (Inativa)"
            horarios_str.append(f"{dia_nome} as {s.inicio.strftime('%H:%M')} [Vigencia: {s.data_inicio.strftime('%d/%m/%Y')} ate {s.data_termino.strftime('%d/%m/%Y')}]{status_ativo}")
        horarios_desc = ", ".join(horarios_str) if horarios_str else "Sem horarios cadastrados"

        context.append(f" - ID: {m.id} | Codigo: {m.codigo} | Nome: {m.nome} (Faltas: {total_faltas}/{max_faltas} | Aulas: {horarios_desc})")

    context.append("\nSe precisar de detalhes (como notas, avaliacoes especificas, arquivos) de qualquer uma das outras materias listadas acima, chame a funcao 'obter_contexto_materia' fornecendo o ID correspondente.")
    
    return "\n".join(context)


def executar_stream_gemini(model_name, api_key, contents, system_instruction, profile, on_completion=None, google_token=None):
    import requests
    import json

    tools = [
        {
            "functionDeclarations": [
                {
                    "name": "obter_contexto_materia",
                    "description": "Obtem o contexto academico detalhado (notas, faltas, avaliacoes, eventos e arquivos do Classroom) de uma disciplina especifica. Use esta ferramenta se precisar responder a perguntas sobre outra materia que nao seja a materia ativa atual, ou se o usuario perguntar sobre uma materia cujo contexto detalhado ainda nao foi fornecido.",
                    "parameters": {
                        "type": "OBJECT",
                        "properties": {
                            "materia_id": {
                                "type": "INTEGER",
                                "description": "O ID unico da materia no banco de dados."
                            }
                        },
                        "required": ["materia_id"]
                    }
                }
            ]
        }
    ]

    def realizar_requisicao(historico):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:streamGenerateContent?key={api_key}"
        payload = {
            "contents": historico,
            "systemInstruction": {
                "parts": [
                    {"text": system_instruction}
                ]
            },
            "tools": tools
        }
        headers = {
            "Content-Type": "application/json"
        }
        return requests.post(url, json=payload, headers=headers, stream=True, timeout=30)

    try:
        response = realizar_requisicao(contents)
        if response.status_code != 200:
            raise Exception(f"Erro na API do Gemini: {response.text}")

        def gerar_stream():
            nonlocal response
            buffer = ""
            bracket_count = 0
            start_idx = -1
            in_string = False
            escape = False
            prompt_tokens = 0
            candidate_tokens = 0
            total_tokens = 0
            i = 0
            resposta_completa = ""
            chamada_funcao = None
            assinatura_pensamento = None

            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    buffer += chunk.decode('utf-8', errors='ignore')
                while i < len(buffer):
                    char = buffer[i]
                    if escape:
                        escape = False
                    elif char == '\\':
                        escape = True
                    elif char == '"':
                        in_string = not in_string
                    elif not in_string:
                        if char == '{':
                            if bracket_count == 0:
                                start_idx = i
                            bracket_count += 1
                        elif char == '}':
                            bracket_count -= 1
                            if bracket_count == 0 and start_idx != -1:
                                obj_str = buffer[start_idx:i+1]
                                try:
                                    obj = json.loads(obj_str)
                                    parts = obj.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])
                                    fc = parts[0].get('functionCall')
                                    if fc:
                                        chamada_funcao = fc
                                        assinatura_pensamento = parts[0].get('thought_signature') or parts[0].get('thoughtSignature')
                                        break
                                    text = parts[0].get('text', '')
                                    if text:
                                        resposta_completa += text
                                        yield text
                                except Exception:
                                    pass
                                buffer = buffer[i+1:]
                                i = -1
                                start_idx = -1
                                in_string = False
                                escape = False
                    i += 1
                if chamada_funcao:
                    break

            if chamada_funcao:
                func_name = chamada_funcao.get("name")
                args = chamada_funcao.get("args", {})
                materia_id = args.get("materia_id")
                result_context = ""
                if func_name == "obter_contexto_materia" and materia_id:
                    result_context = obter_contexto_academico(profile, int(materia_id), google_token)
                    print(result_context)
                model_part = {
                    "functionCall": chamada_funcao
                }
                if assinatura_pensamento:
                    model_part["thought_signature"] = assinatura_pensamento

                contents.append({
                    "role": "model",
                    "parts": [
                        model_part
                    ]
                })
                contents.append({
                    "role": "function",
                    "parts": [
                        {
                            "functionResponse": {
                                "name": func_name,
                                "response": {
                                    "result": result_context
                                }
                            }
                        }
                    ]
                })
                response2 = realizar_requisicao(contents)
                if response2.status_code != 200:
                    raise Exception(f"Erro na API do Gemini apos chamada de funcao: {response2.text}")
                buffer2 = ""
                bracket_count2 = 0
                start_idx2 = -1
                in_string2 = False
                escape2 = False
                i2 = 0
                for chunk in response2.iter_content(chunk_size=1024):
                    if chunk:
                        buffer2 += chunk.decode('utf-8', errors='ignore')
                    while i2 < len(buffer2):
                        char = buffer2[i2]
                        if escape2:
                            escape2 = False
                        elif char == '\\':
                            escape2 = True
                        elif char == '"':
                            in_string2 = not in_string2
                        elif not in_string2:
                            if char == '{':
                                if bracket_count2 == 0:
                                    start_idx2 = i2
                                bracket_count2 += 1
                            elif char == '}':
                                bracket_count2 -= 1
                                if bracket_count2 == 0 and start_idx2 != -1:
                                    obj_str = buffer2[start_idx2:i2+1]
                                    try:
                                        obj = json.loads(obj_str)
                                        usage = obj.get('usageMetadata', {})
                                        if usage:
                                            prompt_tokens = usage.get('promptTokenCount', prompt_tokens)
                                            candidate_tokens = usage.get('candidatesTokenCount', candidate_tokens)
                                            total_tokens = usage.get('totalTokenCount', total_tokens)
                                        parts = obj.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])
                                        text = parts[0].get('text', '')
                                        if text:
                                            resposta_completa += text
                                            yield text
                                    except Exception:
                                        pass
                                    buffer2 = buffer2[i2+1:]
                                    i2 = -1
                                    start_idx2 = -1
                                    in_string2 = False
                                    escape2 = False
                        i2 += 1

            try:
                from .models import HistoricoUsoIA
                HistoricoUsoIA.objects.create(
                    profile=profile,
                    model_name=model_name,
                    prompt_tokens=prompt_tokens,
                    candidate_tokens=candidate_tokens,
                    total_tokens=total_tokens
                )
            except Exception:
                pass

            if on_completion:
                try:
                    on_completion(resposta_completa)
                except Exception:
                    pass

        return gerar_stream()
    except Exception as e:
        raise e


class ChatIAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile, _ = obter_perfil_ativo(request)
        if not hasattr(profile, 'chave_gemini'):
            return Response({'erro': 'Configure sua chave de API nas configuracoes antes de usar a IA.'}, status=status.HTTP_400_BAD_REQUEST)

        message = request.data.get('mensagem')
        if not message:
            return Response({'erro': 'Mensagem nao fornecida.'}, status=status.HTTP_400_BAD_REQUEST)

        materia_id = request.data.get('materia_id')
        drive_file_id = request.data.get('arquivo_aberto_id')
        selected_file_ids = request.data.get('arquivos_selecionados_ids', [])
        local_files = request.data.get('arquivos_locais', [])

        google_token = request.headers.get('X-Google-Access-Token')
        encrypted_api_key = profile.chave_gemini.encrypted_api_key
        api_key = ServicoCriptografia.descriptografar_dado(encrypted_api_key)
        model_name = profile.chave_gemini.model_name

        context_prompt = obter_contexto_academico(profile, materia_id, google_token)
        print(context_prompt)

        files_to_send = []
        if drive_file_id:
            if isinstance(drive_file_id, list):
                files_to_send.extend(drive_file_id)
            elif isinstance(drive_file_id, str) and ',' in drive_file_id:
                files_to_send.extend([fid.strip() for fid in drive_file_id.split(',') if fid.strip()])
            else:
                files_to_send.append(drive_file_id)
        if selected_file_ids:
            files_to_send.extend(selected_file_ids)

        files_to_send = list(dict.fromkeys(files_to_send))
        parts = []

        for file_id in files_to_send:
            file_data = self.obter_dados_arquivo(profile, file_id, google_token)
            if file_data:
                parts.append({
                    "inlineData": {
                        "mimeType": file_data["mime_type"],
                        "data": file_data["base64_data"]
                    }
                })

        for f in local_files:
            if 'mime_type' in f and 'base64_data' in f:
                parts.append({
                    "inlineData": {
                        "mimeType": f["mime_type"],
                        "data": f["base64_data"]
                    }
                })

        parts.append({"text": message})

        contents = [{
            "role": "user",
            "parts": parts
        }]

        system_instruction = (
            "Voce e o assistente virtual do site Minha UEM. Voce ajuda estudantes da Universidade Estadual de Maringa (UEM) em suas tarefas academicas. Responda em Portugues (PT-BR) de forma amigavel and concisa.\n"
            "IMPORTANTE: Nao mencione dados de desempenho academico (como notas, faltas, media atual ou avaliacoes) a menos que o usuario pergunte especificamente sobre isso ou que seja relevante para responder a pergunta dele.\n\n"
            f"Contexto academico atual do usuario:\n{context_prompt}"
        )

        try:
            stream = executar_stream_gemini(model_name, api_key, contents, system_instruction, profile, google_token=google_token)
            from django.http import StreamingHttpResponse
            return StreamingHttpResponse(stream, content_type='text/plain')
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def obter_dados_arquivo(self, profile, file_id: str, google_token: str | None) -> dict | None:
        import mimetypes
        import base64
        import requests
        from .models import ArquivoMateriaClassroom

        if file_id.startswith('local_'):
            return None
        else:
            if not google_token:
                return None

            arquivo = ArquivoMateriaClassroom.objects.filter(
                classroom_connection__subject_config__perfil=profile,
                drive_file_id=file_id
            ).first()

            nome_arquivo = arquivo.original_name if arquivo else "documento"
            mime_type, _ = mimetypes.guess_type(nome_arquivo)
            mime_type = mime_type or 'application/pdf'

            try:
                headers = {'Authorization': f'Bearer {google_token}'}
                drive_url = f'https://www.googleapis.com/drive/v3/files/{file_id}?alt=media'
                drive_res = requests.get(drive_url, headers=headers, timeout=20)

                if drive_res.status_code == 200:
                    content_type = drive_res.headers.get('Content-Type', mime_type)
                    base64_data = base64.b64encode(drive_res.content).decode('utf-8')
                    return {
                        "mime_type": content_type,
                        "base64_data": base64_data
                    }
                else:
                    print(f"DEBUG GOOGLE DRIVE - Erro no download do arquivo {file_id}. Status: {drive_res.status_code}, Resposta: {drive_res.text[:200]}")
            except Exception as e:
                print(f"DEBUG GOOGLE DRIVE - Excecao ao baixar arquivo {file_id}: {str(e)}")
                return None
        return None


class ConversasIAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = obter_perfil_ativo(request)
        from .models import ConversaIA, Materia
        conversas = ConversaIA.objects.filter(profile=profile).order_by('-updated_at')

        geral = [{
            'id': c.id,
            'title': c.title,
            'updated_at': c.updated_at.isoformat()
        } for c in conversas.filter(materia__isnull=True)]

        materias_ids = conversas.filter(materia__isnull=False).values_list('materia_id', flat=True).distinct()
        materias = Materia.objects.filter(id__in=materias_ids)

        disciplinas_list = []
        for m in materias:
            chats_materia = conversas.filter(materia=m)
            disciplinas_list.append({
                'materia_id': m.id,
                'codigo': m.codigo,
                'nome': m.nome,
                'chats': [{
                    'id': c.id,
                    'title': c.title,
                    'updated_at': c.updated_at.isoformat()
                } for c in chats_materia]
            })

        return Response({
            'geral': geral,
            'disciplinas': disciplinas_list
        })

    def post(self, request):
        profile, _ = obter_perfil_ativo(request)
        materia_id = request.data.get('materia_id')
        title = request.data.get('title')

        if not title:
            title = 'Nova conversa'

        from .models import ConversaIA, Materia
        limit = 10
        user_conversations = ConversaIA.objects.filter(profile=profile).order_by('updated_at')
        count = user_conversations.count()
        if count >= limit:
            excess_count = count - limit + 1
            ids_to_delete = list(user_conversations.values_list('id', flat=True)[:excess_count])
            ConversaIA.objects.filter(id__in=ids_to_delete).delete()

        materia = Materia.objects.filter(id=materia_id).first() if materia_id else None

        conversa = ConversaIA.objects.create(
            profile=profile,
            materia=materia,
            title=title
        )

        return Response({
            'id': conversa.id,
            'title': conversa.title,
            'materia_id': conversa.materia_id
        }, status=status.HTTP_201_CREATED)


class ConversaIADetalheView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        profile, _ = obter_perfil_ativo(request)
        from .models import ConversaIA
        conversa = ConversaIA.objects.filter(profile=profile, id=pk).first()
        if not conversa:
            return Response({'erro': 'Conversa nao encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        mensagens = conversa.messages.all().order_by('created_at')
        return Response({
            'id': conversa.id,
            'title': conversa.title,
            'materia_id': conversa.materia_id,
            'messages': [{
                'role': m.role,
                'text': m.text,
                'created_at': m.created_at.isoformat()
            } for m in mensagens]
        })

    def delete(self, request, pk):
        profile, _ = obter_perfil_ativo(request)
        from .models import ConversaIA
        conversa = ConversaIA.objects.filter(profile=profile, id=pk).first()
        if not conversa:
            return Response({'erro': 'Conversa nao encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        conversa.delete()
        return Response({'sucesso': True})


class EnviarMensagemConversaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        profile, _ = obter_perfil_ativo(request)
        from .models import ConversaIA, MensagemConversaIA
        conversa = ConversaIA.objects.filter(profile=profile, id=pk).first()
        if not conversa:
            return Response({'erro': 'Conversa nao encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        message = request.data.get('mensagem')
        if not message:
            return Response({'erro': 'Mensagem nao fornecida.'}, status=status.HTTP_400_BAD_REQUEST)

        drive_file_id = request.data.get('arquivo_aberto_id')
        selected_file_ids = request.data.get('arquivos_selecionados_ids', [])
        local_files = request.data.get('arquivos_locais', [])

        google_token = request.headers.get('X-Google-Access-Token')
        encrypted_api_key = profile.chave_gemini.encrypted_api_key
        api_key = ServicoCriptografia.descriptografar_dado(encrypted_api_key)
        model_name = profile.chave_gemini.model_name

        materia_id = conversa.materia_id
        context_prompt = obter_contexto_academico(profile, materia_id, google_token)
        print("--- CONTEXTO ENVIADO A IA ---")
        print(context_prompt)
        print("----------------------------")

        ultima_mensagem = MensagemConversaIA.objects.create(
            conversa=conversa,
            role='user',
            text=message
        )

        files_to_send = []
        if drive_file_id:
            if isinstance(drive_file_id, list):
                files_to_send.extend(drive_file_id)
            elif isinstance(drive_file_id, str) and ',' in drive_file_id:
                files_to_send.extend([fid.strip() for fid in drive_file_id.split(',') if fid.strip()])
            else:
                files_to_send.append(drive_file_id)
        if selected_file_ids:
            files_to_send.extend(selected_file_ids)

        files_to_send = list(dict.fromkeys(files_to_send))
        parts = []

        for file_id in files_to_send:
            file_data = self.obter_dados_arquivo(profile, file_id, google_token)
            if file_data:
                parts.append({
                    "inlineData": {
                        "mimeType": file_data["mime_type"],
                        "data": file_data["base64_data"]
                    }
                })

        for f in local_files:
            if 'mime_type' in f and 'base64_data' in f:
                parts.append({
                    "inlineData": {
                        "mimeType": f["mime_type"],
                        "data": f["base64_data"]
                    }
                })

        mensagens_anteriores = conversa.messages.all().order_by('created_at')
        contents = []

        for msg in mensagens_anteriores:
            if msg.id == ultima_mensagem.id:
                parts.append({"text": msg.text})
                contents.append({
                    "role": "user",
                    "parts": parts
                })
            else:
                contents.append({
                    "role": msg.role,
                    "parts": [{"text": msg.text}]
                })

        system_instruction = (
            "Voce e o assistente virtual do site Minha UEM. Voce ajuda estudantes da Universidade Estadual de Maringa (UEM) em suas tarefas academicas. Responda em Portugues (PT-BR) de forma amigavel and concisa.\n"
            "IMPORTANTE: Nao mencione dados de desempenho academico (como notas, faltas, media atual ou avaliacoes) a menos que o usuario pergunte especificamente sobre isso ou que seja relevante para responder a pergunta dele.\n\n"
            f"Contexto academico atual do usuario:\n{context_prompt}"
        )

        def salvar_resposta(texto):
            MensagemConversaIA.objects.create(
                conversa=conversa,
                role='model',
                text=texto
            )
            conversa.save()

        try:
            stream = executar_stream_gemini(model_name, api_key, contents, system_instruction, profile, on_completion=salvar_resposta, google_token=google_token)
            from django.http import StreamingHttpResponse
            return StreamingHttpResponse(stream, content_type='text/plain')
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def obter_dados_arquivo(self, profile, file_id: str, google_token: str | None) -> dict | None:
        view_temp = ChatIAView()
        return view_temp.obter_dados_arquivo(profile, file_id, google_token)


