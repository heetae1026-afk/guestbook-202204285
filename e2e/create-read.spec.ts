import { test, expect } from "./fixtures";

test.describe("작성", () => {
  test("방명록 글을 남기면 목록에 나타나고 폼이 비워진다", async ({ guestbook, page }) => {
    const name = guestbook.name("작성");
    await guestbook.write(name, "안녕하세요", "pass-1234");

    await expect(guestbook.entry(name)).toContainText("안녕하세요");
    await expect(guestbook.writeForm.getByLabel("이름")).toHaveValue("");
    await expect(guestbook.writeForm.getByLabel("메시지")).toHaveValue("");
    await expect(guestbook.writeForm.getByLabel("글 비밀번호")).toHaveValue("");

    await page.reload();
    await expect(guestbook.entry(name)).toContainText("안녕하세요");
  });
});

test.describe("조회", () => {
  test("최신 방명록 글이 위에 보인다", async ({ guestbook, page }) => {
    const older = guestbook.name("먼저");
    const newer = guestbook.name("나중");
    await guestbook.write(older, "먼저 쓴 글", "pass-1234");
    await guestbook.write(newer, "나중에 쓴 글", "pass-1234");

    await page.reload();
    const names = await page.locator("li").allInnerTexts();
    const olderIndex = names.findIndex((t) => t.startsWith(older));
    const newerIndex = names.findIndex((t) => t.startsWith(newer));
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  test("작성 시각이 KST 기준 YYYY-MM-DD HH:mm 으로 보이고 툴팁에 초까지 보인다", async ({ guestbook }) => {
    const name = guestbook.name("시각");
    await guestbook.write(name, "시각 확인", "pass-1234");

    const time = guestbook.entry(name).locator("time");
    await expect(time).toHaveText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    await expect(time).toHaveAttribute("title", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} KST$/);

    // The shown time must be Seoul time: compare against "now" computed independently in Asia/Seoul.
    const seoulNow = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await expect(time).toHaveText(new RegExp(`^${seoulNow} `));
  });

  test("메시지의 줄바꿈이 유지되고 HTML은 글자 그대로 보인다", async ({ guestbook, page }) => {
    const name = guestbook.name("표시");
    await guestbook.write(name, "첫 줄\n둘째 줄 <b>굵게</b>", "pass-1234");

    await page.reload();
    const entry = guestbook.entry(name);
    await expect(entry.getByText("<b>굵게</b>", { exact: false })).toBeVisible();
    await expect(entry.locator("b")).toHaveCount(0);
    expect(await entry.locator("p").first().innerText()).toBe("첫 줄\n둘째 줄 <b>굵게</b>");
  });

  test("방명록 글이 없으면 첫 글을 남기라는 안내가 보인다", async ({ page }) => {
    await page.goto("/");
    const emptyNotice = page.getByText("아직 방명록 글이 없습니다. 첫 글을 남겨 주세요.");
    // Wait until the list has streamed in (past the loading fallback) before deciding.
    await expect(emptyNotice.or(page.locator("li").first())).toBeVisible();

    // Only meaningful against an empty database; a shared or production DB already has entries.
    test.skip((await page.locator("li").count()) > 0, "데이터베이스에 이미 방명록 글이 있음");
    await expect(emptyNotice).toBeVisible();
  });
});
