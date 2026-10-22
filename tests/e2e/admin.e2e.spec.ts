import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

// Die Verwaltung baut sich im Entwicklungsmodus beim ersten Aufruf erst auf – großzügige Zeitgrenzen
test.setTimeout(240_000)

test.describe('Verwaltung', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(300_000)
    await seedTestUser()
    page = await (await browser.newContext()).newPage()
    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('Dashboard begrüßt mit Namen', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page.locator('.bsv-dash__kopf')).toContainText('Hallo')
  })

  test('Benutzerliste öffnet sich', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page.locator('h1', { hasText: 'Benutzer' }).first()).toBeVisible({ timeout: 120_000 })
  })

  test('Neue Seite anlegen zeigt das Titelfeld', async () => {
    await page.goto('http://localhost:3000/admin/collections/pages/create')
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 120_000 })
  })

  test('Impressum und Datenschutz lassen sich im Editor öffnen', async () => {
    for (const slug of ['impressum', 'datenschutz']) {
      const antwort = await page.request.get(`http://localhost:3000/api/pages?where[slug][equals]=${slug}&limit=1&depth=0`)
      const seite = (await antwort.json()).docs?.[0]
      if (!seite) continue // Seite gibt es in dieser Datenbank nicht
      await page.goto(`http://localhost:3000/admin/collections/pages/${seite.id}`)
      await expect(page.locator('[data-lexical-editor="true"]').first()).toBeVisible({ timeout: 120_000 })
      await expect(page.getByText('parseEditorState')).toHaveCount(0)
    }
  })

  test('Neues Passwort zeigt die Regeln live an', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    const feld = page.locator('#field-password')
    await expect(feld).toBeVisible({ timeout: 120_000 })
    await feld.fill('Sommer2026!')
    await expect(page.getByText('zu leicht zu erraten').first()).toBeVisible()
    await feld.fill('Mein Hund frisst 3 Äpfel!')
    await expect(page.getByText('Passwort: stark')).toBeVisible()
  })
})
