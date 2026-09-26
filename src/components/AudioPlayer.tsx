import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../hooks/useAudio';

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
    togglePlayPause,
    seekBy, // Ambil fungsi seekBy
  } = useAudio();

  // Play audio saat URL berubah atau komponen pertama kali di-mount dengan URL
  // Kita gunakan useEffect sederhana untuk memastikan audio dimuat saat url berubah
  // Namun, untuk menghindari auto-play yang tidak diinginkan, kita bisa memanggil playAudio 
  // hanya jika user belum pernah berinteraksi, atau biarkan user menekan tombol play.
  // Di sini, kita biarkan user yang menekan tombol play secara manual untuk UX yang lebih baik.
  
  const handlePlay = async () => {
    if (!isPlaying && !isLoading) {
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
        {/* Skip Back (mundur 10 detik) */}
        <TouchableOpacity 
          onPress={() => seekBy(-10)}
          disabled={duration === 0}
          className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} active:opacity-70`}
        >
          <SkipBack size={24} color={theme.iconColor} />
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          onPress={isPlaying ? togglePlayPause : handlePlay}
          disabled={isLoading}
          className="w-16 h-16 bg-emerald-600 rounded-full items-center justify-center shadow-lg active:opacity-80"
        >
          {isLoading ? (
            <View className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={28} color="#fff" />
          ) : (
            <Play size={28} color="#fff" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        {/* Skip Forward (maju 10 detik) */}
        <TouchableOpacity 
          onPress={() => seekBy(10)}
          disabled={duration === 0}
          className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} active:opacity-70`}
        >
          <SkipForward size={24} color={theme.iconColor} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="flex-row items-center gap-3">
        <Text className={`text-xs ${theme.textMuted} w-10 text-center`}>
          {formattedPosition}
        </Text>
        
        <View className="flex-1 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <View
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
        
        <Text className={`text-xs ${theme.textMuted} w-10 text-center`}>
          {formattedDuration}
        </Text>
      </View>
    </View>
  );
}