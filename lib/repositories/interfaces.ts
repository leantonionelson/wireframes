import type { Doc } from "../model";

/* The storage boundary. Everything above it deals in whole Docs and these
 * types; nothing above it may import a vendor SDK. New backends (Firestore
 * is the planned third) implement these interfaces and register in
 * lib/store.ts — no caller changes.
 *
 * Whole-doc semantics are deliberate: the single revision check in save()
 * is what makes concurrent editing safe without a CRDT. A backend may
 * shard the document internally, but save/read keep aggregate semantics
 * until per-entity writes are genuinely needed (see IMPLEMENTATION.md 1.2). */

export type ProjectMeta = Pick<Doc, "id" | "name" | "rev" | "updatedAt" | "updatedBy">;
export type SaveResult = { ok: boolean; doc: Doc | null };
export type VersionMeta = { vid: string; name: string; rev: number; createdAt: number; createdBy: string };

export interface ProjectRepository {
  list(): Promise<ProjectMeta[]>;
  read(id: string): Promise<Doc | null>;
  create(name: string): Promise<Doc>;
  remove(id: string): Promise<void>;
  /** Revision-checked write: succeeds only when the stored rev equals
   *  baseRev; on conflict returns ok:false with the current server copy. */
  save(doc: Doc, baseRev: number, by: string): Promise<SaveResult>;
}

export interface VersionRepository {
  listVersions(pid: string): Promise<VersionMeta[]>;
  getVersion(pid: string, vid: string): Promise<Doc | null>;
  createVersion(pid: string, name: string, by: string): Promise<void>;
}

export type Repository = ProjectRepository & VersionRepository;

/* Snapshot policy is product behaviour, not backend detail: one automatic
 * version per window of activity, bounded history. */
export const AUTO_SNAPSHOT_MS = 10 * 60 * 1000;
export const KEEP_VERSIONS = 100;
