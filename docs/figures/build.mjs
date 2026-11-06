// Generates the README figures, in a light and a dark variant each:
//   node docs/figures/build.mjs
// Geometry is computed from real values (iPhone portrait: 390 × 844, 59px top
// inset, 34px bottom inset), so the figures stay true to the CSS they show.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const themes = {
  light: {
    fg: "#1f2328", muted: "#59636e", line: "#d1d9e0", frame: "#59636e", screen: "#ffffff",
    page: "#eaeef2", content: "#d1d9e0", el: "#f6f8fa", inset: "#9a6700", insetBg: "#fff8c5",
    value: "#0969da", valueBg: "#ddf4ff", bad: "#cf222e", badBg: "#ffebe9", good: "#1a7f37", scrim: "#1f2328",
  },
  dark: {
    fg: "#f0f6fc", muted: "#9198a1", line: "#3d444d", frame: "#9198a1", screen: "#0d1117",
    page: "#151b23", content: "#3d444d", el: "#212830", inset: "#d29922", insetBg: "#2e2a1e",
    value: "#4493f8", valueBg: "#15253b", bad: "#f85149", badBg: "#3c1618", good: "#3fb950", scrim: "#010409",
  },
};

const SANS = `system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`;
const r1 = (n) => Math.round(n * 10) / 10;

function svg(t, { width, height, title }, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" font-family='${SANS}'>
<title>${title}</title>
<defs>
  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="6" height="6" fill="${t.insetBg}"/>
    <line x1="0" y1="0" x2="0" y2="6" stroke="${t.inset}" stroke-width="1.5" opacity="0.55"/>
  </pattern>
</defs>
${body}
</svg>
`;
}

const text = (t, x, y, s, { size = 13, color = t.fg, anchor = "start", weight = 400, mono = false } = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}"${mono ? ` font-family='${MONO}'` : ""}>${s}</text>`;

/** A vertical dimension bracket with a label on its right. */
function dim(t, x, y1, y2, label, color = t.muted) {
  if (y2 - y1 < 0.5) return text(t, x + 2, y1 + 4, label, { size: 12, color });
  return `<path d="M${r1(x - 3)} ${r1(y1)}h6M${r1(x)} ${r1(y1)}V${r1(y2)}M${r1(x - 3)} ${r1(y2)}h6" stroke="${color}" fill="none" stroke-width="1"/>
${text(t, x + 7, (y1 + y2) / 2 + 4, label, { size: 12, color })}`;
}

/* Figure 1: the three forms --------------------------------------------- */

function forms(t) {
  const s = 1.25; // px → figure units
  const INSET = 34, VALUE = 24;
  const cols = [
    { cls: "pb-safe", desc: "the inset", pad: (i) => ({ inset: i, value: 0, absorbed: 0 }) },
    { cls: "pb-safe-6", desc: "inset + 1.5rem", pad: (i) => ({ inset: i, value: VALUE, absorbed: 0 }) },
    { cls: "pb-safe-or-6", desc: "the larger of the two", pad: (i) => (i >= VALUE ? { inset: i, value: 0, absorbed: VALUE } : { inset: 0, value: VALUE, absorbed: 0 }) },
  ];
  const rows = [
    { label: "iPhone", sub: "34px inset", inset: INSET, round: true, y: 62, h: 128 },
    { label: "Desktop", sub: "no inset", inset: 0, round: false, y: 214, h: 92 },
  ];
  const x0 = 104, cw = 168, gap = 56, W = x0 + 3 * cw + 2 * gap + 48, H = 346;
  let out = "";
  cols.forEach((c, ci) => {
    const x = x0 + ci * (cw + gap);
    out += text(t, x, 22, c.cls, { size: 14, weight: 600, mono: true });
    out += text(t, x, 41, c.desc, { size: 12, color: t.muted });
  });
  rows.forEach((row, ri) => {
    out += text(t, 0, row.y + row.h / 2 - 2, row.label, { size: 13, weight: 600 });
    out += text(t, 0, row.y + row.h / 2 + 15, row.sub, { size: 12, color: t.muted });
    cols.forEach((c, ci) => {
      const x = x0 + ci * (cw + gap), y = row.y, w = cw, h = row.h, bottom = y + h;
      const p = c.pad(row.inset);
      const id = `clip${ri}${ci}`;
      const R = row.round ? 26 : 0;
      const shape = row.round
        ? `M${x} ${y}H${x + w}V${bottom - R}Q${x + w} ${bottom} ${x + w - R} ${bottom}H${x + R}Q${x} ${bottom} ${x} ${bottom - R}Z`
        : `M${x} ${y}H${x + w}V${bottom}H${x}Z`;
      const total = p.inset + p.value;
      const padH = total * s;
      const elTop = bottom - padH - 30;
      out += `<clipPath id="${id}"><path d="${shape}"/></clipPath>
<g clip-path="url(#${id})">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${t.screen}"/>
  <rect x="${x + 12}" y="${y + 10}" width="${w * 0.55}" height="7" rx="3.5" fill="${t.content}" opacity="0.6"/>
  <rect x="${x}" y="${r1(elTop)}" width="${w}" height="${r1(bottom - elTop)}" fill="${t.el}"/>
  <line x1="${x}" y1="${r1(elTop)}" x2="${x + w}" y2="${r1(elTop)}" stroke="${t.line}"/>
  <rect x="${x + 12}" y="${r1(elTop + 8)}" width="${w - 24}" height="14" rx="4" fill="${t.content}"/>
  ${p.value ? `<rect x="${x}" y="${r1(elTop + 30)}" width="${w}" height="${r1(p.value * s)}" fill="${t.valueBg}"/>` : ""}
  ${p.inset ? `<rect x="${x}" y="${r1(bottom - p.inset * s)}" width="${w}" height="${r1(p.inset * s)}" fill="url(#hatch)"/>` : ""}
  ${p.absorbed ? `<rect x="${x + 1}" y="${r1(bottom - p.absorbed * s)}" width="${w - 2}" height="${r1(p.absorbed * s - 1)}" fill="none" stroke="${t.value}" stroke-dasharray="4 3"/>` : ""}
  ${row.round ? `<rect x="${x + w / 2 - 34}" y="${bottom - 10}" width="68" height="4" rx="2" fill="${t.fg}" opacity="0.8"/>` : ""}
</g>
<path d="${shape}" fill="none" stroke="${t.frame}" stroke-width="1.5"/>`;
      const label = `${total}px`;
      out += dim(t, x + w + 10, elTop + 30, bottom, label, padH ? t.fg : t.muted);
    });
  });
  // Legend
  const ly = H - 6;
  out += `<rect x="${x0}" y="${ly - 10}" width="14" height="12" fill="url(#hatch)" stroke="${t.inset}" stroke-width="0.5"/>`;
  out += text(t, x0 + 20, ly, "inset (status bar, home indicator, notch)", { size: 12, color: t.muted });
  out += `<rect x="${x0 + 290}" y="${ly - 10}" width="14" height="12" fill="${t.valueBg}" stroke="${t.value}" stroke-width="0.5"/>`;
  out += text(t, x0 + 310, ly, "value", { size: 12, color: t.muted });
  out += `<rect x="${x0 + 362}" y="${ly - 10}" width="14" height="12" fill="none" stroke="${t.value}" stroke-dasharray="3 2"/>`;
  out += text(t, x0 + 382, ly, "value, covered by the inset", { size: 12, color: t.muted });
  return svg(t, { width: W, height: H, title: "pb-safe is the inset, pb-safe-6 adds 1.5rem to it, pb-safe-or-6 takes the larger of the two" }, out);
}

/* Phones ------------------------------------------------------------------ */

const PHONE = { w: 390, h: 844, top: 59, bottom: 34 };

/** A portrait phone at scale s, with its insets hatched; returns { svg, X, Y } helpers. */
function phone(t, ox, oy, s, id, inner) {
  const w = PHONE.w * s, h = PHONE.h * s, R = 55 * s;
  const X = (px) => ox + px * s, Y = (px) => oy + px * s;
  const lines = [120, 150, 180, 250, 280, 310, 380, 410, 480, 510, 540, 610, 640]
    .map((y, i) => `<rect x="${r1(X(20))}" y="${r1(Y(y))}" width="${r1((i % 3 === 2 ? 200 : 330) * s)}" height="${r1(12 * s)}" rx="${r1(6 * s)}" fill="${t.content}"/>`).join("");
  return `<clipPath id="${id}"><rect x="${r1(ox)}" y="${r1(oy)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(R)}"/></clipPath>
<g clip-path="url(#${id})">
  <rect x="${r1(ox)}" y="${r1(oy)}" width="${r1(w)}" height="${r1(h)}" fill="${t.screen}"/>
  ${lines}
  <rect x="${r1(ox)}" y="${r1(oy)}" width="${r1(w)}" height="${r1(h)}" fill="${t.scrim}" opacity="0.22"/>
  <rect x="${r1(ox)}" y="${r1(oy)}" width="${r1(w)}" height="${r1(PHONE.top * s)}" fill="url(#hatch)" opacity="0.9"/>
  <rect x="${r1(ox)}" y="${r1(Y(PHONE.h - PHONE.bottom))}" width="${r1(w)}" height="${r1(PHONE.bottom * s)}" fill="url(#hatch)" opacity="0.9"/>
  ${inner(X, Y)}
  <rect x="${r1(X(135))}" y="${r1(Y(11))}" width="${r1(120 * s)}" height="${r1(36 * s)}" rx="${r1(18 * s)}" fill="#000"/>
  <rect x="${r1(X(127))}" y="${r1(Y(PHONE.h - 13))}" width="${r1(136 * s)}" height="${r1(5 * s)}" rx="${r1(2.5 * s)}" fill="${t.fg}" opacity="0.8"/>
</g>
<rect x="${r1(ox)}" y="${r1(oy)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(R)}" fill="none" stroke="${t.frame}" stroke-width="1.5"/>`;
}

function modalBox(t, X, Y, top, height, s) {
  let out = `<rect x="${r1(X(16))}" y="${r1(Y(top))}" width="${r1(358 * s)}" height="${r1(height * s)}" rx="${r1(14 * s)}" fill="${t.el}" stroke="${t.line}"/>`;
  out += `<rect x="${r1(X(36))}" y="${r1(Y(top + 24))}" width="${r1(160 * s)}" height="${r1(16 * s)}" rx="${r1(8 * s)}" fill="${t.fg}" opacity="0.55"/>`;
  for (let y = top + 70; y < top + height - 40; y += 34) {
    out += `<rect x="${r1(X(36))}" y="${r1(Y(y))}" width="${r1((y / 34) % 3 < 1 ? 220 * s : 318 * s)}" height="${r1(10 * s)}" rx="${r1(5 * s)}" fill="${t.content}"/>`;
  }
  return out;
}

/* Figure 2: a modal, centered in the viewport vs in the safe area --------- */

function modal(t) {
  const s = 0.4, pw = PHONE.w * s, ph = PHONE.h * s;
  const colW = 300, x1 = (colW - pw) / 2, x2 = colW + (colW - pw) / 2, y0 = 8;
  const W = 2 * colW, H = y0 + ph + 96;
  let out = "";
  // Left: top-1/2 with max-h-[calc(100dvh-2rem)]: 16px from the screen edges.
  const lTop = 16, lH = PHONE.h - 32;
  out += phone(t, x1, y0, s, "pl", (X, Y) => {
    let g = modalBox(t, X, Y, lTop, lH, s);
    g += `<rect x="${r1(X(16))}" y="${r1(Y(lTop))}" width="${r1(358 * s)}" height="${r1((PHONE.top - lTop) * s)}" fill="${t.bad}" opacity="0.35"/>`;
    g += `<rect x="${r1(X(16))}" y="${r1(Y(PHONE.h - PHONE.bottom))}" width="${r1(358 * s)}" height="${r1((PHONE.bottom - 16) * s)}" fill="${t.bad}" opacity="0.35"/>`;
    return g;
  });
  // Right: top-safe-1/2 with max-h-dvh-safe-4: 16px from each inset.
  const rH = PHONE.h - PHONE.top - PHONE.bottom - 32;
  const rTop = PHONE.top + (PHONE.h - PHONE.top - PHONE.bottom) / 2 - rH / 2;
  out += phone(t, x2, y0, s, "pr", (X, Y) => modalBox(t, X, Y, rTop, rH, s));
  const Y = (px) => y0 + px * s;
  out += dim(t, x2 + pw + 8, Y(PHONE.top), Y(rTop), "1rem", t.good);
  out += dim(t, x2 + pw + 8, Y(rTop + rH), Y(PHONE.h - PHONE.bottom), "1rem", t.good);
  const cy = y0 + ph + 26;
  out += text(t, colW / 2, cy, "top-1/2", { size: 13, anchor: "middle", mono: true });
  out += text(t, colW / 2, cy + 18, "max-h-[calc(100dvh-2rem)]", { size: 13, anchor: "middle", mono: true });
  out += text(t, colW / 2, cy + 44, "✗ under the status bar and the corners", { size: 13, anchor: "middle", color: t.bad, weight: 600 });
  out += text(t, colW * 1.5, cy, "top-safe-1/2", { size: 13, anchor: "middle", mono: true });
  out += text(t, colW * 1.5, cy + 18, "max-h-dvh-safe-4", { size: 13, anchor: "middle", mono: true });
  out += text(t, colW * 1.5, cy + 44, "✓ 1rem clear of each inset", { size: 13, anchor: "middle", color: t.good, weight: 600 });
  return svg(t, { width: W, height: H, title: "A modal with top-1/2 reaches the status bar; with top-safe-1/2 and max-h-dvh-safe-4 it stays 1rem clear of each inset" }, out);
}

/* Figure 3: opting out inside a component ------------------------------- */

function optOut(t) {
  const s = 1.1, INSET = 34, GAP = 16;
  const pw = 176, H = 236, y0 = 46, sh = 150;
  const cols = [
    { title: "At the screen edge", cls: "pb-safe-4", card: false, pad: INSET + GAP, ok: "✓ clears the home indicator" },
    { title: "Inside a card", cls: "pb-safe-4", card: true, pad: INSET + GAP, bad: "✗ 34px for nothing" },
    { title: "Inside a card", cls: "safe-none → pb-safe-4", card: true, pad: GAP, ok: "✓ behaves like pb-4" },
  ];
  const gap = 46, W = 3 * pw + 2 * gap + 44;
  let out = "";
  cols.forEach((c, i) => {
    const x = i * (pw + gap), bottom = y0 + sh, R = 26;
    out += text(t, x, 16, c.title, { size: 13, weight: 600 });
    out += text(t, x, 34, c.cls, { size: 12, mono: true, color: t.muted });
    const shape = `M${x} ${y0}H${x + pw}V${bottom - R}Q${x + pw} ${bottom} ${x + pw - R} ${bottom}H${x + R}Q${x} ${bottom} ${x} ${bottom - R}Z`;
    out += `<clipPath id="c${i}"><path d="${shape}"/></clipPath><g clip-path="url(#c${i})">`;
    out += `<rect x="${x}" y="${y0}" width="${pw}" height="${sh}" fill="${c.card ? t.page : t.screen}"/>`;
    out += `<rect x="${x}" y="${r1(bottom - INSET * s)}" width="${pw}" height="${r1(INSET * s)}" fill="url(#hatch)"/>`;
    let elBottom = bottom, ex = x, ew = pw;
    if (c.card) {
      const cTop = y0 + 12;
      elBottom = bottom - INSET * s - 10;
      ex = x + 12; ew = pw - 24;
      out += `<rect x="${ex}" y="${cTop}" width="${ew}" height="${r1(elBottom - cTop)}" rx="10" fill="${t.screen}" stroke="${t.line}"/>`;
      out += `<rect x="${ex + 10}" y="${cTop + 10}" width="${ew * 0.6}" height="7" rx="3.5" fill="${t.content}" opacity="0.7"/>`;
    }
    const padH = c.pad * s, elTop = elBottom - padH - 26;
    // The footer fills the bottom of the card, so only its bottom corners are rounded.
    out += `<rect x="${ex}" y="${r1(elTop)}" width="${ew}" height="${r1(elBottom - elTop)}" fill="${t.el}"${c.card ? ' rx="10"' : ""}/>`;
    if (c.card) out += `<rect x="${ex}" y="${r1(elTop)}" width="${ew}" height="12" fill="${t.el}"/>`;
    out += `<line x1="${ex}" y1="${r1(elTop)}" x2="${ex + ew}" y2="${r1(elTop)}" stroke="${t.line}"/>`;
    out += `<rect x="${ex + 10}" y="${r1(elTop + 7)}" width="${ew - 20}" height="12" rx="4" fill="${t.content}"/>`;
    if (c.pad > GAP) {
      out += `<rect x="${ex}" y="${r1(elTop + 26)}" width="${ew}" height="${r1(GAP * s)}" fill="${t.valueBg}"/>`;
      out += `<rect x="${ex}" y="${r1(elTop + 26 + GAP * s)}" width="${ew}" height="${r1(INSET * s)}" fill="url(#hatch)"${c.card ? ` stroke="${t.bad}" stroke-width="1.5" stroke-dasharray="4 3"` : ""}/>`;
    } else {
      out += `<rect x="${ex}" y="${r1(elTop + 26)}" width="${ew}" height="${r1(GAP * s)}" fill="${t.valueBg}"/>`;
    }
    out += `<rect x="${x + pw / 2 - 34}" y="${bottom - 10}" width="68" height="4" rx="2" fill="${t.fg}" opacity="0.8"/></g>`;
    out += `<path d="${shape}" fill="none" stroke="${t.frame}" stroke-width="1.5"/>`;
    out += dim(t, x + pw + 8, elTop + 26, elBottom, `${c.pad}px`, c.bad ? t.bad : t.fg);
    out += text(t, x, H - 8, c.ok ?? c.bad, { size: 13, weight: 600, color: c.bad ? t.bad : t.good });
  });
  return svg(t, { width: W, height: H, title: "pb-safe-4 clears the home indicator at the screen edge; inside a card it adds 34px for nothing, unless the card has safe-none" }, out);
}

const figures = { forms, modal, "opt-out": optOut };
for (const [name, draw] of Object.entries(figures)) {
  for (const [theme, t] of Object.entries(themes)) {
    writeFileSync(join(here, `${name}.${theme}.svg`), draw(t));
  }
}
console.log(`wrote ${Object.keys(figures).length * 2} figures to ${here}`);
