import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "./LanguageContext";
import { NOTIF_ARTWORK_URL } from "../config";
import { getDetailSurahMerged } from "../services/quranService";

/**
 * Pemutar audio GLOBAL (satu AudioPlayer untuk seluruh app), supaya audio tetap
 * jalan waktu pindah layar dan bisa dikendalikan dari mini player di bawah
 * layar, seperti aplikasi musik.
 *
 * kind "ayah": playlist per-ayat, lanjut otomatis ke ayat berikutnya.
 * kind "full": satu file audio utuh untuk satu surah.
 * Selesai satu surah -> otomatis lanjut ke surah berikutnya.
 *
 * Catatan: AudioPlaylist milik expo-audio belum punya API notifikasi media,
 * jadi tetap pakai SATU AudioPlayer biasa dan pindah track sendiri
 * (ada jeda sangat singkat antar ayat, tapi notifikasi/lock screen berfungsi).
 */
export interface PlayerSession {
  kind: "ayah" | "full";
  surah: number;
  surahName: string;
  reciterId: number | null;
  reciterName?: string;
  mushafId: string;
  /** ayah: URL per ayat (index 0 = ayat 1). full: [urlSurah]. */
  urls: string[];
}

interface PlayerControls {
  session: PlayerSession | null;
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  /** true selama data surah berikutnya sedang diambil */
  switching: boolean;
  /** pesan singkat (mis. surah tidak tersedia untuk qari ini), hilang sendiri */
  notice: string | null;
  start: (session: PlayerSession, index?: number) => boolean;
  toggle: () => void;
  pause: () => void;
  stop: () => void;
  seekBy: (seconds: number) => void;
  /** Putar surah n memakai qari & mushaf dari sesi yang sedang aktif. */
  playSurah: (n: number) => Promise<boolean>;
}

interface PlayerProgress {
  position: number;
  duration: number;
}

const ControlsCtx = createContext<PlayerControls | null>(null);
const ProgressCtx = createContext<PlayerProgress>({ position: 0, duration: 0 });

export const usePlayer = () => {
  const ctx = useContext(ControlsCtx);
  if (!ctx) throw new Error("usePlayer harus dipakai di dalam PlayerProvider");
  return ctx;
};
export const usePlayerProgress = () => useContext(ProgressCtx);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [session, setSession] = useState<PlayerSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [switching, setSwitching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sessionRef = useRef<PlayerSession | null>(null);
  const indexRef = useRef(0);
  const autoAdvanceRef = useRef(false);
  const lastFinishedRef = useRef(-1);
  const lockKindRef = useRef<PlayerSession["kind"] | null>(null);
  const switchTokenRef = useRef(0);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tRef = useRef(t);
  tRef.current = t;
  // Status dibaca lewat ref supaya toggle/seekBy tetap stabil (nggak berubah tiap 250 ms)
  const statusRef = useRef(status);
  statusRef.current = status;

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  const lockMetadata = (s: PlayerSession, index: number) => {
    const total = s.urls.filter(Boolean).length;
    const title =
      s.kind === "ayah"
        ? `${s.surahName} • ${tRef.current("ayahN", { n: index + 1 })}${total ? `/${total}` : ""}`
        : s.surahName;
    return {
      title,
      artist: s.reciterName ?? "Qiraat Al-Qur'an",
      albumTitle: "Qiraat Al-Qur'an",
      artworkUrl: NOTIF_ARTWORK_URL,
    };
  };

  const applyLockScreen = (s: PlayerSession, index: number) => {
    try {
      if (lockKindRef.current !== s.kind) {
        // Surah penuh: tombol mundur/maju 10 detik di notifikasi.
        player.setActiveForLockScreen(
          true,
          lockMetadata(s, index),
          s.kind === "full" ? { showSeekBackward: true, showSeekForward: true } : undefined
        );
        lockKindRef.current = s.kind;
      } else {
        player.updateLockScreenMetadata(lockMetadata(s, index));
      }
    } catch (e) {
      console.warn("Gagal mengatur kontrol lock screen:", e);
    }
  };

  const start = useCallback(
    (s: PlayerSession, index = 0) => {
      const url = s.urls[index];
      if (!url) return false;
      switchTokenRef.current += 1; // batalkan perpindahan surah yang masih berjalan
      sessionRef.current = s;
      indexRef.current = index;
      lastFinishedRef.current = -1;
      autoAdvanceRef.current = true;
      setSession(s);
      setCurrentIndex(index);
      player.replace(url);
      player.play();
      applyLockScreen(s, index);
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player]
  );

  const playSurah = useCallback(
    async (n: number) => {
      const s = sessionRef.current;
      if (!Number.isInteger(n) || n < 1 || n > 114) return false;
      const token = ++switchTokenRef.current;
      setSwitching(true);
      try {
        const mushafId = s?.mushafId ?? (await AsyncStorage.getItem("selected_mushaf_id")) ?? "1";
        const data = await getDetailSurahMerged(n, mushafId, "05", s?.reciterId ?? undefined);
        if (token !== switchTokenRef.current) return false; // sudah ada permintaan lain

        const ayahUrls: string[] = (data.ayat ?? []).map((a: any) => a.audio || "");
        const hasAyah = ayahUrls.some(Boolean);
        const full: string | undefined = data.audioFull || undefined;
        const wantFull = s?.kind === "full";
        const kind: PlayerSession["kind"] | null =
          wantFull && full ? "full" : hasAyah ? "ayah" : full ? "full" : null;
        if (!kind) {
          showNotice(tRef.current("surahNoAudio"));
          return false;
        }

        const ra = data.info?.reciterAktif;
        const next: PlayerSession = {
          kind,
          surah: data.info?.nomor ?? n,
          surahName: data.info?.namaLatin ?? `Surah ${n}`,
          reciterId: ra && typeof ra === "object" ? ra.id : s?.reciterId ?? null,
          reciterName: ra && typeof ra === "object" ? ra.nama : typeof ra === "string" ? ra : s?.reciterName,
          mushafId,
          urls: kind === "ayah" ? ayahUrls : [full as string],
        };
        const first = next.urls.findIndex(Boolean);
        return start(next, first < 0 ? 0 : first);
      } catch (e: any) {
        console.warn("Gagal memuat surah untuk pemutar:", e?.message);
        showNotice(tRef.current("surahNoAudio"));
        return false;
      } finally {
        if (token === switchTokenRef.current) setSwitching(false);
      }
    },
    [start, showNotice]
  );

  // Track selesai -> ayat berikutnya, atau surah berikutnya kalau sudah di ujung
  useEffect(() => {
    if (!status.didJustFinish) return;
    const s = sessionRef.current;
    if (!s) return;
    const finished = indexRef.current;
    if (lastFinishedRef.current === finished) return; // cegah double-trigger
    lastFinishedRef.current = finished;

    if (s.kind === "ayah" && autoAdvanceRef.current) {
      let next = finished + 1;
      while (next < s.urls.length && !s.urls[next]) next += 1;
      if (next < s.urls.length) {
        start(s, next);
        return;
      }
    } else if (s.kind === "ayah") {
      return; // sedang dijeda manual
    }
    // surah selesai
    autoAdvanceRef.current = false;
    if (s.surah < 114) playSurah(s.surah + 1);
  }, [status.didJustFinish, start, playSurah]);

  const pause = useCallback(() => {
    autoAdvanceRef.current = false;
    player.pause();
  }, [player]);

  const toggle = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    const st = statusRef.current;
    if (st.playing) {
      autoAdvanceRef.current = false;
      player.pause();
      return;
    }
    const atEnd =
      lastFinishedRef.current === indexRef.current && st.duration > 0 && st.currentTime >= st.duration - 0.3;
    if (atEnd) {
      start(s, 0);
      return;
    }
    autoAdvanceRef.current = true;
    player.play();
  }, [player, start]);

  const stop = useCallback(() => {
    switchTokenRef.current += 1;
    autoAdvanceRef.current = false;
    sessionRef.current = null;
    indexRef.current = 0;
    try {
      player.pause();
      player.clearLockScreenControls();
    } catch {}
    lockKindRef.current = null;
    setSession(null);
    setCurrentIndex(0);
    setSwitching(false);
  }, [player]);

  const seekBy = useCallback(
    (seconds: number) => {
      const st = statusRef.current;
      player.seekTo(Math.max(0, Math.min(st.currentTime + seconds, st.duration || 0)));
    },
    [player]
  );

  // Bersihkan notifikasi saat app ditutup
  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      try {
        player.pause();
        player.clearLockScreenControls();
      } catch {}
    };
  }, [player]);

  const isLoading = !!session && (status.isBuffering || !status.isLoaded);

  const controls = useMemo<PlayerControls>(
    () => ({
      session,
      currentIndex,
      isPlaying: status.playing,
      isLoading,
      switching,
      notice,
      start,
      toggle,
      pause,
      stop,
      seekBy,
      playSurah,
    }),
    [session, currentIndex, status.playing, isLoading, switching, notice, start, toggle, pause, stop, seekBy, playSurah]
  );

  const progress = useMemo<PlayerProgress>(
    () => ({ position: status.currentTime || 0, duration: status.duration || 0 }),
    [status.currentTime, status.duration]
  );

  return (
    <ControlsCtx.Provider value={controls}>
      <ProgressCtx.Provider value={progress}>{children}</ProgressCtx.Provider>
    </ControlsCtx.Provider>
  );
}
