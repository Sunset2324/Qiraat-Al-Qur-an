package app.qiraat.alquran.appguard

import android.content.Context
import android.content.pm.ApplicationInfo
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Debug
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.net.InetSocketAddress
import java.net.NetworkInterface
import java.net.Socket

/**
 * Deteksi lingkungan berisiko (best-effort, bukan jaminan):
 * opsi pengembang, ADB, debugger, root, hooking (Frida/Xposed), emulator, VPN, dan proxy.
 * Semua pemeriksaan dibungkus try/catch: gagal memeriksa = dianggap aman (fail-open),
 * supaya perangkat sah tidak terblokir karena error.
 */
class AppGuardModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AppGuard")

    // Berjalan di thread background (ada pengecekan socket singkat untuk Frida).
    AsyncFunction("getStatus") {
      collect()
    }
  }

  private inline fun safe(block: () -> Boolean): Boolean =
    try { block() } catch (_: Throwable) { false }

  private fun collect(): Map<String, Boolean> {
    val ctx = context
    return mapOf(
      "devOptions" to devOptions(ctx),
      "adb" to adb(ctx),
      "debugger" to debugger(),
      "debuggableApp" to debuggableApp(ctx),
      "root" to root(),
      "hooked" to hooked(),
      "emulator" to emulator(),
      "vpn" to vpn(ctx),
      "proxy" to proxy(ctx),
    )
  }

  // ---------- developer ----------
  private fun devOptions(ctx: Context) = safe {
    Settings.Global.getInt(ctx.contentResolver, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) == 1
  }

  private fun adb(ctx: Context) = safe {
    Settings.Global.getInt(ctx.contentResolver, Settings.Global.ADB_ENABLED, 0) == 1
  }

  private fun debugger() = safe {
    Debug.isDebuggerConnected() || Debug.waitingForDebugger() || tracerPid() > 0
  }

  private fun tracerPid(): Int = try {
    File("/proc/self/status").useLines { lines ->
      lines.firstOrNull { it.startsWith("TracerPid:") }
        ?.substringAfter(":")?.trim()?.toIntOrNull() ?: 0
    }
  } catch (_: Throwable) { 0 }

  private fun debuggableApp(ctx: Context) = safe {
    (ctx.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
  }

  // ---------- root / hooking / emulator ----------
  private fun root() = safe {
    val paths = arrayOf(
      "/system/bin/su", "/system/xbin/su", "/sbin/su", "/system/su",
      "/system/app/Superuser.apk", "/system/sd/xbin/su", "/data/local/xbin/su",
      "/data/local/bin/su", "/data/local/su", "/su/bin/su", "/sbin/.magisk",
      "/data/adb/magisk", "/system/bin/.ext/.su",
    )
    paths.any { File(it).exists() } || (Build.TAGS?.contains("test-keys") == true)
  }

  private fun hooked() = safe {
    xposedLoaded() || suspiciousMaps() || fridaPortOpen()
  }

  private fun xposedLoaded(): Boolean {
    try {
      Class.forName("de.robv.android.xposed.XposedBridge")
      return true
    } catch (_: Throwable) {}
    return try {
      throw Exception("probe")
    } catch (e: Exception) {
      e.stackTrace.any {
        it.className.contains("de.robv.android.xposed") || it.className.contains("com.saurik.substrate")
      }
    }
  }

  private fun suspiciousMaps(): Boolean = try {
    val needles = listOf("frida", "gum-js", "gadget", "xposed", "lsposed", "substrate")
    File("/proc/self/maps").useLines { lines ->
      lines.any { line -> val l = line.lowercase(); needles.any { l.contains(it) } }
    }
  } catch (_: Throwable) { false }

  private fun fridaPortOpen(): Boolean = try {
    Socket().use { s ->
      s.connect(InetSocketAddress("127.0.0.1", 27042), 120) // port bawaan frida-server
      true
    }
  } catch (_: Throwable) { false }

  private fun emulator() = safe {
    val fp = Build.FINGERPRINT.lowercase()
    val model = Build.MODEL.lowercase()
    val hw = Build.HARDWARE.lowercase()
    fp.startsWith("generic") || fp.contains("emulator") || fp.contains("sdk_gphone") ||
      model.contains("emulator") || model.contains("android sdk built for") ||
      hw.contains("goldfish") || hw.contains("ranchu") ||
      Build.PRODUCT.lowercase().contains("sdk") ||
      (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
  }

  // ---------- jaringan ----------
  private fun vpn(ctx: Context) = safe {
    val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    var found = false
    @Suppress("DEPRECATION")
    val nets = cm.allNetworks.toMutableList()
    cm.activeNetwork?.let { nets.add(it) }
    for (n in nets) {
      val caps = cm.getNetworkCapabilities(n) ?: continue
      if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN) ||
        !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_VPN)
      ) { found = true; break }
    }
    if (!found) {
      // cadangan: antarmuka tunnel yang aktif (tun0, ppp0, wg0, ...)
      found = NetworkInterface.getNetworkInterfaces()?.toList()?.any {
        it.isUp && listOf("tun", "ppp", "tap", "wg", "ipsec").any { p -> it.name.startsWith(p) }
      } == true
    }
    found
  }

  private fun proxy(ctx: Context) = safe {
    val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val sys = !System.getProperty("http.proxyHost").isNullOrBlank() ||
      !System.getProperty("https.proxyHost").isNullOrBlank()
    sys || cm.defaultProxy != null
  }
}
