import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { usePlayer, usePlayerProgress } from '../context/PlayerContext';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  /** Nama qari, tampil di notifikasi media. */
  artist?: string;
  /** Nama surah, jadi judul notifikasi. */
  notifTitle?: string;
  /** Info sesi untuk pemutar global (mini player, surah berikutnya, dst). */
  surahNomor: number;
  reciterId: number | null;
  mushafId: string;
}

export default function AudioPlayer({ audioUrl, title = 'Murottal', artist, notifTitle, surahNomor, reciterId, mushafId }: AudioPlayerProps) {
  const { isDarkMode, theme } = useTheme();
  const player = usePlayer();
  const prog = usePlayerProgress();

  // Pemutar global dipakai bersama: kartu ini hanya "aktif" kalau yang sedang
  // diputar memang audio surah penuh ini.
  const mine = player.session?.kind === 'full' && player.session.urls[0] === audioUrl;
  const isPlaying = mine && player.isPlaying;
  const isLoading = mine && player.isLoading;
  const position = mine ? prog.position : 0;
  const duration = mine ? prog.duration : 0;
  const fmt = (sec: number) => {
    const total = Math.max(0, Math.floor(sec || 0));
    return `${Math.floor(total / 60)}:${total % 60 < 10 ? '0' : ''}${total % 60}`;
  };
  const formattedPosition = fmt(position);
  const formattedDuration = fmt(duration);
  const seekBy = player.seekBy;

  const handlePlay = () => {
    if (mine) {
      player.toggle();
      return;
    }
    player.start({
      kind: 'full',
      surah: surahNomor,
      surahName: notifTitle ?? title,
      reciterId,
      reciterName: artist,
      mushafId,
      urls: [audioUrl],
    });
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
          onPress={handlePlay}
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