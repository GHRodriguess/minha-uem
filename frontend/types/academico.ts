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
