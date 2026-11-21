/**
 * Pewarnaan tajwid otomatis (rule-based) untuk teks Utsmani riwayat Hafs.
 * Dipakai pada mushaf "Tajwid Berwarna" (Quranpedia id 11).
 *
 * Catatan: ini analisis teks (huruf + harakat + tanda baca Utsmani), bukan data anotasi
 * dari Quranpedia. Hukum yang diwarnai: ghunnah, idgham (bighunnah/bilaghunnah/mimi),
 * ikhfa, ikhfa syafawi, iqlab, qalqalah, mad (wajib/jaiz/lazim), dan huruf yang tidak dibaca
 * (lam syamsiyyah). Izhar & mad asli sengaja tidak diwarnai (bacaan biasa).
 */

export const TAJWEED_MUSHAF_ID = "11";

export type TajweedRuleKey =
  | "ghunnah"
  | "idghamGhunnah"
  | "idghamNoGhunnah"
  | "idghamMimi"
  | "ikhfa"
  | "ikhfaSyafawi"
  | "iqlab"
  | "qalqalah"
  | "maddWajib"
  | "maddJaiz"
  | "maddLazim"
  | "silent";

export interface TajweedStyle {
  key: TajweedRuleKey;
  light: string;
  dark: string;
}

/** Urutan = urutan di legenda */
export const TAJWEED_STYLES: TajweedStyle[] = [
  { key: "ghunnah", light: "#E07B00", dark: "#FFA733" },
  { key: "idghamGhunnah", light: "#1E9E4A", dark: "#4ADE80" },
  { key: "idghamNoGhunnah", light: "#6B7B8C", dark: "#9FB0C0" },
  { key: "idghamMimi", light: "#0E9F8E", dark: "#2DD4BF" },
  { key: "ikhfa", light: "#D6336C", dark: "#F472B6" },
  { key: "ikhfaSyafawi", light: "#B5179E", dark: "#E879F9" },
  { key: "iqlab", light: "#2563EB", dark: "#60A5FA" },
  { key: "qalqalah", light: "#0891B2", dark: "#22D3EE" },
  { key: "maddWajib", light: "#E03131", dark: "#F87171" },
  { key: "maddJaiz", light: "#F08C00", dark: "#FBBF24" },
  { key: "maddLazim", light: "#7B1FA2", dark: "#C084FC" },
  { key: "silent", light: "#9AA0A6", dark: "#6B7280" },
];

const STYLE_BY_KEY = Object.fromEntries(TAJWEED_STYLES.map((s) => [s.key, s])) as Record<
  TajweedRuleKey,
  TajweedStyle
>;

export function tajweedColor(key: TajweedRuleKey, isDark: boolean): string {
  const s = STYLE_BY_KEY[key];
  return isDark ? s.dark : s.light;
}

// ---------- klasifikasi karakter ----------
const isMark = (c: string) => {
  const n = c.charCodeAt(0);
  return (
    (n >= 0x064b && n <= 0x065f) ||
    n === 0x0670 ||
    (n >= 0x06d6 && n <= 0x06ed) ||
    (n >= 0x08d3 && n <= 0x08ff) ||
    n === 0x0640 // tatwil: ikut huruf sebelumnya
  );
};
const SUKUN = new Set(["ْ", "ۡ"]);
const SHADDA = "ّ";
const MADDAH = "ٓ";
const TANWIN = new Set(["ً", "ٌ", "ٍ", "ࣰ", "ࣱ", "ࣲ"]);
const VOWELS = new Set(["َ", "ُ", "ِ", "ٖ", "ٗ", "ٞ", "ࣴ", "ࣵ", "ࣶ"]);
const SMALL_MEEM_IQLAB = "ۢ";

const IDGHAM_GHUNNAH = new Set(["ي", "ن", "م", "و"]);
const IDGHAM_NO_GHUNNAH = new Set(["ل", "ر"]);
const IKHFA = new Set([..."تثجدذزسشصضطظفقك"]);
const QALQALAH = new Set([..."قطبجد"]);
const SHAMSI = new Set([..."تثدذرزسشصضطظلن"]);
const HAMZA = new Set([..."ءأإؤئ"]);

interface Unit {
  base: string; // huruf dasar ("" untuk spasi)
  marks: string; // tanda yang menempel
  start: number;
  end: number;
  space: boolean;
}

function toUnits(text: string): Unit[] {
  const out: Unit[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === " " || ch === " ") {
      out.push({ base: "", marks: "", start: i, end: i + 1, space: true });
      i++;
      continue;
    }
    if (isMark(ch) && out.length && !out[out.length - 1].space) {
      const u = out[out.length - 1];
      u.marks += ch;
      u.end = i + 1;
      i++;
      continue;
    }
    out.push({ base: ch, marks: "", start: i, end: i + 1, space: false });
    i++;
  }
  return out;
}

const hasSukun = (m: string) => [...m].some((c) => SUKUN.has(c));
const hasTanwin = (m: string) => [...m].some((c) => TANWIN.has(c));
const hasVowel = (m: string) => [...m].some((c) => VOWELS.has(c));
const hasShadda = (m: string) => m.includes(SHADDA);

/** Huruf "mati tanpa tanda" (gaya Utsmani untuk idgham / mad): tidak ada harakat/sukun/shadda/tanwin. */
const bare = (m: string) =>
  !hasSukun(m) && !hasTanwin(m) && !hasVowel(m) && !hasShadda(m) && !m.includes("ٰ");

export interface TajweedSegment {
  text: string;
  rule: TajweedRuleKey | null;
}

const PRIORITY: TajweedRuleKey[] = [
  "silent",
  "ghunnah",
  "qalqalah",
  "ikhfaSyafawi",
  "idghamMimi",
  "ikhfa",
  "iqlab",
  "idghamNoGhunnah",
  "idghamGhunnah",
  "maddWajib",
  "maddJaiz",
  "maddLazim",
];
const prio = (k: TajweedRuleKey) => PRIORITY.indexOf(k);

export function analyzeTajweed(text: string): TajweedSegment[] {
  const clean = text.replace(/﻿/g, "");
  const units = toUnits(clean);
  const rules: (TajweedRuleKey | null)[] = new Array(units.length).fill(null);

  const set = (i: number, k: TajweedRuleKey) => {
    if (i < 0 || i >= units.length || units[i].space) return;
    const cur = rules[i];
    if (!cur || prio(k) >= prio(cur)) rules[i] = k;
  };

  /** Huruf berikutnya (melewati spasi); sameWord=false jika melintasi spasi. */
  const nextLetter = (i: number): { idx: number; sameWord: boolean } | null => {
    let j = i + 1;
    let crossed = false;
    while (j < units.length && units[j].space) {
      crossed = true;
      j++;
    }
    if (j >= units.length) return null;
    return { idx: j, sameWord: !crossed };
  };

  // indeks huruf terakhir (untuk qalqalah waqf)
  let lastLetter = units.length - 1;
  while (lastLetter >= 0 && units[lastLetter].space) lastLetter--;

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (u.space) continue;
    const { base, marks } = u;

    // --- tidak dibaca: lam syamsiyyah (ٱل + huruf bertasydid)
    if (base === "ل" && bare(marks) && i > 0 && units[i - 1].base === "ٱ") {
      const n = nextLetter(i);
      if (n && n.sameWord && SHAMSI.has(units[n.idx].base) && hasShadda(units[n.idx].marks)) set(i, "silent");
    }

    // --- ghunnah: nun / mim bertasydid
    if ((base === "ن" || base === "م") && hasShadda(marks)) set(i, "ghunnah");

    // --- qalqalah
    if (QALQALAH.has(base) && hasSukun(marks)) set(i, "qalqalah");
    else if (QALQALAH.has(base) && i === lastLetter && !hasTanwin(marks) && !hasShadda(marks)) set(i, "qalqalah");

    // --- nun sukun / tanwin
    const nunSakin = base === "ن" && (hasSukun(marks) || (bare(marks) && nextShadda(i)));
    const tanwin = hasTanwin(marks) || marks.includes(SMALL_MEEM_IQLAB);
    if (nunSakin || tanwin) {
      const n = nextLetter(i);
      if (n) {
        const nb = units[n.idx].base;
        if (marks.includes(SMALL_MEEM_IQLAB) || nb === "ب") {
          if (nb === "ب" || marks.includes(SMALL_MEEM_IQLAB)) set(i, "iqlab");
        } else if (IDGHAM_GHUNNAH.has(nb) && n.sameWord) {
          // izhar mutlaq (dunya, qinwan, shinwan, sinwan): tidak diwarnai
        } else if (IDGHAM_GHUNNAH.has(nb)) {
          set(i, "idghamGhunnah");
          if (hasShadda(units[n.idx].marks)) set(n.idx, "idghamGhunnah");
        } else if (IDGHAM_NO_GHUNNAH.has(nb)) {
          set(i, "idghamNoGhunnah");
          if (hasShadda(units[n.idx].marks)) set(n.idx, "idghamNoGhunnah");
        } else if (IKHFA.has(nb)) {
          set(i, "ikhfa");
        }
      }
    }

    // --- mim sukun
    const mimSakin = base === "م" && (hasSukun(marks) || (bare(marks) && nextShadda(i)));
    if (mimSakin) {
      const n = nextLetter(i);
      if (n) {
        const nb = units[n.idx].base;
        if (nb === "ب") set(i, "ikhfaSyafawi");
        else if (nb === "م") {
          set(i, "idghamMimi");
          if (hasShadda(units[n.idx].marks)) set(n.idx, "idghamMimi");
        }
      }
    }

    // --- mad dengan tanda maddah (4–6 harakat)
    if (marks.includes(MADDAH) || base === "\u0622") {
      const n = nextLetter(i);
      let key: TajweedRuleKey = "maddLazim";
      if (n) {
        const nu = units[n.idx];
        if (HAMZA.has(nu.base)) key = n.sameWord ? "maddWajib" : "maddJaiz";
        else if (hasShadda(nu.marks) || hasSukun(nu.marks)) key = "maddLazim";
        else key = "maddJaiz";
      }
      set(i, key);
    }
  }

  function nextShadda(i: number): boolean {
    const n = nextLetter(i);
    return !!n && hasShadda(units[n.idx].marks);
  }

  // gabungkan unit berurutan dengan aturan sama
  const segs: TajweedSegment[] = [];
  units.forEach((u, i) => {
    const piece = clean.slice(u.start, u.end);
    const r = rules[i];
    const last = segs[segs.length - 1];
    if (last && last.rule === r) last.text += piece;
    else segs.push({ text: piece, rule: r });
  });
  return segs;
}
