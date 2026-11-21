import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { RotateCcw, Check } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

/** Jeda antar ketukan (ms) supaya tidak terhitung dobel / spam. */
export const TAP_COOLDOWN_MS = 750;
const TARGETS = [3, 33] as const;

interface Props {
  /** jumlah anjuran dari data (mis. 1, 3, 33, 100). Dipakai sebagai target awal bila 3 atau 33. */
  recommended?: number;
}

export default function DzikirCounter({ recommended }: Props) {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const initial = recommended === 3 ? 3 : 33;
  const [target, setTarget] = useState<number>(initial);
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [locked, setLocked] = useState(false);
  const lastTap = useRef(0); // sumber kebenaran jeda (tidak bergantung re-render)
  const unlock = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (unlock.current) clearTimeout(unlock.current); }, []);

  const done = count >= target;
  const countRef = useRef(0);
  countRef.current = count;

  const onTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < TAP_COOLDOWN_MS) return; // abaikan ketukan spam
    lastTap.current = now;
    setLocked(true);
    if (unlock.current) clearTimeout(unlock.current);
    unlock.current = setTimeout(() => setLocked(false), TAP_COOLDOWN_MS);

    // setelah target tercapai, ketukan berikutnya memulai putaran baru
    const next = countRef.current >= target ? 1 : countRef.current + 1;
    countRef.current = next;
    setCount(next);
    if (next >= target) {
      setRounds((r) => r + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [target]);

  const reset = () => {
    setCount(0);
    setRounds(0);
    lastTap.current = 0;
    setLocked(false);
  };

  const pickTarget = (n: number) => {
    setTarget(n);
    setCount(0);
  };

  const ringPct = Math.min(100, Math.round((count / target) * 100));

  return (
    <View className={`p-5 rounded-3xl border ${theme.border} ${theme.bgCard}`}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className={`text-sm font-semibold uppercase tracking-wider ${theme.textSecondary}`}>
          {t("counterTitle")}
        </Text>
        <Pressable onPress={reset} hitSlop={10} className="flex-row items-center gap-1 active:opacity-60">
          <RotateCcw size={14} color={theme.mutedColor} />
          <Text className={`text-xs ${theme.textMuted}`}>{t("counterReset")}</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-center gap-2 mb-5">
        <Text className={`text-xs ${theme.textMuted}`}>{t("counterTarget")}</Text>
        {TARGETS.map((n) => (
          <Pressable
            key={n}
            onPress={() => pickTarget(n)}
            accessibilityRole="button"
            className={`px-5 py-2 rounded-full border ${
              target === n ? "bg-emerald-800 border-emerald-800" : `${theme.bgCard} ${theme.border}`
            }`}
          >
            <Text className={`font-bold ${target === n ? "text-white" : theme.text}`}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel={t("counterTapHint")}
        className="items-center"
      >
        <View
          className={`h-44 w-44 rounded-full items-center justify-center border-4 ${
            locked ? "opacity-70" : ""
          } ${
            done
              ? "bg-emerald-600 border-emerald-700"
              : isDarkMode
              ? "bg-emerald-900/50 border-emerald-700"
              : "bg-emerald-50 border-emerald-600"
          }`}
        >
          <Text className={`text-5xl font-bold ${done ? "text-white" : theme.text}`}>{count}</Text>
          <Text className={`text-base ${done ? "text-emerald-100" : theme.textMuted}`}>/ {target}</Text>
        </View>
      </Pressable>

      {/* progress bar */}
      <View className={`h-2 rounded-full mt-5 overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}>
        <View className="h-2 bg-emerald-600" style={{ width: `${ringPct}%` }} />
      </View>

      <View className="items-center mt-3 min-h-[20px]">
        {rounds > 0 ? (
          <View className="flex-row items-center gap-1">
            <Check size={14} color={isDarkMode ? "#34d399" : "#047857"} />
            <Text className={`text-xs font-semibold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
              {t("counterRounds", { n: rounds })}
            </Text>
          </View>
        ) : (
          <Text className={`text-xs ${theme.textMuted}`}>{t("counterTapHint")}</Text>
        )}
      </View>
    </View>
  );
}
