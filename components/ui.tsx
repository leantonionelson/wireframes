"use client";
import React from "react";

/* The app's UI primitives.
 *
 * Deliberately hand-rolled rather than shadcn/Radix: this app already has a
 * complete visual language (pills everywhere, glass on floating chrome, solid
 * --card on modals, CSS custom-property tokens with light/dark) and its own
 * accessibility surface is small. shadcn would add Radix, CVA and
 * tailwind-merge to restyle every component back into these same tokens.
 * What shadcn is actually good at - components you own, in your file tree -
 * is what this file is. Reach for Radix only when a real primitive needs it
 * (focus trapping, listbox semantics), not for looks.
 *
 * Rules: pill radius on anything interactive, 32px minimum hit target,
 * colour by token, never by literal. */

type El = React.ReactNode;

/* ---------- buttons ---------- */

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md";

const BTN_BASE = "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-colors disabled:opacity-40 disabled:pointer-events-none";
const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-[var(--accent)] text-white hover:opacity-90",
  secondary: "border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--hover)]",
  ghost: "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)]",
  danger: "border border-[var(--border)] text-[var(--muted)] hover:text-red-500 hover:border-red-500/50",
};
const BTN_SIZE: Record<BtnSize, string> = {
  sm: "px-3 py-1 text-[11.5px]",
  md: "px-4 py-1.5 text-[12.5px]",
};

export function Button({ variant = "secondary", size = "md", className = "", ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return <button className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`} {...rest} />;
}

/** Square icon-only button, sized for touch. */
export function IconButton({ label, danger, className = "", children, ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean; children: El }) {
  return (
    <button title={label} aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-full text-[var(--muted)] transition-colors ${
        danger ? "hover:text-red-500" : "hover:text-[var(--ink)]"} hover:bg-[var(--hover)] ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ---------- pill tabs ---------- */

export type TabItem = { id: string; label: string; color?: string };

/** Scrolling pill tab strip. `color` tints the selected pill (intents use
 *  their own colour); without one the accent is used. */
export function PillTabs({ items, value, onChange, after, className = "" }: {
  items: TabItem[];
  value: string | null;
  onChange: (id: string) => void;
  after?: El;                       // trailing control, e.g. an add button
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar ${className}`}>
      {items.map(t => {
        const on = t.id === value;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} aria-current={on ? "true" : undefined}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[12.5px] rounded-full border whitespace-nowrap shrink-0 transition-colors ${
              on ? "border-transparent font-semibold text-white" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)]"}`}
            style={on ? { background: t.color ?? "var(--accent)" } : undefined}>
            {t.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: on ? "currentColor" : t.color }} />}
            {t.label}
          </button>
        );
      })}
      {after}
    </div>
  );
}

/* ---------- modal shell ---------- */

/** Full-screen sheet on phones, centred dialog from sm upward. Escape is
 *  handled by the editor's global key handler, so this only wires the
 *  backdrop click. */
export function Modal({ onClose, width = "max-w-3xl", children }: {
  onClose: () => void;
  width?: string;
  children: El;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm flex items-center justify-center p-0 sm:p-5" onClick={onClose}>
      <div className={`panel w-full h-full sm:h-auto ${width} sm:max-h-[92vh] rounded-none sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden`}
           role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, actions, onClose }: {
  title: El; subtitle?: string; actions?: El; onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--border)]">
      <h2 className="text-[17px] sm:text-lg font-bold min-w-0 truncate">{title}</h2>
      {subtitle && <span className="tk text-[11px] text-[var(--muted)] hidden md:inline shrink-0">{subtitle}</span>}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        {actions}
        <IconButton label="Close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </IconButton>
      </div>
    </div>
  );
}

/* ---------- misc ---------- */

/** Floating cluster: the glass chrome that sits over the canvas. */
export function Cluster({ className = "", children }: { className?: string; children: El }) {
  return (
    <div className={`cluster flex items-center gap-1 px-2 py-1.5 bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "danger" | "accent" | "warn"; children: El }) {
  const tones = {
    neutral: "bg-[var(--hover)] text-[var(--muted)]",
    danger: "bg-red-600 text-white",
    accent: "bg-[var(--accent)] text-white",
    warn: "bg-amber-400 text-amber-950",
  };
  return <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0 ${tones[tone]}`}>{children}</span>;
}
