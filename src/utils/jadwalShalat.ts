/**
 * Respons jadwal shalat bisa berbentuk:
 *  - array langsung                      [ {tanggal, subuh, ...}, ... ]
 *  - { jadwal: [...] }                   (format EQuran.id: data.jadwal)
 *  - { data: { jadwal: [...] } } / { data: [...] }  (dibungkus axios/backend)
 * Fungsi ini meratakan semuanya jadi array.
 */
export function toJadwalArray(raw: any): any[] {
  let cur = raw;
  for (let i = 0; i < 3 && cur && !Array.isArray(cur); i++) {
    cur = cur.jadwal ?? cur.data ?? null;
  }
  return Array.isArray(cur) ? cur : [];
}

/** Cari baris jadwal untuk tanggal tertentu (default hari ini). */
export function findTodaySchedule(raw: any, date: Date = new Date()): any | null {
  const list = toJadwalArray(raw);
  const day = date.getDate();
  return (
    list.find((item: any) => {
      if (typeof item?.tanggal === "number") return item.tanggal === day;
      const s = String(item?.tanggal ?? item?.date ?? "");
      if (!s) return false;
      // "2026-10-13" | "13-10-2026" | "13" | "Selasa, 13/10/2026"
      const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (iso) return parseInt(iso[3], 10) === day && parseInt(iso[2], 10) === date.getMonth() + 1;
      const dmy = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (dmy) return parseInt(dmy[1], 10) === day && parseInt(dmy[2], 10) === date.getMonth() + 1;
      return parseInt(s, 10) === day;
    }) ?? null
  );
}