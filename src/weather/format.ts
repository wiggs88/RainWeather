const clockFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatClockTime(epochMs: number, timezone?: string): string {
  const key = timezone || 'local';
  let formatter = clockFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
    clockFormatters.set(key, formatter);
  }
  return formatter.format(epochMs);
}
