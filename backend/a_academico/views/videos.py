from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from ..models import VinculoGoogleClassroom, VideoMateriaClassroom
from ..serializers import VideoMateriaClassroomSerializer
from .base import obter_perfil_ativo
from .videos_sinc import obter_videos_classroom_em_tempo_real

class VideosMateriaClassroomView(APIView):
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

            if not connection:
                return Response({'vinculado': False, 'videos': []})

            if google_token:
                videos_atualizados = obter_videos_classroom_em_tempo_real(connection, google_token)
                serializer = VideoMateriaClassroomSerializer(videos_atualizados, many=True)
            else:
                videos = connection.videos.all().order_by('-sync_at')
                serializer = VideoMateriaClassroomSerializer(videos, many=True)

            return Response({
                'vinculado': True,
                'classroom_course_id': connection.classroom_course_id,
                'classroom_course_name': connection.classroom_course_name,
                'videos': serializer.data
            })
        except PermissionError as e:
            if str(e) == 'GOOGLE_TOKEN_EXPIRADO':
                return Response({'erro': 'Token do Google expirado ou inválido', 'codigo': 'GOOGLE_TOKEN_EXPIRADO'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AtualizarVideoClassroomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, video_id):
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

            if not connection:
                return Response({'erro': 'Vínculo do Classroom não encontrado'}, status=status.HTTP_404_NOT_FOUND)

            video_obj = connection.videos.filter(video_id=video_id).first()
            if not video_obj:
                return Response({'erro': 'Vídeo não encontrado'}, status=status.HTTP_404_NOT_FOUND)

            serializer = VideoMateriaClassroomSerializer(video_obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)
