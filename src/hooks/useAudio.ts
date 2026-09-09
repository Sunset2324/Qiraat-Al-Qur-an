// src/hooks/useAudio.ts
import { useState } from 'react';

// VERSI MOCK: Tidak mengimpor 'expo-av' agar tidak crash di Expo Go
export const useAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const playAudio = async (uri: string) => {
    console.log('⚠️ [MOCK] Simulasi memutar audio:', uri);
    console.log('💡 INFO: Audio asli memerlukan Development Build (EAS).');
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsPlaying(true);
      setDuration(180000); // Simulasi durasi 3 menit
    }, 1000);
  };

  const pauseAudio = async () => setIsPlaying(false);
  const togglePlayPause = async () => setIsPlaying(!isPlaying);
  const stopAudio = async () => { setIsPlaying(false); setPosition(0); };
  const seekTo = async (pos: number) => setPosition(pos);

  const formatTime = (millis: number) => {
    const m = Math.floor(millis / 60000);
    const s = Math.floor((millis % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    isPlaying, isLoading, position, duration,
    formattedPosition: formatTime(position),
    formattedDuration: formatTime(duration),
    playAudio, pauseAudio, togglePlayPause, stopAudio, seekTo,
  };
};