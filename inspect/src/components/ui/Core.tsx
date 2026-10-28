import { View, ViewProps, Pressable, Text, PressableProps } from "react-native";
import { ReactNode } from "react";

type CardProps = ViewProps & {
  variant?: "elevated" | "outline";
};

export function Card({ variant = "outline", className = "", style, ...props }: CardProps) {
  const base = "rounded-2xl bg-white p-4";
  const variants: Record<string, string> = {
    outline: "border border-cream-300",
    elevated: "border border-cream-300 shadow-sm shadow-black/5",
  };
  return <View className={`${base} ${variants[variant]} ${className}`} style={style} {...props} />;
}

type ButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "outline";
};

export function Button({ label, variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "flex-row items-center justify-center rounded-full px-5 py-3 active:opacity-80";
  const variants: Record<string, string> = {
    primary: "bg-emerald-700",
    outline: "border border-emerald-700 bg-transparent",
  };
  const textVariants: Record<string, string> = {
    primary: "font-semibold text-white",
    outline: "font-semibold text-emerald-700",
  };
  return (
    <Pressable className={`${base} ${variants[variant]} ${className}`} {...props}>
      <Text className={textVariants[variant]}>{label}</Text>
    </Pressable>
  );
}

type ProgressBarProps = { progress: number };

export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <View className="h-1.5 w-full rounded-full bg-cream-300">
      <View className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${clamped}%` }} />
    </View>
  );
}

type BadgeProps = { label: string; tone?: "neutral" | "success" };

const tones: Record<string, { box: string; text: string }> = {
  neutral: { box: "bg-cream-200", text: "text-ink-muted" },
  success: { box: "bg-emerald-100", text: "text-emerald-700" },
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const t = tones[tone];
  return (
    <View className={`rounded-full px-2.5 py-1 ${t.box}`}>
      <Text className={`text-xs font-medium ${t.text}`}>{label}</Text>
    </View>
  );
}

type IconBadgeProps = { variant: "madd" | "idgham" | "qalqalah"; children: ReactNode };

const variantClasses: Record<string, string> = {
  madd: "bg-tajweed-madd-bg",
  idgham: "bg-tajweed-idgham-bg",
  qalqalah: "bg-tajweed-qalqalah-bg",
};

export function IconBadge({ variant, children }: IconBadgeProps) {
  return (
    <View className={`h-10 w-10 items-center justify-center rounded-full ${variantClasses[variant]}`}>
      {children}
    </View>
  );
}
