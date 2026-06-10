import uuid
from datetime import timedelta
from django.urls import reverse
from django.http import HttpResponse
from django.utils.timezone import now
from django.core.cache import cache
from django.db.models import Q
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from a_academico.models import PerfilAcademico, Horario, Avaliacao
from .base import obter_perfil_ativo


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
