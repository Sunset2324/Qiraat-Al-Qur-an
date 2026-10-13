import { useLanguage } from "../context/LanguageContext";

export type Lang = "id" | "en";

/** Ambil bahasa aktif dari LanguageContext → "id" | "en" (default id). */
export function useLang(): Lang {
  const ctx: any = useLanguage();
  const raw = String(ctx?.language ?? ctx?.lang ?? "id").toLowerCase();
  return raw.startsWith("en") ? "en" : "id";
}

const STR = {
  id: {
    loadingMushaf: "Memuat daftar mushaf...",
    loadFailed: "Gagal Memuat Data",
    retry: "Coba Muat Ulang",
    topTag: "ILMU AL-QUR'AN",
    title: "Pilihan Mushaf",
    aboutTitle: "Tentang Mushaf",
    aboutBody:
      "Aplikasi ini mendukung berbagai riwayat Mushaf Al-Qur'an yang valid. Pilih mushaf yang ingin Anda gunakan sebagai tampilan default.",
    listTitle: "Daftar Mushaf Tersedia",
    popular: "POPULER",
    selectedTitle: "Mushaf Terpilih",
    selectedBody: (n: string) => `${n} berhasil dipilih.`,
    backToMushaf: "Kembali ke Mushaf Belajar",
    // qari
    pickReciter: "Pilih Qari",
    pickReciterShort: "Pilih qari",
    loadingShort: "Memuat...",
    all: "Semua",
    perAyah: "Per ayat",
    fullSurah: "Full surah",
    reciterCount: (n: number) =>
      `${n} qari tersedia untuk surah ini • "Ayah" = bisa Ikuti Bacaan, "Surah" = file full surah`,
    noReciterFilter: "Tidak ada qari untuk filter ini.",
    noReciterSurah: "Belum ada qari yang tersedia untuk surah ini.",
    reciterLoadFailed: "Gagal memuat daftar qari. Pastikan koneksi internet aktif.",
    badgeAyah: "Ayah",
    badgeSurah: "Surah",
    syncAyah: "(Sinkron per Ayat)",
    perSurah: "(Per Surah)",
    reciterLabel: "Qari",
    onlyPerAyah: "🎵 Qari ini cuma punya audio per-ayat, nggak ada file full-surah",
    noPerAyah: "Qari ini nggak punya audio per-ayat",
  },
  en: {
    loadingMushaf: "Loading mushaf list...",
    loadFailed: "Failed to Load Data",
    retry: "Try Again",
    topTag: "QUR'AN SCIENCES",
    title: "Mushaf Selection",
    aboutTitle: "About Mushaf",
    aboutBody:
      "This app supports several valid Qur'an Mushaf transmissions. Choose the mushaf you want to use as your default view.",
    listTitle: "Available Mushafs",
    popular: "POPULAR",
    selectedTitle: "Mushaf Selected",
    selectedBody: (n: string) => `${n} has been selected.`,
    backToMushaf: "Back to Study Mushaf",
    pickReciter: "Choose Reciter",
    pickReciterShort: "Choose reciter",
    loadingShort: "Loading...",
    all: "All",
    perAyah: "Per verse",
    fullSurah: "Full surah",
    reciterCount: (n: number) =>
      `${n} reciters available for this surah • "Verse" = supports Follow Along, "Surah" = full-surah file`,
    noReciterFilter: "No reciters for this filter.",
    noReciterSurah: "No reciters are available for this surah yet.",
    reciterLoadFailed: "Failed to load reciters. Please check your internet connection.",
    badgeAyah: "Verse",
    badgeSurah: "Surah",
    syncAyah: "(Verse-synced)",
    perSurah: "(Full surah)",
    reciterLabel: "Reciter",
    onlyPerAyah: "🎵 This reciter only has per-verse audio, no full-surah file",
    noPerAyah: "This reciter has no per-verse audio",
  },
} as const;

export function useQiraatT() {
  const lang = useLang();
  return { lang, s: STR[lang] };
}

// ---------- Label metadata Quranpedia (Arab → id/en) ----------

const RAWI: Record<string, { id: string; en: string }> = {
  "حفص": { id: "Hafs 'an 'Ashim", en: "Hafs from 'Asim" },
  "ورش": { id: "Warsh 'an Nafi'", en: "Warsh from Nafi'" },
  "قالون": { id: "Qalun 'an Nafi'", en: "Qalun from Nafi'" },
  "شعبة": { id: "Syu'bah 'an 'Ashim", en: "Shu'bah from 'Asim" },
  "الدوري": { id: "Ad-Duri", en: "Ad-Duri" },
  "السوسي": { id: "As-Susi 'an Abi 'Amr", en: "As-Susi from Abu 'Amr" },
  "البزي": { id: "Al-Bazzi 'an Ibn Katsir", en: "Al-Bazzi from Ibn Kathir" },
  "قنبل": { id: "Qunbul 'an Ibn Katsir", en: "Qunbul from Ibn Kathir" },
  "هشام": { id: "Hisyam 'an Ibn 'Amir", en: "Hisham from Ibn 'Amir" },
  "ابن ذكوان": { id: "Ibn Dzakwan", en: "Ibn Dhakwan" },
  "خلف": { id: "Khalaf 'an Hamzah", en: "Khalaf from Hamzah" },
  "خلاد": { id: "Khallad 'an Hamzah", en: "Khallad from Hamzah" },
  "أبو الحارث": { id: "Abul Harits 'an Al-Kisa'i", en: "Abu al-Harith from al-Kisa'i" },
};

const RECITATION: Record<string, { id: string; en: string }> = {
  "مرتل": { id: "Murattal (tartil)", en: "Murattal (measured)" },
  "مجود": { id: "Mujawwad (indah/panjang)", en: "Mujawwad (melodic)" },
  "معلم": { id: "Mu'allim (pembelajaran)", en: "Mu'allim (teaching)" },
  "مرتل وتعليمي": { id: "Murattal & pembelajaran", en: "Murattal & teaching" },
};

const CLASSIFICATION: Record<string, { id: string; en: string }> = {
  "حسب السور": { id: "Per surah", en: "By surah" },
  "حسب الآيات": { id: "Per ayat", en: "By verse" },
};

// Qari populer (nama Arab → transliterasi). Selain ini tampil nama Arab apa adanya.
const QARI: Record<string, string> = {
  "إبراهيم الأخضر": "Ibrahim Al-Akhdar",
  "مشاري راشد العفاسي": "Mishary Rashid Alafasy",
  "عبد الباسط عبد الصمد": "Abdul Basit Abdus Samad",
  "محمود خليل الحصري": "Mahmoud Khalil Al-Husary",
  "محمد صديق المنشاوي": "Muhammad Siddiq Al-Minshawi",
  "عبد الرحمن السديس": "Abdurrahman As-Sudais",
  "سعود الشريم": "Saud Ash-Shuraim",
  "ماهر المعيقلي": "Maher Al-Muaiqly",
  "ياسر الدوسري": "Yasser Ad-Dosari",
  "سعد الغامدي": "Saad Al-Ghamdi",
  "أحمد العجمي": "Ahmad Al-Ajmi",
  "ناصر القطامي": "Nasser Al-Qatami",
  "هاني الرفاعي": "Hani Ar-Rifai",
  "علي الحذيفي": "Ali Al-Hudhaify",
  "محمد أيوب": "Muhammad Ayyub",
  "بندر بليلة": "Bandar Baleela",
  "عبد الله بصفر": "Abdullah Basfar",
  "أبو بكر الشاطري": "Abu Bakr Ash-Shatri",
  "فارس عباد": "Fares Abbad",
  "إدريس أبكر": "Idris Abkar",
};

const strip = (s: string) => s.replace(/[ً-ٰٟ]/g, "").trim(); // buang harakat

function lookup(map: Record<string, { id: string; en: string }>, ar: string | null | undefined, lang: Lang) {
  if (!ar) return "";
  const key = strip(ar);
  const hit = map[ar] || map[key] || Object.entries(map).find(([k]) => strip(k) === key)?.[1];
  return hit ? hit[lang] : ar;
}

export const rawiLabel = (ar: string | null | undefined, lang: Lang) => lookup(RAWI, ar, lang);
export const recitationLabel = (ar: string | null | undefined, lang: Lang) => lookup(RECITATION, ar, lang);
export const classificationLabel = (ar: string | null | undefined, lang: Lang) =>
  lookup(CLASSIFICATION, ar, lang);

/** Nama qari: id/en → transliterasi Latin bila dikenal; fallback nama Arab. */
export function reciterName(ar: string | null | undefined, lang: Lang): string {
  if (!ar) return "";
  const key = strip(ar);
  for (const [k, v] of Object.entries(QARI)) {
    if (key.includes(strip(k))) return v;
  }
  return ar;
}

/** Baris detail di bawah nama qari, mis. "Hafs 'an 'Ashim • Murattal (tartil)". */
export const reciterDetail = (
  r: { rawi?: string | null; recitationType?: string | null },
  lang: Lang
) => [rawiLabel(r.rawi, lang), recitationLabel(r.recitationType, lang)].filter(Boolean).join(" • ");

/** Deskripsi mushaf per bahasa bila backend hanya kirim Indonesia. */
export function mushafDescription(
  m: { name: string; description: string },
  lang: Lang
): string {
  if (lang === "id") return m.description;
  const n = m.name.toLowerCase();
  const hit = Object.entries(RAWI).find(([ar]) => m.name.includes(ar));
  if (n.includes("hafs") || n.includes("hafsh") || hit?.[0] === "حفص")
    return "The most widely used transmission worldwide (Hafs from 'Asim), also the standard of the Madinah Mushaf.";
  if (n.includes("warsh") || n.includes("warasy"))
    return "Transmission of Warsh from Nafi', widely used in North and West Africa.";
  if (n.includes("qalun") || n.includes("qaloon"))
    return "Transmission of Qalun from Nafi', used in Libya, Tunisia and parts of Africa.";
  return m.description; // fallback: teks asli dari server
}