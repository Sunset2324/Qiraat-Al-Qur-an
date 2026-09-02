import { View, Text } from 'react-native';

export default function Test() {
  return (
    // Jika TIDAK ADA garis merah di bawah "className", berarti BERHASIL!
    <View className="flex-1 bg-cream justify-center items-center">
      <Text className="text-emerald font-bold">Hello World</Text>
    </View>
  );
}