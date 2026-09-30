import { test, expect } from "./fixtures";

test.describe("삭제", () => {
  test("[삭제]를 누르면 글 비밀번호 입력란과 [삭제 확인]이 나타나고 아직 지워지지 않는다", async ({ guestbook, page }) => {
    const name = guestbook.name("열기");
    await guestbook.write(name, "지울 글", "pass-1234");

    const entry = guestbook.entry(name);
    await entry.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(entry.getByLabel("글 비밀번호")).toBeVisible();
    await expect(entry.getByRole("button", { name: "삭제 확인" })).toBeVisible();

    await page.reload();
    await expect(guestbook.entry(name)).toBeVisible();
  });

  test("다른 방명록 글의 글 비밀번호로는 삭제가 거부되고 글이 남는다", async ({ guestbook, page }) => {
    const mine = guestbook.name("내글");
    const other = guestbook.name("남글");
    await guestbook.write(mine, "내 메시지", "mine-1234");
    await guestbook.write(other, "남의 메시지", "other-1234");

    await guestbook.submitDelete(other, "mine-1234");
    await expect(guestbook.entry(other).getByRole("alert")).toHaveText(
      "글 비밀번호가 일치하지 않습니다. 삭제되지 않았습니다.",
    );

    await page.reload();
    await expect(guestbook.entry(other)).toBeVisible();
  });

  test("맞는 글 비밀번호면 방명록 글이 흔적 없이 사라진다", async ({ guestbook, page }) => {
    const name = guestbook.name("성공");
    await guestbook.write(name, "지울 글", "pass-1234");

    await guestbook.submitDelete(name, "pass-1234");
    await expect(guestbook.entry(name)).toHaveCount(0);

    await page.reload();
    await expect(guestbook.writeForm).toBeVisible();
    await expect(page.getByText(name)).toHaveCount(0);
    await expect(page.getByText("지울 글")).toHaveCount(0);
  });

  test("[취소]를 누르면 입력란이 닫히고 방명록 글은 남는다", async ({ guestbook, page }) => {
    const name = guestbook.name("취소");
    await guestbook.write(name, "남을 글", "pass-1234");

    const entry = guestbook.entry(name);
    await entry.getByRole("button", { name: "삭제", exact: true }).click();
    await entry.getByRole("button", { name: "취소" }).click();
    await expect(entry.getByLabel("글 비밀번호")).toHaveCount(0);

    await page.reload();
    await expect(guestbook.entry(name).locator("p")).toHaveText("남을 글");
  });
});
