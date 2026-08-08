import type { Doc, Page } from "../lib/model";
import { normDoc } from "../lib/model";
import fixture from "./fixtures/ey-global-careers.json";

/** The frozen EY document: 10 pages, 82 blocks, 4 journeys, plus fixture
 *  annotations (comments, pinned notes, a member) that live outside the
 *  Markdown file and must survive every import untouched. */
export const eyDoc = (): Doc => normDoc(structuredClone(fixture) as unknown as Doc);

/** Pages come back from an import in tree order rather than storage order,
 *  and `order` is only meaningful within a parent. Key pages by id and
 *  reduce ordering to the sibling sequence under each parent, so deep
 *  equality means "the same document", not "the same array order". */
export function comparable(d: Doc) {
  const parents = [...new Set(d.pages.map(p => p.parentId ?? "root"))].sort();
  return {
    ...d,
    pages: Object.fromEntries(d.pages.map(p => [p.id, stripOrder(p)])),
    siblings: parents.map(par =>
      `${par}:` + d.pages.filter(p => (p.parentId ?? "root") === par)
        .sort((a, b) => a.order - b.order).map(p => p.id).join(">")).join(" | "),
  };
}
const stripOrder = ({ order: _order, ...rest }: Page) => rest;

/** First line index matching a regex, from a start offset. -1 when absent. */
export function lineIndex(lines: string[], re: RegExp, from = 0): number {
  for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i;
  return -1;
}
