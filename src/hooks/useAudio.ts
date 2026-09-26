import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export const useAudio = () => {
  const soundRef = useRef<Audio.Sound | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0); // dalam milidetik
  const [duration, setDuration] = useState(0); // dalam milidetik

  // Format waktu dari ms ke "mm:ss"
  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const formattedPosition = formatTime(position);
  const formattedDuration = formatTime(duration);

  // Cleanup: Hentikan dan unload audio saat komponen unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  // Konfigurasi mode audio global (agar bisa play di background/silent mode iOS)
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false, // Ubah ke true jika butuh background play
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Gagal mengatur mode audio:', error);
      }
    };
    setupAudio();
  }, []);

  const playAudio = useCallback(async (url: string) => {
    try {
      setIsLoading(true);
      
      // Jika ada audio yang sedang berjalan, hentikan dan unload dulu
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);
            
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        }
      );

      soundRef.current = sound;
    } catch (error) {
      console.error('Error memutar audio:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pauseAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    
    if (isPlaying) {
      await pauseAudio();
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [isPlaying, pauseAudio]);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    }
  }, []);

  // Fungsi untuk skip maju/mundur (dalam detik)
  const seekBy = useCallback(async (seconds: number) => {
    if (!soundRef.current) return;
    
    const newPosition = Math.max(0, Math.min(position + seconds * 1000, duration));
    await soundRef.current.setPositionAsync(newPosition);
    setPosition(newPosition);
  }, [position, duration]);

  return {
    isPlaying,
    isLoading,
    position,
    duration,
    formattedPosition,
    formattedDuration,
    playAudio,
    pauseAudio,
    togglePlayPause,
    stopAudio,
    seekBy, // Ditambahkan untuk tombol skip
  };
};