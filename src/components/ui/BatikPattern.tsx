import React from "react";
import { Platform } from "react-native";
import Svg, { Defs, Pattern, G, Ellipse, Circle, Rect } from "react-native-svg";

type Props = {
  /** Default "100%": mengikuti ukuran induk, jadi pas di HP, tablet, maupun landscape. */
  width?: number | string;
  height?: number | string;
  color?: string;
  opacity?: number;
  /** Ukuran satu sel motif kawung (px) */
  cell?: number;
  strokeWidth?: number;
};

let uid = 0;

/** Motif batik kawung sebagai latar dekoratif (tidak menangkap sentuhan). */
export default function BatikPattern({ width = "100%", height = "100%", color = "#fde68a", opacity = 0.15, cell = 40, strokeWidth = 1 }: Props) {
  const id = React.useMemo(() => `kawung${uid++}`, []);
  const h = cell / 2;
  const q = cell / 4;
  return (
    <Svg
      width={width}
      height={height}
      pointerEvents="none"
      style={{ position: "absolute", left: 0, top: 0, opacity }}
      {...(Platform.OS === "web"
        ? { "aria-hidden": true }
        : { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const })}
    >
      <Defs>
        <Pattern id={id} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <G fill="none" stroke={color} strokeWidth={strokeWidth}>
            <Ellipse cx={h} cy={q} rx={cell * 0.2} ry={q} />
            <Ellipse cx={h} cy={h + q} rx={cell * 0.2} ry={q} />
            <Ellipse cx={q} cy={h} rx={q} ry={cell * 0.2} />
            <Ellipse cx={h + q} cy={h} rx={q} ry={cell * 0.2} />
          </G>
          <Circle cx={h} cy={h} r={cell * 0.05} fill={color} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
