import re
import unicodedata
from django.contrib.auth.models import User
from a_academico.models import PerfilAcademico

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
