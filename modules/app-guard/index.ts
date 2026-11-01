import { requireOptionalNativeModule } from "expo";

export interface NativeGuardStatus {
  devOptions: boolean;
  adb: boolean;
  debugger: boolean;
  debuggableApp: boolean;
  root: boolean;
  hooked: boolean;
  emulator: boolean;
  vpn: boolean;
  proxy: boolean;
}

interface AppGuardNative {
  getStatus(): Promise<NativeGuardStatus>;
}

/** null di Expo Go, web, iOS, atau build lama tanpa modul ini -> guard otomatis nonaktif. */
const native = requireOptionalNativeModule<AppGuardNative>("AppGuard");

export const isAppGuardAvailable = !!native;

export async function getNativeGuardStatus(): Promise<NativeGuardStatus | null> {
  if (!native) return null;
  return native.getStatus();
}
