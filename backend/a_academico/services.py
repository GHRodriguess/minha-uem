import pdfplumber
import re
from datetime import datetime
from django.db import transaction
from .models import Curso, Materia, Horario, PerfilAcademico, AnoLetivo

class ServicoExtracaoHorario:
    def __init__(self, pdf_file, user):
        self.pdf_file = pdf_file
        self.user = user
        self.materias_data = {}
        self.horarios_data = []
        self.curso_codigo = ""
        self.curso_nome = ""
        self.texto = ""
        self.ano = None

    def processar(self, apenas_analisar=False):
        self._extrair_texto()
        self._extrair_ano()
        print(f"Ano letivo identificado: {self.ano}")
        
        if apenas_analisar:
            return {"ano": self.ano}

        self._extrair_curso()
        self._extrair_materias()
        self._extrair_horarios()
        return self._salvar_dados()

    def _extrair_texto(self):
        if self.texto:
            return
        with pdfplumber.open(self.pdf_file) as pdf:
            for page in pdf.pages:
                self.texto += page.extract_text() + "\n---PAGE_BREAK---\n"

    def _extrair_ano(self):
        cabecalho = self.texto.split("---PAGE_BREAK---")[0][:2000]
                
        padroes = [
            r'ANO\s*LETIVO.*?:?\s*(\d{4})',
            r'(\d{4})\s*-\s*ANO\s*LETIVO',
            r'LETIVO.*?:?\s*(\d{4})'
        ]
        
        for padrao in padroes:
            match = re.search(padrao, cabecalho, re.IGNORECASE)
            if match:
                self.ano = int(match.group(1))
                return

        for padrao in padroes:
            match = re.search(padrao, self.texto, re.IGNORECASE)
            if match:
                self.ano = int(match.group(1))
                return

        datas = re.findall(r'(\d{2}/\d{2}/\d{2})', self.texto)
        if datas:
            anos_inferidos = []
            for data_str in datas:
                try:
                    ano_yy = int(data_str.split('/')[-1])
                    ano_full = 2000 + ano_yy if ano_yy < 50 else 1900 + ano_yy
                    anos_inferidos.append(ano_full)
                except:
                    continue
            
            if anos_inferidos:
                from collections import Counter
                self.ano = Counter(anos_inferidos).most_common(1)[0][0]
                return

        if not self.ano:
            self.ano = datetime.now().year
                
    def _extrair_curso(self):
        match = re.search(r'CURSO-\s*(\d+)\s*-\s*(.*?)\s*-', self.texto)
        if match:
            self.curso_codigo = match.group(1).strip()
            self.curso_nome = match.group(2).strip()
        else:
            match_simples = re.search(r'CURSO-\s*(.*?)\s*-', self.texto)
            if match_simples:
                conteudo = match_simples.group(1).strip()                
                partes = conteudo.split(" ", 1)                    
                self.curso_codigo = partes[0].strip()
                self.curso_nome = partes[1].strip()

    def _extrair_materias(self):
        padrao_materia = re.compile(r'^(\d+)\s+(\d+)\s+(.*?)\s+([A-Z]{2,4})\s+([ASME\d\s]+?)\s+(\d{2}/\d{2}/\d{2})\s+(\d{2}/\d{2}/\d{2})\s+(\d+)$')
        
        for linha in self.texto.split('\n'):
            linha = linha.replace("(cid:10)", "").strip()
            match = padrao_materia.match(linha)
            if match:
                codigo, turma, nome, depto, periodo, inicio, termino, faltas = match.groups()
                # Normaliza turma removendo zeros à esquerda para consistência
                turma_normalizada = str(int(turma)) if turma.isdigit() else turma.strip()
                self.materias_data[codigo] = {
                    "turma": turma_normalizada,
                    "nome": nome.strip(),
                    "departamento": depto,
                    "periodo": periodo.strip(),
                    "inicio": datetime.strptime(inicio, '%d/%m/%y').date(),
                    "termino": datetime.strptime(termino, '%d/%m/%y').date(),
                    "maximo_faltas": int(faltas)
                }

    def _extrair_horarios(self):
        padrao = re.compile(r'(\d{2}:\d{2})\|[^|]*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)')
        
        linhas_texto = self.texto.split('\n')
        colunas_horarios = []
        buffer_matches = None
        seen_intervals = set()
        
        for linha in linhas_texto:
            if "---PAGE_BREAK---" in linha:
                seen_intervals = set()
                buffer_matches = None
                continue

            matches_na_linha = list(padrao.finditer(linha))
            if not matches_na_linha:
                continue
            
            if buffer_matches is None:
                buffer_matches = matches_na_linha
            else:
                if len(matches_na_linha) == len(buffer_matches):
                    # Verifica se este intervalo de tempo já foi processado nesta página
                    # (Evita duplicações comuns em PDFs da UEM)
                    if len(matches_na_linha) == 1:
                        inicio = buffer_matches[0].group(1)
                        fim = matches_na_linha[0].group(1)
                        if (inicio, fim) in seen_intervals:
                            buffer_matches = None
                            continue
                        seen_intervals.add((inicio, fim))

                    while len(colunas_horarios) < len(matches_na_linha):
                        colunas_horarios.append([])
                    
                    for i, (m_disc, m_sala) in enumerate(zip(buffer_matches, matches_na_linha)):
                        inicio = m_disc.group(1)
                        fim = m_sala.group(1)
                        colunas_horarios[i].append((m_disc, m_sala, inicio, fim))
                buffer_matches = None
        
        tabelas = []
        for coluna in colunas_horarios:
            tabela_atual = []
            last_inicio = ""
            for item in coluna:
                inicio = item[2]
                if last_inicio and inicio <= last_inicio:
                    if tabela_atual:
                        tabelas.append(tabela_atual)
                    tabela_atual = []
                tabela_atual.append(item)
                last_inicio = inicio
            if tabela_atual:
                tabelas.append(tabela_atual)
            
        vistos = set()
        
        for tabela in tabelas:
            bloco_detectado = None
            for match_disc, _, _, _ in tabela:
                for dia_idx in range(6):
                    disciplina_raw = match_disc.group(dia_idx + 2).strip()
                    if disciplina_raw:
                        codigo_materia = disciplina_raw.split('-')[0]
                        if codigo_materia in self.materias_data:
                            periodo = self.materias_data[codigo_materia].get("periodo", "")
                            if "S1" in periodo:
                                bloco_detectado = 1
                                break
                            if "S2" in periodo:
                                bloco_detectado = 2
                                break
                            if "M" in periodo:
                                mes_inicio = self.materias_data[codigo_materia]["inicio"].month
                                bloco_detectado = 2 if mes_inicio >= 7 else 1
                                break
                if bloco_detectado:
                    break
            
            bloco_detectado = bloco_detectado or 1
                
            for match_disc, match_sala, inicio, fim in tabela:
                mapa_horarios = {
                    "07:45": 1, "08:35": 2, "09:40": 3, "10:30": 4, "11:20": 5,
                    "13:30": 6, "14:20": 7, "15:20": 8, "16:10": 9, "17:00": 10,
                    "18:50": 11, "19:30": 12, "20:20": 13, "21:20": 14, "22:10": 15
                }
                aula_num = mapa_horarios.get(inicio, 1)

                for dia_idx in range(6):
                    disciplina_raw = match_disc.group(dia_idx + 2).strip()
                    sala = match_sala.group(dia_idx + 2).strip()
                    
                    if disciplina_raw:
                        partes = disciplina_raw.split('-')
                        codigo_materia = partes[0]
                        turma_raw = partes[1] if len(partes) > 1 else ""
                        # Normaliza turma removendo zeros à esquerda para consistência
                        turma_normalizada = str(int(turma_raw)) if turma_raw.isdigit() else turma_raw.strip()
                        dia_semana = dia_idx + 1
                        
                        # A chave de de-duplicação ignora o bloco para evitar que matérias anuais
                        # (que aparecem em múltiplas páginas/semestres) gerem horários duplicados no mesmo dia/hora.
                        chave = (aula_num, dia_semana, codigo_materia)
                        if chave not in vistos:
                            m_data = self.materias_data.get(codigo_materia, {})
                            self.horarios_data.append({
                                "bloco": bloco_detectado,
                                "aula": aula_num,
                                "dia": dia_semana,
                                "inicio": datetime.strptime(inicio, '%H:%M').time(),
                                "fim": datetime.strptime(fim, '%H:%M').time(),
                                "codigo": codigo_materia,
                                "turma": turma_normalizada,
                                "sala": sala,
                                "departamento": m_data.get("departamento", ""),
                                "periodo": m_data.get("periodo", ""),
                                "data_inicio": m_data.get("inicio"),
                                "data_termino": m_data.get("termino"),
                                "maximo_faltas": m_data.get("maximo_faltas", 0)
                            })
                            vistos.add(chave)

    def _salvar_dados(self):
        if not self.ano and self.materias_data:
            from collections import Counter
            anos = [data['inicio'].year for data in self.materias_data.values()]
            if anos:
                self.ano = Counter(anos).most_common(1)[0][0]
        
        if not self.ano:
            self.ano = datetime.now().year

        print(f"Iniciando salvamento para o ano {self.ano}: {len(self.materias_data)} matérias, {len(self.horarios_data)} horários.")
        
        with transaction.atomic():
            curso, _ = Curso.objects.get_or_create(
                codigo=self.curso_codigo,
                defaults={'nome': self.curso_nome}
            )
            
            materias_salvas = []
            for codigo, data in self.materias_data.items():
                materia, created = Materia.objects.get_or_create(
                    codigo=codigo,
                    defaults={
                        'nome': data['nome'],
                    }
                )
                
                if not created:
                    materia.nome = data['nome']
                    materia.save()
                
                materias_salvas.append(materia)

            horarios_criados_objs = []
            for h_data in self.horarios_data:
                materia = next((m for m in materias_salvas if m.codigo == h_data['codigo']), None)
                
                if not materia:
                    continue
                    
                obj, created = Horario.objects.update_or_create(
                    materia=materia,
                    turma=h_data['turma'],
                    aula=h_data['aula'],
                    dia=h_data['dia'],
                    defaults={
                        'bloco': h_data['bloco'],
                        'inicio': h_data['inicio'],
                        'fim': h_data['fim'],
                        'sala': h_data['sala'].strip(),
                        'departamento': h_data['departamento'],
                        'periodo': h_data['periodo'],
                        'data_inicio': h_data['data_inicio'],
                        'data_termino': h_data['data_termino'],
                        'maximo_faltas': h_data['maximo_faltas']
                    }
                )
                horarios_criados_objs.append(obj)

            perfil, _ = PerfilAcademico.objects.get_or_create(user=self.user)
            perfil.curso = curso
            perfil.save()

            # Limpa dados anteriores do mesmo ano letivo (incluindo faltas via CASCADE)
            AnoLetivo.objects.filter(perfil=perfil, ano=self.ano).delete()

            ano_letivo = AnoLetivo.objects.create(
                perfil=perfil,
                ano=self.ano
            )
            ano_letivo.materias.set(materias_salvas)
            ano_letivo.horarios.set(horarios_criados_objs)
            ano_letivo.save()
            
            return perfil
