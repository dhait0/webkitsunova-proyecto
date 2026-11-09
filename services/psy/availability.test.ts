import { describe, expect, it } from 'vitest';
import { fitsAvailability, localWeekdayAndMinutes } from './availability';
import { hhmmToMinutes } from './shared';

// 2026-01-15 es jueves.
const thursdayMorning = [{ weekday: 4, startMinutes: 9 * 60, endMinutes: 12 * 60 }];

describe('localWeekdayAndMinutes', () => {
  it('convierte el instante a la zona indicada, cambiando de día si hace falta', () => {
    // 03:00Z del viernes son las 22:00 del jueves en Bogotá.
    expect(localWeekdayAndMinutes(new Date('2026-01-16T03:00:00Z'), 'America/Bogota')).toEqual({
      weekday: 4,
      minutes: 22 * 60,
    });
  });

  it('usa la zona por defecto si la indicada no es válida', () => {
    expect(localWeekdayAndMinutes(new Date('2026-01-15T14:00:00Z'), 'No/Existe').minutes).toBe(
      9 * 60,
    );
  });
});

describe('fitsAvailability', () => {
  it('acepta una sesión dentro de la franja', () => {
    expect(fitsAvailability(thursdayMorning, new Date('2026-01-15T15:00:00Z'), 60, null)).toBe(
      true,
    );
  });

  it('rechaza otro día de la semana', () => {
    expect(fitsAvailability(thursdayMorning, new Date('2026-01-16T15:00:00Z'), 60, null)).toBe(
      false,
    );
  });

  it('interpreta las franjas en la zona del psicólogo, no en UTC', () => {
    const start = new Date('2026-01-15T09:00:00Z'); // 04:00 Bogotá, 10:00 Madrid
    expect(fitsAvailability(thursdayMorning, start, 60, 'America/Bogota')).toBe(false);
    expect(fitsAvailability(thursdayMorning, start, 60, 'Europe/Madrid')).toBe(true);
  });

  it('rechaza una sesión que cruza la medianoche', () => {
    const allDay = [{ weekday: 4, startMinutes: 0, endMinutes: 24 * 60 }];
    expect(fitsAvailability(allDay, new Date('2026-01-16T04:30:00Z'), 60, null)).toBe(false);
  });
});

describe('hhmmToMinutes', () => {
  it('convierte horas y minutos reales', () => {
    expect(hhmmToMinutes('09:00')).toBe(540);
    expect(hhmmToMinutes('17:30')).toBe(1050);
    expect(hhmmToMinutes('24:00')).toBe(1440);
  });

  it('rechaza formatos no válidos', () => {
    expect(() => hhmmToMinutes('9')).toThrow();
    expect(() => hhmmToMinutes('10:75')).toThrow();
    expect(() => hhmmToMinutes('25:00')).toThrow();
  });
});
