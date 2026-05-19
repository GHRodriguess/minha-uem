export interface Horario {
  bloco: number;
  aula: number;
  dia: number;
  inicio: string;
  fim: string;
  sala: string;
}

export interface Materia {
  id: number;
  nome: string;
  codigo: string;
  turma: string;
  departamento: string;
  inicio: string;
  termino: string;
  maximo_faltas: number;
  faltas_atuais: number;
  detalhes_faltas?: { data: string; aula: number; faltas: number }[];
  horarios?: Horario[];
}

export interface Curso {
  id: number;
  codigo: string;
  nome: string;
}

export interface Perfil {
  configurado: boolean;
  curso?: Curso;
  materias?: Materia[];
}
