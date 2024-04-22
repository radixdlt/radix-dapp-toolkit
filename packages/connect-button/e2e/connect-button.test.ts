import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('renders "Connect" text by default', async ({ page }) => {
  await expect(page.getByText('Connect')).toBeVisible()
})

test('toggles popover on button click', async ({ page }) => {
  page.locator('radix-connect-button').click()

  const popover = page.locator('radix-popover')

  await expect(popover.getByText('Connect your Radix Wallet')).toBeVisible()
  await expect(popover.getByText('Connect Now')).toBeVisible()

  page.locator('radix-connect-button').click()

  await expect(page.locator('radix-popover')).not.toBeVisible()
})

test('renders indicator in loading state', async ({ page }) => {
  await page.evaluate(() =>
    window.radixConnectButtonApi.setState({ loading: true }),
  )
  await expect(page.locator('loading-spinner')).toBeVisible()
})

test('renders "Connected" text in connected state', async ({ page }) => {
  await page.evaluate(() =>
    window.radixConnectButtonApi.setState({ connected: true }),
  )
  await expect(page.getByText('Connected')).toBeVisible()
})

test('renders text & indicator in connected loading state', async ({
  page,
}) => {
  await page.evaluate(() =>
    window.radixConnectButtonApi.setState({ connected: true, loading: true }),
  )
  await expect(page.locator('loading-spinner')).toBeVisible()
  await expect(page.getByText('Connected')).toBeVisible()
})

test('saves most recent state to local storage', async ({ page }) => {
  await page.evaluate(() =>
    window.radixConnectButtonApi.setState({ connected: true }),
  )
  const localStorage = await page.evaluate(() => window.localStorage)
  expect(localStorage['radixdlt.connected']).toBe('true')
})
