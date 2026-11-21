import { useWindowDimensions } from "react-native";

/** Tablet / layar lebar: sisi terpendek >= 600 dp (rotasi bebas di tablet). */
export function useIsTablet() {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= 600;
}
