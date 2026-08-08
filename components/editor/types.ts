/* Selection is shared across every editor surface: a page, optionally a
 * block within it. Null means nothing selected. */
export type Sel = { pageId: string; blockId?: string } | null;


