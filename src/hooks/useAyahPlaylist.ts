import { useCallback, useEffect, useRef } from "react";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";

// Format waktu dari detik ke "mm:ss"
// (expo-audio pakai satuan detik, beda dengan expo-av yang pakai milidetik)
const formatTime = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * Hook player audio tunggal (single-track): dipakai untuk audio full-surah
 * dan untuk memutar satu ayat secara individual.
 *
 * Untuk mode "Ikuti Bacaan" (playlist ayat per ayat yang otomatis lanjut),
 * pakai `useAyahPlaylist` di src/hooks/useAyahPlaylist.ts.
 */
export const useAudio = () => {
  // Player dibuat sekali tanpa source awal (null), source-nya baru
  // diisi/diganti lewat player.replace() setiap kali playAudio() dipanggil.
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  // Menandai apakah player ini pernah diisi source sama sekali,
  // supaya "isLoading" tidak nyala terus sebelum user pernah menekan play.
  const hasSourceRef = useRef(false);

  // Konfigurasi mode audio global sekali di awal
  // (pengganti Audio.setAudioModeAsync milik expo-av)
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false, // ubah ke true kalau nanti butuh audio jalan di background
      interruptionMode: "duckOthers",
    }).catch((error) => console.error("Gagal mengatur mode audio:", error));
  }, []);

  const playAudio = useCallback(
    (url: string) => {
      hasSourceRef.current = true;
      player.replace(url);
      player.play();
    },
    [player]
  );

  const pauseAudio = useCallback(() => {
    player.pause();
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, status.playing]);

  const stopAudio = useCallback(() => {
    player.pause();
    player.seekTo(0);
  }, [player]);

  // Skip maju/mundur (dalam detik)
  const seekBy = useCallback(
    (seconds: number) => {
      const newPosition = Math.max(
        0,
        Math.min(status.currentTime + seconds, status.duration || 0)
      );
      player.seekTo(newPosition);
    },
    [player, status.currentTime, status.duration]
  );

  return {
    isPlaying: status.playing,
    // "loading" = sudah pernah diminta play, tapi track belum siap / lagi buffering
    isLoading: hasSourceRef.current && (!status.isLoaded || status.isBuffering),
    position: status.currentTime,
    duration: status.duration,
    formattedPosition: formatTime(status.currentTime),
    formattedDuration: formatTime(status.duration),
    didJustFinish: status.didJustFinish,
    playAudio,
    pauseAudio,
    togglePlayPause,
    stopAudio,
    seekBy,
  };
};