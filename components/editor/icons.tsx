"use client";
import React from "react";

/* The editor's shared icon set: tiny inline strokes, sized for pills. */

export const I = (d: React.ReactNode) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
export const ICONS = {
  up: I(<path d="M18 15l-6-6-6 6" />),
  down: I(<path d="M6 9l6 6 6-6" />),
  dup: I(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>),
  edit: I(<><path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" /><line x1="13.5" y1="6.5" x2="17.5" y2="10.5" /></>),
  trash: I(<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />),
  plus: I(<path d="M12 5v14M5 12h14" />),
  page: I(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>),
  detail: I(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16M6 9h4M6 13h4" /></>),
  copy: I(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>),
  check: I(<path d="M20 6L9 17l-5-5" />),
  export: I(<><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 20h16" /></>),
  close: I(<path d="M18 6L6 18M6 6l12 12" />),
  undo: I(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>),
  redo: I(<><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></>),
  clock: I(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>),
  route: I(<><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H15a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h6.5" /></>),
  eye: I(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: I(<><path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.4 0-10-7-10-7a20 20 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c6.4 0 10 7 10 7a19.8 19.8 0 0 1-3.22 4.31" /><line x1="2" y1="2" x2="22" y2="22" /></>),
  rec: I(<circle cx="12" cy="12" r="6" />),
  image: I(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M4 17l5-5 4 3.5 3-2.5 4 4" /></>),
  md: I(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 17v-4l2 2 2-2v4" /></>),
  upload: I(<><path d="M12 20V8" /><path d="M7 12l5-5 5 5" /><path d="M4 4h16" /></>),
};
