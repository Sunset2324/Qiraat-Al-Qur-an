import { memo } from "react";
import { View, Text, Pressable, type TextStyle } from "react-native";
import { MARK_COLORS, marksAt, splitWords, type WordMark } from "../../utils/teachMarks";

interface Props {
  ayah: number;
  text: string;
  /** hanya tanda milik ayat ini (supaya memo efektif) */
  marks: WordMark[];
  arab: TextStyle;
  color: string;
  markMode: boolean;
  /** kata awal rentang yang sedang dipilih (tekan lama), atau null */
  pendingIdx: number | null;
  isRTL: boolean;
  onWord: (ayah: number, idx: number) => void;
  onWordLong: (ayah: number, idx: number) => void;
}

/**
 * Teks satu ayat. Tanpa tanda & bukan mode Tandai -> satu <Text> biasa (paling ringan).
 * Selain itu dipecah per kata supaya tiap kata bisa diberi garis bawah / stabilo / coret / kotak
 * yang tampil sama di Android, iOS, dan web.
 */
function MarkedAyahBase(p: Props) {
  if (!p.markMode && p.marks.length === 0) {
    return <Text style={{ ...p.arab, color: p.color }}>{p.text}</Text>;
  }

  const words = splitWords(p.text);
  const fs = Number(p.arab.fontSize) || 30;
  const wordText: TextStyle = {
    ...p.arab,
    color: p.color,
    textAlign: "center",
    lineHeight: Math.round(fs * 2.1),
  };

  return (
    // Kata pertama di kanan: layout LTR -> row-reverse; layout RTL sudah membalik "row"
    <View style={{ flexDirection: p.isRTL ? "row" : "row-reverse", flexWrap: "wrap", paddingVertical: 6 }}>
      {words.map((w, i) => {
        const m = marksAt(p.marks, p.ayah, i);
        const pending = p.pendingIdx === i;
        const box = {
          paddingHorizontal: 4,
          marginHorizontal: 2,
          marginVertical: 3,
          borderRadius: 6,
          backgroundColor: m.highlight ? MARK_COLORS[m.highlight].soft : "transparent",
          borderWidth: m.box ? 2 : pending ? 1.5 : 0,
          borderStyle: (pending && !m.box ? "dashed" : "solid") as "dashed" | "solid",
          borderColor: m.box ? MARK_COLORS[m.box].solid : "#9ca3af",
          borderBottomWidth: m.underline ? 3 : m.box ? 2 : pending ? 1.5 : 0,
          borderBottomColor: m.underline ? MARK_COLORS[m.underline].solid : m.box ? MARK_COLORS[m.box].solid : "#9ca3af",
        };
        const inner = (
          <>
            <Text style={wordText}>{w}</Text>
            {m.strike && (
              <View
                pointerEvents="none"
                style={{ position: "absolute", left: 2, right: 2, top: "50%", height: 3, borderRadius: 2, backgroundColor: MARK_COLORS[m.strike].solid }}
              />
            )}
          </>
        );
        return p.markMode ? (
          <Pressable
            key={i}
            onPress={() => p.onWord(p.ayah, i)}
            onLongPress={() => p.onWordLong(p.ayah, i)}
            delayLongPress={350}
            accessibilityRole="button"
            accessibilityLabel={w}
            style={({ pressed }) => [box, pressed ? { opacity: 0.6 } : null]}
          >
            {inner}
          </Pressable>
        ) : (
          <View key={i} style={box}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

export default memo(MarkedAyahBase);
