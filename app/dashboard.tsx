import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Book, Settings, History, Activity } from "lucide-react-native";

export default function Dashboard() {
  return (
    <View className="flex-1 bg-[#fbf8ef]">
      {/* Header Placeholder */}
      <View className="h-[237px] bg-emerald-800" /> 

      {/* Main Content Section */}
      <View className="flex-1 px-6 -mt-20">
        
        {/* Journal Button */}
        <Pressable 
            onPress={() => router.push("/journal")}
            className="h-[145px] bg-[#fffcf5] rounded-3xl border border-[#dccb9c] items-center justify-center mb-8 shadow-sm"
        >
          <Text className="text-[#7a6132] font-bold">Jurnal Kesehatan</Text>
        </Pressable>

        {/* Navigation Grid */}
        <View className="flex-row justify-between px-4">
          <Pressable onPress={() => router.push("/history")}><History size={30} color="#7a6132" /></Pressable>
          <Activity size={30} color="#7a6132" />
          <Pressable onPress={() => router.push("/mushaf")}><Book size={30} color="#7a6132" /></Pressable>
          <Pressable onPress={() => router.push("/settings")}><Settings size={30} color="#7a6132" /></Pressable>
        </View>
      </View>

      {/* Footer Navigation */}
      <View className="h-[100px] flex-row items-center justify-around bg-transparent border-t border-[#dccb9c]">
        <Pressable onPress={() => router.replace("/")} className="bg-[#f5f0e1] p-3 rounded-full">
          <Text className="text-xs font-bold">Back to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}
