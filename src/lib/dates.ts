const LOCALE = 'de-DE';

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time} Uhr`;
}

export function formatDay(isoDate: string): string {
  // isoDate is YYYY-MM-DD; parse as local date to avoid timezone shifts
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/**
 * The Thursday (dinner night) users can currently sign up for, as YYYY-MM-DD.
 * Signups close Tuesday night because tables are matched on Wednesday,
 * so from Wednesday on the next week's dinner is open.
 */
export function nextDinnerDate(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let diff = (4 - d.getDay() + 7) % 7;
  if (diff < 2) diff += 7;
  d.setDate(d.getDate() + diff);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** This week's Thursday if signups for it are already closed (Wednesday/Thursday), otherwise null. */
export function lockedDinnerDate(now = new Date()): string | null {
  const open = nextDinnerDate(now);
  const [y, m, d] = open.split('-').map(Number);
  const locked = new Date(y, m - 1, d - 7);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (locked < today) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${locked.getFullYear()}-${pad(locked.getMonth() + 1)}-${pad(locked.getDate())}`;
}

export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}
