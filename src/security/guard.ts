import { Platform } from "react-native";
import type { AxiosInstance } from "axios";
import { getNativeGuardStatus, type NativeGuardStatus } from "../../modules/app-guard";

/**
 * Lapisan keamanan sisi-klien (best-effort).
 *  - "restricted"  : opsi pengembang/ADB/debugger/root/hooking/emulator -> fitur sensitif dimatikan
 *                    (iklan & pengiriman koordinat ke layanan pihak ketiga). Baca Quran tetap jalan.
 *  - "apiBlocked"  : VPN atau proxy aktif -> semua panggilan API diblokir (mencegah sniffing
 *                    PCAPdroid / Canary / proxy MITM). Konten yang sudah ter-cache tetap tampil.
 * Hanya aktif di build release Android. Di dev/Expo Go/iOS selalu aman (fail-open).
 */
export interface GuardStatus extends NativeGuardStatus {
  available: boolean;
  checkedAt: number;
}

const SAFE: GuardStatus = {
  devOptions: false,
  adb: false,
  debugger: false,
  debuggableApp: false,
  root: false,
  hooked: false,
  emulator: false,
  vpn: false,
  proxy: false,
  available: false,
  checkedAt: 0,
};

const ENABLED = Platform.OS === "android" && !__DEV__;

let current: GuardStatus = SAFE;
let inflight: Promise<GuardStatus> | null = null;
const listeners = new Set<(s: GuardStatus) => void>();

export const isRestricted = (s: GuardStatus = current) =>
  s.devOptions || s.adb || s.debugger || s.debuggableApp || s.root || s.hooked || s.emulator;

export const isApiBlocked = (s: GuardStatus = current) => s.vpn || s.proxy;

export const getGuard = () => current;

export function subscribeGuard(fn: (s: GuardStatus) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function refreshGuard(): Promise<GuardStatus> {
  if (!ENABLED) return Promise.resolve(current);
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const n = await getNativeGuardStatus();
      current = n ? { ...n, available: true, checkedAt: Date.now() } : { ...SAFE, checkedAt: Date.now() };
    } catch {
      current = { ...SAFE, checkedAt: Date.now() }; // gagal memeriksa = jangan blokir pengguna sah
    }
    listeners.forEach((fn) => fn(current));
    return current;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Pakai hasil terbaru bila umurnya < maxAgeMs, kalau tidak periksa ulang. */
export async function ensureFresh(maxAgeMs = 4000): Promise<GuardStatus> {
  if (!ENABLED) return current;
  if (Date.now() - current.checkedAt < maxAgeMs) return current;
  return refreshGuard();
}

export class GuardBlockedError extends Error {
  code: "GUARD_NETWORK" | "GUARD_RESTRICTED";
  constructor(code: "GUARD_NETWORK" | "GUARD_RESTRICTED") {
    super(
      code === "GUARD_NETWORK"
        ? "VPN/proxy terdeteksi. Matikan VPN atau proxy lalu coba lagi."
        : "Fitur ini dinonaktifkan karena mode pengembang/perangkat tidak aman terdeteksi."
    );
    this.name = "GuardBlockedError";
    this.code = code;
  }
}

/** Lempar error bila ada VPN/proxy aktif. */
export async function assertNetworkAllowed() {
  const s = await ensureFresh();
  if (isApiBlocked(s)) throw new GuardBlockedError("GUARD_NETWORK");
}

/** Lempar error bila perangkat dalam mode terbatas (untuk fitur sensitif). */
export async function assertSensitiveAllowed() {
  const s = await ensureFresh();
  if (isRestricted(s)) throw new GuardBlockedError("GUARD_RESTRICTED");
}

/** Pasang pemeriksaan jaringan ke instance axios. */
export function installGuard(http: AxiosInstance) {
  http.interceptors.request.use(async (config) => {
    await assertNetworkAllowed();
    return config;
  });
}
