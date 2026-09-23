// One reading of a tally, shared by the answer sheet and the exam page so
// both screens give the same exam the same verdict.

export type Verdict = "none" | "you" | "split" | "everyone";

export function touchingShare(touching: number, total: number) {
  return total === 0 ? 0 : Math.round((touching / total) * 100);
}

export function verdictOf(touching: number, total: number): Verdict {
  if (total === 0) return "none";
  const share = touching / total;
  if (share > 0.65) return "you";
  if (share >= 0.35) return "split";
  return "everyone";
}

export const SHORT_VERDICT: Record<Verdict, string> = {
  none: "No votes yet",
  you: "Mostly just you",
  split: "Split",
  everyone: "Everyone got wrecked",
};

// The exam page's answer to its own headline.
export function verdictSentence(touchy: number, total: number, verdict: Verdict) {
  const wrecked = `${touchy} of ${total} got wrecked.`;
  switch (verdict) {
    case "you":
      return `Only ${wrecked} So no, it was mostly just you.`;
    case "split":
      return `${wrecked} It split the room down the middle.`;
    case "everyone":
      return `${wrecked} So yes, it wrecked everyone.`;
    default:
      return "";
  }
}

// "Midterm" reads as "midterm" mid-sentence; "MT1" and "CS Final" keep
// their case.
export function inSentence(examName: string) {
  return /^[A-Z][a-z]/.test(examName)
    ? examName[0].toLowerCase() + examName.slice(1)
    : examName;
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function ago(iso: string | null, now = Date.now()) {
  if (!iso) return null;
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
