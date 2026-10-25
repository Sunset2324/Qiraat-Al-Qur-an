import { memo, useMemo } from "react";
import { Text } from "react-native";
import { analyzeTajweed, tajweedColor } from "../utils/tajweedColor";

/**
 * Teks Arab dengan warna per hukum tajwid. Mengembalikan <Text> bersarang,
 * jadi bisa ditaruh di dalam <Text> induk (mengalir seperti biasa).
 */
function TajweedText({ text, isDark }: { text: string; isDark: boolean }) {
  const segs = useMemo(() => analyzeTajweed(text), [text]);
  return (
    <>
      {segs.map((s, i) =>
        s.rule ? (
          <Text key={i} style={{ color: tajweedColor(s.rule, isDark) }}>
            {s.text}
          </Text>
        ) : (
          <Text key={i}>{s.text}</Text>
        )
      )}
    </>
  );
}

export default memo(TajweedText);
