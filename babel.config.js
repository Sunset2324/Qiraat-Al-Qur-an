module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Konfigurasi resmi NativeWind v4 untuk Expo
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // Reanimated v4 memindahkan plugin babel-nya ke paket react-native-worklets.
      // WAJIB di urutan paling bawah.
      "react-native-worklets/plugin",
    ],
  };
};