import type { Access, CollectionConfig, Config, Field, FieldAccess, GlobalConfig, Plugin, Where } from 'payload'

import { istLeser, nurLeser } from './roles'
import { rechteLaden, schalter, SCHALTER } from './rollenRechte'

/**
 * Rolle „Nur ansehen“ (lesen): darf in der Verwaltung alles LESEN, aber nichts anlegen, ändern oder löschen.
 *
 * Statt jeden Bereich einzeln anzupassen, legt dieses Plugin eine Hülle um die Zugriffsregeln aller Bereiche
 * (auch die von Plugins) – neue Bereiche sind damit automatisch abgedeckt:
 * - Lesen: zusätzlich erlaubt (Bereich, Versionen/Entwürfe, Felder mit eigener Leseregel, Seitenleiste).
 *   Sensible Bereiche hängen an Haken unter „Rollen-Rechte → Nur ansehen“ (ab Werk an).
 * - Schreiben: wer NUR „Nur ansehen“ hat (keine weitere Rolle, keine Einzelrechte), wird überall abgewiesen –
 *   auch wenn die ursprüngliche Regel es erlauben würde. Ausnahmen: das eigene Benutzerkonto (Name, Passwort …) und
 *   „Hat dir das geholfen?“ in der Hilfe.
 *
 * Nie lesbar (auch nicht mit Haken): Pass-Unterlagen (Ausweise, Kinderfotos), Sicherheits-Einstellungen (nur so weit
 * wie für alle Verwaltungs-Zugänge – z. B. die Zeit bis zum automatischen Abmelden),
 * Zwei-Faktor-Geheimnisse und Bestätigungs-Codes, der Papierkorb (dafür sorgt zweistufigerPapierkorb, weil
 * diese Rolle nichts löschen darf). Datensicherung, Exporte und Auskunft laufen über eigene Endpunkte, die die
 * Rolle nicht freigeben.
 *
 * Muss VOR zweistufigerPapierkorb laufen, damit dessen Papierkorb-Filter auch für diese Rolle gilt.
 */

type LeseHaken = (typeof SCHALTER)['lesen'][number]['key']

/** Bereich → Haken (fehlt der Bereich hier, sieht die Rolle ihn immer) */
const BEREICH_HAKEN: Record<string, LeseHaken> = {
  kontaktanfragen: 'posteingang',
  probetraining: 'posteingang',
  'form-submissions': 'posteingang',
  passantraege: 'passantraege',
  mitgliedsantraege: 'mitgliedsantraege',
  mitgliedschaften: 'mitgliedschaften',
  users: 'benutzer',
  profilbilder: 'benutzer',
  statistik: 'statistik',
}

/** Bereiche und Einstellungen, die die Rolle nie sieht */
export const NIE_BEREICHE = new Set(['passdokumente'])
export const NIE_GLOBALS = new Set(['sicherheit'])

/** Felder, die niemand über die Schnittstelle liest – bleiben auch für diese Rolle zu */
const GEHEIME_FELDER = new Set([
  'zweiFaktorGeheimnis',
  'zweiFaktorCodes',
  'zweiFaktorSitzungen',
  'zweiFaktorLetzterSchritt',
  'zweiFaktorFehler',
  'zweiFaktorFehlerSeit',
  'zweiFaktorEinrichtungSeit',
  'bestaetigungHash',
  'bestaetigungBis',
  'googleId',
])

/** Felder, die zusätzlich den Haken „Bankdaten“ brauchen */
const BANK_FELDER: Record<string, Set<string>> = { mitgliedsantraege: new Set(['iban', 'kontoinhaber', 'sepaMandat']) }

/** Haken gesetzt? (synchron, nutzt den zuletzt geladenen Stand) */
const hakenAn = (k: LeseHaken) => schalter('lesen', k)

/** Darf die Rolle diesen Bereich sehen? (ohne Laden – für Seitenleiste und Bedingungen) */
export const leserSiehtBereich = (user: unknown, slug: string): boolean => {
  if (!istLeser(user) || NIE_BEREICHE.has(slug)) return false
  const h = BEREICH_HAKEN[slug]
  return h ? hakenAn(h) : true
}

/** Darf die Rolle diesen Bereich sehen? (lädt vorher den aktuellen Stand der Haken) */
export const leserDarf = async (req: { user: unknown; payload: Parameters<typeof rechteLaden>[0] }, slug: string): Promise<boolean> => {
  if (!istLeser(req.user)) return false
  await rechteLaden(req.payload)
  return leserSiehtBereich(req.user, slug)
}

/** Einzelner Haken für eigene Ansichten/Endpunkte (z. B. „benutzer“ für die Registrierungen) */
export const leserHaken = async (req: { user: unknown; payload: Parameters<typeof rechteLaden>[0] }, k: LeseHaken): Promise<boolean> => {
  if (!istLeser(req.user)) return false
  await rechteLaden(req.payload)
  return hakenAn(k)
}

/** Lesen: erst die ursprüngliche Regel; reicht sie nicht, darf die Rolle trotzdem alles (Papierkorb filtert später) */
const lesen =
  (slug: string, orig: Access | undefined, standard: boolean): Access =>
  async (args) => {
    const r = orig ? await orig(args) : standard ? Boolean(args.req.user) : false
    if (r === true) return r
    return (await leserDarf(args.req, slug)) ? true : r
  }

/** Versionen/Entwürfe: wie Lesen – aber keine Versionen gelöschter Einträge */
const versionenLesen =
  (slug: string, orig: Access | undefined, mitPapierkorb: boolean): Access =>
  async (args) => {
    const r = orig ? await orig(args) : Boolean(args.req.user)
    if (r === true) return r
    if (!(await leserDarf(args.req, slug))) return r
    return mitPapierkorb ? ({ 'version.deletedAt': { exists: false } } as Where) : true
  }

/** Schreiben: reine „Nur ansehen“-Konten nie (eigenes Konto ausgenommen) */
const nichtFuerLeser =
  (orig: Access | undefined, eigenesKonto = false): Access =>
  async (args) => {
    if (nurLeser(args.req.user) && !eigenesKonto) return false
    return orig ? orig(args) : Boolean(args.req.user)
  }

/** Feld mit eigener Leseregel: für die Rolle zusätzlich lesbar (außer Geheimes; Bankdaten nur mit Haken) */
const feldLesen =
  (slug: string, name: string, orig: FieldAccess): FieldAccess =>
  async (args) => {
    if (await orig(args)) return true
    if (!(await leserDarf(args.req, slug))) return false
    return BANK_FELDER[slug]?.has(name) ? hakenAn('bankdaten') : true
  }

/** Alle Felder (auch in Reitern, Gruppen, Listen, Blöcken) durchgehen */
const felderOeffnen = (slug: string, fields: Field[]): Field[] =>
  fields.map((f) => {
    let neu = f as Field & { access?: { read?: FieldAccess }; name?: string; fields?: Field[]; tabs?: { fields: Field[] }[]; blocks?: { fields: Field[] }[] }
    if (neu.access?.read && neu.name && !GEHEIME_FELDER.has(neu.name)) {
      neu = { ...neu, access: { ...neu.access, read: feldLesen(slug, neu.name, neu.access.read) } } as typeof neu
    }
    if (Array.isArray(neu.fields)) neu = { ...neu, fields: felderOeffnen(slug, neu.fields) } as typeof neu
    if (Array.isArray(neu.tabs)) neu = { ...neu, tabs: neu.tabs.map((t) => ({ ...t, fields: felderOeffnen(slug, t.fields) })) } as typeof neu
    if (Array.isArray(neu.blocks)) neu = { ...neu, blocks: neu.blocks.map((b) => ({ ...b, fields: felderOeffnen(slug, b.fields) })) } as typeof neu
    return neu as Field
  })

/** Seitenleiste: Bereiche, die sonst nur bestimmte Rollen sehen, auch für diese Rolle zeigen */
const sichtbar = (slug: string, hidden: unknown) =>
  typeof hidden === 'function' ? ({ user }: { user: unknown }) => (leserSiehtBereich(user, slug) ? false : (hidden as (a: { user: unknown }) => boolean)({ user })) : hidden

const bereich = (c: CollectionConfig): CollectionConfig => {
  if (NIE_BEREICHE.has(c.slug)) {
    // Nie lesbar – aber Schreiben trotzdem sperren (z. B. Hochladen in fremde Bereiche)
    return { ...c, access: { ...c.access, create: nichtFuerLeser(c.access?.create), update: nichtFuerLeser(c.access?.update), delete: nichtFuerLeser(c.access?.delete) } }
  }
  const a = c.access ?? {}
  return {
    ...c,
    access: {
      ...a,
      read: lesen(c.slug, a.read, true),
      ...(c.versions ? { readVersions: versionenLesen(c.slug, a.readVersions, Boolean(c.trash)) } : {}),
      // Einzige Ausnahme: „Hat dir das geholfen?“ in der Hilfe (Rückmeldung an die Admins, ändert nichts an der Website)
      create: c.slug === 'hilfe-feedback' ? a.create : nichtFuerLeser(a.create),
      // Eigenes Konto: Name, Passwort, Benachrichtigungen – die Feldregeln der Benutzer bleiben unverändert
      update: nichtFuerLeser(a.update, c.slug === 'users'),
      delete: nichtFuerLeser(a.delete),
      ...(a.unlock ? { unlock: nichtFuerLeser(a.unlock) } : {}),
    },
    admin: { ...c.admin, hidden: sichtbar(c.slug, c.admin?.hidden) as never },
    fields: felderOeffnen(c.slug, c.fields),
  }
}

/** Einstellungen (Globals): lesen ja, speichern nie */
const einstellung = (g: GlobalConfig): GlobalConfig => {
  const a = g.access ?? {}
  if (NIE_GLOBALS.has(g.slug)) return { ...g, access: { ...a, update: nichtFuerLeser(a.update) } }
  return {
    ...g,
    access: {
      ...a,
      read: lesen(g.slug, a.read, true),
      ...(g.versions ? { readVersions: versionenLesen(g.slug, a.readVersions, false) } : {}),
      update: nichtFuerLeser(a.update),
    },
    admin: { ...g.admin, hidden: sichtbar(g.slug, g.admin?.hidden) as never },
    fields: felderOeffnen(g.slug, g.fields),
  }
}

export const nurAnsehen: Plugin = (config: Config): Config => ({
  ...config,
  collections: (config.collections ?? []).map(bereich),
  globals: (config.globals ?? []).map(einstellung),
})
