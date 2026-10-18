import { expect, type Page } from "@playwright/test";

export const preview = (page: Page) => page.frameLocator('iframe[title="MLForm code preview"]');
export const editor = (page: Page) => page.getByRole("textbox", { name: "MLForm TypeScript code" });
export const menu = (page: Page) => page.getByRole("button", { name: "Playground options" });
export const ready = (page: Page) => expect(page.locator(".code-status")).toHaveText("Up to date");
export const edit = async (page: Page, code: string) => {
  await editor(page).focus();
  await editor(page).press("ControlOrMeta+a");
  await page.keyboard.insertText(code);
};
export const execute = async (page: Page, code: string) => {
  await edit(page, code);
  await page.getByRole("button", { name: "Rerun preview", exact: true }).click();
};
