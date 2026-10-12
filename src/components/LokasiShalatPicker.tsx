import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, Search, X } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { getKabKotaShalat, getProvinsiShalat } from "../services/quranService";

export interface LokasiShalat {
  provinsi: string;
  kota: string;
}

interface Props {
  visible: boolean;
  current: LokasiShalat;
  onClose: () => void;
  onSelect: (lokasi: LokasiShalat) => void;
}

/**
 * Pilih lokasi dua langkah: provinsi -> kab/kota.
 * Nama yang dikirim ke callback persis seperti dari EQuran.id,
 * karena endpoint jadwal menuntut nama resmi yang sama.
 */
export default function LokasiShalatPicker({ visible, current, onClose, onSelect }: Props) {
  const { isDarkMode, theme } = useTheme();
  const [langkah, setLangkah] = useState<"provinsi" | "kota">("provinsi");
  const [provinsi, setProvinsi] = useState<string | null>(null);
  const [daftar, setDaftar] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // Reset tiap kali dibuka
  useEffect(() => {
    if (visible) {
      setLangkah("provinsi");
      setProvinsi(null);
      setQuery("");
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let batal = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data =
          langkah === "provinsi" ? await getProvinsiShalat() : await getKabKotaShalat(provinsi as string);
        if (!batal) setDaftar(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!batal) {
          setDaftar([]);
          setError(e?.message || "Gagal memuat daftar lokasi.");
        }
      } finally {
        if (!batal) setLoading(false);
      }
    })();
    return () => {
      batal = true;
    };
  }, [visible, langkah, provinsi, retryKey]);

  const tampil = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? daftar.filter((x) => x.toLowerCase().includes(q)) : daftar;
  }, [daftar, query]);

  const pilih = (nama: string) => {
    setQuery("");
    if (langkah === "provinsi") {
      setProvinsi(nama);
      setLangkah("kota");
    } else {
      onSelect({ provinsi: provinsi as string, kota: nama });
    }
  };

  const kembali = () => {
    if (langkah === "kota") {
      setLangkah("provinsi");
      setProvinsi(null);
      setQuery("");
    } else {
      onClose();
    }
  };

  const judul = langkah === "provinsi" ? "Pilih Provinsi" : `Pilih Kab/Kota`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={kembali}>
      <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top", "bottom"]}>
        <View className={`flex-row items-center px-6 py-4 border-b ${theme.border}`}>
          <Pressable onPress={kembali} className="p-2 mr-2">
            <ArrowLeft size={24} color={theme.iconColor} />
          </Pressable>
          <View className="flex-1">
            <Text className={`text-lg font-bold ${theme.text}`}>{judul}</Text>
            {langkah === "kota" && provinsi ? (
              <Text className={`text-xs ${theme.textMuted}`}>{provinsi}</Text>
            ) : null}
          </View>
          <Pressable onPress={onClose} className="p-2">
            <X size={22} color={theme.iconColor} />
          </Pressable>
        </View>

        <View className="px-6 pt-4 pb-2">
          <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
            <Search size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <TextInput
              className={`flex-1 ml-3 text-base ${theme.text}`}
              placeholder={langkah === "provinsi" ? "Cari provinsi..." : "Cari kab/kota..."}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.iconColor} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className={`text-center mb-4 ${theme.textMuted}`}>{error}</Text>
            <Pressable onPress={() => setRetryKey((k) => k + 1)} className="px-5 py-2 rounded-full bg-emerald-600 active:opacity-80">
              <Text className="text-white font-semibold">Coba lagi</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={tampil}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            ListEmptyComponent={
              <Text className={`text-center mt-10 ${theme.textMuted}`}>Tidak ditemukan.</Text>
            }
            renderItem={({ item }) => {
              const aktif =
                langkah === "provinsi"
                  ? item === current.provinsi
                  : item === current.kota && provinsi === current.provinsi;
              return (
                <Pressable
                  onPress={() => pilih(item)}
                  className={`flex-row items-center justify-between px-4 py-4 mb-2 rounded-xl border ${theme.border} ${
                    aktif ? (isDarkMode ? "bg-emerald-900/40" : "bg-emerald-50") : theme.bgCard
                  } active:opacity-80`}
                >
                  <Text className={`text-base ${theme.text}`}>{item}</Text>
                  {aktif ? (
                    <Check size={18} color={isDarkMode ? "#34d399" : "#047857"} />
                  ) : (
                    <Text className={`text-lg ${theme.textMuted}`}>{langkah === "provinsi" ? "›" : ""}</Text>
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}