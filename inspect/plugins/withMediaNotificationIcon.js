// Mengganti ikon kecil notifikasi media (status bar) dari "tombol play" bawaan
// expo-audio/media3 menjadi ikon buku terbuka. Resource aplikasi dengan nama yang
// sama otomatis menimpa resource milik library saat build.
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const XML = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M2.5,5.2C5.3,4.3 8.9,4.6 11.2,6.2V19.6C8.9,18.1 5.3,17.8 2.5,18.8ZM21.5,5.2C18.7,4.3 15.1,4.6 12.8,6.2V19.6C15.1,18.1 18.7,17.8 21.5,18.8Z" />
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,2.1m-1.1,0a1.1,1.1 0,1 1,2.2 0a1.1,1.1 0,1 1,-2.2 0" />
</vector>
`;

module.exports = function withMediaNotificationIcon(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, "app", "src", "main", "res", "drawable");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "media3_icon_circular_play.xml"), XML);
      return cfg;
    },
  ]);
};
