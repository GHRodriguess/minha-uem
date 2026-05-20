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
  tipo: 'PROVA' | 'TRABALHO' | 'EXAME' | 'OUTRO';
  peso: number;
  nota: number | null;
  data: string | null;
  ordem: number;
}

export interface ConfiguracaoMateria {
  id: number;
  media_minima: number;
  avaliacoes: Avaliacao[];
  media_atual: number;
  quanto_falta: number;
}

export interface Materia {
  id: number;
  nome: string;
  codigo: string;
  faltas_atuais: number;
  detalhes_faltas?: { data: string; aula: number; faltas: number }[];
  horarios?: Horario[];
  configuracao_notas?: ConfiguracaoMateria | null;
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
