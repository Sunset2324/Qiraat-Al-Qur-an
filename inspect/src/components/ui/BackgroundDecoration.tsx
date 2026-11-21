import { View, StyleSheet } from "react-native";

export const BackgroundDecoration = () => {
  return (
    <View style={StyleSheet.absoluteFill} className="opacity-40">
      {/* Placeholder untuk border-stroke */}
      <View className="absolute top-0 left-0 w-[171px] h-[171px] bg-emerald-200 rounded-full" />

      {/* Placeholder untuk image */}
      <View className="absolute top-28 right-0 w-32 h-48 bg-cream-300 rounded-lg" />
    </View>
  );
};
