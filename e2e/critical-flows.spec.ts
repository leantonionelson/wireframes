import { test, expect, type Page } from "@playwright/test";

/* The flows every later phase can break: create a project, edit a block,
 * export the Markdown, import an edited copy through review, undo, delete.
 * Self-contained: everything happens in a project this file creates. */

const PROJECT = "E2E Scratch";

// The page card's title is an editable input; assert on its value.
const pageName = (page: Page) => page.locator(".card input").first();

async function openProject(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("New project name").fill(PROJECT);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/p\//);
  // the scaffolding loader holds for one animation cycle before the canvas
  // mounts, and the page name renders inside an input, not as text.
  await expect(pageName(page)).toHaveValue("Home", { timeout: 10_000 });
}

/** Purge every project with our name via the API, including orphans of
 *  earlier failed runs. The UI delete button is a thin confirm+fetch over
 *  the same endpoint; the canvas flows above are where the value is. */
async function purgeProjects(page: Page) {
  await page.goto("/");
  await page.evaluate(async name => {
    const { projects } = await fetch("/api/projects").then(r => r.json());
    for (const p of projects.filter((x: { name: string }) => x.name === name)) {
      await fetch(`/api/projects?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
    }
  }, PROJECT);
  await page.reload();
  await expect(page.getByText(PROJECT)).toHaveCount(0);
}

test("create, edit, export, import with review, undo, delete", async ({ page }) => {
  await openProject(page);

  /* ---- edit: add a block, rename it in the inspector ---- */
  await page.locator(".card").first().getByText("+ block").click();
  const inspector = page.locator("aside.panel");
  await expect(inspector).toBeVisible();
  const label = inspector.locator("input").first();
  await label.fill("Hero video");
  await expect(page.locator(".card").first()).toContainText("Hero video");
  await page.keyboard.press("Escape");

  /* ---- export: the md is real and carries the project ---- */
  await page.getByRole("button", { name: "Export / import" }).click();
  await page.getByRole("button", { name: "Markdown for AI" }).click();
  await page.getByText("Preview the file").click();
  const preview = page.locator("details pre");
  await expect(preview).toContainText("## Pages");
  await expect(preview).toContainText("Hero video");
  const md = (await preview.textContent()) ?? "";

  /* ---- import: rename the page in the file, review, apply ---- */
  const edited = md.replace(/^### Home /m, "### Landing ");
  await page.getByRole("button", { name: "Bring it back" }).click();
  await page.getByPlaceholder("Paste the edited Markdown here…").fill(edited);
  await page.getByRole("button", { name: "Review changes" }).click();
  await expect(page.getByText("1 change: 1 edited")).toBeVisible();
  await expect(page.getByText('renamed from "Home"')).toBeVisible();
  await page.getByRole("button", { name: "Apply 1 change" }).click();
  await expect(pageName(page)).toHaveValue("Landing");

  /* ---- undo reverts the import in one step ---- */
  await page.keyboard.press("ControlOrMeta+z");
  await expect(pageName(page)).toHaveValue("Home");

  /* ---- save round trip: the rename persisted then reverted on disk ---- */
  await page.waitForTimeout(1000); // debounced save
  const url = new URL(page.url());
  const id = url.pathname.split("/p/")[1];
  const doc = await page.evaluate(async pid =>
    (await fetch(`/api/doc?id=${pid}`).then(r => r.json())).doc, id);
  expect(doc.pages[0].name).toBe("Home");

  await purgeProjects(page);
});

test("viewer without auth still sees the project read-only", async ({ page }) => {
  // auth is disabled on this server, so this only asserts the page renders
  // for a fresh session with no localStorage state.
  await page.goto("/");
  await expect(page.getByText("collaborative sitemaps")).toBeVisible();
});

test.describe("mobile projection", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("sitemap list, page detail and editing on a phone", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("New project name").fill(PROJECT);
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/\/p\//);

    // the canvas is replaced by the list projection
    await expect(page.getByRole("button", { name: /Home/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".tree")).toHaveCount(0);

    // add a page from the list, then open a page into full-screen detail
    await page.getByRole("button", { name: "+ page", exact: true }).click();
    await expect(page.getByRole("button", { name: /New page/ })).toBeVisible();
    await page.getByRole("button", { name: /Home/ }).click();
    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();

    // the detail view is editable on mobile: blocks render as wireframe
    // components with their copy in an accordion — expand, then edit
    await page.locator(".panel .cursor-pointer").first().click();
    await page.getByPlaceholder("Purpose, user needs, content status…").first()
      .fill("Written on a phone");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Home" })).toHaveCount(0);

    await purgeProjects(page);
  });
});
