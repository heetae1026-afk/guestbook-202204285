import { test as base, expect, type Locator, type Page } from "@playwright/test";

type Created = { name: string; password: string };

export class Guestbook {
  readonly tag = `E2E${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2, 5)}`;
  private created: Created[] = [];

  constructor(readonly page: Page) {}

  get writeForm(): Locator {
    return this.page.locator("form").first();
  }

  /** A name that is unique to this test, so tests only ever touch their own entries. */
  name(suffix: string): string {
    const name = `${this.tag}-${suffix}`;
    if ([...name].length > 20) throw new Error(`Test name "${name}" exceeds the 20-character limit`);
    return name;
  }

  entry(name: string): Locator {
    return this.page.locator("li", { has: this.page.getByText(name, { exact: true }) });
  }

  async fillWriteForm(fields: { name?: string; message?: string; password?: string }) {
    if (fields.name !== undefined) await this.writeForm.getByLabel("이름").fill(fields.name);
    if (fields.password !== undefined) await this.writeForm.getByLabel("글 비밀번호").fill(fields.password);
    if (fields.message !== undefined) await this.writeForm.getByLabel("메시지").fill(fields.message);
  }

  /** Leaves an entry through the write form and waits for it to appear in the list. */
  async write(name: string, message: string, password: string) {
    await this.fillWriteForm({ name, message, password });
    await this.writeForm.getByRole("button", { name: "남기기" }).click();
    await expect(this.entry(name)).toBeVisible();
    this.created.push({ name, password });
  }

  /**
   * Strips the browser's own checks (required, length limits) from the forms inside `scope`,
   * so submissions reach the server as-is and the server's rules are what gets tested.
   */
  async disableBrowserValidation(scope: Locator = this.page.locator("body")) {
    await scope.evaluate((root) => {
      for (const form of root.querySelectorAll("form")) form.noValidate = true;
      for (const el of root.querySelectorAll("input, textarea")) {
        el.removeAttribute("required");
        el.removeAttribute("minlength");
        el.removeAttribute("maxlength");
      }
    });
  }

  /** Records an entry created some other way so cleanup still removes it. */
  track(name: string, password: string) {
    this.created.push({ name, password });
  }

  async submitEdit(name: string, message: string, password: string) {
    const entry = this.entry(name);
    await entry.getByRole("button", { name: "수정", exact: true }).click();
    await entry.getByLabel("메시지").fill(message);
    await entry.getByLabel("글 비밀번호").fill(password);
    await entry.getByRole("button", { name: "수정 저장" }).click();
  }

  async submitDelete(name: string, password: string) {
    const entry = this.entry(name);
    await entry.getByRole("button", { name: "삭제", exact: true }).click();
    await entry.getByLabel("글 비밀번호").fill(password);
    await entry.getByRole("button", { name: "삭제 확인" }).click();
  }

  /** Deletes, through the UI, every entry this test created that still exists. */
  async cleanup() {
    await this.page.goto("/");
    for (const { name, password } of this.created) {
      if ((await this.entry(name).count()) === 0) continue;
      await this.submitDelete(name, password);
      await expect(this.entry(name)).toHaveCount(0);
    }
  }
}

export const test = base.extend<{ guestbook: Guestbook }>({
  guestbook: async ({ page }, provide) => {
    const guestbook = new Guestbook(page);
    await page.goto("/");
    await provide(guestbook);
    await guestbook.cleanup();
  },
});

export { expect };
