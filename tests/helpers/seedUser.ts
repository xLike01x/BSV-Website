import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

// Testkonto (nur lokal anmeldbar, ohne Zwei-Faktor) – nie ein schwaches Admin-Konto in einer echten Datenbank
export const testUser = {
  email: 'e2e-admin@bsv.test',
  password: 'BSV-Test-2026!',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Testkonten nie in Produktion anlegen.')
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: { ...testUser, name: 'Test Admin (E2E)', roles: ['admin'], testkonto: true } as never,
    // Festes Testpasswort: nur Länge/Zeichenarten prüfen (wie bei der Testkonten-Anlage)
    context: { bsvTestkonto: true },
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
