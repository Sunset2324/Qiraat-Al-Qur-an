import { Image } from "react-native";

interface CustomIconProps {
  name: string;
  size?: number;
  isFocused?: boolean;
}

export default function CustomIcon({ name, size = 28, isFocused = false }: CustomIconProps) {
  // Mapping statis agar Metro Bundler dapat me-resolve path dengan benar
  const iconMap: Record<string, any> = {
    home: require("../../assets/icons/home.png"),
    "home-active": require("../../assets/icons/home-active.png"),
    mushaf: require("../../assets/icons/mushaf.png"),
    "mushaf-active": require("../../assets/icons/mushaf-active.png"),
    history: require("../../assets/icons/history.png"),
    "history-active": require("../../assets/icons/history-active.png"),
    settings: require("../../assets/icons/settings.png"),
    "settings-active": require("../../assets/icons/settings-active.png"),
    jurnal: require("../../assets/icons/jurnal.png"),
    qiraat: require("../../assets/icons/qiraat.png"),
    dzikir: require("../../assets/icons/dzikir.png"),
    jadwal: require("../../assets/icons/jadwal.png"),
    tajweed: require("../../assets/icons/tajweed.png"),
    thibbun: require("../../assets/icons/thibbun.png"),
    cuaca: require("../../assets/icons/cuaca.png"),
  };

  const activeName = `${name}-active`;
  // Gunakan ikon aktif jika tersedia dan statusnya focused, jika tidak gunakan ikon biasa
  const source = isFocused && iconMap[activeName] ? iconMap[activeName] : iconMap[name];

  return (
    <Image 
      source={source || iconMap.home} // Fallback ke home jika nama tidak ditemukan
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}