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
  // Bachillerato — top colegios e institutos SV (orden alfabético).
  // Mix de privados conocidos + institutos públicos top.
  // La opción "Otro" ya NO vive acá: el combobox del onboarding ofrece
  // "+ Agregar <texto>" dinámicamente cuando lo que buscás no aparece.
  { value: 'ABC', label: 'Academia Británica Cuscatleca (ABC)', type: 'bachiller' },
  { value: 'Don Bosco', label: 'Colegio Don Bosco', type: 'bachiller' },
  { value: 'Escuela Americana', label: 'Escuela Americana', type: 'bachiller' },
  { value: 'Oasis', label: 'Escuela Cristiana Oasis', type: 'bachiller' },
  { value: 'Externado', label: 'Externado de San José', type: 'bachiller' },
  { value: 'Highlands', label: 'Highlands School', type: 'bachiller' },
  { value: 'INFRAMEN', label: 'INFRAMEN — Inst. Nac. Francisco Menéndez', type: 'bachiller' },
  { value: 'INTI', label: 'INTI — Inst. Nac. Técnico Industrial', type: 'bachiller' },
  { value: 'Lamatepec', label: 'Liceo Cristiano "Lamatepec"', type: 'bachiller' },
  { value: 'Liceo Salvadoreño', label: 'Liceo Salvadoreño', type: 'bachiller' },
  { value: 'Liceo San Benito', label: 'Liceo San Benito', type: 'bachiller' },
  { value: 'Sagrado Corazón', label: 'Colegio Sagrado Corazón', type: 'bachiller' },
  { value: 'Santa Cecilia', label: 'Colegio Santa Cecilia', type: 'bachiller' },
  { value: 'Walter Soundy', label: 'Centro Escolar Walter Soundy', type: 'bachiller' },

  // Universidades — sigue disponible para users que escogen 'universitario'
  // (el sistema soporta ambos; pero la landing y el flow defaultean a bachiller).
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
 * Materias frecuentes en bachillerato general SV (currículo MINED).
 * Aparecen en períodos evaluativos aunque no estén en AVANZO.
 *
 * Nota: "Ciencias Sociales" NO se incluye porque duplica el contenido de
 * "Estudios Sociales y Ciudadanía" (AVANZO). Son el mismo cuerpo de
 * historia + geografía + cívica con nombre diferente según pensum.
 *
 * "Moral, Urbanidad y Cívica" SÍ está aparte — enfoque en valores y ética,
 * común en colegios católicos (Don Bosco, Sagrado Corazón, Externado).
 *
 * Física, Química, Biología y Religión se mantienen aunque "Ciencias
 * Naturales" (AVANZO) las englobe — los colegios suelen separarlas en 2°
 * y 3° de bachillerato técnico.
 */
export const BACHILLER_EXTRA_SUBJECTS = [
  'Física',
  'Química',
  'Biología',
  'Religión',
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
