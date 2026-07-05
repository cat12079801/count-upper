import { test, expect, type Page } from "@playwright/test";

// storageState により認証済みで開始する（e2e/auth.setup.ts）。
// 主要フロー（カウンター作成→記録→グラフ反映→削除→バリデーションエラー）を一連で検証する。
// 各実行で一意名のカウンターを作り、最後に削除して自己完結させる。

// EmptyState（カウンター0件）と CounterBar（1件以上）の双方に対応してカウンターを作成する。
async function createAndSelectCounter(page: Page, name: string) {
  await page.goto("/app");

  const addButton = page.getByRole("button", { name: "カウンターを追加" });
  if ((await addButton.count()) > 0) {
    // 既存カウンターあり: CounterBar の「＋」から追加フォームを開く
    await addButton.click();
    await page.locator('input[name="name"]').fill(name);
    await page.getByRole("button", { name: "追加", exact: true }).click();
  } else {
    // カウンター0件: EmptyState のフォームがそのまま表示されている
    await page.locator('input[name="name"]').fill(name);
    await page.getByRole("button", { name: "作成", exact: true }).click();
  }

  // 作成したカウンターは自動選択されないため、チップをクリックして選択する。
  await page.getByRole("link", { name, exact: true }).click();
}

test("主要フロー: 作成→記録→グラフ反映→削除→バリデーションエラー", async ({
  page,
}) => {
  const counterName = `E2E-${Date.now()}`;

  await test.step("カウンターを作成して選択する", async () => {
    await createAndSelectCounter(page, counterName);
    await expect(page.getByRole("link", { name: counterName, exact: true })).toBeVisible();
    // 記録前の合計は 0
    await expect(page.locator("span.text-6xl")).toHaveText("0");
  });

  const dateValue = await page.locator('input[name="logged_on"]').inputValue();

  // 「最近の記録」の当日分の行（統計値の "3回" と衝突しないよう listitem にスコープする）
  const recordRow = page.getByRole("listitem").filter({ hasText: dateValue });

  await test.step("記録するとグラフと最近の記録に即時反映される（楽観的更新）", async () => {
    await page.locator('input[name="count"]').fill("3");
    await page.getByRole("button", { name: /記録/ }).click();

    // 楽観的更新: 通信完了を待たず合計が即時に反映される
    await expect(page.locator("span.text-6xl")).toHaveText("3");
    // 成功トースト
    await expect(page.getByText("記録した", { exact: true })).toBeVisible();
    // 「最近の記録」に当日分の行（3回）が現れる
    await expect(recordRow).toContainText("3回");
  });

  await test.step("記録を削除するとリストから消え合計が戻る", async () => {
    // 削除ボタンは楽観的更新で即座に自壊するため、アクショナビリティ待ちを挟まず
    // dispatchEvent で1回だけクリックを発火し、結果（行の消失・合計0）で検証する。
    await recordRow.getByRole("button", { name: "削除", exact: true }).dispatchEvent("click");

    await expect(recordRow).toHaveCount(0);
    await expect(page.locator("span.text-6xl")).toHaveText("0");
  });

  await test.step("不正な日付はサーバ検証で弾かれエラートーストを表示する", async () => {
    // クライアントの max 制約を外し、未来日をサーバアクションまで到達させる。
    await page
      .locator('input[name="logged_on"]')
      .evaluate((el) => el.removeAttribute("max"));
    await page.locator('input[name="logged_on"]').fill("2099-12-31");
    await page.locator('input[name="count"]').fill("1");
    await page.getByRole("button", { name: /記録/ }).click();

    await expect(page.getByText(/日付が不正です/)).toBeVisible();
  });

  await test.step("後片付け: カウンターを削除する", async () => {
    const chip = page.getByRole("link", { name: counterName, exact: true });
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "編集", exact: true }).click();
    // 編集パネル内の赤いカウンター削除ボタン（ログ行の削除ボタンとは別）。
    // 削除成功でカウンター自体が消えるため、チップの消失で実削除を検証する。
    await page.locator("button.text-red-600").dispatchEvent("click");
    await expect(chip).toHaveCount(0);
  });
});
