import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Meldet ein (lokales Test-)Konto über die Anmeldeseite der Website an und öffnet die Verwaltung.
 * Testkonten brauchen lokal keine Zwei-Faktor-Anmeldung.
 */
export async function login({ page, serverURL = 'http://localhost:3000', user }: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/login?weiter=/admin`)
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="passwort"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${serverURL}/admin`, { timeout: 120_000 })
  await expect(page.locator('.bsv-dash__kopf')).toBeVisible({ timeout: 120_000 })
}
