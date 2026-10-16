import type { Language } from "./translations";

type Lang = Language;

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
  if (lang === "ar") return ar; // data Quranpedia sudah berbahasa Arab
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
  if (lang === "ar") return ar;
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
  const ar = lang === "ar";
  const hit = Object.entries(RAWI).find(([ar]) => m.name.includes(ar));
  if (n.includes("hafs") || n.includes("hafsh") || hit?.[0] === "حفص")
    return ar ? "الرواية الأكثر انتشارًا في العالم (حفص عن عاصم) وهي رواية مصحف المدينة." : "The most widely used transmission worldwide (Hafs from 'Asim), also the standard of the Madinah Mushaf.";
  if (n.includes("warsh") || n.includes("warasy"))
    return ar ? "رواية ورش عن نافع، منتشرة في شمال أفريقيا وغربها." : "Transmission of Warsh from Nafi', widely used in North and West Africa.";
  if (n.includes("qalun") || n.includes("qaloon"))
    return ar ? "رواية قالون عن نافع، تُستعمل في ليبيا وتونس وأجزاء من أفريقيا." : "Transmission of Qalun from Nafi', used in Libya, Tunisia and parts of Africa.";
  return m.description; // fallback: teks asli dari server
}