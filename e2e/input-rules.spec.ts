import { test, expect } from "./fixtures";

// Every case here bypasses the browser's own checks, so what's verified is the server's rule.

test.describe("작성 입력 규칙", () => {
  const rejected = [
    { case: "빈 이름", name: "", message: "메시지", password: "pass-1234", notice: "이름을 입력해 주세요." },
    { case: "공백만 입력한 이름", name: "   ", message: "메시지", password: "pass-1234", notice: "이름을 입력해 주세요." },
    { case: "빈 메시지", name: "@name", message: "", password: "pass-1234", notice: "메시지를 입력해 주세요." },
    { case: "공백만 입력한 메시지", name: "@name", message: " \n\t ", password: "pass-1234", notice: "메시지를 입력해 주세요." },
    { case: "21자 이름", name: "가".repeat(21), message: "메시지", password: "pass-1234", notice: "이름은 20자 이하로 입력해 주세요." },
    { case: "501자 메시지", name: "@name", message: "가".repeat(501), password: "pass-1234", notice: "메시지는 500자 이하로 입력해 주세요." },
    { case: "3자 글 비밀번호", name: "@name", message: "메시지", password: "abc", notice: "글 비밀번호는 4–64자로 입력해 주세요." },
  ];

  for (const c of rejected) {
    test(`거부된다: ${c.case} (입력 내용 유지, 방명록 글 생성 안 됨)`, async ({ guestbook, page }) => {
      const name = c.name === "@name" ? guestbook.name("거부") : c.name;
      const message = c.message === "메시지" ? `${guestbook.tag} 메시지` : c.message;
      await guestbook.disableBrowserValidation(guestbook.writeForm);

      await guestbook.fillWriteForm({ name, message, password: c.password });
      await guestbook.writeForm.getByRole("button", { name: "남기기" }).click();

      await expect(guestbook.writeForm.getByRole("alert")).toHaveText(c.notice);
      await expect(guestbook.writeForm.getByLabel("이름")).toHaveValue(name.trim());
      await expect(guestbook.writeForm.getByLabel("메시지")).toHaveValue(message.trim());

      await page.reload();
      await expect(guestbook.writeForm).toBeVisible();
      await expect(page.getByText(guestbook.tag)).toHaveCount(0);
    });
  }

  test("이모지가 섞여도 문자 단위로 세어 20자 이름과 500자 메시지는 받아들여진다", async ({ guestbook, page }) => {
    // 20 characters but 28 UTF-16 units: fails if length is counted in UTF-16 units.
    const name = `${guestbook.tag}-${"😀".repeat(8)}`;
    expect([...name]).toHaveLength(20);
    const message = "🎉".repeat(500);
    await guestbook.disableBrowserValidation(guestbook.writeForm);

    await guestbook.write(name, message, "pass-1234");

    await page.reload();
    await expect(guestbook.entry(name).locator("p")).toHaveText(message);
  });
});

test.describe("수정 입력 규칙", () => {
  const rejected = [
    { case: "빈 메시지", message: "", notice: "메시지를 입력해 주세요." },
    { case: "501자 메시지", message: "가".repeat(501), notice: "메시지는 500자 이하로 입력해 주세요." },
  ];

  for (const c of rejected) {
    test(`수정이 거부된다: ${c.case} (데이터 그대로)`, async ({ guestbook, page }) => {
      const name = guestbook.name("수정");
      await guestbook.write(name, "원래 메시지", "pass-1234");

      const entry = guestbook.entry(name);
      await entry.getByRole("button", { name: "수정", exact: true }).click();
      await guestbook.disableBrowserValidation(entry);
      await entry.getByLabel("메시지").fill(c.message);
      await entry.getByLabel("글 비밀번호").fill("pass-1234");
      await entry.getByRole("button", { name: "수정 저장" }).click();

      await expect(entry.getByRole("alert")).toHaveText(c.notice);

      await page.reload();
      await expect(guestbook.entry(name).locator("p")).toHaveText("원래 메시지");
      await expect(guestbook.entry(name)).not.toContainText("(수정됨)");
    });
  }
});
