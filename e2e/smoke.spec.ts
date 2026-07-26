import { expect, test } from '@playwright/test'

/**
 * End-to-end coverage of the paths that must never break: the app boots,
 * navigation works, the analyzer produces real findings, and the language and
 * theme switches take effect.
 */

test('boots and renders the hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('#pg-boot')).toHaveCount(0)
})

test('navigates between primary pages', async ({ page }) => {
  await page.goto('/')

  await page
    .getByRole('navigation', { name: 'Primary' })
    .first()
    .getByRole('link', { name: /lab/i })
    .click()
  await expect(page).toHaveURL(/\/lab$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/lab/i)

  await page
    .getByRole('navigation', { name: 'Primary' })
    .first()
    .getByRole('link', { name: /patterns/i })
    .click()
  await expect(page).toHaveURL(/\/patterns$/)
})

test('a deep link resolves directly', async ({ page }) => {
  await page.goto('/models')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('an unknown path shows the not-found screen, not a crash', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: /go home|на главную/i })).toBeVisible()
})

test('the analyzer finds real problems in a weak prompt', async ({ page }) => {
  await page.goto('/lab')

  const editor = page.getByRole('textbox', { name: /prompt lab/i })
  await editor.fill('Please improve this text and make it more professional and engaging. Thanks!')

  // The findings panel is keyed off the analysis, which runs on a deferred
  // value — so wait for the assertion rather than the input.
  await expect(page.getByText(/findings/i).first()).toBeVisible()
  await expect(
    page.getByRole('button', { name: /quality words|the verb does not/i }).first(),
  ).toBeVisible()
})

test('a well-formed prompt scores higher than a vague one', async ({ page }) => {
  await page.goto('/lab')
  const score = page.getByTestId('score')

  await page.getByRole('button', { name: /a vague prompt/i }).click()
  await expect(score).not.toHaveText('0')
  const vague = Number(await score.textContent())

  await page.getByRole('button', { name: /a well-formed prompt/i }).click()
  // The analysis runs on a deferred value, so wait for the number to settle
  // rather than reading it on the next tick.
  await expect(score).not.toHaveText(String(vague))
  const good = Number(await score.textContent())

  expect(good).toBeGreaterThan(vague)
})

test('the language switch changes the interface', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /language|язык/i }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('the theme switch cycles system, light, dark', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('button', { name: /theme|тема/i })

  // Starting from "system" the resolved attribute may already match the OS
  // preference, so one click proves nothing. Two clicks always land on dark.
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('the command palette opens on the keyboard shortcut', async ({ page }) => {
  await page.goto('/')
  // The shortcut is bound in an effect, so wait for the shell to be mounted —
  // a key press sent before that is genuinely lost, in a test as in life.
  await expect(page.getByRole('button', { name: /search|поиск/i })).toBeVisible()

  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('the command palette finds a lesson and navigates to it', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /search|поиск/i })).toBeVisible()

  await page.getByRole('button', { name: /search|поиск/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByRole('textbox').fill('lab')
  await dialog.getByRole('button', { name: /lab/i }).first().click()
  await expect(page).toHaveURL(/\/lab$/)
})

test('the app runs clean under its own CSP', async ({ page }) => {
  // The policy is emitted at build time, so a violation only ever shows up in
  // a built app — which is exactly what this suite runs against. Two features
  // the policy could plausibly break: the blob download used by the progress
  // export, and service-worker registration.
  const violations: string[] = []
  page.on('console', (message) => {
    if (/Content Security Policy|Refused to/i.test(message.text())) violations.push(message.text())
  })
  page.on('pageerror', (error) => violations.push(`pageerror: ${error.message}`))

  await page.goto('/progress')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /export|выгрузить/i }).click()
  expect((await download).suggestedFilename()).toBe('prompt-god-progress.json')

  await page.goto('/')
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length)),
    )
    .toBeGreaterThan(0)

  expect(violations).toEqual([])
})

test('the manifest is served and installable-shaped', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()

  const response = await request.get(href!)
  expect(response.ok()).toBe(true)

  const manifest = (await response.json()) as {
    name?: string
    start_url?: string
    display?: string
    icons?: { sizes?: string }[]
  }
  expect(manifest.name).toBeTruthy()
  expect(manifest.start_url).toBeTruthy()
  expect(manifest.display).toBeTruthy()

  const sizes = (manifest.icons ?? []).map((icon) => icon.sizes)
  expect(sizes).toContain('192x192')
  expect(sizes).toContain('512x512')
})
