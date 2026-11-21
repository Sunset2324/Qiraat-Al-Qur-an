import { useState, useCallback, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { getJadwalShalat } from "../services/quranService";
import { findTodaySchedule } from "../utils/jadwalShalat";

// Key SAMA dengan layar Jadwal Shalat -> satu sumber kebenaran lokasi.
export const LOKASI_KEY = "user_shalat_location";

export interface LokasiShalat {
  provinsi: string;
  kota: string;
}

// kunci jadwal -> kunci terjemahan nama shalat
export const PRAYER_KEYS = [
  { key: "subuh", label: "p_subuh" },
  { key: "dzuhur", label: "p_dzuhur" },
  { key: "ashar", label: "p_ashar" },
  { key: "maghrib", label: "p_maghrib" },
  { key: "isya", label: "p_isya" },
] as const;

export const toMinutes = (v?: string): number | null => {
  const m = /(\d{1,2}):(\d{2})/.exec(String(v ?? ""));
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
};

export interface NextPrayer {
  labelKey: string;
  time: string; // "HH:mm"
  tomorrow: boolean;
  secondsLeft: number;
}

export function computeNext(schedule: any, now: Date): NextPrayer | null {
  if (!schedule) return null;
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const list = PRAYER_KEYS.map((p) => {
    const raw = schedule[p.key] ?? (p.key === "dzuhur" ? schedule.dhuhur : undefined);
    const min = toMinutes(raw);
    return min === null ? null : { labelKey: p.label, min, time: `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}` };
  }).filter(Boolean) as { labelKey: string; min: number; time: string }[];
  if (list.length === 0) return null;

  const upcoming = list.find((p) => p.min * 60 > nowSec);
  if (upcoming) return { labelKey: upcoming.labelKey, time: upcoming.time, tomorrow: false, secondsLeft: upcoming.min * 60 - nowSec };
  const first = list[0]; // Subuh besok (pendekatan: jam Subuh hari ini)
  return { labelKey: first.labelKey, time: first.time, tomorrow: true, secondsLeft: 24 * 3600 - nowSec + first.min * 60 };
}

/**
 * Lokasi dibaca dari AsyncStorage: dipilih sekali di layar Jadwal Shalat dan
 * tetap sampai pengguna mengubahnya. Dashboard TIDAK punya lokasi sendiri.
 */
export function useJadwalHariIni(tickMs = 1000) {
  const [lokasi, setLokasi] = useState<LokasiShalat | null>(null);
  const [ready, setReady] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [retryKey, setRetryKey] = useState(0);

  // baca ulang tiap layar fokus (mis. setelah kembali dari Jadwal Shalat)
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const saved = await AsyncStorage.getItem(LOKASI_KEY);
          const p = saved ? JSON.parse(saved) : null;
          const provinsi = p?.provinsi;
          const kota = p?.kota || p?.kabkota;
          if (alive) setLokasi(provinsi && kota ? { provinsi, kota } : null);
        } catch {
          if (alive) setLokasi(null);
        } finally {
          if (alive) setReady(true);
        }
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const today = now.getDate();
  useEffect(() => {
    if (!ready) return;
    if (!lokasi) {
      setSchedule(null);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    const t = new Date();
    getJadwalShalat(lokasi.provinsi, lokasi.kota, t.getMonth() + 1, t.getFullYear())
      .then((data: any) => {
        if (!alive) return;
        const row = findTodaySchedule(data, t);
        setSchedule(row);
        if (!row) setError("not_today");
      })
      .catch((e: any) => alive && setError(e?.message ?? "error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // today: ganti hari -> ambil ulang (dan ganti bulan otomatis)
  }, [ready, lokasi?.provinsi, lokasi?.kota, today, retryKey]);

  const next = useMemo(() => computeNext(schedule, now), [schedule, now]);

  return { lokasi, ready, loading, error, schedule, next, now, retry: () => setRetryKey((k) => k + 1) };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const formatCountdown = (sec: number) =>
  `${pad2(Math.floor(sec / 3600))}:${pad2(Math.floor((sec % 3600) / 60))}:${pad2(sec % 60)}`;
