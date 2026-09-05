import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

export const useAudio = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Cleanup sound saat unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Load dan play audio
  const playAudio = async (uri: string) => {
    try {
      setIsLoading(true);
      
      // Stop audio sebelumnya jika ada
      if (sound) {
        await sound.unloadAsync();
      }

      // Load audio baru
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      // Update progress
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });

    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pause audio
  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  // Resume audio
  const resumeAudio = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (isPlaying) {
      await pauseAudio();
    } else {
      await resumeAudio();
    }
  };

  // Stop audio
  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      setPosition(0);
    }
  };

  // Seek to position
  const seekTo = async (positionMillis: number) => {
    if (sound) {
      await sound.setPositionAsync(positionMillis);
    }
  };

  // Format waktu (ms -> mm:ss)
  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isPlaying,
    isLoading,
    position,
    duration,
    formattedPosition: formatTime(position),
    formattedDuration: formatTime(duration),
    playAudio,
    pauseAudio,
    togglePlayPause,
    stopAudio,
    seekTo,
  };
};