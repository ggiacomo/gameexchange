import { test, expect } from '@playwright/test'

/**
 * Test diagnostico: intercetta le risposte di rete per capire
 * cosa ritorna il proxy /api/auth/* su Neon Auth.
 */
test.describe('Debug API auth', () => {
  test('sign-up/email: risposta raw del proxy + cookie check', async ({ page, context }) => {
    const responses: { url: string; status: number; body: string; setCookie: string | null }[] = []

    page.on('response', async (res) => {
      if (res.url().includes('/api/auth/')) {
        try {
          const body = await res.text()
          const setCookie = res.headers()['set-cookie'] ?? null
          responses.push({ url: res.url(), status: res.status(), body, setCookie })
        } catch { /* ignore */ }
      }
    })

    await page.goto('/register')
    await page.getByLabel('Username').fill(`dbg${Date.now()}`.slice(0, 20))
    await page.getByLabel('Email').fill(`dbg${Date.now()}@mailinator.com`)
    await page.getByLabel('Password').fill('TestPassword123!')
    await page.getByLabel('City').fill('Roma')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Italy' }).click()
    await page.getByRole('button', { name: 'Create account' }).click()

    // Aspetta che arrivi una risposta API
    await page.waitForTimeout(8000)

    console.log('=== RISPOSTE API AUTH ===')
    for (const r of responses) {
      console.log(`${r.status} ${r.url}`)
      console.log('Body:', r.body.slice(0, 300))
      console.log('Set-Cookie header:', r.setCookie)
    }

    // Cookie nel browser dopo signup
    const cookies = await context.cookies()
    const neonCookies = cookies.filter(c => c.name.includes('neon-auth'))
    console.log('=== COOKIE NEL BROWSER ===')
    console.log(JSON.stringify(neonCookies.map(c => ({ name: c.name, value: c.value.slice(0, 20) + '...', domain: c.domain, httpOnly: c.httpOnly })), null, 2))
    console.log('URL attuale:', page.url())

    // Chiama l'endpoint debug per vedere se getCurrentUser() funziona con i cookie del browser
    const sessionData = await page.evaluate(async () => {
      const res = await fetch('/api/debug-session', { method: 'POST' })
      return res.json()
    })
    console.log('=== RISULTATO getCurrentUser() SERVER-SIDE ===')
    console.log(JSON.stringify(sessionData, null, 2))

    // Il test non fallisce — serve solo per vedere i log
    expect(responses.length).toBeGreaterThan(0)
  })

  test('sign-in/email: risposta raw del proxy', async ({ page }) => {
    const responses: { url: string; status: number; body: string }[] = []

    page.on('response', async (res) => {
      if (res.url().includes('/api/auth/')) {
        try {
          const body = await res.text()
          responses.push({ url: res.url(), status: res.status(), body })
        } catch { /* ignore */ }
      }
    })

    await page.goto('/login')
    await page.getByLabel('Email').fill('fake@fake.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.waitForTimeout(5000)

    console.log('=== RISPOSTE API AUTH ===')
    for (const r of responses) {
      console.log(`${r.status} ${r.url}`)
      console.log('Body:', r.body.slice(0, 500))
    }

    expect(responses.length).toBeGreaterThan(0)
  })
})
