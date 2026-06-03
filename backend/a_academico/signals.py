from django.db.models.signals import post_save, pre_delete, m2m_changed
from django.dispatch import receiver
from django.core.cache import cache
from .models import PerfilAcademico, AnoLetivo, Horario, ConfiguracaoMateria, Avaliacao

def invalidar_cache_agenda(perfil_id):
    profile = PerfilAcademico.objects.filter(id=perfil_id).first()
    if profile and profile.calendar_token:
        cache_key = f"agenda_ical_{profile.calendar_token}"
        cache.delete(cache_key)

@receiver(post_save, sender=Avaliacao)
@receiver(pre_delete, sender=Avaliacao)
def limpar_agenda_avaliacao(sender, instance, **kwargs):
    if instance.configuracao and instance.configuracao.perfil_id:
        invalidar_cache_agenda(instance.configuracao.perfil_id)

@receiver(post_save, sender=ConfiguracaoMateria)
@receiver(pre_delete, sender=ConfiguracaoMateria)
def limpar_agenda_configuracao(sender, instance, **kwargs):
    if instance.perfil_id:
        invalidar_cache_agenda(instance.perfil_id)

@receiver(post_save, sender=Horario)
@receiver(pre_delete, sender=Horario)
def limpar_agenda_horario(sender, instance, **kwargs):
    profile_ids = set()
    profile_ids.update(PerfilAcademico.objects.filter(horarios=instance).values_list('id', flat=True))
    profile_ids.update(AnoLetivo.objects.filter(horarios=instance).values_list('perfil_id', flat=True))
    for profile_id in profile_ids:
        invalidar_cache_agenda(profile_id)

@receiver(m2m_changed, sender=PerfilAcademico.horarios.through)
@receiver(m2m_changed, sender=AnoLetivo.horarios.through)
def limpar_agenda_m2m(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        if isinstance(instance, PerfilAcademico):
            invalidar_cache_agenda(instance.id)
        elif isinstance(instance, AnoLetivo):
            invalidar_cache_agenda(instance.perfil_id)
