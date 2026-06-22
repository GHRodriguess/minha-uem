import re
import requests
from ..models import VideoMateriaClassroom

def obter_videos_classroom_em_tempo_real(connection, token):
    headers = {'Authorization': f'Bearer {token}'}
    course_id = connection.classroom_course_id

    materials_res = requests.get(f'https://classroom.googleapis.com/v1/courses/{course_id}/courseWorkMaterials', headers=headers)
    work_res = requests.get(f'https://classroom.googleapis.com/v1/courses/{course_id}/courseWork', headers=headers)
    announcements_res = requests.get(f'https://classroom.googleapis.com/v1/courses/{course_id}/announcements', headers=headers)

    if materials_res.status_code == 401 or work_res.status_code == 401 or announcements_res.status_code == 401:
        raise PermissionError("GOOGLE_TOKEN_EXPIRADO")

    found_videos = []
    video_extensions = {'mp4', 'mkv', 'webm', 'ogg', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp'}

    def extrair_videos(materials_list):
        for item in materials_list:
            if 'driveFile' in item:
                drive_info = item['driveFile']['driveFile']
                title = drive_info.get('title', '')
                ext = title.split('.')[-1].lower() if '.' in title else ''
                if ext in video_extensions:
                    found_videos.append({
                        'video_id': drive_info.get('id'),
                        'tipo': 'drive',
                        'titulo': title,
                        'url': drive_info.get('alternateLink'),
                        'thumbnail': drive_info.get('thumbnailUrl')
                    })
            elif 'youtubeVideo' in item:
                yt_info = item['youtubeVideo']
                found_videos.append({
                    'video_id': yt_info.get('id'),
                    'tipo': 'youtube',
                    'titulo': yt_info.get('title', 'Vídeo do YouTube'),
                    'url': yt_info.get('alternateLink'),
                    'thumbnail': yt_info.get('thumbnailUrl')
                })
            elif 'link' in item:
                link_info = item['link']
                url = link_info.get('url', '')
                title = link_info.get('title', '') or 'Vídeo Externo'
                if 'youtube.com' in url or 'youtu.be' in url:
                    match = re.search(r'(?:v=|\/v\/|embed\/|youtu.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})', url)
                    if match:
                        yt_id = match.group(1)
                        found_videos.append({
                            'video_id': yt_id,
                            'tipo': 'youtube',
                            'titulo': title,
                            'url': url,
                            'thumbnail': link_info.get('thumbnailUrl')
                        })

    if materials_res.status_code == 200:
        for m in materials_res.json().get('courseWorkMaterial', []):
            extrair_videos(m.get('materials', []))

    if work_res.status_code == 200:
        for w in work_res.json().get('courseWork', []):
            extrair_videos(w.get('materials', []))

    if announcements_res.status_code == 200:
        for a in announcements_res.json().get('announcements', []):
            extrair_videos(a.get('materials', []))

    current_video_ids = set()
    for video in found_videos:
        vid_id = video['video_id']
        if not vid_id:
            continue
        current_video_ids.add(vid_id)

        video_obj = connection.videos.filter(video_id=vid_id).first()
        if video_obj:
            salvar = False
            if video_obj.titulo != video['titulo']:
                video_obj.titulo = video['titulo']
                salvar = True
            if video_obj.url != video['url']:
                video_obj.url = video['url']
                salvar = True
            if video['thumbnail'] and video_obj.thumbnail != video['thumbnail']:
                video_obj.thumbnail = video['thumbnail']
                salvar = True
            if salvar:
                video_obj.save()
        else:
            VideoMateriaClassroom.objects.create(
                classroom_connection=connection,
                video_id=vid_id,
                tipo=video['tipo'],
                titulo=video['titulo'],
                url=video['url'],
                thumbnail=video['thumbnail']
            )

    connection.videos.exclude(video_id__in=current_video_ids).delete()
    return connection.videos.all().order_by('-sync_at')
