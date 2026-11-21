import { Tabs, router } from "expo-router";
import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import MiniPlayer from "../../src/components/MiniPlayer";
import BatikPattern from "../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../src/hooks/useIsTablet";
import { ARABIC_FONT } from "../../src/constants/fonts";

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

function SideRail({ state, navigation }: any) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const bg = isDarkMode ? "#0f0f0f" : "#065f46";

  const items = [
    ...state.routes.map((route: any, index: number) => ({
      key: route.key,
      label: t(TAB_LABEL_KEY[route.name] ?? route.name),
      icon: TAB_ICON[route.name] ?? ["help-circle", "help-circle-outline"],
      focused: state.index === index,
      onPress: () => {
        const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
        if (state.index !== index && !event.defaultPrevented) navigation.navigate(route.name);
      },
    })),
  ];
  // sisipkan "Mengajar" sebelum Pengaturan (indeks terakhir)
  items.splice(items.length - 1, 0, {
    key: "teach",
    label: t("tabTeach"),
    icon: ["school", "school-outline"],
    focused: false,
    onPress: () => router.push("/screen/mengajar/mengajar" as any),
  });

  return (
    <View style={{ width: 108, backgroundColor: bg, paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 16), alignItems: "center", overflow: "hidden" }}>
      <BatikPattern width={108} height={1400} cell={36} opacity={isDarkMode ? 0.06 : 0.14} />
      <Text allowFontScaling={false} style={{ fontFamily: ARABIC_FONT, fontSize: 32, color: "#fde68a", marginBottom: 16, lineHeight: 52 }}>
        قِرَاءَات
      </Text>
      {items.map((it: any) => (
        <Pressable
          key={it.key}
          onPress={it.onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: it.focused }}
          accessibilityLabel={it.label}
          className="items-center justify-center active:opacity-70"
          style={{
            width: 84,
            height: 84,
            borderRadius: 22,
            marginBottom: 10,
            backgroundColor: it.focused ? "#fffcf5" : "transparent",
            // Pengaturan didorong ke bawah
            ...(it.key === items[items.length - 1].key ? { marginTop: "auto" } : null),
          }}
        >
          <Ionicons name={(it.focused ? it.icon[0] : it.icon[1]) as any} size={28} color={it.focused ? "#065f46" : "#d1fae5"} />
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            style={{ fontSize: 13, marginTop: 6, fontWeight: it.focused ? "800" : "700", color: it.focused ? "#065f46" : "#d1fae5" }}
          >
            {it.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

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
  const isTablet = useIsTablet();
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: isTablet ? "left" : "bottom" }}
      tabBar={(props) => (isTablet ? <SideRail {...props} /> : <CustomFooter {...props} />)}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mushaf" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
