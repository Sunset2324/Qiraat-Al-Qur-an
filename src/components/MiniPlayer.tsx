import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Play, Pause, SkipBack, SkipForward, X } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { usePlayer, usePlayerProgress } from "../context/PlayerContext";

/**
 * Mini player ala aplikasi musik: muncul di bawah layar selama ada audio yang
 * diputar/dijeda. Ketuk kartu -> buka surahnya; tombol kiri/kanan = surah
 * sebelumnya/berikutnya.
 *
 * @param withSafeBottom true kalau mini player ada di paling bawah layar
 *   (tanpa tab bar), supaya tidak tertutup navigasi sistem.
 */
export default function MiniPlayer({ withSafeBottom = false }: { withSafeBottom?: boolean }) {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  const { position, duration } = usePlayerProgress();
  const s = p.session;
  if (!s) return null;

  const total = s.urls.filter(Boolean).length;
  const frac = duration > 0 ? Math.min(1, position / duration) : 0;
  const progress =
    s.kind === "ayah" && s.urls.length > 0
      ? Math.min(1, (p.currentIndex + frac) / s.urls.length)
      : frac;

  const subtitle =
    s.kind === "ayah"
      ? `${t("ayahN", { n: p.currentIndex + 1 })}${total ? `/${total}` : ""}${s.reciterName ? ` • ${s.reciterName}` : ""}`
      : s.reciterName ?? "";

  const iconColor = theme.iconColor;
  const busy = p.isLoading || p.switching;

  const open = () =>
    router.push({
      pathname: "/screen/surah/[nomor]",
      params: { nomor: String(s.surah), mushafId: s.mushafId },
    });

  return (
    <View
      className="px-4 pt-2"
      style={withSafeBottom ? { paddingBottom: Math.max(insets.bottom, 8) } : { paddingBottom: 4 }}
    >
      {p.notice ? (
        <View className="mb-1 px-3 py-1.5 rounded-xl bg-amber-500/15">
          <Text className={`text-[11px] text-center ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>{p.notice}</Text>
        </View>
      ) : null}
      <View
        className={`rounded-2xl border overflow-hidden ${isDarkMode ? "bg-[#242424] border-gray-700" : "bg-white border-gray-200"}`}
        style={{ elevation: 8 }}
      >
        <View className="flex-row items-center px-3 py-2.5">
          <Pressable
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel={s.surahName}
            className="flex-1 flex-row items-center active:opacity-70"
          >
            <View className="h-10 w-10 rounded-full bg-emerald-600 items-center justify-center mr-3">
              <Text className="text-white font-bold text-sm">{s.surah}</Text>
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className={`text-sm font-bold ${theme.text}`}>
                {s.surahName}
              </Text>
              <Text numberOfLines={1} className={`text-[11px] ${theme.textMuted}`}>
                {subtitle}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => p.playSurah(s.surah - 1)}
            disabled={s.surah <= 1 || p.switching}
            accessibilityRole="button"
            accessibilityLabel={t("prevSurah")}
            hitSlop={6}
            className={`h-10 w-10 items-center justify-center active:opacity-60 ${s.surah <= 1 ? "opacity-30" : ""}`}
          >
            <SkipBack size={20} color={iconColor} />
          </Pressable>

          <Pressable
            onPress={p.toggle}
            disabled={p.switching}
            accessibilityRole="button"
            accessibilityLabel={p.isPlaying ? "Pause" : "Play"}
            className="h-11 w-11 rounded-full bg-emerald-600 items-center justify-center active:opacity-80"
          >
            {p.isPlaying ? (
              <Pause size={20} color="#fff" />
            ) : (
              <Play size={20} color="#fff" style={{ marginLeft: 2 }} />
            )}
          </Pressable>

          <Pressable
            onPress={() => p.playSurah(s.surah + 1)}
            disabled={s.surah >= 114 || p.switching}
            accessibilityRole="button"
            accessibilityLabel={t("nextSurah")}
            hitSlop={6}
            className={`h-10 w-10 items-center justify-center active:opacity-60 ${s.surah >= 114 ? "opacity-30" : ""}`}
          >
            <SkipForward size={20} color={iconColor} />
          </Pressable>

          <Pressable
            onPress={p.stop}
            accessibilityRole="button"
            accessibilityLabel={t("closePlayer")}
            hitSlop={6}
            className="h-8 w-8 items-center justify-center active:opacity-60"
          >
            <X size={16} color={theme.iconColor} />
          </Pressable>
        </View>
        <View className={`h-[3px] ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
          <View className="h-full bg-emerald-600" style={{ width: `${(busy ? 0 : progress) * 100}%` }} />
        </View>
      </View>
    </View>
  );
}
