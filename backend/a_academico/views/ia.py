import io
import os
import re
import json
import base64
import mimetypes
import traceback
import pdfplumber
import requests
from django.utils import timezone
from django.db.models import Count, Sum, Q
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from a_academico.models import (
    ChaveApiGemini,
    ConversaIA,
    MensagemConversaIA,
    Materia,
    HistoricoUsoIA,
    ArquivoMateriaClassroom,
    Avaliacao,
    ConfiguracaoMateria
)
from a_academico.services import ServicoCriptografia
from .base import obter_perfil_ativo


def obter_contexto_academico(profile, materia_id=None, google_token=None) -> str:
    try:
        now_dt = timezone.localtime(timezone.now())
    except Exception:
        now_dt = timezone.now()

    today = now_dt.date()
    weekday_map = {0: "Segunda-feira", 1: "Terca-feira", 2: "Quarta-feira", 3: "Quinta-feira", 4: "Sexta-feira", 5: "Sabado", 6: "Domingo"}
    current_date_str = f"Hoje e {weekday_map[today.weekday()]} {today.strftime('%d/%m/%Y')} as {now_dt.strftime('%H:%M')}."

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

    materias = ano_letivo.materias.all()
    for m in materias:
        is_active = (materia_id is not None and m.id == int(materia_id))
        label_active = " (SELECIONADA ATUALMENTE)" if is_active else ""
        context.append(f"\n--- DISCIPLINA: {m.codigo} - {m.nome}{label_active} (ID: {m.id}) ---")

        schedules = ano_letivo.horarios.filter(materia=m).order_by('dia', 'inicio')
        if schedules.exists():
            context.append("Horarios e Aulas:")
            for s in schedules:
                dia_nome = days_map.get(s.dia, f"Dia {s.dia}")
                status_ativo = " (Ativa)" if s.data_inicio <= today <= s.data_termino else " (Inativa/Outro Periodo)"
                context.append(f"  - {dia_nome} | Sala: {s.sala} | Bloco: {s.bloco} | Horario: {s.inicio.strftime('%H:%M')} - {s.fim.strftime('%H:%M')} | Vigencia: {s.data_inicio.strftime('%d/%m/%Y')} ate {s.data_termino.strftime('%d/%m/%Y')}{status_ativo} | Turma: {s.turma}")

        total_faltas = profile.registros_falta.filter(materia=m, ano_letivo=ano_letivo).aggregate(Sum('faltas'))['faltas__sum'] or 0
        max_faltas = schedules.first().maximo_faltas if schedules.exists() else 0
        context.append(f"Faltas: {total_faltas}/{max_faltas}")

        config = ConfiguracaoMateria.objects.filter(materia=m, perfil=profile, ano_letivo=ano_letivo).first()
        if config:
            context.append(f"Media minima para aprovacao: {config.media_minima}")

            all_evaluations = config.avaliacoes.all()
            graded_evaluations = all_evaluations.filter(nota__isnull=False)
            total_weights = sum(float(a.peso) for a in all_evaluations)
            graded_weights = sum(float(a.peso) for a in graded_evaluations)
            ungraded_weights = sum(float(a.peso) for a in all_evaluations.filter(nota__isnull=True))
            if graded_evaluations.exists():
                weighted_sum = sum(float(a.nota * a.peso) for a in graded_evaluations)
                if graded_weights > 0:
                    current_average = round(weighted_sum / graded_weights, 2)
                    context.append(f"Media atual calculada (apenas das provas ja realizadas): {current_average}")
                if total_weights > 0:
                    min_final_average = round(weighted_sum / total_weights, 2)
                    max_final_average = round((weighted_sum + 10.0 * ungraded_weights) / total_weights, 2)
                    percentage_graded = round((graded_weights / total_weights) * 100, 1)
                    context.append(f"Progresso da avaliacao: {percentage_graded}% do peso total avaliado")
                    context.append(f"Media final minima possivel (se tirar zero no restante): {min_final_average}")
                    context.append(f"Media final maxima possivel (se tirar dez no restante): {max_final_average}")
                    required_sum = float(config.media_minima) * total_weights
                    needed_points = required_sum - weighted_sum
                    if min_final_average >= float(config.media_minima):
                        context.append("Situacao: Aprovado garantido! Mesmo se tirar zero nas avaliacoes restantes, a media final sera igual ou superior a media minima de aprovacao.")
                    elif max_final_average < float(config.media_minima):
                        context.append("Situacao: Reprovado. Matematicamente nao e mais possivel alcancar a media minima de aprovacao, mesmo gabaritando o restante.")
                    else:
                        context.append("Situacao: Em andamento. Ainda precisa realizar avaliacoes para atingir a media minima.")
                        if ungraded_weights > 0:
                            needed_average = round(needed_points / ungraded_weights, 2)
                            context.append(f"Nota media necessaria nas avaliacoes restantes: {needed_average}")

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
                local_files = connection.arquivos.all()
                for file_obj in local_files:
                    if not file_obj.is_ignored:
                        files_list.append(f"    * {file_obj.custom_name or file_obj.original_name} (ID: {file_obj.drive_file_id})")
                if files_list:
                    context.append("Materiais no Classroom:")
                    context.extend(files_list)
    return "\n".join(context)


def obter_conteudo_arquivo_servidor(profile, drive_file_id, google_token):
    arquivo = ArquivoMateriaClassroom.objects.filter(
        classroom_connection__subject_config__perfil=profile,
        drive_file_id=drive_file_id
    ).first()
    conteudo_binario = None
    nome_arquivo = "documento.pdf"

    if arquivo:
        nome_arquivo = arquivo.original_name
        
    if not drive_file_id.startswith('local_') and google_token:
        try:
            headers = {'Authorization': f'Bearer {google_token}'}
            drive_url = f'https://www.googleapis.com/drive/v3/files/{drive_file_id}?alt=media'
            drive_res = requests.get(drive_url, headers=headers, timeout=20)
            if drive_res.status_code == 200:
                conteudo_binario = drive_res.content
        except Exception:
            pass

    if not conteudo_binario and arquivo and arquivo.local_path:
        if os.path.exists(arquivo.local_path):
            try:
                with open(arquivo.local_path, 'rb') as f:
                    conteudo_binario = f.read()
            except Exception:
                pass

    if not conteudo_binario:
        return "Nao foi possivel obter o conteudo do arquivo."

    mime_type, _ = mimetypes.guess_type(nome_arquivo)
    mime_type = mime_type or 'application/pdf'

    if 'pdf' in mime_type:
        try:
            texto = []
            with pdfplumber.open(io.BytesIO(conteudo_binario)) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        texto.append(t)
            return "\n".join(texto) if texto else "O PDF esta vazio ou nao contem texto extraivel."
        except Exception as e:
            return f"Erro ao extrair texto do PDF: {str(e)}"
    else:
        try:
            return conteudo_binario.decode('utf-8', errors='ignore')
        except Exception as e:
            return f"Erro ao decodificar arquivo de texto: {str(e)}"


def executar_stream_gemini(model_name, api_key, contents, system_instruction, profile, on_completion=None, google_token=None):
    tools = [
        {
            "functionDeclarations": [
                {
                    "name": "obter_conteudo_arquivo",
                    "description": "Obtem o conteudo em texto ou informacoes internas de um arquivo especifico do Classroom ou local associado a disciplina. Use esta ferramenta sempre que o usuario fizer perguntas sobre o conteudo, regras, requisitos ou detalhes de um arquivo/documento especifico (como trab2.pdf ou outros arquivos) listado nos materiais da disciplina.",
                    "parameters": {
                        "type": "OBJECT",
                        "properties": {
                            "drive_file_id": {
                                "type": "STRING",
                                "description": "O ID do arquivo no Google Drive ou identificador local."
                            }
                        },
                        "required": ["drive_file_id"]
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

    def gerar_stream():
        try:
            response = realizar_requisicao(contents)
            if response.status_code != 200:
                raise Exception(f"Erro na API do Gemini: {response.text}")

            prompt_tokens = 0
            candidate_tokens = 0
            total_tokens = 0
            full_response = ""
            current_turn = 0
            turn_limit = 5

            while current_turn < turn_limit:
                buffer = ""
                bracket_count = 0
                start_idx = -1
                in_string = False
                escape = False
                i = 0
                function_call = None
                thought_signature = None

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
                                        usage = obj.get('usageMetadata', {})
                                        if usage:
                                            prompt_tokens = usage.get('promptTokenCount', prompt_tokens)
                                            candidate_tokens = usage.get('candidatesTokenCount', candidate_tokens)
                                            total_tokens = usage.get('totalTokenCount', total_tokens)
                                        parts = obj.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])
                                        fc = parts[0].get('functionCall')
                                        if fc:
                                            function_call = fc
                                            thought_signature = parts[0].get('thought_signature') or parts[0].get('thoughtSignature')
                                            break
                                        text = parts[0].get('text', '')
                                        if text:
                                            full_response += text
                                            yield text
                                    except Exception:
                                        pass
                                    buffer = buffer[i+1:]
                                    i = -1
                                    start_idx = -1
                                    in_string = False
                                    escape = False
                        i += 1
                    if function_call:
                        break

                if not function_call:
                    break

                function_name = function_call.get("name")
                args = function_call.get("args", {})
                result_context = ""
                if function_name == "obter_conteudo_arquivo":
                    drive_file_id = args.get("drive_file_id")
                    if drive_file_id:
                        result_context = obter_conteudo_arquivo_servidor(profile, drive_file_id, google_token)

                model_part = {
                    "functionCall": function_call
                }
                if thought_signature:
                    model_part["thought_signature"] = thought_signature
                    model_part["thoughtSignature"] = thought_signature

                contents.append({
                    "role": "model",
                    "parts": [model_part]
                })
                contents.append({
                    "role": "function",
                    "parts": [
                        {
                            "functionResponse": {
                                "name": function_name,
                                "response": {
                                    "result": result_context
                                }
                            }
                        }
                    ]
                })

                response = realizar_requisicao(contents)
                if response.status_code != 200:
                    raise Exception(f"Erro na API do Gemini apos chamada de funcao: {response.text}")
                current_turn += 1

            try:
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
                    on_completion(full_response)
                except Exception:
                    pass

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower() or "limit" in error_msg.lower() or "resource_exhausted" in error_msg.lower():
                yield "Desculpe, o limite de requisicoes (quota) da API do Gemini foi atingido. Por favor, aguarde alguns instantes e tente novamente."
            else:
                yield f"Desculpe, ocorreu um erro ao processar a resposta da IA. Detalhes: {error_msg}"

    return gerar_stream()


class ConfiguracaoIAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = obter_perfil_ativo(request)
        has_key = hasattr(profile, 'chave_gemini')
        model_name = profile.chave_gemini.model_name if has_key else "gemini-3.5-flash"

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
            is_valid, error_msg = self.validar_chave_gemini(api_key, model_name or "gemini-3.5-flash")
            if not is_valid:
                return Response({'erro': error_msg}, status=status.HTTP_400_BAD_REQUEST)

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

    def validar_chave_gemini(self, api_key: str, model_name: str) -> tuple[bool, str]:
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
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", {}).get("message", response.text)
                except Exception:
                    error_msg = response.text
                return False, f"Erro na API do Google (Status {response.status_code}): {error_msg}"
            return True, ""
        except Exception as e:
            return False, f"Erro de conexao com a API do Gemini: {str(e)}"


class ChatIAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile, _ = obter_perfil_ativo(request)
        if not hasattr(profile, 'chave_gemini'):
            return Response({'erro': 'Configure sua chave de API nas configuracoes antes de usar a IA.'}, status=status.HTTP_400_BAD_REQUEST)

        message = request.data.get('mensagem')
        if not message:
            return Response({'erro': 'Fluxo nao completo. Mensagem nao fornecida.'}, status=status.HTTP_400_BAD_REQUEST)

        materia_id = request.data.get('materia_id')
        drive_file_id = request.data.get('arquivo_aberto_id')
        selected_file_ids = request.data.get('arquivos_selecionados_ids', [])
        local_files = request.data.get('arquivos_locais', [])

        google_token = request.headers.get('X-Google-Access-Token')
        encrypted_api_key = profile.chave_gemini.encrypted_api_key
        api_key = ServicoCriptografia.descriptografar_dado(encrypted_api_key)
        model_name = profile.chave_gemini.model_name

        context_prompt = obter_contexto_academico(profile, materia_id, google_token)

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
            "IMPORTANTE: Nao mencione dados de desempenho academico (como notas, faltas, media atual ou avaliacoes) a menos que o usuario pergunte especificamente sobre isso ou que seja relevante para responder a pergunta dele.\n"
            "ATENCAO AO CALCULO DE APROVACAO: Nunca assuma que o aluno ja passou apenas olhando a 'Media atual'. A 'Media atual' e parcial e considera apenas avaliacoes ja realizadas. Use os dados de 'Situacao', 'Progresso da avaliacao' e 'Nota media necessaria' fornecidos no contexto para responder com precisao se ele ja passou ou o que ainda precisa fazer.\n"
            "Voce ja tem acesso aos dados de todas as disciplinas ativas no contexto fornecido (incluindo faltas, notas, avaliacoes/eventos e arquivos). Nao ha necessidade de chamar nenhuma ferramenta para obter contexto de disciplina.\n\n"
            f"Contexto academico atual do usuario:\n{context_prompt}"
        )

        try:
            stream = executar_stream_gemini(model_name, api_key, contents, system_instruction, profile, google_token=google_token)
            return StreamingHttpResponse(stream, content_type='text/plain')
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def obter_dados_arquivo(self, profile, file_id: str, google_token: str | None) -> dict | None:
        arquivo = ArquivoMateriaClassroom.objects.filter(
            classroom_connection__subject_config__perfil=profile,
            drive_file_id=file_id
        ).first()

        nome_arquivo = arquivo.original_name if arquivo else "documento"
        mime_type, _ = mimetypes.guess_type(nome_arquivo)
        mime_type = mime_type or 'application/pdf'

        conteudo_binario = None

        if not file_id.startswith('local_') and google_token:
            try:
                headers = {'Authorization': f'Bearer {google_token}'}
                drive_url = f'https://www.googleapis.com/drive/v3/files/{file_id}?alt=media'
                drive_res = requests.get(drive_url, headers=headers, timeout=20)
                if drive_res.status_code == 200:
                    conteudo_binario = drive_res.content
                    mime_type = drive_res.headers.get('Content-Type', mime_type)
            except Exception:
                pass

        if not conteudo_binario and arquivo and arquivo.local_path:
            if os.path.exists(arquivo.local_path):
                try:
                    with open(arquivo.local_path, 'rb') as f:
                        conteudo_binario = f.read()
                except Exception:
                    pass

        if conteudo_binario:
            base64_data = base64.b64encode(conteudo_binario).decode('utf-8')
            return {
                "mime_type": mime_type,
                "base64_data": base64_data
            }
        return None


class ConversasIAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = obter_perfil_ativo(request)
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
        conversa = ConversaIA.objects.filter(profile=profile, id=pk).first()
        if not conversa:
            return Response({'erro': 'Conversa nao encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        conversa.delete()
        return Response({'sucesso': True})


class EnviarMensagemConversaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        profile, _ = obter_perfil_ativo(request)
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
            "IMPORTANTE: Nao mencione dados de desempenho academico (como notas, faltas, media atual ou avaliacoes) a menos que o usuario pergunte especificamente sobre isso ou que seja relevante para responder a pergunta dele.\n"
            "ATENCAO AO CALCULO DE APROVACAO: Nunca assuma que o aluno ja passou apenas olhando a 'Media atual'. A 'Media atual' e parcial e considera apenas avaliacoes ja realizadas. Use os dados de 'Situacao', 'Progresso da avaliacao' e 'Nota media necessaria' fornecidos no contexto para responder com precisao se ele ja passou ou o que ainda precisa fazer.\n"
            "Voce ja tem acesso aos dados de todas as disciplinas ativas no contexto fornecido (incluindo faltas, notas, avaliacoes/eventos e arquivos). Nao ha necessidade de chamar nenhuma ferramenta para obter contexto de disciplina.\n\n"
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
            return StreamingHttpResponse(stream, content_type='text/plain')
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def obter_dados_arquivo(self, profile, file_id: str, google_token: str | None) -> dict | None:
        view_temp = ChatIAView()
        return view_temp.obter_dados_arquivo(profile, file_id, google_token)
