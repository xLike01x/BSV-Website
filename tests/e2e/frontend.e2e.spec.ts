import { test, expect } from '@playwright/test'

test.setTimeout(180_000)

test.describe('Website', () => {
  test('Startseite lädt', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Büdericher Spielverein/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('Registrierung zeigt die Passwortregeln beim Tippen', async ({ page }) => {
    await page.goto('http://localhost:3000/registrieren')
    await page.fill('input[name="name"]', 'Erika Musterfrau')
    await page.fill('input[name="passwort"]', 'Musterfrau!2027')
    await expect(page.getByText('Namen oder die E-Mail-Adresse')).toBeVisible()
    await page.fill('input[name="passwort"]', 'Mein Hund frisst 3 Äpfel!')
    await expect(page.getByText('Passwort: stark')).toBeVisible()
  })
})
