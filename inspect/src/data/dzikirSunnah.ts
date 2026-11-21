// Dzikir & doa sunnah dari proyek terbuka fitrahive/dua-dhikr (MIT).
// Di-bundle (offline-first). Dibangun ulang dengan scripts/buildDzikirSunnah.py.
import raw from "./dzikirSunnah.json";
import type { Language } from "../i18n/translations";

type L10n = { id: string | null; en: string | null };
export interface DzikirSunnah {
  id: string; // "dd-<slug>-<n>"
  kat: "pagi" | "petang" | "bakda" | "doa";
  slug: string;
  grup: { id: string; en: string };
  judul: { id: string; en: string };
  arab: string;
  latin: string;
  arti: { id: string; en: string };
  catatan: L10n;
  faedah: L10n;
  sumber: string | null;
  jumlah: number;
}

export const DZIKIR_SUNNAH = raw as unknown as DzikirSunnah[];
export const isLocalDzikirId = (id: unknown): id is string => typeof id === "string" && id.startsWith("dd-");
export const getLocalDzikir = (id: string) => DZIKIR_SUNNAH.find((d) => d.id === id) ?? null;

// Bahasa Arab memakai teks Inggris untuk terjemahan (data sumber hanya id/en)
export const pick = (v: L10n | { id: string; en: string }, lang: Language): string =>
  ((lang === "id" ? v.id : v.en) ?? v.id ?? v.en ?? "") as string;
