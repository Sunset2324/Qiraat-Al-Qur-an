import { useCallback, useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, TextInput, ActivityIndicator, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Headphones, ChevronRight, Bell, Search } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { getDaftarSurah, getMushafPages, type MushafPagesSummary } from "../../src/services/quranService";
import { QURAN_FONT } from "../../src/constants/fonts";
import BatikPattern from "../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../src/hooks/useIsTablet";
import TabHeader from "../../src/components/ui/TabHeader";
import { getLastReadAyah } from "../../src/utils/readingHistory"; // Import utility baru

interface SurahItem {
  nomor: number;
  namaLatin: string;
  namaArab: string;
  arti: string;
  jumlahAyat: number;
  tempatTurun: string;
}

export default function MushafScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const { width: winWidth } = useWindowDimensions();
  const isTablet = useIsTablet();
  const gutter = winWidth < 360 ? 16 : isTablet ? 40 : 24;
  // Tablet: daftar jadi grid 2 kolom (3 kolom di layar sangat lebar)
  const cols = winWidth >= 1100 ? 3 : winWidth >= 700 ? 2 : 1;
  const { selectedMushafId, selectedMushafName } = useLocalSearchParams();
  
  const [currentMushaf, setCurrentMushaf] = useState({ id: "1", name: "Hafs 'an 'Asim" });
  const [surahList, setSurahList] = useState<SurahItem[]>([]);
  const [lastRead, setLastRead] = useState<{ nomor: number; nama: string; ayat: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mode baca: per surah atau per halaman (halaman mengikuti mushaf/qiraat yang dipilih)
  const [viewMode, setViewMode] = useState<"surah" | "page">("surah");
  const [pagesSummary, setPagesSummary] = useState<MushafPagesSummary | null>(null);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [lastPage, setLastPage] = useState<number | null>(null);
  const [pagesReload, setPagesReload] = useState(0);

  const changeMode = (m: "surah" | "page") => {
    setViewMode(m);
    setSearchQuery("");
    AsyncStorage.setItem("mushaf_view_mode", m).catch(() => {});
  };

  // Ingat mode terakhir
  useEffect(() => {
    AsyncStorage.getItem("mushaf_view_mode")
      .then((v) => v === "page" && setViewMode("page"))
      .catch(() => {});
  }, []);

  // Muat daftar halaman untuk mushaf aktif saat mode halaman dibuka / mushaf berganti
  useEffect(() => {
    if (viewMode !== "page") return;
    let cancelled = false;
    setPagesLoading(true);
    setPagesSummary(null);
    getMushafPages(currentMushaf.id)
      .then((d) => !cancelled && setPagesSummary(d))
      .catch(() => {})
      .finally(() => !cancelled && setPagesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [viewMode, currentMushaf.id, pagesReload]);

  // Halaman terakhir dibaca (disegarkan tiap layar ini fokus)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(`last_page_mushaf_${currentMushaf.id}`)
        .then((v) => setLastPage(v ? parseInt(v, 10) || null : null))
        .catch(() => setLastPage(null));
    }, [currentMushaf.id])
  );

  const openPage = (page: number) =>
    router.push({
      pathname: "/screen/halaman/[page]",
      params: { page: String(page), mushafId: currentMushaf.id },
    });

  const loadSurahList = useCallback(async () => {
    try {
      const data = await getDaftarSurah();
      setSurahList(data);
    } catch (e) {
      console.error("Gagal memuat daftar surah:", e);
    }
  }, []);

  // LOGIKA BARU: Load last read spesifik untuk Mushaf (Qiraat) yang aktif
  const loadLastRead = useCallback(async () => {
    try {
      // Kita cek surah yang paling umum dibaca atau bisa diiterasi. 
      // Untuk simplicity di card ini, kita cek surah 1 (Al-Fatihah) atau bisa disimpan global last active surah.
      // Disini saya asumsikan kita menyimpan 'last_active_surah_nomor' secara global per mushaf
      const lastActiveSurahStr = await AsyncStorage.getItem(`last_active_surah_mushaf_${currentMushaf.id}`);
      const surahNomor = lastActiveSurahStr ? parseInt(lastActiveSurahStr) : 1;
      
      const ayatNomor = await getLastReadAyah(surahNomor, currentMushaf.id);
      
      if (ayatNomor) {
        // Cari nama surah dari list
        const surah = surahList.find(s => s.nomor === surahNomor);
        if (surah) {
          setLastRead({ nomor: surahNomor, nama: surah.namaLatin, ayat: ayatNomor });
        }
      } else {
        setLastRead(null);
      }
    } catch (e) {
      console.error("Gagal memuat last read:", e);
    }
  }, [currentMushaf.id, surahList]);

  useFocusEffect(
    useCallback(() => {
      const loadPreferences = async () => {
        if (selectedMushafId && selectedMushafName) {
          const idStr = String(selectedMushafId);
          const nameStr = String(selectedMushafName);
          setCurrentMushaf({ id: idStr, name: nameStr });
          await AsyncStorage.setItem("selected_mushaf_id", idStr);
          await AsyncStorage.setItem("selected_mushaf_name", nameStr);
        } else {
          const savedId = await AsyncStorage.getItem("selected_mushaf_id");
          const savedName = await AsyncStorage.getItem("selected_mushaf_name");
          if (savedId) {
            setCurrentMushaf({ id: savedId, name: savedName || t("mushafSelected") });
          }
        }
        loadSurahList();
        // Load last read setelah mushaf ditentukan
        setTimeout(() => loadLastRead(), 500); 
      };
      loadPreferences();
    }, [selectedMushafId, selectedMushafName, loadSurahList, loadLastRead])
  );

  // LOGIKA BARU: Jika ada lastRead, lempar ke ayat tersebut. Jika tidak, ke ayat 1.
  const handleOpenSurah = (nomor: number, nama: string) => {
    // Simpan surah aktif untuk mushaf ini
    AsyncStorage.setItem(`last_active_surah_mushaf_${currentMushaf.id}`, String(nomor));
    
    const params: any = { nomor: String(nomor), mushafId: currentMushaf.id };
    if (lastRead && lastRead.nomor === nomor) {
      params.ayat = String(lastRead.ayat);
    }

    router.push({
      pathname: '/screen/surah/[nomor]',
      params
    });
  };

  const filteredSurahList = useMemo(() => {
    if (!searchQuery.trim()) return surahList;
    const q = searchQuery.toLowerCase();
    return surahList.filter(
      (s) =>
        s.namaLatin.toLowerCase().includes(q) ||
        s.arti.toLowerCase().includes(q) ||
        String(s.nomor).includes(q)
    );
  }, [surahList, searchQuery]);

  const filteredPageRows = useMemo(() => {
    const rows = (pagesSummary?.pages ?? []).map((p) => ({
      ...p,
      surahName: surahList.find((s) => s.nomor === p.surah)?.namaLatin ?? "",
    }));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => String(r.page).startsWith(q) || r.surahName.toLowerCase().includes(q));
  }, [pagesSummary, surahList, searchQuery]);

  const cardStyle = { flex: 1, minHeight: isTablet ? 88 : 76, ...(cols > 1 ? { marginHorizontal: 6 } : null) } as const;

  const gridData = useMemo(() => {
    const base: any[] = viewMode === "surah" ? filteredSurahList : filteredPageRows;
    if (cols === 1 || base.length === 0) return base;
    const pad = (cols - (base.length % cols)) % cols;
    return pad ? [...base, ...Array.from({ length: pad }, (_, i) => ({ spacer: true, nomor: `s${i}`, page: `s${i}` }))] : base;
  }, [viewMode, filteredSurahList, filteredPageRows, cols]);

  const renderPageItem = ({ item }: { item: any }) =>
    item.spacer ? <View style={{ flex: 1, marginHorizontal: cols > 1 ? 6 : 0 }} /> : (
    <Pressable
      onPress={() => openPage(item.page)}
      accessibilityRole="button"
      style={cardStyle}
      className={`p-4 rounded-3xl border ${theme.border} ${theme.bgCard} mb-3 flex-row items-center gap-3 active:opacity-90`}
    >
      <View className={`h-12 w-12 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} items-center justify-center`}>
        <Text className={`text-base font-extrabold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{item.page}</Text>
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className={`text-base font-extrabold ${theme.text}`}>{t("pageTitle")} {item.page}</Text>
        <Text numberOfLines={2} className={`text-xs ${theme.textSecondary}`}>
          {item.surahName}
          {item.juz ? ` • ${t("juzN", { n: item.juz })}` : ""}
        </Text>
      </View>
      <ChevronRight size={20} color={theme.iconColor} style={flip} />
    </Pressable>
  );

  const renderSurahItem = ({ item }: { item: any }) =>
    item.spacer ? <View style={{ flex: 1, marginHorizontal: cols > 1 ? 6 : 0 }} /> : (
    <Pressable
      onPress={() => handleOpenSurah(item.nomor, item.namaLatin)}
      accessibilityRole="button"
      accessibilityLabel={`${item.nomor}. ${item.namaLatin}`}
      style={cardStyle}
      className={`p-4 rounded-3xl border ${theme.border} ${theme.bgCard} mb-3 flex-row items-center gap-3 active:opacity-90`}
    >
      <View className={`h-12 w-12 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} items-center justify-center`}>
        <Text className={`text-base font-extrabold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
          {item.nomor}
        </Text>
      </View>
      
      <View className="flex-1 min-w-0">
        <Text numberOfLines={1} className={`text-base font-extrabold ${theme.text}`}>{item.namaLatin}</Text>
        <Text numberOfLines={2} className={`text-xs ${theme.textSecondary}`}>
          {item.arti} • {t("versesCount", { n: item.jumlahAyat })} • {item.tempatTurun === 'Mekah' ? t("makkiyah") : t("madaniyah")}
        </Text>
      </View>

      <Text numberOfLines={1} className={`${isTablet ? "text-2xl" : "text-xl"} ${isDarkMode ? "text-emerald-300" : "text-emerald-800"} flex-shrink`} style={{ fontFamily: QURAN_FONT, maxWidth: "34%" }}>
        {item.namaArab}
      </Text>
      
      <ChevronRight size={20} color={theme.iconColor} style={flip} />
    </Pressable>
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <TabHeader tag={t("greeting")} title={t("mushafLearn")} arabic="المصحف" />

      <FlatList
        key={`${viewMode}-${cols}`}
        numColumns={cols}
        data={gridData as any[]}
        keyExtractor={(item: any) => (viewMode === "surah" ? String(item.nomor) : `p${item.page}`)}
        columnWrapperStyle={cols > 1 ? { marginHorizontal: -6 } : undefined}
        renderItem={(viewMode === "surah" ? renderSurahItem : renderPageItem) as any}
        extraData={viewMode}
        ListEmptyComponent={
          viewMode === "page" ? (
            pagesLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
              </View>
            ) : !pagesSummary ? (
              <View className="items-center py-10">
                <Text className={`text-center mb-4 ${theme.textMuted}`}>{t("pageLoadFailed")}</Text>
                <Pressable
                  onPress={() => setPagesReload((k) => k + 1)}
                  className={`px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
                >
                  <Text className="text-white font-bold">{t("retry")}</Text>
                </Pressable>
              </View>
            ) : null
          ) : null
        }
        ListHeaderComponent={
          <View className="mb-6">
            <View className="mb-6">
              <Pressable 
                onPress={() => router.push('/screen/qiraat/qiraat')}
                accessibilityRole="button"
                style={{ minHeight: 72 }}
                className={`p-4 rounded-3xl border ${theme.border} ${theme.bgCard} flex-row items-center justify-between active:opacity-90`}
              >
                <View className="flex-row items-center gap-3">
                  <View className={`h-12 w-12 items-center justify-center rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"}`}>
                    <Headphones size={20} color={isDarkMode ? "#34d399" : "#047857"} />
                  </View>
                  <View>
                    <Text className={`text-xs ${theme.textSecondary}`}>{t("selectedQiraat")}</Text>
                    <Text className={`text-base font-extrabold ${theme.text}`}>{currentMushaf.name}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={theme.iconColor} style={flip} />
              </Pressable>
            </View>

            {/* Pilih mode baca: per surah / per halaman */}
            <View className={`flex-row p-1 rounded-full border ${theme.border} ${theme.bgCard} mb-6`}>
              {(["page", "surah"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => changeMode(m)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: viewMode === m }}
                  style={{ height: 48 }}
                  className={`flex-1 rounded-full items-center justify-center ${viewMode === m ? "bg-emerald-800" : ""}`}
                >
                  <Text className={`text-sm font-bold ${viewMode === m ? "text-white" : theme.textSecondary}`}>
                    {t(m === "surah" ? "viewBySurah" : "viewByPage")}
                  </Text>
                </Pressable>
              ))}
            </View>

            {viewMode === "surah" && (
              <>
            {/* Card Lanjutkan Belajar (LOGIKA IF) */}
            {lastRead ? (
              <View className="mb-6">
                <View className={`p-6 rounded-3xl overflow-hidden ${isDarkMode ? "bg-emerald-900" : "bg-emerald-800"}`}>
                  <BatikPattern cell={42} opacity={0.14} />
                  <Text className={`text-xs font-bold tracking-[2px] ${isDarkMode ? "text-emerald-300" : "text-emerald-100"} mb-2`}>
                    {t("continueLearning")}
                  </Text>
                  <View className="flex-row items-center justify-between gap-3 mb-2">
                    <View className="flex-1 min-w-0">
                      <Text numberOfLines={1} className="text-2xl font-bold text-white mb-1">{lastRead.nama}</Text>
                      <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>
                        {t("surahAyahLine", { n: lastRead.nomor, a: lastRead.ayat })}
                      </Text>
                    </View>
                    <View className={`h-14 w-14 rounded-full border-2 ${isDarkMode ? "border-emerald-600" : "border-emerald-500"} items-center justify-center`}>
                      <Text className={`text-xl font-bold ${isDarkMode ? "text-emerald-300" : "text-white"}`}>
                        {lastRead.nomor}
                      </Text>
                    </View>
                  </View>
                  <Pressable 
                    onPress={() => handleOpenSurah(lastRead.nomor, lastRead.nama)}
                    accessibilityRole="button"
                    style={{ height: 52 }}
                    className="rounded-full bg-amber-400 items-center justify-center mt-2 active:opacity-90"
                  >
                    <Text className="text-sm font-extrabold text-emerald-950">
                      {t("continueToAyah", { a: lastRead.ayat })}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="mb-6">
                <View className={`p-6 rounded-3xl border-2 border-dashed ${theme.border} items-center justify-center`}>
                  <Text className={`text-sm font-medium ${theme.textMuted}`}>
                    {t("noBookmark", { name: currentMushaf.name })}
                  </Text>
                  <Text className={`text-xs ${theme.textMuted} mt-1`}>
                    {t("tapToBookmark")}
                  </Text>
                </View>
              </View>
            )}
              </>
            )}

            {viewMode === "page" && (
              <View className="mb-6">
                {lastPage ? (
                  <View className={`p-5 rounded-3xl overflow-hidden ${isDarkMode ? "bg-emerald-900" : "bg-emerald-800"}`}>
                    <BatikPattern cell={42} opacity={0.14} />
                    <Text className={`text-xs font-bold tracking-[2px] ${isDarkMode ? "text-emerald-300" : "text-emerald-100"} mb-2`}>
                      {t("continueLearning")}
                    </Text>
                    <Text className="text-2xl font-bold text-white mb-3">{t("pageTitle")} {lastPage}</Text>
                    <Pressable
                      onPress={() => openPage(lastPage)}
                      accessibilityRole="button"
                      style={{ height: 52 }}
                      className="rounded-full bg-amber-400 items-center justify-center active:opacity-90"
                    >
                      <Text className="text-sm font-extrabold text-emerald-950">
                        {t("continuePage", { n: lastPage })}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View className={`p-4 rounded-3xl border ${theme.border} ${theme.bgCard}`}>
                    <Text className={`text-sm ${theme.textSecondary}`}>{t("pageListHint", { name: currentMushaf.name })}</Text>
                  </View>
                )}
              </View>
            )}

            <View className={`flex-row items-center gap-3 px-5 rounded-full border ${theme.border} ${theme.bgCard} mb-6`} style={{ height: 52 }}>
              <Search size={20} color={theme.mutedColor} />
              <TextInput
                placeholder={t(viewMode === "surah" ? "searchSurah" : "searchPage")}
                placeholderTextColor={theme.mutedColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className={`flex-1 text-base ${theme.text}`}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel={t("clearSearch")} hitSlop={12}>
                  <Text className={`text-sm ${theme.textSecondary}`}>✕</Text>
                </Pressable>
              )}
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-lg font-bold ${theme.text}`}>{t(viewMode === "surah" ? "surahList" : "pageTitle")}</Text>
              <Text className={`text-sm ${theme.textSecondary}`}>
                {viewMode === "surah"
                  ? `${filteredSurahList.length} / 114`
                  : pagesLoading
                  ? "…"
                  : `${filteredPageRows.length} / ${pagesSummary?.totalPages ?? "—"}`}
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 24, paddingBottom: 100, width: "100%", maxWidth: 1180, alignSelf: "center" }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={9}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
}