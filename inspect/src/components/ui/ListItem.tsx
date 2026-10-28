import { View, Text, Pressable } from "react-native";
import { Badge } from "./Core";

type QiraatOptionItemProps = {
  index: number;
  title: string;
  subtitleArabic: string;
  selected?: boolean;
  onPress?: () => void;
};

export function QiraatOptionItem({
  index,
  title,
  subtitleArabic,
  selected = false,
  onPress,
}: QiraatOptionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border px-3 py-3 ${
        selected ? "border-emerald-700 bg-emerald-50" : "border-cream-300 bg-white"
      }`}
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded-full ${
          selected ? "bg-emerald-700" : "bg-cream-200"
        }`}
      >
        <Text className={`text-xs font-semibold ${selected ? "text-white" : "text-ink-muted"}`}>{index}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-ink">{title}</Text>
        <Text className="text-ink-muted">{subtitleArabic}</Text>
      </View>
      {selected && <Text className="text-emerald-700">✓</Text>}
    </Pressable>
  );
}

type SurahProgressItemProps = {
  order: number;
  name: string;
  meta: string;
  progress: number;
};

export function SurahProgressItem({ order, name, meta, progress }: SurahProgressItemProps) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-white px-3 py-3">
      <View className="flex-row items-center gap-3">
        <Text className="w-5 text-ink-muted">{order}</Text>
        <View>
          <Text className="font-semibold text-ink">{name}</Text>
          <Text className="text-xs text-ink-muted">{meta}</Text>
        </View>
      </View>
      <Badge label={`${progress}%`} tone={progress > 0 ? "success" : "neutral"} />
    </View>
  );
}
