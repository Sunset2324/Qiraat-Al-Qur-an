import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../hooks/useaudio';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
}

export default function AudioPlayer({ audioUrl, title = 'Murottal' }: AudioPlayerProps) {
  const { isDarkMode, theme } = useTheme();
  const {
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
  } = useAudio();

  // Play audio saat URL berubah
  const handlePlay = async () => {
    if (!isPlaying) {
      await playAudio(audioUrl);
    }
  };

  // Progress bar
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 mb-4`}>
      {/* Title */}
      <Text className={`text-sm font-medium ${theme.textSecondary} mb-3`}>
        {title}
      </Text>

      {/* Controls */}
      <View className="flex-row items-center justify-between mb-4">
        {/* Skip Back (rewind 10s) */}
        <TouchableOpacity 
          onPress={() => {}}
          className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
        >
          <SkipBack size={20} color={theme.iconColor} />
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          onPress={togglePlayPause}
          disabled={isLoading}
          className="w-16 h-16 bg-emerald-600 rounded-full items-center justify-center shadow-lg active:opacity-80"
        >
          {isLoading ? (
            <View className="w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          ) : isPlaying ? (
            <Pause size={28} color="#fff" />
          ) : (
            <Play size={28} color="#fff" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        {/* Skip Forward (forward 10s) */}
        <TouchableOpacity 
          onPress={() => {}}
          className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
        >
          <SkipForward size={20} color={theme.iconColor} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="flex-row items-center gap-3">
        <Text className={`text-xs ${theme.textMuted} w-10`}>
          {formattedPosition}
        </Text>
        
        <View className="flex-1 h-1.5 bg-gray-300 rounded-full overflow-hidden">
          <View
            className="h-full bg-emerald-600 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
        
        <Text className={`text-xs ${theme.textMuted} w-10 text-right`}>
          {formattedDuration}
        </Text>
      </View>
    </View>
  );
}