/** Bausteine für die Sammlungs-Konfiguration: Status-Reiter über der Liste und farbige Status-Pillen */
type Reiter = { key: string; titel: string; symbol: string; status: string[] | null; hervorheben?: boolean }
type Farbe = { text: string; klasse: 'neu' | 'warten' | 'ok' | 'aus' }

export const statusReiter = (sammlung: string, reiter: Reiter[]) => ({ path: '@/components/Admin/StatusReiter', serverProps: { sammlung, reiter } })

export const statusPille = (farben: Record<string, Farbe>) => ({ Cell: { path: '@/components/Admin/StatusReiter/Pille', clientProps: { farben } } })
