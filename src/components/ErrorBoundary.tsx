import { Component, ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";

// Rincian teknis hanya di build preview (eas.json: EXPO_PUBLIC_APP_VARIANT=preview).
export const IS_PREVIEW = process.env.EXPO_PUBLIC_APP_VARIANT === "preview";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Menangkap error saat render layar. Tanpa ini, error render di build release membuat app
 * langsung tertutup ("terpental"). Dengan ini, pengguna melihat pesan dan tombol kembali ke beranda.
 * Tidak menangkap crash native (Kotlin/Java); itu hanya terlihat di logcat / Play Console.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[ErrorBoundary]", error?.message, info?.componentStack);
  }

  private home = () => {
    this.setState({ error: null });
    try {
      router.replace("/(tabs)" as any);
    } catch {
      /* abaikan */
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    // Teks tetap Indonesia + Inggris singkat: komponen ini harus bisa tampil walau konteks bahasa/tema yang rusak.
    return (
      <View style={{ flex: 1, backgroundColor: "#fbf8ef", padding: 24, justifyContent: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#2b2a26", textAlign: "center" }}>
          Terjadi kesalahan / Something went wrong
        </Text>
        <Text style={{ fontSize: 14, color: "#6b6558", textAlign: "center", marginTop: 8 }}>
          Halaman ini tidak bisa ditampilkan. Silakan kembali ke beranda.
        </Text>
        {IS_PREVIEW && (
          <ScrollView style={{ maxHeight: 220, marginTop: 16, backgroundColor: "#00000010", borderRadius: 10, padding: 10 }}>
            <Text selectable style={{ fontSize: 11, color: "#7f1d1d" }}>
              {`[preview] ${error.name}: ${error.message}\n\n${(error.stack ?? "").split("\n").slice(0, 8).join("\n")}`}
            </Text>
          </ScrollView>
        )}
        <Pressable
          onPress={this.home}
          accessibilityRole="button"
          style={{ marginTop: 20, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, backgroundColor: "#047857" }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Beranda / Home</Text>
        </Pressable>
      </View>
    );
  }
}
