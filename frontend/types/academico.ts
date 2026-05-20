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

export interface Materia {
  id: number;
  nome: string;
  codigo: string;
  faltas_atuais: number;
  detalhes_faltas?: { data: string; aula: number; faltas: number }[];
  horarios?: Horario[];
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
