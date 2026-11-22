/**
 * Qiraat sab'ah: 7 imam (urutan asy-Syathibiyyah) × 2 rawi, dengan tariq jalur asy-Syathibiyyah/at-Taysir.
 * Sumber: laporan riset "Sanad qiraat sabah dan asyrah" (tariq 14 rawi dikonfirmasi dari at-Taysir & an-Nasyr).
 * Sama dengan data backend (src/data/qiraatStandard.ts) supaya id riwayah konsisten.
 *
 * `rawiKey` = nama rawi (Arab) sebagaimana dikirim backend di field `rawi` mushaf (Quranpedia).
 * null = tidak dipetakan otomatis (ad-Duri 'an al-Kisa'i & Khalaf: nama rawi saja ambigu,
 * dan mushaf ad-Duri yang tersedia adalah riwayah 'an Abi 'Amr).
 */

type L3 = { id: string; en: string; ar: string };

export interface RawiSabah {
  id: string;
  nama: L3;
  /** "Qalun 'an Nafi'" */
  label: L3;
  tariq: { latin: string; ar: string };
  rawiKey: string | null;
}

export interface ImamSabah {
  id: string;
  urutan: number;
  nama: L3;
  kota: L3;
  wafat: string; // Hijriah
  rawi: [RawiSabah, RawiSabah];
}

export const POPULAR_RIWAYAH_ID = "hafsh";

export const QIRAAT_SABAH: ImamSabah[] = [
  {
    id: "nafi", urutan: 1, wafat: "169",
    nama: { id: "Nafi' al-Madani", en: "Nafi' al-Madani", ar: "نافع المدني" },
    kota: { id: "Madinah", en: "Madinah", ar: "المدينة" },
    rawi: [
      { id: "qalun", rawiKey: "قالون", nama: { id: "Qalun", en: "Qalun", ar: "قالون" },
        label: { id: "Qalun 'an Nafi'", en: "Qalun from Nafi'", ar: "قالون عن نافع" },
        tariq: { latin: "Abu Nasyith", ar: "أبو نشيط" } },
      { id: "warsy", rawiKey: "ورش", nama: { id: "Warsy", en: "Warsh", ar: "ورش" },
        label: { id: "Warsy 'an Nafi'", en: "Warsh from Nafi'", ar: "ورش عن نافع" },
        tariq: { latin: "al-Azraq", ar: "الأزرق" } },
    ],
  },
  {
    id: "ibn-katsir", urutan: 2, wafat: "120",
    nama: { id: "Ibnu Katsir al-Makki", en: "Ibn Kathir al-Makki", ar: "ابن كثير المكي" },
    kota: { id: "Makkah", en: "Makkah", ar: "مكة" },
    rawi: [
      { id: "bazzi", rawiKey: "البزي", nama: { id: "al-Bazzi", en: "al-Bazzi", ar: "البزي" },
        label: { id: "al-Bazzi 'an Ibnu Katsir", en: "al-Bazzi from Ibn Kathir", ar: "البزي عن ابن كثير" },
        tariq: { latin: "Abu Rabi'ah", ar: "أبو ربيعة" } },
      { id: "qunbul", rawiKey: "قنبل", nama: { id: "Qunbul", en: "Qunbul", ar: "قنبل" },
        label: { id: "Qunbul 'an Ibnu Katsir", en: "Qunbul from Ibn Kathir", ar: "قنبل عن ابن كثير" },
        tariq: { latin: "Ibnu Mujahid", ar: "ابن مجاهد" } },
    ],
  },
  {
    id: "abu-amr", urutan: 3, wafat: "154",
    nama: { id: "Abu 'Amr al-Bashri", en: "Abu 'Amr al-Basri", ar: "أبو عمرو البصري" },
    kota: { id: "Basrah", en: "Basra", ar: "البصرة" },
    rawi: [
      { id: "duri-abu-amr", rawiKey: "الدوري", nama: { id: "ad-Duri", en: "ad-Duri", ar: "الدوري" },
        label: { id: "ad-Duri 'an Abi 'Amr", en: "ad-Duri from Abu 'Amr", ar: "الدوري عن أبي عمرو" },
        tariq: { latin: "Abu az-Za'ra'", ar: "أبو الزعراء" } },
      { id: "susi", rawiKey: "السوسي", nama: { id: "as-Susi", en: "as-Susi", ar: "السوسي" },
        label: { id: "as-Susi 'an Abi 'Amr", en: "as-Susi from Abu 'Amr", ar: "السوسي عن أبي عمرو" },
        tariq: { latin: "Musa ibn Jarir", ar: "موسى بن جرير" } },
    ],
  },
  {
    id: "ibn-amir", urutan: 4, wafat: "118",
    nama: { id: "Ibnu 'Amir asy-Syami", en: "Ibn 'Amir ash-Shami", ar: "ابن عامر الشامي" },
    kota: { id: "Damaskus", en: "Damascus", ar: "دمشق" },
    rawi: [
      { id: "hisyam", rawiKey: "هشام", nama: { id: "Hisyam", en: "Hisham", ar: "هشام" },
        label: { id: "Hisyam 'an Ibnu 'Amir", en: "Hisham from Ibn 'Amir", ar: "هشام عن ابن عامر" },
        tariq: { latin: "al-Hulwani", ar: "الحلواني" } },
      { id: "ibn-dzakwan", rawiKey: "ابن ذكوان", nama: { id: "Ibnu Dzakwan", en: "Ibn Dhakwan", ar: "ابن ذكوان" },
        label: { id: "Ibnu Dzakwan 'an Ibnu 'Amir", en: "Ibn Dhakwan from Ibn 'Amir", ar: "ابن ذكوان عن ابن عامر" },
        tariq: { latin: "al-Akhfasy", ar: "الأخفش" } },
    ],
  },
  {
    id: "asim", urutan: 5, wafat: "127",
    nama: { id: "'Ashim al-Kufi", en: "'Asim al-Kufi", ar: "عاصم الكوفي" },
    kota: { id: "Kufah", en: "Kufa", ar: "الكوفة" },
    rawi: [
      { id: "syubah", rawiKey: "شعبة", nama: { id: "Syu'bah", en: "Shu'bah", ar: "شعبة" },
        label: { id: "Syu'bah 'an 'Ashim", en: "Shu'bah from 'Asim", ar: "شعبة عن عاصم" },
        tariq: { latin: "Yahya ibn Adam", ar: "يحيى بن آدم" } },
      { id: "hafsh", rawiKey: "حفص", nama: { id: "Hafsh", en: "Hafs", ar: "حفص" },
        label: { id: "Hafsh 'an 'Ashim", en: "Hafs from 'Asim", ar: "حفص عن عاصم" },
        tariq: { latin: "'Ubaid ibn ash-Shabbah", ar: "عبيد بن الصباح" } },
    ],
  },
  {
    id: "hamzah", urutan: 6, wafat: "156",
    nama: { id: "Hamzah az-Zayyat", en: "Hamzah az-Zayyat", ar: "حمزة الزيات" },
    kota: { id: "Kufah", en: "Kufa", ar: "الكوفة" },
    rawi: [
      { id: "khalaf-hamzah", rawiKey: null, nama: { id: "Khalaf", en: "Khalaf", ar: "خلف" },
        label: { id: "Khalaf 'an Hamzah", en: "Khalaf from Hamzah", ar: "خلف عن حمزة" },
        tariq: { latin: "Idris al-Haddad", ar: "إدريس الحداد" } },
      { id: "khallad", rawiKey: "خلاد", nama: { id: "Khallad", en: "Khallad", ar: "خلاد" },
        label: { id: "Khallad 'an Hamzah", en: "Khallad from Hamzah", ar: "خلاد عن حمزة" },
        tariq: { latin: "Ibnu Syadzan", ar: "ابن شاذان" } },
    ],
  },
  {
    id: "kisai", urutan: 7, wafat: "189",
    nama: { id: "al-Kisa'i", en: "al-Kisa'i", ar: "الكسائي" },
    kota: { id: "Kufah", en: "Kufa", ar: "الكوفة" },
    rawi: [
      { id: "abul-harits", rawiKey: "أبو الحارث", nama: { id: "Abul Harits", en: "Abu al-Harith", ar: "أبو الحارث" },
        label: { id: "Abul Harits 'an al-Kisa'i", en: "Abu al-Harith from al-Kisa'i", ar: "أبو الحارث عن الكسائي" },
        tariq: { latin: "Muhammad ibn Yahya", ar: "محمد بن يحيى" } },
      { id: "duri-kisai", rawiKey: null, nama: { id: "ad-Duri", en: "ad-Duri", ar: "الدوري" },
        label: { id: "ad-Duri 'an al-Kisa'i", en: "ad-Duri from al-Kisa'i", ar: "الدوري عن الكسائي" },
        tariq: { latin: "Ja'far an-Nashibi", ar: "جعفر النصيبي" } },
    ],
  },
];

/** Samakan tulisan Arab: buang harakat/tatwil, seragamkan alif, rapikan spasi. */
export const normAr = (s: string | null | undefined) =>
  String(s ?? "")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();

const BY_KEY = new Map<string, string>();
QIRAAT_SABAH.forEach((im) => im.rawi.forEach((r) => r.rawiKey && BY_KEY.set(normAr(r.rawiKey), r.id)));

/** id riwayah dari field `rawi` mushaf backend (null bila tidak dikenal). */
export const riwayahIdOfMushafRawi = (rawi: string | null | undefined): string | null =>
  BY_KEY.get(normAr(rawi)) ?? null;
