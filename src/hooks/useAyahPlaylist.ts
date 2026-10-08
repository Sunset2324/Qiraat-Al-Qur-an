import { useCallback, useEffect, useRef } from "react";
import { useAudioPlaylist, useAudioPlaylistStatus } from "expo-audio";

/**
 * Playlist audio per-ayat untuk mode "Ikuti Bacaan".
 *
 * Native `AudioPlaylist` dari expo-audio otomatis lanjut ke track berikutnya
 * begitu track sekarang selesai (gapless), jadi kita tinggal baca
 * `currentIndex` buat tahu ayat mana yang lagi dibaca -> dipakai untuk
 * highlight teks & auto-scroll di layar.
 *
 * @param audioUrls Daftar URL audio per ayat, urut sesuai nomor ayat (index 0 = ayat 1, dst).
 */
export const useAyahPlaylist = (audioUrls: string[]) => {
  const playlist = useAudioPlaylist({ updateInterval: 250, loop: "none" });
  const status = useAudioPlaylistStatus(playlist);

  // Supaya nggak reload playlist tiap render kalau isi audioUrls-nya sama persis
  // (mis. surah yang sama, qari yang sama).
  const loadedKeyRef = useRef<string>("");

  useEffect(() => {
    const key = audioUrls.join("|");
    if (key === loadedKeyRef.current) return;
    loadedKeyRef.current = key;

    playlist.clear();
    audioUrls.forEach((url) => {
      if (url) playlist.add({ uri: url });
    });
  }, [audioUrls, playlist]);

  const playFrom = useCallback(
    (index: number) => {
      playlist.skipTo(index);
      playlist.play();
    },
    [playlist]
  );

  const pause = useCallback(() => {
    playlist.pause();
  }, [playlist]);

  const stop = useCallback(() => {
    playlist.pause();
    playlist.skipTo(0);
  }, [playlist]);

  return {
    // Index ayat yang lagi aktif (relatif ke array audioUrls yang dikasih)
    currentIndex: status.currentIndex,
    isPlaying: status.playing,
    isBuffering: status.isBuffering,
    trackCount: status.trackCount,
    playFrom,
    pause,
    stop,
  };
};