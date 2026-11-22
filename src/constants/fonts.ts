// Font untuk teks Arab (ayat, nama surah, doa, hukum tajweed).
// Amiri Quran (OFL) dimuat lewat useFonts di app/_layout.tsx.
export const ARABIC_FONT = "AmiriQuran_400Regular"; 

// Font mushaf Madinah (KFGQPC Uthmanic Script Hafs) khusus teks ayat Al-Qur'an.
// Dimuat lewat useFonts di app/_layout.tsx.
export const QURAN_FONT = "UthmanicHafs";

/**
 * Gaya teks Arab standar = sama persis dengan teks ayat di layar Surah (AyatCard):
 * font mushaf Madinah (UthmanicHafs), 30/76 di layar normal, 26/64 di layar sempit (< 360 dp).
 * Pakai ini untuk semua teks Arab supaya ukuran dan font-nya seragam dengan Al-Qur'an.
 */
export const quranTextStyle = (compact = false) =>
  ({
    fontFamily: QURAN_FONT,
    fontSize: compact ? 26 : 30,
    lineHeight: compact ? 64 : 76,
    writingDirection: "rtl",
    textAlign: "right",
    includeFontPadding: false,
    textAlignVertical: "center",
  }) as const;
