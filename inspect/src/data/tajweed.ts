export interface TajweedContoh {
  arab: string;
  ket?: string; // keterangan / referensi ayat
}

export interface TajweedRule {
  id: number;
  kategori: string;
  judul: string;
  arab: string; // nama hukum dalam Arab
  huruf?: string; // huruf pemicu
  ringkas: string; // untuk kartu di daftar
  cara: string; // cara membaca
  contoh: TajweedContoh[];
  catatan?: string;
  durasi?: string; // untuk mad / ghunnah
}

export const KATEGORI_TAJWEED = [
  "Nun Mati & Tanwin",
  "Mim Mati",
  "Ghunnah & Qalqalah",
  "Tafkhim & Tarqiq",
  "Mad",
] as const;

export const TAJWEED_DATA: TajweedRule[] = [
  // ===== NUN MATI & TANWIN =====
  {
    id: 1,
    kategori: "Nun Mati & Tanwin",
    judul: "Izhar Halqi",
    arab: "إِظْهَار حَلْقِي",
    huruf: "ء  ه  ع  ح  غ  خ",
    ringkas: "Nun mati/tanwin dibaca jelas tanpa dengung bila bertemu huruf tenggorokan.",
    cara: "Bunyikan nun mati atau tanwin dengan jelas dan tegas, tanpa dengung dan tanpa dimasukkan ke huruf berikutnya.",
    contoh: [
      { arab: "مَنْ آمَنَ", ket: "Al-Baqarah: 62" },
      { arab: "أَنْعَمْتَ", ket: "Al-Fatihah: 7" },
      { arab: "مِنْ هَادٍ", ket: "Ar-Ra'd: 33" },
      { arab: "مِنْ خَيْرٍ", ket: "Al-Baqarah: 105" },
    ],
  },
  {
    id: 2,
    kategori: "Nun Mati & Tanwin",
    judul: "Idgham Bighunnah",
    arab: "إِدْغَام بِغُنَّة",
    huruf: "ي  ن  م  و  (yanmu)",
    ringkas: "Nun mati/tanwin melebur ke huruf yanmu dengan dengung.",
    cara: "Nun mati/tanwin dilebur ke huruf sesudahnya dan ditahan dengan dengung sekitar 2 harakat.",
    durasi: "Dengung ± 2 harakat",
    contoh: [
      { arab: "مَنْ يَقُولُ", ket: "Al-Baqarah: 8" },
      { arab: "فَمَنْ يَعْمَلْ", ket: "Az-Zalzalah: 7" },
      { arab: "مِنْ وَالٍ", ket: "Ar-Ra'd: 11" },
      { arab: "يَوْمَئِذٍ نَاعِمَةٌ", ket: "Al-Ghashiyah: 8" },
    ],
    catatan:
      "Jika nun mati dan huruf ya/wawu berada dalam satu kata (contoh: دُنْيَا، بُنْيَانٌ، صِنْوَانٌ، قِنْوَانٌ), hukumnya Izhar Mutlaq, bukan idgham.",
  },
  {
    id: 3,
    kategori: "Nun Mati & Tanwin",
    judul: "Idgham Bilaghunnah",
    arab: "إِدْغَام بِلَا غُنَّة",
    huruf: "ل  ر",
    ringkas: "Nun mati/tanwin melebur ke lam atau ra tanpa dengung.",
    cara: "Nun mati/tanwin dilebur sepenuhnya ke huruf lam atau ra tanpa dengung.",
    contoh: [
      { arab: "مِنْ رَبِّهِمْ", ket: "Al-Baqarah: 5" },
      { arab: "هُدًى لِلْمُتَّقِينَ", ket: "Al-Baqarah: 2" },
      { arab: "غَفُورٌ رَحِيمٌ" },
    ],
  },
  {
    id: 4,
    kategori: "Nun Mati & Tanwin",
    judul: "Iqlab",
    arab: "إِقْلَاب",
    huruf: "ب",
    ringkas: "Nun mati/tanwin berubah menjadi mim samar saat bertemu ba.",
    cara: "Ubah bunyi nun mati/tanwin menjadi mim, rapatkan bibir dan dengungkan sekitar 2 harakat, lalu lanjut ke ba.",
    durasi: "Dengung ± 2 harakat",
    contoh: [
      { arab: "مِنْ بَعْدِ", ket: "Al-Baqarah: 27" },
      { arab: "أَنْبِئْهُمْ", ket: "Al-Baqarah: 33" },
      { arab: "سَمِيعٌ بَصِيرٌ" },
    ],
  },
  {
    id: 5,
    kategori: "Nun Mati & Tanwin",
    judul: "Ikhfa Haqiqi",
    arab: "إِخْفَاء حَقِيقِي",
    huruf: "ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك",
    ringkas: "Nun mati/tanwin dibaca samar dengan dengung bila bertemu 15 huruf ikhfa.",
    cara: "Bunyi nun disamarkan (antara izhar dan idgham) dengan dengung sekitar 2 harakat, lidah bersiap ke makhraj huruf berikutnya tanpa menyentuhnya penuh.",
    durasi: "Dengung ± 2 harakat",
    contoh: [
      { arab: "مِنْ قَبْلِكَ", ket: "Al-Baqarah: 4" },
      { arab: "أَنْتُمْ" },
      { arab: "مَنْ كَانَ" },
      { arab: "عَلِيمٌ قَدِيرٌ" },
    ],
  },

  // ===== MIM MATI =====
  {
    id: 6,
    kategori: "Mim Mati",
    judul: "Ikhfa Syafawi",
    arab: "إِخْفَاء شَفَوِي",
    huruf: "ب",
    ringkas: "Mim mati dibaca samar dengan dengung bila bertemu ba.",
    cara: "Rapatkan bibir ringan (tidak ditekan) sambil mendengung sekitar 2 harakat, lalu lanjut ke ba.",
    durasi: "Dengung ± 2 harakat",
    contoh: [
      { arab: "تَرْمِيهِمْ بِحِجَارَةٍ", ket: "Al-Fil: 4" },
      { arab: "يَعْتَصِمْ بِاللَّهِ", ket: "Ali Imran: 101" },
    ],
  },
  {
    id: 7,
    kategori: "Mim Mati",
    judul: "Idgham Mimi",
    arab: "إِدْغَام مِثْلَيْن / مِيمِي",
    huruf: "م",
    ringkas: "Mim mati bertemu mim, dilebur dengan dengung.",
    cara: "Lebur mim mati ke mim berikutnya dan dengungkan sekitar 2 harakat (disebut juga Idgham Mutsalain Shaghir).",
    durasi: "Dengung ± 2 harakat",
    contoh: [{ arab: "كَمْ مِنْ فِئَةٍ", ket: "Al-Baqarah: 249" }],
  },
  {
    id: 8,
    kategori: "Mim Mati",
    judul: "Izhar Syafawi",
    arab: "إِظْهَار شَفَوِي",
    huruf: "Semua huruf selain ب dan م",
    ringkas: "Mim mati dibaca jelas tanpa dengung bila bertemu huruf selain ba dan mim.",
    cara: "Bunyikan mim mati dengan jelas. Waspadai huruf wawu dan fa: jangan sampai mim terdengar samar karena bibir yang berdekatan.",
    contoh: [
      { arab: "عَلَيْهِمْ وَلَا", ket: "Al-Fatihah: 7" },
      { arab: "هُمْ فِيهَا" },
      { arab: "أَمْ لَمْ" },
    ],
  },

  // ===== GHUNNAH & QALQALAH =====
  {
    id: 9,
    kategori: "Ghunnah & Qalqalah",
    judul: "Ghunnah Musyaddadah",
    arab: "غُنَّة مُشَدَّدَة",
    huruf: "نّ  مّ (bertasydid)",
    ringkas: "Nun atau mim bertasydid wajib didengungkan.",
    cara: "Setiap nun atau mim yang bertasydid dibaca dengan dengung sekitar 2 harakat.",
    durasi: "Dengung ± 2 harakat",
    contoh: [
      { arab: "إِنَّ" },
      { arab: "ثُمَّ" },
      { arab: "النَّاسِ", ket: "An-Nas: 1" },
    ],
  },
  {
    id: 10,
    kategori: "Ghunnah & Qalqalah",
    judul: "Qalqalah",
    arab: "قَلْقَلَة",
    huruf: "ق  ط  ب  ج  د  (qutbu jadin)",
    ringkas: "Huruf qalqalah yang sukun dipantulkan dengan bunyi memantul.",
    cara: "Saat huruf qalqalah berharakat sukun, keluarkan bunyi pantulan ringan. Qalqalah Sughra: sukun asli di tengah kata (lebih ringan). Qalqalah Kubra: saat berhenti (waqaf) di akhir kata (lebih kuat).",
    contoh: [
      { arab: "يَدْخُلُونَ", ket: "Sughra" },
      { arab: "أَحَدٌ", ket: "Kubra saat waqaf: Al-Ikhlas: 1" },
      { arab: "الْفَلَقِ", ket: "Kubra saat waqaf: Al-Falaq: 1" },
    ],
  },

  // ===== TAFKHIM & TARQIQ =====
  {
    id: 11,
    kategori: "Tafkhim & Tarqiq",
    judul: "Lam Jalalah",
    arab: "لَام الْجَلَالَة",
    huruf: "ل pada lafaz الله",
    ringkas: "Lam pada lafaz Allah tebal setelah fathah/dhammah, tipis setelah kasrah.",
    cara: "Tafkhim (tebal) jika didahului fathah atau dhammah. Tarqiq (tipis) jika didahului kasrah.",
    contoh: [
      { arab: "رَسُولُ اللَّهِ", ket: "Tafkhim (setelah dhammah)" },
      { arab: "قَالَ اللَّهُ", ket: "Tafkhim (setelah fathah)" },
      { arab: "بِسْمِ اللَّهِ", ket: "Tarqiq (setelah kasrah)" },
    ],
  },
  {
    id: 12,
    kategori: "Tafkhim & Tarqiq",
    judul: "Hukum Huruf Ra",
    arab: "أَحْكَام الرَّاء",
    huruf: "ر",
    ringkas: "Ra dibaca tebal atau tipis tergantung harakat dan huruf sebelumnya.",
    cara: "Tafkhim (tebal) bila ra berharakat fathah atau dhammah, atau ra sukun setelah fathah/dhammah. Tarqiq (tipis) bila ra berharakat kasrah, atau ra sukun setelah kasrah.",
    contoh: [
      { arab: "الرَّحْمَنِ", ket: "Tafkhim" },
      { arab: "رِزْقًا", ket: "Tarqiq" },
      { arab: "رَبِّ", ket: "Tafkhim" },
    ],
    catatan:
      "Ada kasus khusus (misalnya ra sukun setelah kasrah yang bertemu huruf isti'la, atau saat waqaf) yang perlu dipelajari bersama guru.",
  },

  // ===== MAD =====
  {
    id: 13,
    kategori: "Mad",
    judul: "Mad Thabi'i",
    arab: "مَدّ طَبِيعِي",
    huruf: "ا  و  ي (mad)",
    ringkas: "Mad asli sepanjang 2 harakat.",
    cara: "Fathah + alif, kasrah + ya sukun, atau dhammah + wawu sukun dibaca panjang 2 harakat, tanpa sebab mad lain setelahnya.",
    durasi: "2 harakat",
    contoh: [
      { arab: "قَالَ" },
      { arab: "يَقُولُ" },
      { arab: "قِيلَ" },
    ],
  },
  {
    id: 14,
    kategori: "Mad",
    judul: "Mad Wajib Muttashil",
    arab: "مَدّ وَاجِب مُتَّصِل",
    ringkas: "Mad bertemu hamzah dalam satu kata.",
    cara: "Huruf mad bertemu hamzah dalam satu kata. Wajib dipanjangkan 4–5 harakat.",
    durasi: "4–5 harakat",
    contoh: [
      { arab: "السَّمَاءِ", ket: "Al-Baqarah: 19" },
      { arab: "جَاءَ" },
    ],
  },
  {
    id: 15,
    kategori: "Mad",
    judul: "Mad Jaiz Munfashil",
    arab: "مَدّ جَائِز مُنْفَصِل",
    ringkas: "Mad bertemu hamzah di kata berikutnya.",
    cara: "Huruf mad di akhir kata, hamzah di awal kata berikutnya. Boleh dibaca 2, 4, atau 5 harakat (konsisten sesuai riwayat/qira'at yang dipakai).",
    durasi: "2 / 4 / 5 harakat",
    contoh: [
      { arab: "بِمَا أُنْزِلَ", ket: "Al-Baqarah: 4" },
      { arab: "قُوا أَنْفُسَكُمْ", ket: "At-Tahrim: 6" },
    ],
  },
  {
    id: 16,
    kategori: "Mad",
    judul: "Mad Lazim",
    arab: "مَدّ لَازِم",
    ringkas: "Mad bertemu sukun asli atau tasydid, dibaca 6 harakat.",
    cara: "Huruf mad bertemu huruf sukun asli atau bertasydid dalam satu kata. Wajib dipanjangkan 6 harakat.",
    durasi: "6 harakat",
    contoh: [
      { arab: "الضَّالِّينَ", ket: "Al-Fatihah: 7" },
      { arab: "الْحَاقَّةُ", ket: "Al-Haqqah: 1" },
    ],
  },
  {
    id: 17,
    kategori: "Mad",
    judul: "Mad 'Aridh Lissukun",
    arab: "مَدّ عَارِض لِلسُّكُون",
    ringkas: "Mad sebelum huruf terakhir yang disukunkan karena waqaf.",
    cara: "Terjadi saat berhenti (waqaf) pada huruf yang didahului huruf mad. Boleh 2, 4, atau 6 harakat.",
    durasi: "2 / 4 / 6 harakat",
    contoh: [
      { arab: "الْعَالَمِينَ", ket: "Al-Fatihah: 2 (saat waqaf)" },
      { arab: "نَسْتَعِينُ", ket: "Al-Fatihah: 5 (saat waqaf)" },
    ],
  },
  {
    id: 18,
    kategori: "Mad",
    judul: "Mad Liin",
    arab: "مَدّ لِين",
    ringkas: "Wawu/ya sukun setelah fathah, saat waqaf.",
    cara: "Wawu atau ya sukun yang didahului fathah, lalu berhenti (waqaf) pada huruf sesudahnya. Boleh 2, 4, atau 6 harakat.",
    durasi: "2 / 4 / 6 harakat",
    contoh: [
      { arab: "قُرَيْشٍ", ket: "Quraisy: 1 (saat waqaf)" },
      { arab: "الْبَيْتِ", ket: "Quraisy: 3 (saat waqaf)" },
    ],
  },
];

export const getTajweedById = (id: number | string) =>
  TAJWEED_DATA.find((r) => String(r.id) === String(id));