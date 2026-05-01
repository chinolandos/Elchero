/**
 * Helpers para calcular estadísticas de "racha" tipo Duolingo.
 *
 * Streak: días consecutivos hasta hoy (o ayer si hoy aún no hay actividad).
 * Weekly: minutos de estudio agrupados por día de semana actual.
 * Last30Days: array de 30 días con flag isActive para grid calendario.
 */

interface NoteRow {
  created_at: string;
  audio_duration_minutes?: number | null;
}

/**
 * Devuelve una key YYYY-MM-DD del Date dado en hora local.
 * Usamos esto para agrupar notas por día.
 */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calcula la racha actual: días consecutivos con al menos 1 nota creada,
 * contando desde HOY hacia atrás. Si hoy aún no hay actividad, la racha
 * cuenta desde ayer (no se "rompe" hasta dejar pasar 2 días sin actividad).
 */
export function calculateStreak(notes: NoteRow[]): number {
  if (notes.length === 0) return 0;

  // Set de días con actividad
  const activeDays = new Set<string>();
  for (const note of notes) {
    activeDays.add(dayKey(new Date(note.created_at)));
  }

  // Contar consecutivos desde hoy hacia atrás
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let dayPointer = new Date(today);

  // Si hoy no hay actividad, empezar desde ayer (gracia de 1 día)
  if (!activeDays.has(dayKey(dayPointer))) {
    dayPointer.setDate(dayPointer.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    if (activeDays.has(dayKey(dayPointer))) {
      streak++;
      dayPointer.setDate(dayPointer.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calcula la racha más larga histórica del usuario.
 * Ordena los días activos y busca la secuencia consecutiva más larga.
 */
export function calculateLongestStreak(notes: NoteRow[]): number {
  if (notes.length === 0) return 0;

  const activeDays = new Set<string>();
  for (const note of notes) {
    activeDays.add(dayKey(new Date(note.created_at)));
  }

  const sortedDays = Array.from(activeDays).sort(); // ISO order

  let longest = 1;
  let current = 1;
  let prev: Date | null = null;

  for (const k of sortedDays) {
    const [y, m, d] = k.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (prev) {
      const diff =
        (date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }
    prev = date;
  }

  return longest;
}

export interface DayBucket {
  label: string; // "L" / "M" / "X" / "J" / "V" / "S" / "D"
  date: Date;
  minutes: number;
  notesCount: number;
  isToday: boolean;
}

/**
 * Devuelve los 7 días de la semana actual (Lunes → Domingo) con sus
 * estadísticas. Usado para el bar chart "Esta semana".
 */
export function calculateThisWeek(notes: NoteRow[]): DayBucket[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lunes de esta semana (week-start es lunes en SV/Latam)
  const dayOfWeek = today.getDay(); // 0 = domingo
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const todayKey = dayKey(today);

  const buckets: DayBucket[] = labels.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      label,
      date,
      minutes: 0,
      notesCount: 0,
      isToday: dayKey(date) === todayKey,
    };
  });

  for (const note of notes) {
    const noteDate = new Date(note.created_at);
    const k = dayKey(noteDate);
    const bucket = buckets.find((b) => dayKey(b.date) === k);
    if (bucket) {
      bucket.minutes += note.audio_duration_minutes ?? 0;
      bucket.notesCount += 1;
    }
  }

  return buckets;
}

export interface CalendarDay {
  date: Date;
  isActive: boolean;
  isToday: boolean;
  notesCount: number;
}

/**
 * Devuelve los últimos N días (default 30) con flag isActive si hay nota
 * creada ese día. Usado para el grid calendario tipo Duolingo.
 */
export function calculateLastNDays(
  notes: NoteRow[],
  n: number = 30,
): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dayKey(today);

  // Map de día → cantidad de notas
  const daysMap = new Map<string, number>();
  for (const note of notes) {
    const k = dayKey(new Date(note.created_at));
    daysMap.set(k, (daysMap.get(k) ?? 0) + 1);
  }

  const result: CalendarDay[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const k = dayKey(date);
    const count = daysMap.get(k) ?? 0;
    result.push({
      date,
      isActive: count > 0,
      isToday: k === todayKey,
      notesCount: count,
    });
  }
  return result;
}

/** Total de minutos sumando audio_duration_minutes. Útil para "X horas". */
export function calculateTotalMinutes(notes: NoteRow[]): number {
  return notes.reduce((acc, n) => acc + (n.audio_duration_minutes ?? 0), 0);
}
