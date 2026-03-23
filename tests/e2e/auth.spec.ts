import { test, expect } from '@playwright/test'

// Email unica per ogni run — evita conflitti con utenti già registrati
const testEmail = `test+${Date.now()}@mailinator.com`
const testPassword = 'TestPassword123!'
const testUsername = `tester${Date.now()}`.slice(0, 20)

// ---------------------------------------------------------------------------
// REGISTRAZIONE
// ---------------------------------------------------------------------------

test.describe('Registrazione email', () => {
  test('la pagina di registrazione si carica correttamente', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveTitle(/Gamexchange/)
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByLabel('City')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
  })

  test('validazione client: mostra errori se il form è incompleto', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: 'Create account' }).click()
    // Almeno uno dei messaggi di errore deve comparire
    await expect(page.locator('text=required').or(page.locator('text=characters').or(page.locator('[role=alert]')))).toBeVisible()
  })

  test('validazione: username troppo corto', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Username').fill('ab')
    await page.getByLabel('Email').fill('x@x.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByLabel('City').fill('Roma')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.locator('text=Minimum 3')).toBeVisible()
  })

  test('registrazione completa con email → redirect a /onboarding', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Username').fill(testUsername)
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByLabel('City').fill('Roma')

    // Seleziona il paese dalla dropdown
    await page.getByRole('combobox').selectOption('IT')

    await page.getByRole('button', { name: 'Create account' }).click()

    // Dopo la registrazione deve andare su /onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 })
  })

  test('registrazione con email già esistente → mostra errore', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Username').fill(`user${Date.now()}`.slice(0, 20))
    await page.getByLabel('Email').fill(testEmail) // stessa email del test precedente
    await page.getByLabel('Password').fill(testPassword)
    await page.getByLabel('City').fill('Milano')
    await page.getByRole('combobox').selectOption('IT')

    await page.getByRole('button', { name: 'Create account' }).click()

    // Deve mostrare un toast/messaggio di errore
    await expect(
      page.locator('[role=alert]').or(page.locator('text=already').or(page.locator('text=exists')))
    ).toBeVisible({ timeout: 8_000 })
  })
})

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------

test.describe('Login email', () => {
  test('la pagina di login si carica correttamente', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
  })

  test('login con credenziali errate → mostra errore', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('fake@fake.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(
      page.locator('[role=alert]').or(page.locator('text=Invalid').or(page.locator('text=incorrect')))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('login corretto → redirect a /feed', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/feed/, { timeout: 10_000 })
  })

  test('utente loggato accede a /login → redirect a /feed', async ({ page }) => {
    // Prima fa il login
    await page.goto('/login')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/feed/, { timeout: 10_000 })

    // Poi prova ad andare su /login di nuovo
    await page.goto('/login')
    await expect(page).toHaveURL(/\/feed/, { timeout: 5_000 })
  })
})

// ---------------------------------------------------------------------------
// PROTEZIONE ROTTE
// ---------------------------------------------------------------------------

test.describe('Protezione rotte', () => {
  test('utente non loggato su /feed → redirect a /login', async ({ page }) => {
    await page.goto('/feed')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })

  test('utente non loggato su /library → redirect a /login', async ({ page }) => {
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })

  test('utente non loggato su /settings → redirect a /login', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })
})

// ---------------------------------------------------------------------------
// GOOGLE OAUTH (solo verifica redirect — non completa il flow)
// ---------------------------------------------------------------------------

test.describe('Google OAuth', () => {
  test('click su "Continue with Google" nel login → redirect verso accounts.google.com', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /Google/ }).click()
    // Dopo il click deve essere reindirizzato a Google (o a Neon Auth che poi va a Google)
    await expect(page).toHaveURL(/google\.com|accounts\.google/, { timeout: 10_000 })
  })
})
