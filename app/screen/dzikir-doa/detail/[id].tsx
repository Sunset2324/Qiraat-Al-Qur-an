import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Copy, Check, Share2, Tag } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../../../src/context/ThemeContext";
import { useLanguage } from "../../../../src/context/LanguageContext";
import BatikPattern from "../../../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../../../src/hooks/useIsTablet";
import { getDetailDoa } from "../../../../src/services/quranService";
import { ARABIC_FONT } from "../../../../src/constants/fonts";
import DzikirCounter from "../../../../src/components/DzikirCounter";
import { getLocalDzikir, isLocalDzikirId, pick } from "../../../../src/data/dzikirSunnah";
import { DOA_OFFLINE_READY, getDoaOffline } from "../../../../src/data/doaOffline";

const DZIKIR_RE = /dzikir|zikir|tasbih|tahmid|takbir|tahlil|istighfar|hauqalah|subhanallah|alhamdulillah|allahu akbar/i;

export default function DoaDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip, language } = useLanguage();
  const { id } = useLocalSearchParams();
  const isTablet = useIsTablet();
  const pad = isTablet ? 40 : 24;
  
  const [doa, setDoa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id, language]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      if (isLocalDzikirId(id)) {
        // data bawaan: tanpa jaringan
        const d = getLocalDzikir(id);
        setDoa(
          d && {
            judul: pick(d.judul, language),
            grup: pick(d.grup, language),
            doa: d.arab,
            latin: d.latin,
            arti: pick(d.arti, language),
            catatan: pick(d.catatan, language),
            faedah: pick(d.faedah, language),
            sumber: d.sumber,
            jumlah: d.jumlah,
            counter: d.kat !== "doa" || d.jumlah > 1,
            tags: [],
          }
        );
        return;
      }
      // Data EQuran.id dibundel di app (offline); API hanya cadangan kalau data bundel belum diisi
      const offline = DOA_OFFLINE_READY ? getDoaOffline(Number(id)) : null;
      if (offline) {
        setDoa(offline);
        return;
      }
      const data = await getDetailDoa(Number(id));
      setDoa(data);
    } catch (error) {
      console.error("Gagal memuat detail doa:", error);
    } finally {
      setLoading(false);
    }
  };

  /** Teks yang disalin / dibagikan: judul, Arab, latin, arti, sumber (kalau ada), nama app. */
  const buildShareText = (): string => {
    if (!doa) return "";
    const parts = [String(doa.judul ?? "").trim(), "", String(doa.doa ?? "").trim()];
    if (doa.latin) parts.push("", `"${String(doa.latin).trim()}"`);
    if (doa.arti) parts.push("", `${t("meaningTitle")}:`, String(doa.arti).trim());
    if (doa.sumber) parts.push("", t("sourceHadith", { src: doa.sumber }));
    parts.push("", "— Qiraat Al-Qur'an");
    return parts.join("\n");
  };

  const onCopy = async () => {
    try {
      await Clipboard.setStringAsync(buildShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* gagal menyalin: tidak ada yang perlu dilakukan */
    }
  };

  const onShare = async () => {
    try {
      await Share.share({ message: buildShareText() });
    } catch {
      /* dibatalkan / gagal: diabaikan */
    }
  };

  if (loading || !doa) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${theme.bg}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <View className={`${theme.bgHeader} flex-row items-center justify-between overflow-hidden`} style={{ paddingHorizontal: pad, paddingVertical: 14 }}>
        <BatikPattern width={1200} height={90} cell={42} opacity={isDarkMode ? 0.08 : 0.15} />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("back")}
          className="items-center justify-center rounded-full active:opacity-70"
          style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.16)" }}
        >
          <ArrowLeft size={22} color="#fff" style={flip} />
        </Pressable>
        <Text className="text-lg font-extrabold text-white">{t("doaDetail")}</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={onCopy}
            accessibilityRole="button"
            accessibilityLabel={t("copyDoa")}
            className="items-center justify-center rounded-full active:opacity-70"
            style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            {copied ? <Check size={22} color="#fde68a" /> : <Copy size={22} color="#fff" />}
          </Pressable>
          <Pressable
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel={t("shareDoa")}
            className="items-center justify-center rounded-full active:opacity-70"
            style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <Share2 size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {copied && (
        <View className={`mx-6 mt-3 px-4 py-2 rounded-xl ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"}`}>
          <Text className={`text-xs font-semibold text-center ${isDarkMode ? "text-emerald-200" : "text-emerald-800"}`}>
            {t("copied")}
          </Text>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 860 }}>
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <View className={`px-3 py-1 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"}`}>
              <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
                {doa.grup || t("general")}
              </Text>
            </View>
          </View>
          <Text className={`text-2xl font-bold ${theme.text} leading-tight`}>
            {doa.judul}
          </Text>
        </View>

        <View className="px-6 mb-6">
          <View className={`p-6 rounded-3xl overflow-hidden ${isDarkMode ? "bg-[#1a1a1a]" : "bg-[#fffcf5]"} border ${theme.border} items-center`}>
            <BatikPattern width={900} height={600} color={isDarkMode ? "#34d399" : "#047857"} cell={56} opacity={0.07} strokeWidth={1.4} />
            <Text 
              className={`${theme.text}`}
              style={{ fontFamily: ARABIC_FONT, textAlign: "right", writingDirection: "rtl", fontSize: isTablet ? 40 : 30, lineHeight: isTablet ? 76 : 56 }}
            >
              {doa.doa}
            </Text>
          </View>
        </View>

        {!!doa.latin && (
          <View className="px-6 mb-6">
            <Text className={`text-sm font-semibold ${theme.textSecondary} mb-2 uppercase tracking-wider`}>{t("howToRead")}</Text>
            <Text className={`text-base italic leading-6 ${theme.textMuted}`}>"{doa.latin}"</Text>
          </View>
        )}

        <View className="px-6 mb-6">
          <Text className={`text-sm font-semibold ${theme.textSecondary} mb-3 uppercase tracking-wider`}>{t("meaningTitle")}</Text>
          <View className={`p-5 rounded-2xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-50"} border ${isDarkMode ? "border-emerald-800" : "border-emerald-200"}`}>
            <Text className={`text-base leading-7 ${theme.text}`} style={{ textAlign: "left" }}>
              {doa.arti}
            </Text>
          </View>
        </View>

        {!!doa.catatan && (
          <View className="px-6 mb-6">
            <Text className={`text-sm font-semibold ${theme.textSecondary} mb-2 uppercase tracking-wider`}>{t("noteTitle")}</Text>
            <Text className={`text-base leading-6 ${theme.text}`} style={{ textAlign: "left" }}>{doa.catatan}</Text>
          </View>
        )}

        {(doa.counter || DZIKIR_RE.test(`${doa.judul} ${doa.grup ?? ""}`)) && (
          <View className="px-6 mb-6">
            <DzikirCounter recommended={doa.jumlah} />
          </View>
        )}

        {!!doa.faedah && (
          <View className="px-6 mb-6">
            <Text className={`text-sm font-semibold ${theme.textSecondary} mb-3 uppercase tracking-wider`}>{t("faedahTitle")}</Text>
            <View className={`p-5 rounded-2xl ${isDarkMode ? "bg-amber-900/20" : "bg-amber-50"} border ${isDarkMode ? "border-amber-800" : "border-amber-200"}`}>
              <Text className={`text-base leading-7 ${theme.text}`} style={{ textAlign: "left" }}>{doa.faedah}</Text>
              {!!doa.sumber && (
                <Text className={`text-[11px] mt-3 ${theme.textMuted}`}>{t("sourceHadith", { src: doa.sumber })}</Text>
              )}
            </View>
          </View>
        )}

        {!!doa.tentang && String(doa.tentang).trim().length > 0 && (
          <View className="px-6 mb-6">
            <Text className={`text-sm font-semibold ${theme.textSecondary} mb-3 uppercase tracking-wider`}>{t("dalilTitle")}</Text>
            <View className={`p-5 rounded-2xl ${isDarkMode ? "bg-amber-900/20" : "bg-amber-50"} border ${isDarkMode ? "border-amber-800" : "border-amber-200"}`}>
              <Text className={`text-base leading-7 ${theme.text}`} style={{ textAlign: "left" }}>
                {String(doa.tentang).trim()}
              </Text>
              <Text className={`text-[11px] mt-3 ${theme.textMuted}`}>
                {t("dalilSource")}
              </Text>
            </View>
          </View>
        )}

        {/* PERBAIKAN TAMPILAN TAGAR DENGAN IKON REACT */}
        {doa.tags && doa.tags.length > 0 && (
          <View className="px-6 mb-6">
            <Text className={`text-sm font-semibold ${theme.textSecondary} mb-3 uppercase tracking-wider`}>{t("relatedTags")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {doa.tags.map((tag: string, index: number) => (
                <View 
                  key={index} 
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}
                >
                  <Tag size={12} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                  <Text className={`text-xs font-medium ${theme.text}`}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}