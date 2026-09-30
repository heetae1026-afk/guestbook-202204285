import { test, expect } from "./fixtures";

const WRONG_PASSWORD_NOTICE = "글 비밀번호가 일치하지 않습니다. 수정되지 않았습니다.";

test.describe("수정", () => {
  test("[수정]을 누르면 현재 메시지가 채워진 수정 폼이 열리고 이름은 바꿀 수 없다", async ({ guestbook }) => {
    const name = guestbook.name("열기");
    await guestbook.write(name, "원래 메시지", "pass-1234");

    const entry = guestbook.entry(name);
    await entry.getByRole("button", { name: "수정", exact: true }).click();
    await expect(entry.getByLabel("메시지")).toHaveValue("원래 메시지");
    await expect(entry.getByLabel("이름")).toHaveCount(0);
  });

  test("틀린 글 비밀번호면 거부되고, 고쳐 쓴 메시지는 남고, 데이터는 그대로다", async ({ guestbook, page }) => {
    const name = guestbook.name("거부");
    await guestbook.write(name, "원래 메시지", "pass-1234");

    await guestbook.submitEdit(name, "고쳐 쓴 메시지", "wrong-pass");

    const entry = guestbook.entry(name);
    await expect(entry.getByRole("alert")).toHaveText(WRONG_PASSWORD_NOTICE);
    await expect(entry.getByLabel("메시지")).toHaveValue("고쳐 쓴 메시지");

    await page.reload();
    await expect(guestbook.entry(name).locator("p")).toHaveText("원래 메시지");
    await expect(guestbook.entry(name)).not.toContainText("(수정됨)");
  });

  test("다른 방명록 글의 글 비밀번호로는 수정할 수 없다", async ({ guestbook, page }) => {
    const mine = guestbook.name("내글");
    const other = guestbook.name("남글");
    await guestbook.write(mine, "내 메시지", "mine-1234");
    await guestbook.write(other, "남의 메시지", "other-1234");

    await guestbook.submitEdit(other, "몰래 수정", "mine-1234");
    await expect(guestbook.entry(other).getByRole("alert")).toHaveText(WRONG_PASSWORD_NOTICE);

    await page.reload();
    await expect(guestbook.entry(other).locator("p")).toHaveText("남의 메시지");
  });

  test("맞는 글 비밀번호면 메시지가 바뀌고 (수정됨)이 붙고 폼이 닫히며 작성 시각은 그대로다", async ({ guestbook, page }) => {
    const name = guestbook.name("성공");
    await guestbook.write(name, "원래 메시지", "pass-1234");
    const createdAt = await guestbook.entry(name).locator("time").getAttribute("title");

    await guestbook.submitEdit(name, "수정된 메시지", "pass-1234");

    const entry = guestbook.entry(name);
    await expect(entry.getByRole("button", { name: "수정 저장" })).toHaveCount(0);
    await expect(entry.locator("p")).toHaveText("수정된 메시지");
    await expect(entry).toContainText("(수정됨)");

    await page.reload();
    await expect(guestbook.entry(name).locator("p")).toHaveText("수정된 메시지");
    await expect(guestbook.entry(name)).toContainText("(수정됨)");
    await expect(guestbook.entry(name).locator("time")).toHaveAttribute("title", createdAt!);
  });

  test("오류 후 [취소]하고 다시 열면 이전 오류 안내가 없다", async ({ guestbook }) => {
    const name = guestbook.name("취소");
    await guestbook.write(name, "원래 메시지", "pass-1234");

    await guestbook.submitEdit(name, "고쳐 쓴 메시지", "wrong-pass");
    const entry = guestbook.entry(name);
    await expect(entry.getByRole("alert")).toBeVisible();

    await entry.getByRole("button", { name: "취소" }).click();
    await expect(entry.locator("p")).toHaveText("원래 메시지");

    await entry.getByRole("button", { name: "수정", exact: true }).click();
    await expect(entry.getByLabel("메시지")).toHaveValue("원래 메시지");
    await expect(entry.getByRole("alert")).toHaveCount(0);
  });
});
