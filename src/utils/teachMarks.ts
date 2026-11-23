import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tanda per kata di Mode Mengajar (Bandingkan Riwayat).
 * Disimpan HANYA di perangkat, per surah per mushaf (riwayat). Yang disimpan cuma posisi
 * (nomor ayat + urutan kata), bukan teks Al-Qur'an.
 */

export type MarkType = "underline" | "highlight" | "strike" | "box";
export type MarkColor = "red" | "green" | "blue";

export interface WordMark {
  id: string;
  ayah: number;
  /** urutan kata (0-based) hasil splitWords, inklusif */
  start: number;
  end: number;
  type: MarkType;
  color: MarkColor;
}

export const MARK_COLORS: Record<MarkColor, { solid: string; soft: string }> = {
  red: { solid: "#dc2626", soft: "rgba(220,38,38,0.22)" },
  green: { solid: "#059669", soft: "rgba(5,150,105,0.22)" },
  blue: { solid: "#2563eb", soft: "rgba(37,99,235,0.22)" },
};

/** Batas per surah per riwayat supaya entri tetap kecil (AsyncStorage Android). */
export const MAX_MARKS = 200;

const key = (surah: number, mushafId: string) => `teach_marks_v1:${surah}:${mushafId}`;

/** Pemisah kata yang dipakai di tampilan DAN di penyimpanan (harus sama). */
export const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

export async function loadMarks(surah: number, mushafId: string): Promise<WordMark[]> {
  try {
    const raw = await AsyncStorage.getItem(key(surah, mushafId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.marks) ? (parsed.marks as WordMark[]) : [];
  } catch {
    return [];
  }
}

export async function saveMarks(surah: number, mushafId: string, marks: WordMark[]) {
  try {
    if (marks.length === 0) await AsyncStorage.removeItem(key(surah, mushafId));
    else await AsyncStorage.setItem(key(surah, mushafId), JSON.stringify({ marks: marks.slice(-MAX_MARKS) }));
  } catch (e) {
    console.warn("[teachMarks] gagal menyimpan:", e);
  }
}

const covers = (m: WordMark, ayah: number, i: number) => m.ayah === ayah && i >= m.start && i <= m.end;

/**
 * Terapkan satu aksi ke daftar tanda.
 * - Tanda dengan jenis + warna + rentang yang persis sama -> dihapus (toggle).
 * - Tanda jenis sama yang bertumpuk -> diganti yang baru.
 * - erase -> hapus semua tanda yang menyentuh rentang itu.
 */
export function applyMark(
  marks: WordMark[],
  ayah: number,
  start: number,
  end: number,
  tool: MarkType | "erase",
  color: MarkColor
): WordMark[] {
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const overlaps = (m: WordMark) => m.ayah === ayah && m.start <= hi && m.end >= lo;
  if (tool === "erase") return marks.filter((m) => !overlaps(m));
  const same = marks.find((m) => m.ayah === ayah && m.start === lo && m.end === hi && m.type === tool && m.color === color);
  if (same) return marks.filter((m) => m !== same);
  const rest = marks.filter((m) => !(overlaps(m) && m.type === tool));
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return [...rest, { id, ayah, start: lo, end: hi, type: tool, color }].slice(-MAX_MARKS);
}

/** Tanda yang berlaku pada satu kata (paling baru menang per jenis). */
export function marksAt(marks: WordMark[], ayah: number, i: number) {
  const out: Partial<Record<MarkType, MarkColor>> = {};
  for (const m of marks) if (covers(m, ayah, i)) out[m.type] = m.color;
  return out;
}
