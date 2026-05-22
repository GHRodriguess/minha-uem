from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import PerfilAcademico, RegistroFalta, Materia, AnoLetivo, ConfiguracaoMateria, Avaliacao, ConfiguracaoGeralClassroom, VinculoGoogleClassroom, ArquivoMateriaClassroom
from .serializers import PerfilAcademicoSerializer, ConfiguracaoMateriaSerializer, AvaliacaoSerializer, ConfiguracaoGeralClassroomSerializer, VinculoGoogleClassroomSerializer, ArquivoMateriaClassroomSerializer
from .services import ServicoExtracaoHorario
import requests
import re
import unicodedata

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
        perfil, _ = PerfilAcademico.objects.get_or_create(user=self.request.user)
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
            config = ConfiguracaoMateria.objects.get(id=config_id, perfil__user=request.user)
            serializer = AvaliacaoSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(configuracao=config)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ConfiguracaoMateria.DoesNotExist:
            return Response({"erro": "Configuração não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            avaliacao = Avaliacao.objects.get(pk=pk, configuracao__perfil__user=request.user)
            serializer = AvaliacaoSerializer(avaliacao, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Avaliacao.DoesNotExist:
            return Response({"erro": "Avaliação não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            avaliacao = Avaliacao.objects.get(pk=pk, configuracao__perfil__user=request.user)
            avaliacao.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Avaliacao.DoesNotExist:
            return Response({"erro": "Avaliação não encontrada."}, status=status.HTTP_404_NOT_FOUND)


class ConfiguracaoClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = PerfilAcademico.objects.get_or_create(user=request.user)
        config, _ = ConfiguracaoGeralClassroom.objects.get_or_create(profile=profile)
        serializer = ConfiguracaoGeralClassroomSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = PerfilAcademico.objects.get_or_create(user=request.user)
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
            profile = PerfilAcademico.objects.get(user=request.user)
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
            
            serializer = VinculoGoogleClassroomSerializer(connection)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        materia_id = request.query_params.get('materia_id') or request.data.get('materia_id')
        ano_id = request.query_params.get('ano_id') or request.data.get('ano_id')
        if not materia_id or not ano_id:
            return Response({'erro': 'materia_id e ano_id são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = PerfilAcademico.objects.get(user=request.user)
            connection = VinculoGoogleClassroom.objects.get(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            )
            connection.delete()
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
            profile = PerfilAcademico.objects.get(user=request.user)
            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()

            if not connection and google_token:
                config_materia = ConfiguracaoMateria.objects.filter(
                    perfil=profile,
                    materia_id=materia_id,
                    ano_letivo_id=ano_id
                ).first()

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
                                connection = VinculoGoogleClassroom.objects.create(
                                    subject_config=config_materia,
                                    classroom_course_id=course.get('id'),
                                    classroom_course_name=course.get('name')
                                )
                                break

            if not connection:
                return Response({'vinculado': False, 'arquivos': []})

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
                    'arquivos': serializer.data
                })
        except PermissionError as e:
            if str(e) == 'GOOGLE_TOKEN_EXPIRADO':
                return Response({'erro': 'Token do Google expirado ou inválido', 'codigo': 'GOOGLE_TOKEN_EXPIRADO'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _obter_arquivos_classroom_em_tempo_real(self, connection, token):
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

        import os
        arquivos_locais = {arq.drive_file_id: arq for arq in connection.arquivos.all()}

        resultado = []
        for file_info in drive_files:
            file_id = file_info.get('id')
            title = file_info.get('title')
            if not file_id or not title:
                continue

            if file_id in arquivos_locais:
                arq = arquivos_locais[file_id]
                resultado.append({
                    'id': arq.id,
                    'drive_file_id': arq.drive_file_id,
                    'original_name': arq.original_name,
                    'custom_name': arq.custom_name,
                    'selected_folder': arq.selected_folder,
                    'local_path': arq.local_path,
                    'is_ignored': arq.is_ignored,
                    'sync_at': arq.sync_at.isoformat() if arq.sync_at else None
                })
            else:
                resultado.append({
                    'id': None,
                    'drive_file_id': file_id,
                    'original_name': title,
                    'custom_name': None,
                    'selected_folder': 'documentos',
                    'local_path': None,
                    'is_ignored': False,
                    'sync_at': None
                })

        for local_id, arq in arquivos_locais.items():
            if local_id.startswith('local_'):
                resultado.append({
                    'id': arq.id,
                    'drive_file_id': arq.drive_file_id,
                    'original_name': arq.original_name,
                    'custom_name': arq.custom_name,
                    'selected_folder': arq.selected_folder,
                    'local_path': arq.local_path,
                    'is_ignored': arq.is_ignored,
                    'sync_at': arq.sync_at.isoformat() if arq.sync_at else None
                })

        return resultado


class AtualizarArquivoClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, drive_file_id):
        try:
            profile = PerfilAcademico.objects.get(user=request.user)
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
            profile = PerfilAcademico.objects.get(user=request.user)
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
            profile = PerfilAcademico.objects.get(user=request.user)
            
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
            profile = PerfilAcademico.objects.get(user=request.user)
            connection = VinculoGoogleClassroom.objects.filter(
                subject_config__perfil=profile,
                subject_config__materia_id=materia_id,
                subject_config__ano_letivo_id=ano_id
            ).first()
            
            if not connection:
                return Response({'erro': 'Vínculo do Classroom não encontrado'}, status=status.HTTP_404_NOT_FOUND)
                
            local_paths = {item.get('local_path'): item for item in local_files if item.get('local_path')}
            local_drive_ids = {item.get('drive_file_id'): item for item in local_files if item.get('drive_file_id')}
            
            arquivos = connection.arquivos.all()
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
                else:
                    arq.local_path = None
                arq.save()
                
            for item in local_files:
                drive_file_id = item.get('drive_file_id')
                if drive_file_id and drive_file_id.startswith('local_'):
                    if not connection.arquivos.filter(drive_file_id=drive_file_id).exists():
                        ArquivoMateriaClassroom.objects.create(
                            classroom_connection=connection,
                            drive_file_id=drive_file_id,
                            original_name=item.get('original_name'),
                            selected_folder=item.get('selected_folder', 'documentos'),
                            local_path=item.get('local_path')
                        )
            
            arquivos_atualizados = connection.arquivos.all().order_by('-sync_at')
            serializer = ArquivoMateriaClassroomSerializer(arquivos_atualizados, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)
