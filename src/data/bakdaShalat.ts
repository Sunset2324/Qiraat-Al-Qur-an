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

// Doa yang berkaitan dengan shalat sunnah tertentu (istikharah, dhuha): masuk tab "Sholat",
// bukan "Ba'da Shalat" (walau judulnya memuat kata "setelah shalat ...").
const POLA_SHALAT_SUNNAH = /\b(?:istikh?a+rah?|istikharoh|dhuha+|duha+|dluha+)\b/i;

const teks = (item: DoaLike) => `${item.judul ?? ""} ${item.grup ?? ""} ${(item.tags ?? []).join(" ")}`;

export const isShalatSunnahDoa = (item: DoaLike): boolean => POLA_SHALAT_SUNNAH.test(teks(item));

export const isBakdaShalat = (item: DoaLike): boolean => !isShalatSunnahDoa(item) && POLA.test(teks(item));
