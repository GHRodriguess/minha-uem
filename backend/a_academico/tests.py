from django.test import TestCase
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from datetime import date, time, timedelta
from django.contrib.auth.models import User
import uuid

from .models import PerfilAcademico, Curso, Materia, Horario, AnoLetivo, ConfiguracaoMateria, Avaliacao

class TesteCacheSinaisAgenda(TestCase):

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username='testuser', password='password')
        self.course = Curso.objects.create(codigo='CURSO1', nome='Curso de Teste')
        self.profile = PerfilAcademico.objects.create(
            user=self.user,
            curso=self.course,
            calendar_token=uuid.uuid4()
        )
        self.academic_year = AnoLetivo.objects.create(
            perfil=self.profile,
            ano=2026
        )

    def test_geracao_e_salvamento_cache(self):
        url = reverse('agenda_feed', kwargs={'token': self.profile.calendar_token})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/calendar; charset=utf-8')
        
        cache_key = f"agenda_ical_{self.profile.calendar_token}"
        cached_data = cache.get(cache_key)
        self.assertIsNotNone(cached_data)
        self.assertIn("BEGIN:VCALENDAR", cached_data)

    def test_leitura_cache(self):
        cache_key = f"agenda_ical_{self.profile.calendar_token}"
        dummy_content = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nSUMMARY:Dummy\r\nEND:VCALENDAR"
        cache.set(cache_key, dummy_content, 600)
        
        url = reverse('agenda_feed', kwargs={'token': self.profile.calendar_token})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode('utf-8'), dummy_content)

    def test_sinal_avaliacao(self):
        subject = Materia.objects.create(codigo='MAT1', nome='Materia 1')
        config = ConfiguracaoMateria.objects.create(
            perfil=self.profile,
            materia=subject,
            ano_letivo=self.academic_year
        )
        
        cache_key = f"agenda_ical_{self.profile.calendar_token}"
        cache.set(cache_key, "dummy", 600)
        
        evaluation = Avaliacao.objects.create(
            configuracao=config,
            nome='Prova 1',
            tipo='PROVA',
            peso=1.0,
            data=date(2026, 6, 10)
        )
        self.assertIsNone(cache.get(cache_key))
        
        cache.set(cache_key, "dummy", 600)
        evaluation.nota = 8.5
        evaluation.save()
        self.assertIsNone(cache.get(cache_key))
        
        cache.set(cache_key, "dummy", 600)
        evaluation.delete()
        self.assertIsNone(cache.get(cache_key))

    def test_sinal_configuracao_materia(self):
        subject = Materia.objects.create(codigo='MAT2', nome='Materia 2')
        cache_key = f"agenda_ical_{self.profile.calendar_token}"
        cache.set(cache_key, "dummy", 600)
        
        config = ConfiguracaoMateria.objects.create(
            perfil=self.profile,
            materia=subject,
            ano_letivo=self.academic_year
        )
        self.assertIsNone(cache.get(cache_key))
        
        cache.set(cache_key, "dummy", 600)
        config.media_minima = 7.0
        config.save()
        self.assertIsNone(cache.get(cache_key))
        
        cache.set(cache_key, "dummy", 600)
        config.delete()
        self.assertIsNone(cache.get(cache_key))

    def test_sinal_horario(self):
        subject = Materia.objects.create(codigo='MAT3', nome='Materia 3')
        schedule = Horario.objects.create(
            materia=subject,
            turma='A',
            departamento='DEP',
            periodo='1',
            data_inicio=date(2026, 6, 1),
            data_termino=date(2026, 6, 30),
            maximo_faltas=16,
            bloco=10,
            aula=1,
            dia=1,
            inicio=time(8, 0),
            fim=time(9, 40),
            sala='101'
        )
        
        self.profile.horarios.add(schedule)
        
        schedule.refresh_from_db()
        
        cache_key = f"agenda_ical_{self.profile.calendar_token}"
        cache.set(cache_key, "dummy", 600)
        
        schedule.bloco = 12
        schedule.save()
        self.assertIsNone(cache.get(cache_key))
        
        cache.set(cache_key, "dummy", 600)
        schedule.delete()
        self.assertIsNone(cache.get(cache_key))

    def test_sinal_m2m_perfil_horario(self):
        subject = Materia.objects.create(codigo='MAT4', nome='Materia 4')
        schedule = Horario.objects.create(
            materia=subject,
            turma='A',
            departamento='DEP',
            periodo='1',
            data_inicio=date(2026, 6, 1),
            data_termino=date(2026, 6, 30),
            maximo_faltas=16,
            bloco=10,
            aula=1,
            dia=1,
            inicio=time(8, 0),
            fim=time(9, 40),
            sala='101'
        )
        
        cache_key = f"agenda_ical_{self.profile.calendar_token}"
        cache.set(cache_key, "dummy", 600)
        
        self.profile.horarios.add(schedule)
        self.assertIsNone(cache.get(cache_key))
        
        cache.set(cache_key, "dummy", 600)
        self.profile.horarios.remove(schedule)
        self.assertIsNone(cache.get(cache_key))

    def test_sinal_m2m_ano_letivo_horario(self):
        subject = Materia.objects.create(codigo='MAT5', nome='Materia 5')
        schedule = Horario.objects.create(
            materia=subject,
            turma='A',
            departamento='DEP',
            periodo='1',
            data_inicio=date(2026, 6, 1),
            data_termino=date(2026, 6, 30),
            maximo_faltas=16,
            bloco=10,
            aula=1,
            dia=1,
            inicio=time(8, 0),
            fim=time(9, 40),
            sala='101'
        )
        
        cache_key = f"agenda_ical_{self.profile.calendar_token}"
        cache.set(cache_key, "dummy", 600)
        
        self.academic_year.horarios.add(schedule)
        self.assertIsNone(cache.get(cache_key))
        
        cache.set(cache_key, "dummy", 600)
        self.academic_year.horarios.remove(schedule)
        self.assertIsNone(cache.get(cache_key))
