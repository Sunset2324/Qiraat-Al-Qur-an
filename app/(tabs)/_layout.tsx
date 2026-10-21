import { Tabs } from "expo-router";
import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import MiniPlayer from "../../src/components/MiniPlayer";

const TAB_LABEL_KEY: Record<string, string> = {
  index: "tabHome",
  mushaf: "tabMushaf",
  history: "tabHistory",
  settings: "tabSettings",
};

const TAB_ICON: Record<string, [string, string]> = {
  index: ["home", "home-outline"],
  mushaf: ["book", "book-outline"],
  history: ["time", "time-outline"],
  settings: ["settings", "settings-outline"],
};

function CustomFooter({ state, navigation }: any) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const active = "#059669";
  const inactive = isDarkMode ? "#9CA3AF" : "#6B7280";

  return (
    <View className="bg-transparent" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <MiniPlayer />
      <View className="px-4">
      <View
        className={`flex-row items-center justify-between rounded-2xl px-2 border ${
          isDarkMode ? "bg-[#242424] border-gray-700" : "bg-white border-gray-100"
        }`}
        style={{ minHeight: 64, elevation: 6 }}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const label = t(TAB_LABEL_KEY[route.name] ?? route.name);
          const [on, off] = TAB_ICON[route.name] ?? ["help-circle", "help-circle-outline"];

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              hitSlop={4}
              className="flex-1 items-center justify-center py-2 active:opacity-60"
              style={{ minHeight: 56 }}
            >
              <Ionicons name={(isFocused ? on : off) as any} size={24} color={isFocused ? active : inactive} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                className={`text-[10px] mt-1 ${isFocused ? "text-emerald-600 font-bold" : isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomFooter {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mushaf" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
