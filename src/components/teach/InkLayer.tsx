import { memo, useMemo, useRef, useState } from "react";
import { View, PanResponder, type GestureResponderEvent, type PanResponderGestureState } from "react-native";
import Svg, { Path } from "react-native-svg";
import { MARK_COLORS, simplify, newId, type InkStroke, type MarkColor } from "../../utils/teachMarks";

interface Props {
  ayah: number;
  /** coretan milik ayat ini */
  strokes: InkStroke[];
  width: number;
  height: number;
  /** "pen" = menggambar, "erase" = ketuk/geser di atas coretan untuk menghapus, null = hanya tampil */
  active: "pen" | "erase" | null;
  color: MarkColor;
  scale: number;
  onStroke: (s: InkStroke) => void;
  onErase: (ids: string[]) => void;
}

const STROKE_W = 3.5;
const HIT = 14; // px, jarak sentuh penghapus

const toD = (pts: Array<[number, number]>, w: number, h: number) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`).join(" ");

/**
 * Lapisan tinta bebas di atas teks satu ayat (react-native-svg + PanResponder, tanpa library baru).
 * Koordinat diambil dari titik sentuh awal (locationX/Y) ditambah dx/dy gesture, supaya tidak
 * bergantung pada elemen anak yang tersentuh.
 */
function InkLayerBase(p: Props) {
  const [draft, setDraft] = useState<Array<[number, number]> | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const pts = useRef<Array<[number, number]>>([]);
  const propsRef = useRef(p);
  propsRef.current = p;

  const eraseNear = (px: number, py: number) => {
    const { strokes, width: w, height: h, onErase } = propsRef.current;
    const hit = strokes.filter((s) => s.pts.some(([x, y]) => Math.hypot(x * w - px, y * h - py) <= HIT));
    if (hit.length) onErase(hit.map((s) => s.id));
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!propsRef.current.active,
        onMoveShouldSetPanResponder: () => !!propsRef.current.active,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          origin.current = { x, y };
          const { active, width: w, height: h } = propsRef.current;
          if (active === "erase") return eraseNear(x, y);
          pts.current = [[x / w, y / h]];
          setDraft(pts.current);
        },
        onPanResponderMove: (_e, g: PanResponderGestureState) => {
          const { active, width: w, height: h } = propsRef.current;
          const x = origin.current.x + g.dx;
          const y = origin.current.y + g.dy;
          if (active === "erase") return eraseNear(x, y);
          pts.current = [...pts.current, [Math.min(1, Math.max(0, x / w)), Math.min(1, Math.max(0, y / h))]];
          setDraft(pts.current);
        },
        onPanResponderRelease: () => {
          const { active, ayah, color, scale, width: w, onStroke } = propsRef.current;
          if (active === "pen" && pts.current.length > 0) {
            // satu ketukan = titik kecil
            const raw = pts.current.length === 1 ? [pts.current[0], [pts.current[0][0] + 0.002, pts.current[0][1]] as [number, number]] : pts.current;
            onStroke({ id: newId(), ayah, color, pts: simplify(raw, 0.002), scale, cw: Math.round(w) });
          }
          pts.current = [];
          setDraft(null);
        },
        onPanResponderTerminate: () => {
          pts.current = [];
          setDraft(null);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (!p.width || !p.height || (!p.active && p.strokes.length === 0)) return null;

  return (
    <View
      {...(p.active ? responder.panHandlers : {})}
      pointerEvents={p.active ? "auto" : "none"}
      style={{ position: "absolute", left: 0, top: 0, width: p.width, height: p.height }}
    >
      <Svg width={p.width} height={p.height} pointerEvents="none">
        {p.strokes.map((s) => (
          <Path
            key={s.id}
            d={toD(s.pts, p.width, p.height)}
            stroke={MARK_COLORS[s.color].solid}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {draft && (
          <Path
            d={toD(draft, p.width, p.height)}
            stroke={MARK_COLORS[p.color].solid}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
}

export default memo(InkLayerBase);
