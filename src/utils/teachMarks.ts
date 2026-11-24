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

/**
 * Coretan tinta bebas di atas satu ayat. Titik disimpan relatif (0-1) terhadap ukuran area teks ayat
 * saat digambar; `scale` dan `cw` (lebar area, px) dicatat untuk mendeteksi coretan yang bisa bergeser
 * setelah ukuran huruf / orientasi berubah.
 */
export interface InkStroke {
  id: string;
  ayah: number;
  color: MarkColor;
  pts: Array<[number, number]>;
  scale: number;
  cw: number;
}

export interface TeachAnnot {
  marks: WordMark[];
  ink: InkStroke[];
}
export const EMPTY_ANNOT: TeachAnnot = { marks: [], ink: [] };

/** Batas per surah per riwayat supaya entri tetap kecil (AsyncStorage Android, batas aman ~1,5 MB). */
export const MAX_MARKS = 200;
export const MAX_STROKES = 200;
export const MAX_POINTS = 200;

const key = (surah: number, mushafId: string) => `teach_marks_v1:${surah}:${mushafId}`;

/** Pemisah kata yang dipakai di tampilan DAN di penyimpanan (harus sama). */
export const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

export async function loadAnnot(surah: number, mushafId: string): Promise<TeachAnnot> {
  try {
    const raw = await AsyncStorage.getItem(key(surah, mushafId));
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      marks: Array.isArray(parsed?.marks) ? (parsed.marks as WordMark[]) : [],
      ink: Array.isArray(parsed?.ink) ? (parsed.ink as InkStroke[]) : [],
    };
  } catch {
    return EMPTY_ANNOT;
  }
}

export async function saveAnnot(surah: number, mushafId: string, a: TeachAnnot) {
  try {
    if (a.marks.length === 0 && a.ink.length === 0) await AsyncStorage.removeItem(key(surah, mushafId));
    else
      await AsyncStorage.setItem(
        key(surah, mushafId),
        JSON.stringify({ marks: a.marks.slice(-MAX_MARKS), ink: a.ink.slice(-MAX_STROKES) })
      );
  } catch (e) {
    console.warn("[teachMarks] gagal menyimpan:", e);
  }
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Kurangi titik coretan: buang titik yang terlalu rapat, batasi jumlah titik. */
export function simplify(pts: Array<[number, number]>, minDist = 0.004): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const p of pts) {
    const q = out.at(-1);
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= minDist) out.push([+p[0].toFixed(4), +p[1].toFixed(4)]);
  }
  if (out.length <= MAX_POINTS) return out;
  const step = out.length / MAX_POINTS;
  return Array.from({ length: MAX_POINTS }, (_, i) => out[Math.floor(i * step)]);
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
  return [...rest, { id: newId(), ayah, start: lo, end: hi, type: tool, color }].slice(-MAX_MARKS);
}

/** Tanda yang berlaku pada satu kata (paling baru menang per jenis). */
export function marksAt(marks: WordMark[], ayah: number, i: number) {
  const out: Partial<Record<MarkType, MarkColor>> = {};
  for (const m of marks) if (covers(m, ayah, i)) out[m.type] = m.color;
  return out;
}
