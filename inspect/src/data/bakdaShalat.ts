// Penanda dzikir/doa "ba'da shalat" dari data EQuran.id.
// Dicocokkan dari judul, grup, dan tag; kalau nanti nama di datanya berbeda,
// cukup sesuaikan POLA di bawah ini.
export interface DoaLike {
  judul?: string;
  grup?: string;
  tags?: string[];
}

const SHALAT = "(?:sholat|shalat|salat|solat)";
const SESUDAH = "(?:ba['’`]?da|bakda|setelah|sesudah|usai|selesai)";

const POLA = new RegExp(
  `${SESUDAH}\\s+${SHALAT}|${SHALAT}\\s+${SESUDAH}|dzikir\\s+${SESUDAH}|${SESUDAH}\\s+dzikir`,
  "i"
);

export const isBakdaShalat = (item: DoaLike): boolean =>
  POLA.test(`${item.judul ?? ""} ${item.grup ?? ""} ${(item.tags ?? []).join(" ")}`);