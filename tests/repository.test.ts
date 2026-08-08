import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileRepository } from "../lib/repositories/file";
import type { Repository } from "../lib/repositories/interfaces";

/* Contract tests for the Repository interface, run against the file
 * implementation in a temp dir. When the Firestore implementation arrives
 * (plan 1.2), it must pass this same suite against the emulator. */

let root: string;
let repo: Repository;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "scaffolds-repo-"));
  repo = fileRepository(root);
});
afterEach(() => rm(root, { recursive: true, force: true }));

describe("Repository contract (file implementation)", () => {
  it("seeds an empty store on first list", async () => {
    const metas = await repo.list();
    expect(metas).toHaveLength(1);
    expect(metas[0].id).toBe("ey-global-careers");
  });

  it("creates, reads and lists a project", async () => {
    const d = await repo.create("Test Project");
    expect(d.rev).toBe(1);
    expect(d.schemaVersion).toBeGreaterThanOrEqual(1);
    expect(d.id).toMatch(/^test-project-/);
    const back = await repo.read(d.id);
    expect(back).toEqual(d);
    const metas = await repo.list();
    expect(metas.map(m => m.id)).toContain(d.id);
  });

  it("save with the current rev succeeds and bumps it", async () => {
    const d = await repo.create("P");
    const r = await repo.save({ ...d, name: "P2" }, d.rev, "tester");
    expect(r.ok).toBe(true);
    expect(r.doc!.rev).toBe(d.rev + 1);
    expect(r.doc!.updatedBy).toBe("tester");
    expect((await repo.read(d.id))!.name).toBe("P2");
  });

  it("save with a stale rev fails and returns the server copy", async () => {
    const d = await repo.create("P");
    await repo.save({ ...d, name: "first" }, d.rev, "a");
    const conflict = await repo.save({ ...d, name: "second" }, d.rev, "b");
    expect(conflict.ok).toBe(false);
    expect(conflict.doc!.name).toBe("first");     // the winner, not the loser
    expect((await repo.read(d.id))!.name).toBe("first");
  });

  it("save on a missing project fails without inventing one", async () => {
    const d = await repo.create("P");
    await repo.remove(d.id);
    const r = await repo.save(d, d.rev, "x");
    expect(r).toEqual({ ok: false, doc: null });
  });

  it("remove deletes the project and its versions", async () => {
    const d = await repo.create("P");
    await repo.createVersion(d.id, "v1", "tester");
    await repo.remove(d.id);
    expect(await repo.read(d.id)).toBeNull();
    expect(await repo.listVersions(d.id)).toEqual([]);
  });

  it("versions round-trip and restore the exact document", async () => {
    const d = await repo.create("P");
    await repo.createVersion(d.id, "before", "tester");
    await repo.save({ ...d, name: "changed" }, d.rev, "tester");
    const versions = await repo.listVersions(d.id);
    expect(versions.map(v => v.name)).toContain("before");
    const v = versions.find(v => v.name === "before")!;
    const snap = await repo.getVersion(d.id, v.vid);
    expect(snap!.name).toBe("P");
  });
});
