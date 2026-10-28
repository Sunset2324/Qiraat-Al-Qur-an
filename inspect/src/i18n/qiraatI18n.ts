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

// Qari (nama Arab -> transliterasi Latin). Selain ini tampil nama Arab apa adanya.
const QARI: Record<string, string> = {
  "إبراهيم الأخضر": "Ibrahim Al-Akhdar",
  "أبو بكر الشاطري": "Abu Bakr Ash-Shatri",
  "أحمد بن علي العجمي": "Ahmad Al-Ajmi",
  "أحمد العجمي": "Ahmad Al-Ajmi",
  "أحمد نعينع": "Ahmad Nuaina",
  "أكرم العلاقمي": "Akram Al-Alaqmi",
  "ياسين": "Yasin",
  "سهل ياسين": "Sahl Yasin",
  "خالد القحطاني": "Khalid Al-Qahtani",
  "خليفة الطنيجي": "Khalifa At-Tunaiji",
  "سعود الشريم": "Saud Ash-Shuraim",
  "صلاح البدير": "Salah Al-Budair",
  "صلاح بو خاطر": "Salah Bukhatir",
  "عبدالباسط عبدالصمد": "Abdul Basit Abdus Samad",
  "عبدالرحمن السديس": "Abdurrahman As-Sudais",
  "عبدالله المطرود": "Abdullah Al-Matrood",
  "عبدالله بصفر": "Abdullah Basfar",
  "عبدالله عواد الجهني": "Abdullah Awad Al-Juhani",
  "عبدالمحسن القاسم": "Abdul Muhsin Al-Qasim",
  "علي جابر": "Ali Jaber",
  "علي حجاج السويسي": "Ali Hajjaj As-Suwaisi",
  "فارس عباد": "Fares Abbad",
  "ناصر القطامي": "Nasser Al-Qatami",
  "هاني الرفاعي": "Hani Ar-Rifai",
  "ياسر الدوسري": "Yasser Ad-Dosari",
  "ماهر المعيقلي": "Maher Al-Muaiqly",
  "محمد الطبلاوي": "Muhammad At-Tablawi",
  "مشاري راشد العفاسي": "Mishary Rashid Alafasy",
  "مشاري العفاسي": "Mishary Rashid Alafasy",
  "محمود خليل الحصري": "Mahmoud Khalil Al-Husary",
  "محمد صديق المنشاوي": "Muhammad Siddiq Al-Minshawi",
  "محمد أيوب": "Muhammad Ayyub",
  "محمد جبريل": "Muhammad Jibreel",
  "محمود علي البنا": "Mahmoud Ali Al-Banna",
  "مصطفى إسماعيل": "Mustafa Ismail",
  "سعد الغامدي": "Saad Al-Ghamdi",
  "معيض الحارثي": "Muaidh Al-Harthi",
  "منصور السالمي": "Mansour As-Salimi",
  "علي الحذيفي": "Ali Al-Hudhaify",
  "بندر بليلة": "Bandar Baleela",
  "إدريس أبكر": "Idris Abkar",
  "ماجد الزامل": "Majed Az-Zamil",
  "وديع اليمني": "Wadee Al-Yamani",
  "توفيق الصائغ": "Tawfeeq As-Sayegh",
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

// Samakan penulisan: tanpa harakat, bentuk alif seragam, tanpa spasi ("عبد الله" == "عبدالله")
const squash = (x: string) =>
  strip(x).replace(/[أإآٱ]/g, "ا").replace(/\s+/g, "");
const QARI_INDEX = Object.entries(QARI)
  .map(([k, v]) => [squash(k), v] as const)
  .sort((a, b) => b[0].length - a[0].length); // yang paling spesifik dicoba dulu

/** Nama qari: id/en -> transliterasi Latin bila dikenal; fallback nama Arab. */
export function reciterName(ar: string | null | undefined, lang: Lang): string {
  if (!ar) return "";
  if (lang === "ar") return ar;
  const key = squash(ar);
  const exact = QARI_INDEX.find(([k]) => k === key);
  if (exact) return exact[1];
  // nama panjang yang memuat nama qari (mis. judul lengkap entri), hanya untuk kunci cukup panjang
  const part = QARI_INDEX.find(([k]) => k.length >= 8 && key.includes(k));
  return part ? part[1] : ar;
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

const MUSHAF_VARIANT: Record<string, { id: string; en: string }> = {
  "نسخة نصية": { id: "Versi teks", en: "Text edition" },
  "نستعليق": { id: "Nastaliq", en: "Nastaliq" },
  "التجويد الملون": { id: "Tajwid berwarna", en: "Color-coded tajweed" },
  "الأوقاف الليبية": { id: "Awqaf Libya", en: "Libyan Awqaf" },
};

/** Judul mushaf per bahasa, mis. "Warsh 'an Nafi'" atau "Hafs 'an 'Ashim • Versi teks". */
export function mushafTitle(m: { name: string; rawi?: string | null }, lang: Lang): string {
  if (lang === "ar") return m.name;
  const label = m.rawi ? rawiLabel(m.rawi, lang) : "";
  if (!label || label === m.rawi) return m.name;
  const variant = Object.entries(MUSHAF_VARIANT).find(([k]) => strip(m.name).includes(strip(k)));
  return variant ? `${label} • ${variant[1][lang]}` : label;
}
