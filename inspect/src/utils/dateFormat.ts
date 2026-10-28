/** Tanggal Masehi + Hijriah sesuai bahasa. Hijriah memakai Intl bila didukung perangkat. */
export function formatGregorian(d: Date, locale: string): string {
  try {
    return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return d.toDateString();
  }
}

export function formatHijri(d: Date, locale: string): string {
  const loc = locale.startsWith("ar") ? "ar-SA" : locale;
  try {
    const s = new Intl.DateTimeFormat(`${loc}-u-ca-islamic-umalqura`, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
    // bila Intl mengabaikan kalender, hasilnya tahun Masehi (>1600) -> sembunyikan
    const year = parseInt(s.replace(/[^\d٠-٩]/g, "").slice(-4).replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))), 10);
    return Number.isFinite(year) && year > 1600 ? "" : s;
  } catch {
    return "";
  }
}

export function formatClock(d: Date, locale: string): string {
  try {
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
}
