// Pengerasan jaringan Android saat build:
//  1) Certificate pinning untuk api.alqiraat.app (network_security_config.xml, dibaca OkHttp/React Native).
//     Pin diisi di security.config.json. Minimal 2 pin (utama + cadangan); kalau kurang, pinning DILEWATI
//     (build tetap jalan) supaya salah isi pin tidak membuat semua pengguna gagal memuat API.
//  2) Hanya mempercayai CA sistem (sertifikat CA yang dipasang pengguna, mis. dari proxy MITM, ditolak).
//  3) allowBackup=false: data lokal (riwayat baca, lokasi) tidak ikut ter-backup lewat adb/cloud.
const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function loadCfg(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "security.config.json"), "utf8"));
  } catch {
    return { host: "", pins: [], expiration: "" };
  }
}

function buildXml(cfg) {
  const pins = (cfg.pins || []).filter((p) => /^[A-Za-z0-9+/]{43}=$/.test(p));
  const usePin = cfg.host && pins.length >= 2;
  if (!usePin) {
    console.warn(
      "[withNetworkHardening] Certificate pinning DILEWATI: isi minimal 2 pin SHA-256 valid di security.config.json."
    );
  }
  const domain = usePin
    ? `
    <domain-config>
        <domain includeSubdomains="false">${cfg.host}</domain>
        <pin-set${cfg.expiration ? ` expiration="${cfg.expiration}"` : ""}>
${pins.map((p) => `            <pin digest="SHA-256">${p}</pin>`).join("\n")}
        </pin-set>
    </domain-config>`
    : "";
  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config>
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>${domain}
</network-security-config>
`;
}

module.exports = function withNetworkHardening(config) {
  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "network_security_config.xml"), buildXml(loadCfg(cfg.modRequest.projectRoot)));
      return cfg;
    },
  ]);
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
      app.$["android:allowBackup"] = "false";
    }
    return cfg;
  });
};
