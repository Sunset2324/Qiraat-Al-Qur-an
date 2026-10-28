import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { qiblaBearing, distanceToKaabaKm, smoothAngle, norm360 } from "../utils/qibla";

const COORDS_KEY = "qibla_coords_v1";
const LOKASI_KEY = "user_shalat_location";
const ALADHAN = "https://api.aladhan.com/v1/qibla";

export type QiblaSource = "aladhan" | "cached" | "local";
export type QiblaStatus = "locating" | "ok" | "gps_denied" | "no_location";
export type SensorAccuracy = "high" | "mid" | "low" | "unknown";

interface Coords { lat: number; lng: number; from: "gps" | "city" | "saved" }

const key = (c: { lat: number; lng: number }) => `qibla_dir_${c.lat.toFixed(2)}_${c.lng.toFixed(2)}`;

async function fetchAladhan(lat: number, lng: number): Promise<number> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${ALADHAN}/${lat.toFixed(6)}/${lng.toFixed(6)}`, { signal: ctrl.signal });
    const json = await res.json();
    const d = Number(json?.data?.direction);
    if (!res.ok || !Number.isFinite(d)) throw new Error("bad_aladhan");
    return norm360(d);
  } finally {
    clearTimeout(timer);
  }
}

async function resolveCoords(): Promise<{ coords: Coords | null; denied: boolean }> {
  let denied = false;
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status === "granted") {
      const last = await Location.getLastKnownPositionAsync();
      const pos =
        last ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const coords: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, from: "gps" };
      AsyncStorage.setItem(COORDS_KEY, JSON.stringify(coords)).catch(() => {});
      return { coords, denied };
    }
    denied = true;
  } catch {
    // GPS mati / timeout -> lanjut ke cadangan
  }
  // Cadangan 1: pusat kota pilihan di Jadwal Shalat (geocoding)
  try {
    const raw = await AsyncStorage.getItem(LOKASI_KEY);
    const p = raw ? JSON.parse(raw) : null;
    const kota = p?.kota || p?.kabkota;
    if (kota) {
      const q = `${String(kota).replace(/^(KAB\.|KOTA)\s*/i, "")}, ${p?.provinsi ?? ""}, Indonesia`;
      const g = await Location.geocodeAsync(q);
      if (g[0]) {
        const coords: Coords = { lat: g[0].latitude, lng: g[0].longitude, from: "city" };
        AsyncStorage.setItem(COORDS_KEY, JSON.stringify(coords)).catch(() => {});
        return { coords, denied };
      }
    }
  } catch {}
  // Cadangan 2: koordinat terakhir yang tersimpan
  try {
    const raw = await AsyncStorage.getItem(COORDS_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (Number.isFinite(c?.lat) && Number.isFinite(c?.lng)) return { coords: { ...c, from: "saved" }, denied };
    }
  } catch {}
  return { coords: null, denied };
}

/**
 * Arah kiblat dari Aladhan API (+ hitungan lokal bila offline) dan heading
 * perangkat secara realtime. `active=false` menghentikan sensor (hemat baterai).
 */
export function useQibla(active = true) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);
  const [source, setSource] = useState<QiblaSource>("local");
  const [status, setStatus] = useState<QiblaStatus>("locating");
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<SensorAccuracy>("unknown");
  const [sensorFailed, setSensorFailed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const smooth = useRef<number | null>(null);

  // 1) lokasi + arah
  useEffect(() => {
    if (!active) return;
    let batal = false;
    (async () => {
      setStatus("locating");
      const { coords: c, denied } = await resolveCoords();
      if (batal) return;
      if (!c) {
        setStatus(denied ? "gps_denied" : "no_location");
        return;
      }
      setCoords(c);
      // tampilkan hitungan lokal dulu supaya kompas langsung hidup, lalu ganti dengan Aladhan
      setBearing(qiblaBearing(c.lat, c.lng));
      setSource("local");
      setStatus(denied ? "gps_denied" : "ok");
      try {
        const d = await fetchAladhan(c.lat, c.lng);
        if (batal) return;
        setBearing(d);
        setSource("aladhan");
        AsyncStorage.setItem(key(c), String(d)).catch(() => {});
      } catch {
        try {
          const cached = await AsyncStorage.getItem(key(c));
          if (!batal && cached && Number.isFinite(Number(cached))) {
            setBearing(Number(cached));
            setSource("cached");
          }
        } catch {}
      }
    })();
    return () => {
      batal = true;
    };
  }, [active, nonce]);

  // 2) heading realtime
  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | null = null;
    let batal = false;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        // heading Android/iOS tidak memerlukan GPS, tetapi iOS meminta izin lokasi
        if (perm.status !== "granted") {
          const req = await Location.requestForegroundPermissionsAsync();
          if (req.status !== "granted" && Platform.OS === "ios") {
            setSensorFailed(true);
            return;
          }
        }
        const s = await Location.watchHeadingAsync((h) => {
          const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          smooth.current = smooth.current === null ? raw : smoothAngle(smooth.current, raw, 0.3);
          setHeading(smooth.current);
          setAccuracy(h.accuracy >= 3 ? "high" : h.accuracy === 2 ? "mid" : h.accuracy >= 0 ? "low" : "unknown");
        });
        if (batal) s.remove();
        else sub = s;
      } catch {
        if (!batal) setSensorFailed(true);
      }
    })();
    return () => {
      batal = true;
      sub?.remove();
      smooth.current = null;
    };
  }, [active]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return {
    coords,
    bearing,
    source,
    status,
    heading,
    accuracy,
    sensorFailed,
    distanceKm: coords ? distanceToKaabaKm(coords.lat, coords.lng) : null,
    refresh,
  };
}
