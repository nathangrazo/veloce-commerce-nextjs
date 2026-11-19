import { expect, test } from "@playwright/test";

test("guest adds item, applies coupon, signs in with cart merge, and completes checkout", async ({
  page,
}) => {
  await page.goto("/");

  // 1. Add product to cart from storefront
  await page.getByRole("button", { name: "Add Aero Knit Runner to bag" }).click();
  await expect(page.getByTestId("cart-badge")).toHaveText("1");

  // 2. Open cart drawer and go to /cart
  await page.getByRole("button", { name: /Open shopping bag/ }).click();
  await page.getByRole("link", { name: "View Cart" }).click();
  await expect(page).toHaveURL(/\/cart$/);

  // 3. Apply WELCOME10 coupon ($145 - 10% = $130.50 + $18 shipping = $148.50)
  await page.getByLabel("Promo code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("-$14.50")).toBeVisible();
  await expect(page.getByText("$148.50")).toBeVisible();

  // 4. Proceed to checkout -> prompted to sign in
  await page.getByRole("link", { name: "Proceed to Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole("link", { name: "Continue to Sign In" }).click();
  await expect(page).toHaveURL(/\/login\?next=(\/|%2F)checkout/);

  // 5. Sign in using demo account and verify redirect + merged cart
  await page.getByRole("button", { name: "Auto-fill" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByLabel("Full name")).toHaveValue("Alex Morgan");
  await expect(page.getByText("Aero Knit Runner", { exact: true })).toBeVisible();

  // 6. Place order and verify confirmation + persisted order history
  await page.getByRole("button", { name: "Complete Order" }).click();
  await expect(page.getByText(/Order Confirmed · VLC-/)).toBeVisible();
  await expect(page.getByTestId("cart-badge")).toHaveText("0");

  await page.getByRole("link", { name: "View Order History" }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByText(/VLC-[A-F0-9]{6}/).first()).toBeVisible();
});
