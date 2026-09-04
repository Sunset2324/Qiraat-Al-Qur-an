module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Konfigurasi resmi NativeWind v4 untuk Expo
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // Plugin Reanimated WAJIB ada di sini, dan WAJIB di urutan paling bawah
      "react-native-reanimated/plugin",
    ],
  };
};
