const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/login.html");
});

test("an empty login reports both fields and focuses the identifier", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Access Account" }).click();

  await expect(page.locator("#identifier-error")).toContainText(
    "Enter your callsign or email."
  );
  await expect(page.locator("#login-password-error")).toContainText(
    "Enter your password."
  );
  await expect(page.locator("#identifier")).toBeFocused();
  await expect(page.locator("#form-status")).toHaveText(
    "2 fields need attention"
  );
});

test("an invalid callsign is rejected", async ({ page }) => {
  await page.locator("#identifier").fill("Bad Callsign!");
  await page.locator("#login-password").fill("anything");
  await page.getByRole("button", { name: "Access Account" }).click();

  await expect(page.locator("#identifier-error")).toContainText(
    "3–20 characters"
  );
});

test("the Caps Lock warning follows the modifier state", async ({ page }) => {
  const warning = page.locator("#login-password-caps-warning");

  await expect(warning).toBeHidden();

  await page.evaluate(() => {
    document.getElementById("login-password").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "A",
        modifierCapsLock: true,
        bubbles: true,
      })
    );
  });

  await expect(warning).toBeVisible();
  await expect(warning).toHaveText("Caps Lock is on");
});

test("a valid login shows Access granted and updates the session", async ({
  page,
}) => {
  await page.locator("#identifier").fill("Vortex_07");
  await page.locator("#login-password").fill("Neoncore99!");
  await page.getByRole("button", { name: "Access Account" }).click();

  await expect(page.locator("#login-label")).toHaveText("Authenticating");
  await expect(page.locator("#login-button")).toHaveAttribute(
    "aria-busy",
    "true"
  );
  await expect(page.locator("#identifier")).toBeDisabled();

  await expect(page.locator("#success-message")).toBeVisible();
  await expect(page.locator("#success-heading")).toBeFocused();
  await expect(page.locator("#success-heading")).toHaveText("Access granted");
  await expect(page.locator("#session-status")).toHaveText("Online");
});

test("the login layout never scrolls horizontally at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });

  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
  );

  expect(hasOverflow).toBe(false);
});
