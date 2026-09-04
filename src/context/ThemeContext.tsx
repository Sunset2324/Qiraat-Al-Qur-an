import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipe untuk Theme
type ThemeMode = "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: {
    bg: string;
    bgCard: string;
    bgHeader: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    footerBg: string;
    iconColor: string;
    cardBg: string;
    inputBg: string;
  };
}

// Warna tema
const lightTheme = {
  bg: "bg-[#fbf8ef]",
  bgCard: "bg-[#fffcf5]",
  bgHeader: "bg-emerald-800",
  text: "text-emerald-950",
  textSecondary: "text-emerald-800/70",
  textMuted: "text-[#6b6558]",
  border: "border-[#dccb9c]",
  footerBg: "bg-emerald-800",
  iconColor: "#047857",
  cardBg: "#fffcf5",
  inputBg: "#fbf8ef",
};

const darkTheme = {
  bg: "bg-[#1a1a1a]",
  bgCard: "bg-[#242424]",
  bgHeader: "bg-[#0f0f0f]",
  text: "text-gray-100",
  textSecondary: "text-gray-400",
  textMuted: "text-gray-500",
  border: "border-gray-700",
  footerBg: "bg-[#0f0f0f]",
  iconColor: "#fff",
  cardBg: "#242424",
  inputBg: "#1a1a1a",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  // Load tema dari AsyncStorage saat pertama kali
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("themeMode");
        if (savedTheme === "dark" || savedTheme === "light") {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    };
    loadTheme();
  }, []);

  // Toggle tema dan simpan ke AsyncStorage
  const toggleTheme = async () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
    try {
      await AsyncStorage.setItem("themeMode", newMode);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const isDarkMode = themeMode === "dark";
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook untuk menggunakan theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};