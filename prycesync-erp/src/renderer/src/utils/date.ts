export function formatDateTimeAR(value?: string | Date): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '—'
  try {
    const fmt = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
    return fmt.format(date)
  } catch (_) {
    // Fallback simple dd/mm/yyyy hh:mm
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
}