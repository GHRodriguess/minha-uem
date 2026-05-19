import pdfplumber
import re
from datetime import datetime
from django.db import transaction
from .models import Curso, Materia, Horario, PerfilAcademico

class ServicoExtracaoHorario:
    def __init__(self, pdf_file, user):
        self.pdf_file = pdf_file
        self.user = user
        self.materias_data = {}
        self.horarios_data = []
        self.curso_codigo = ""
        self.curso_nome = ""
        self.texto = ""

    def processar(self):
        self._extrair_texto()
        self._extrair_curso()
        self._extrair_materias()
        self._extrair_horarios()
        return self._salvar_dados()

    def _extrair_texto(self):
        with pdfplumber.open(self.pdf_file) as pdf:
            for page in pdf.pages:
                self.texto += page.extract_text()

    def _extrair_curso(self):
        # Tenta o padrão esperado: CURSO- [CODIGO] [NOME] -
        match = re.search(r'CURSO-\s*(\d+)\s*-\s*(.*?)\s*-', self.texto)
        if match:
            self.curso_codigo = match.group(1).strip()
            self.curso_nome = match.group(2).strip()
        else:
            # Fallback mais genérico
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
                self.materias_data[codigo] = {
                    "turma": turma,
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
        
        for linha in linhas_texto:
            matches_na_linha = list(padrao.finditer(linha))
            if not matches_na_linha:
                continue
            
            if buffer_matches is None:
                buffer_matches = matches_na_linha
            else:
                if len(matches_na_linha) == len(buffer_matches):
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
                        turma = partes[1] if len(partes) > 1 else ""
                        dia_semana = dia_idx + 1
                        
                        chave = (bloco_detectado, aula_num, dia_semana, codigo_materia)
                        if chave not in vistos:
                            self.horarios_data.append({
                                "bloco": bloco_detectado,
                                "aula": aula_num,
                                "dia": dia_semana,
                                "inicio": datetime.strptime(inicio, '%H:%M').time(),
                                "fim": datetime.strptime(fim, '%H:%M').time(),
                                "codigo": codigo_materia,
                                "turma": turma,
                                "sala": sala
                            })
                            vistos.add(chave)

    def _salvar_dados(self):
        with transaction.atomic():
            curso, _ = Curso.objects.get_or_create(
                codigo=self.curso_codigo,
                defaults={'nome': self.curso_nome}
            )
            
            materias_salvas = []
            for codigo, data in self.materias_data.items():
                materia, created = Materia.objects.get_or_create(
                    codigo=codigo,
                    turma=data['turma'],
                    inicio=data['inicio'],
                    termino=data['termino'],
                    defaults={
                        'nome': data['nome'],
                        'departamento': data['departamento'],
                        'periodo': data['periodo'],
                        'maximo_faltas': data['maximo_faltas']
                    }
                )
                
                if not created:
                    materia.nome = data['nome']
                    materia.departamento = data['departamento']
                    materia.periodo = data['periodo']
                    materia.maximo_faltas = data['maximo_faltas']
                    materia.save()
                
                materias_salvas.append(materia)

            # Salvar horários para cada matéria
            for h_data in self.horarios_data:
                materia = next((m for m in materias_salvas if m.codigo == h_data['codigo'] and m.turma == h_data['turma']), None)
                
                if not materia:
                    continue
                    
                Horario.objects.get_or_create(
                    materia=materia,
                    bloco=h_data['bloco'],
                    aula=h_data['aula'],
                    dia=h_data['dia'],
                    defaults={
                        'inicio': h_data['inicio'],
                        'fim': h_data['fim'],
                        'sala': h_data['sala']
                    }
                )

            perfil, _ = PerfilAcademico.objects.get_or_create(user=self.user)
            perfil.curso = curso
            perfil.materias.set(materias_salvas)
            perfil.save()
            
            return perfil
