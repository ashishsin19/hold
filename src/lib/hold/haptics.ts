export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function haptic(pattern: number | number[]): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export const Haptics = {
  down: () => haptic(12),
  heartbeat: () => haptic([16, 40, 18]),
  double: () => haptic([12, 40, 12, 40, 18]),
  triple: () => haptic([30, 40, 30, 40, 80, 40, 80]),
  long: () => haptic(48),
  error: () => haptic([70, 50, 70]),
  cancel: () => haptic([18, 24, 18, 24, 18]),
  success: () => haptic([12, 30, 24]),
};
