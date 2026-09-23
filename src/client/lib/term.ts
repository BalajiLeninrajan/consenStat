// Each term's season has one colour everywhere it is shown: winter blue,
// spring green, fall peach (the palette's orange).
const SEASON_CLASS: Record<string, string> = {
  winter: "cn-text-blue",
  spring: "cn-text-green",
  fall: "cn-text-peach",
};

export function termClass(termLabel: string): string {
  const season = termLabel.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return SEASON_CLASS[season] ?? "";
}
