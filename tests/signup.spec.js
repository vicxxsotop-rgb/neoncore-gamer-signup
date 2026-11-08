const { test, expect } = require("@playwright/test");

const validForm = {
  callsign: "Vortex_07",
  email: "vortex@example.com",
  password: "Neoncore99!",
  confirm: "Neoncore99!",
};

async function fillValidForm(page) {
  await page.locator("#callsign").fill(validForm.callsign);
  await page.locator("#email").fill(validForm.email);
  await page.locator("#password").fill(validForm.password);
  await page.locator("#confirm-password").fill(validForm.confirm);
  await page.locator("#terms").check();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("an empty submit reports every field and focuses the callsign", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Initialize Account" }).click();

  await expect(page.locator("#callsign-error")).toContainText(
    "Enter your callsign."
  );
  await expect(page.locator("#email-error")).toContainText("Enter your email.");
  await expect(page.locator("#password-error")).toContainText(
    "Enter a password."
  );
  await expect(page.locator("#confirm-password-error")).toContainText(
    "Confirm your password."
  );
  await expect(page.locator("#terms-error")).toContainText(
    "You must accept the terms"
  );
  await expect(page.locator("#callsign")).toBeFocused();
  await expect(page.locator("#form-status")).toHaveText(
    "5 fields need attention"
  );
});

test("invalid values show a specific message per field", async ({ page }) => {
  await page.locator("#callsign").fill("ab");
  await page.locator("#email").fill("not-an-email");
  await page.locator("#password").fill("short");
  await page.locator("#confirm-password").fill("different");
  await page.getByRole("button", { name: "Initialize Account" }).click();

  await expect(page.locator("#callsign-error")).toContainText(
    "3–20 characters"
  );
  await expect(page.locator("#email-error")).toContainText("valid email");
  await expect(page.locator("#password-error")).toContainText(
    "at least 8 characters"
  );
  await expect(page.locator("#confirm-password-error")).toContainText(
    "do not match"
  );
  await expect(page.locator("#terms-error")).toContainText(
    "accept the terms"
  );
});

test("an error clears as soon as the value is fixed", async ({ page }) => {
  await page.getByRole("button", { name: "Initialize Account" }).click();
  await expect(page.locator("#callsign-error")).toBeVisible();

  await page.locator("#callsign").fill(validForm.callsign);

  await expect(page.locator("#callsign-error")).toBeHidden();
  await expect(page.locator("#callsign")).not.toHaveAttribute(
    "aria-invalid",
    "true"
  );
});

test("the strength meter moves from Weak to Strong", async ({ page }) => {
  const password = page.locator("#password");
  const label = page.locator("#password-strength-label");

  await password.fill("abcdefg1");
  await expect(label).toHaveText("Fair");

  await password.fill("Abcdefg1");
  await expect(label).toHaveText("Good");

  await password.fill("Abcdefgh1234!");
  await expect(label).toHaveText("Strong");

  await password.fill("abc");
  await expect(label).toHaveText("Weak");
});

test("the show/hide button reveals the password and updates its label", async ({
  page,
}) => {
  const password = page.locator("#password");
  const toggle = page.locator('button[aria-controls="password"]');

  await password.fill("Neoncore99!");
  await expect(password).toHaveAttribute("type", "password");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();

  await expect(password).toHaveAttribute("type", "text");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAttribute("aria-label", "Hide password");

  await toggle.click();

  await expect(password).toHaveAttribute("type", "password");
});

test("the Caps Lock warning follows the modifier state", async ({ page }) => {
  const warning = page.locator("#password-caps-warning");

  await expect(warning).toBeHidden();

  await page.evaluate(() => {
    document.getElementById("password").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "A",
        modifierCapsLock: true,
        bubbles: true,
      })
    );
  });

  await expect(warning).toBeVisible();
  await expect(warning).toHaveText("Caps Lock is on");

  await page.evaluate(() => {
    document.getElementById("password").dispatchEvent(
      new KeyboardEvent("keyup", { key: "a", bubbles: true })
    );
  });

  await expect(warning).toBeHidden();
});

test("a valid submit shows the loading state, then the success panel", async ({
  page,
}) => {
  await fillValidForm(page);
  await page.getByRole("button", { name: "Initialize Account" }).click();

  await expect(page.locator("#submit-label")).toHaveText("Transmitting");
  await expect(page.locator("#submit-button")).toHaveAttribute(
    "aria-disabled",
    "true"
  );
  await expect(page.locator("#submit-button")).toHaveAttribute(
    "aria-busy",
    "true"
  );
  await expect(page.locator("#callsign")).toBeDisabled();

  await expect(page.locator("#success-message")).toBeVisible();
  await expect(page.locator("#form-view")).toBeHidden();
  await expect(page.locator("#success-heading")).toBeFocused();
});

test("the layout never scrolls horizontally at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
  );

  expect(hasOverflow).toBe(false);
});
