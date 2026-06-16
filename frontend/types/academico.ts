export interface Horario {
  bloco: number;
  aula: number;
  dia: number;
  inicio: string;
  fim: string;
  sala: string;
  turma: string;
  departamento: string;
  periodo: string;
  data_inicio: string;
  data_termino: string;
  maximo_faltas: number;
}

export interface Avaliacao {
  id: number;
  nome: string;
  tipo: 'PROVA' | 'TRABALHO' | 'EXAME' | 'TAREFA' | 'PESQUISA' | 'OUTRO';
  peso: number;
  nota: number | null;
  data: string | null;
  ordem: number;
  status: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO';
}

export interface AnotacaoMateria {
  id: number;
  content: string;
}

export interface ConfiguracaoMateria {
  id: number;
  media_minima: number;
  avaliacoes: Avaliacao[];
  media_atual: number;
  quanto_falta: number;
  notes?: AnotacaoMateria[];
  proportional_average?: number;
  required_exam_grade?: number;
  approval_status?: 'APROVADO' | 'EXAME' | 'REPROVADO' | 'EM_ANDAMENTO';
  total_weights_sum?: number;
  graded_weights_sum?: number;
  current_weighted_sum?: number;
}

export interface Materia {
  id: number;
  nome: string;
  codigo: string;
  faltas_atuais: number;
  detalhes_faltas?: { data: string; aula: number; faltas: number }[];
  horarios?: Horario[];
  configuracao_notas?: ConfiguracaoMateria | null;
  max_absences?: number;
  remaining_absences?: number;
  current_attendance_percentage?: number;
  classes_per_week?: number;
  weeks_tolerated_absences?: number;
  absences_risk_zone?: boolean;
}

export interface Curso {
  id: number;
  codigo: string;
  nome: string;
}

export interface AnoLetivo {
  id: number;
  ano: number;
}

export interface Perfil {
  configurado: boolean;
  curso?: Curso;
  materias?: Materia[];
  anos?: AnoLetivo[];
}
