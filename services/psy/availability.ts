/** Zona horaria con la que se interpretan las franjas cuando el perfil no define una. */
export const DEFAULT_AVAILABILITY_TIMEZONE = 'America/Bogota';

export type AvailabilityWindow = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

const WEEKDAY_BY_SHORT_NAME: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Día (1 = lunes ... 7 = domingo) y minuto del día de un instante en `timeZone`. */
export function localWeekdayAndMinutes(
  instant: Date,
  timeZone: string,
): { weekday: number; minutes: number } {
  const zone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_AVAILABILITY_TIMEZONE;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(instant);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    weekday: WEEKDAY_BY_SHORT_NAME[get('weekday')] ?? 0,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/**
 * Indica si la sesión [startsAt, startsAt + duración) cabe entera dentro de una
 * franja semanal del psicólogo, interpretada en `timeZone`. Las sesiones que
 * cruzan la medianoche no caben en ninguna franja.
 */
export function fitsAvailability(
  windows: AvailabilityWindow[],
  startsAt: Date,
  durationMinutes: number,
  timeZone: string | null | undefined,
): boolean {
  const { weekday, minutes } = localWeekdayAndMinutes(
    startsAt,
    timeZone || DEFAULT_AVAILABILITY_TIMEZONE,
  );
  const end = minutes + durationMinutes;

  return windows.some(
    (w) => w.weekday === weekday && minutes >= w.startMinutes && end <= w.endMinutes,
  );
}
