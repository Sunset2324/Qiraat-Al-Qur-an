import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

interface LockScreenMeta {
  title?: string; // contoh: "Al-Fatihah"
  artist?: string; // contoh: nama qari
}

/**
 * Playback audio per-ayat untuk mode "Ikuti Bacaan".
 *
 * Kenapa bukan useAudioPlaylist? AudioPlaylist milik expo-audio belum punya
 * API lock screen / notifikasi media, jadi notifikasi ala aplikasi musik
 * tidak akan muncul. Di sini kita pakai SATU AudioPlayer biasa, lalu pindah
 * ke ayat berikutnya sendiri begitu `didJustFinish`. Konsekuensinya: ada jeda
 * sangat singkat antar ayat (tidak gapless), tapi notifikasi & kontrol
 * lock screen berfungsi.
 *
 * @param audioUrls Daftar URL audio per ayat (index 0 = ayat 1, dst).
 * @param meta Judul/artist untuk notifikasi media.
 */
export const useAyahPlaylist = (audioUrls: string[], meta?: LockScreenMeta) => {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [currentIndex, setCurrentIndex] = useState(0);

  const urlsRef = useRef<string[]>(audioUrls);
  const metaRef = useRef<LockScreenMeta | undefined>(meta);
  const indexRef = useRef(0);
  const autoAdvanceRef = useRef(false); // true selama sesi "lanjut otomatis" aktif
  const lastFinishedRef = useRef(-1);
  const lockActiveRef = useRef(false);
  urlsRef.current = audioUrls;
  metaRef.current = meta;

  const lockMetadata = (index: number) => ({
    title: `${metaRef.current?.title ?? "Al-Qur'an"} • Ayat ${index + 1}`,
    artist: metaRef.current?.artist ?? "Qiraat Al-Qur'an",
  });

  const playFrom = useCallback(
    (index: number) => {
      const url = urlsRef.current[index];
      if (!url) return;
      indexRef.current = index;
      lastFinishedRef.current = -1;
      autoAdvanceRef.current = true;
      setCurrentIndex(index);

      player.replace(url);
      player.play();

      try {
        if (!lockActiveRef.current) {
          player.setActiveForLockScreen(true, lockMetadata(index));
          lockActiveRef.current = true;
        } else {
          player.updateLockScreenMetadata(lockMetadata(index));
        }
      } catch (e) {
        console.warn("Gagal mengatur kontrol lock screen:", e);
      }
    },
    [player]
  );

  // Ayat selesai -> lanjut ke ayat berikutnya
  useEffect(() => {
    if (!status.didJustFinish || !autoAdvanceRef.current) return;
    const finished = indexRef.current;
    if (lastFinishedRef.current === finished) return; // cegah double-trigger
    lastFinishedRef.current = finished;

    const next = finished + 1;
    if (next < urlsRef.current.length && urlsRef.current[next]) {
      playFrom(next);
    } else {
      autoAdvanceRef.current = false; // surah selesai
    }
  }, [status.didJustFinish, playFrom]);

  // Ganti surah / qari -> reset
  const urlsKey = audioUrls.join("|");
  useEffect(() => {
    autoAdvanceRef.current = false;
    indexRef.current = 0;
    lastFinishedRef.current = -1;
    setCurrentIndex(0);
    try {
      player.pause();
    } catch {}
  }, [urlsKey, player]);

  const pause = useCallback(() => {
    autoAdvanceRef.current = false;
    player.pause();
  }, [player]);

  const stop = useCallback(() => {
    autoAdvanceRef.current = false;
    player.pause();
    indexRef.current = 0;
    setCurrentIndex(0);
    try {
      player.clearLockScreenControls();
      lockActiveRef.current = false;
    } catch {}
  }, [player]);

  // Bersihkan notifikasi saat layar ditutup
  useEffect(() => {
    return () => {
      try {
        player.pause();
        player.clearLockScreenControls();
      } catch {}
    };
  }, [player]);

  return {
    currentIndex,
    isPlaying: status.playing,
    isBuffering: status.isBuffering,
    trackCount: audioUrls.filter(Boolean).length,
    playFrom,
    pause,
    stop,
  };
};