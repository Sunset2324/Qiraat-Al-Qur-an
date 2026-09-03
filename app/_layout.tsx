import { Slot } from "expo-router";
import "../src/global.css";

export default function RootLayout() {
  // Jika Anda ingin semua halaman di dalam tabs, 
  // pastikan struktur ini benar.
  return <Slot />;
}