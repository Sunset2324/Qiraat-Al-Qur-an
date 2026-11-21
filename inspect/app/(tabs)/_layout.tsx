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
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // Gaya sama dengan prototype di landing page: bar rata, latar krem, garis pasir di atas
  const active = isDarkMode ? "#34d399" : "#047857";
  const inactive = isDarkMode ? "#9CA3AF" : "#9a9486";

  return (
    <View className="bg-transparent">
      <MiniPlayer />
      <View
        className={`flex-row items-center justify-around border-t ${theme.bgCard} ${theme.border}`}
        style={{ paddingBottom: Math.max(insets.bottom, 6), paddingTop: 6 }}
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
              className="flex-1 items-center justify-center active:opacity-60"
              style={{ height: 54 }}
            >
              {/* Ikon & label berukuran tetap supaya semua tab sejajar (tidak ada auto-shrink per label) */}
              <View style={{ width: 28, height: 26, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={(isFocused ? on : off) as any} size={22} color={isFocused ? active : inactive} />
              </View>
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                style={{ height: 14, lineHeight: 14, fontSize: 10, textAlign: "center", includeFontPadding: false }}
                className={
                  isFocused
                    ? `font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`
                    : isDarkMode ? "text-gray-400" : "text-[#9a9486]"
                }
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
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
