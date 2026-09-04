import { Tabs } from "expo-router";
import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function CustomFooter({ state, descriptors, navigation }: any) {
  return (
    <View className="px-4 pb-6 bg-transparent">
      <View className="flex-row items-center justify-between bg-white rounded-[8px] py-3 px-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] border border-gray-100">
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: any = "help-circle";
          let activeColor = "#059669";
          let inactiveColor = "#9CA3AF";

          if (route.name === "index")
            iconName = isFocused ? "home" : "home-outline";
          if (route.name === "mushaf")
            iconName = isFocused ? "book" : "book-outline";
          if (route.name === "history")
            iconName = isFocused ? "time" : "time-outline";
          if (route.name === "settings")
            iconName = isFocused ? "settings" : "settings-outline";

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="flex-1 items-center justify-center py-1"
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? activeColor : inactiveColor}
              />
              <Text
                className={`text-[10px] mt-1 ${
                  isFocused ? "text-emerald-600 font-bold" : "text-gray-400"
                }`}
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
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomFooter {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="mushaf" options={{ title: "Mushaf" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
