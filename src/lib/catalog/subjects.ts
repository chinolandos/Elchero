/**
 * Catálogo curado de materias por tipo de usuario.
 *
 * AVANZO oficial (MINED 2024+): Lenguaje y Literatura, Matemática,
 * Ciencias Naturales, Estudios Sociales y Ciudadanía, Inglés.
 *
 * Para bachillerato general agregamos las clásicas que aparecen en períodos.
 * Para universitario damos un set transversal de carreras técnicas/admin
 * más populares en SV (ESEN, UCA, UES, UDB, UTEC, UEES, UFG).
 */

export interface InstitutionOption {
  value: string;
  label: string;
  type: 'universitario' | 'bachiller';
}

export const INSTITUTIONS: InstitutionOption[] = [
  // Universidades top SV
  { value: 'ESEN', label: 'ESEN', type: 'universitario' },
  { value: 'UCA', label: 'UCA — Universidad Centroamericana', type: 'universitario' },
  { value: 'UES', label: 'UES — Universidad de El Salvador', type: 'universitario' },
  { value: 'UDB', label: 'UDB — Universidad Don Bosco', type: 'universitario' },
  { value: 'UTEC', label: 'UTEC — Universidad Tecnológica', type: 'universitario' },
  { value: 'UEES', label: 'UEES — Universidad Evangélica', type: 'universitario' },
  { value: 'UFG', label: 'UFG — Universidad Francisco Gavidia', type: 'universitario' },
  { value: 'UNICAES', label: 'UNICAES — Universidad Católica', type: 'universitario' },
  { value: 'UJMD', label: 'UJMD — Dr. José Matías Delgado', type: 'universitario' },
  { value: 'Mónica Herrera', label: 'Universidad Mónica Herrera', type: 'universitario' },
  { value: 'Otra', label: 'Otra universidad', type: 'universitario' },
  // Bachillerato (no listamos colegios — son cientos. Ponemos un input libre)
  { value: 'Otro', label: 'Mi colegio (lo escribo después)', type: 'bachiller' },
];

/**
 * Materias AVANZO 2024+ (MINED, oficial).
 * Estas son las 5 áreas que se evalúan en la prueba nacional.
 */
export const AVANZO_SUBJECTS = [
  'Lenguaje y Literatura',
  'Matemática',
  'Ciencias Naturales',
  'Estudios Sociales y Ciudadanía',
  'Inglés',
] as const;

/**
 * Materias frecuentes en bachillerato general SV.
 * Aparecen en períodos evaluativos aunque no estén en AVANZO.
 */
export const BACHILLER_EXTRA_SUBJECTS = [
  'Ciencias Sociales',
  'Educación Física',
  'Educación Artística',
  'Moral, Urbanidad y Cívica',
  'Informática',
  'Filosofía',
  'Psicología',
  'Economía',
  'Contabilidad',
] as const;

export const BACHILLER_SUBJECTS = [
  ...AVANZO_SUBJECTS,
  ...BACHILLER_EXTRA_SUBJECTS,
] as const;

/**
 * Materias universitarias agrupadas por área.
 * Cubre las carreras más populares en SV.
 */
export const UNIVERSITARIO_SUBJECTS = [
  // Cuantitativas
  'Cálculo I', 'Cálculo II', 'Cálculo III',
  'Álgebra Lineal', 'Estadística', 'Probabilidad',
  'Investigación de Operaciones', 'Métodos Numéricos',
  // Económicas / negocios
  'Microeconomía', 'Macroeconomía', 'Econometría',
  'Finanzas', 'Contabilidad Financiera', 'Contabilidad de Costos',
  'Marketing', 'Mercadeo Digital', 'Estrategia Empresarial',
  'Recursos Humanos', 'Comportamiento Organizacional',
  // Software / ingeniería
  'Programación I', 'Programación II',
  'Estructuras de Datos', 'Algoritmos',
  'Bases de Datos', 'Ingeniería de Software',
  'Redes', 'Sistemas Operativos', 'Arquitectura de Computadores',
  'Inteligencia Artificial', 'Machine Learning',
  // Civil / industrial
  'Física I', 'Física II', 'Química', 'Termodinámica',
  'Mecánica de Materiales', 'Hidráulica',
  // Salud
  'Anatomía', 'Fisiología', 'Bioquímica', 'Farmacología', 'Patología',
  // Derecho
  'Derecho Constitucional', 'Derecho Civil', 'Derecho Penal',
  'Derecho Mercantil', 'Derecho Laboral',
  // Comunicación / humanidades
  'Comunicación Estratégica', 'Periodismo', 'Diseño Gráfico',
  'Historia', 'Filosofía',
] as const;

export type AvanzoSubject = (typeof AVANZO_SUBJECTS)[number];
export type BachillerSubject = (typeof BACHILLER_SUBJECTS)[number];
export type UniversitarioSubject = (typeof UNIVERSITARIO_SUBJECTS)[number];

/**
 * Helper: dado un user_type, devuelve las materias sugeridas para chips.
 */
export function getSubjectsFor(
  userType: 'bachiller' | 'universitario',
  year?: number | null,
): readonly string[] {
  if (userType === 'bachiller') {
    return BACHILLER_SUBJECTS;
  }
  return UNIVERSITARIO_SUBJECTS;
}
