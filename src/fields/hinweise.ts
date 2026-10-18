import type { UIField } from 'payload'

/** Live-Hinweise beim Bearbeiten (siehe src/components/Admin/Hinweise). Speichert nichts. */
export const hinweisFeld = (komponente: string, seitenleiste = true): UIField => ({
  name: 'hinweise',
  type: 'ui',
  admin: {
    ...(seitenleiste ? { position: 'sidebar' as const } : {}),
    components: { Field: `@/components/Admin/Hinweise#${komponente}` },
  },
})
