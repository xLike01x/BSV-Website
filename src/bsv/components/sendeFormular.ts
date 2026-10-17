/** Schickt ein öffentliches Formular an die Payload-REST-API und übersetzt Fehler verständlich. */
export async function sendeFormular(url: string, daten: Record<string, unknown>): Promise<{ ok: true } | { ok: false; fehler: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(daten),
    })
    if (res.ok) return { ok: true }
    if (res.status === 429) return { ok: false, fehler: 'Zu viele Anfragen in kurzer Zeit. Bitte versuche es in ein paar Minuten erneut.' }
    const body = (await res.json().catch(() => null)) as { errors?: { message?: string; data?: { errors?: { message?: string }[] } }[] } | null
    const detail = body?.errors?.[0]?.data?.errors?.map((e) => e.message).filter(Boolean).join(' ')
    return { ok: false, fehler: detail || body?.errors?.[0]?.message || 'Das hat leider nicht geklappt. Bitte prüfe deine Angaben.' }
  } catch {
    return { ok: false, fehler: 'Keine Verbindung. Bitte prüfe deine Internetverbindung und versuche es erneut.' }
  }
}
