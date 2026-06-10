import os
import re
import json
import base64
import uuid
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from django.core.cache import cache
from django.utils import timezone
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from a_academico.models import (
    ConfiguracaoGeralClassroom,
    VinculoGoogleClassroom,
    ProfessorClassroom,
    Materia,
    AnoLetivo,
    ConfiguracaoMateria,
    ArquivoMateriaClassroom
)
from a_academico.serializers import (
    ConfiguracaoGeralClassroomSerializer,
    VinculoGoogleClassroomSerializer,
    ProfessorClassroomSerializer,
    ArquivoMateriaClassroomSerializer
)
from .base import obter_perfil_ativo, nomes_sao_compativeis


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

    current_drive_ids = set()
    for file_info in drive_files:
        file_id = file_info.get('id')
        title = file_info.get('title')
        if not file_id or not title:
            continue
        current_drive_ids.add(file_id)

        file_obj = connection.arquivos.filter(drive_file_id=file_id).first()
        if file_obj:
            if file_obj.original_name != title:
                file_obj.original_name = title
                file_obj.save()
        else:
            ArquivoMateriaClassroom.objects.create(
                classroom_connection=connection,
                drive_file_id=file_id,
                original_name=title,
                selected_folder='documentos'
            )

    connection.arquivos.filter(
        local_path__isnull=True
    ).exclude(
        drive_file_id__in=current_drive_ids
    ).exclude(
        drive_file_id__startswith='local_'
    ).delete()

    arquivos = connection.arquivos.all().order_by('-sync_at')
    serializer = ArquivoMateriaClassroomSerializer(arquivos, many=True)
    return serializer.data


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


class ExploradorDiretoriosView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        path_str = request.query_params.get('path', '')
        
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
                classroom_connection=connection,
                drive_file_id=drive_file_id,
                defaults={
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
                classroom_connection=connection,
                drive_file_id=drive_file_id,
                defaults={
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
