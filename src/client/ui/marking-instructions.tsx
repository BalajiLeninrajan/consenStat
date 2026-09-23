import type { PropsWithChildren } from "react";

const RULES = [
  "One browser, one vote. Don't be a slut for statistics.",
  "Votes are anonymous. Your TA won't find you here.",
  "Don't create duplicates, we have enough problems already.",
];

// The page's one tilted panel, the same rules on every screen.
export function MarkingInstructions({ children }: PropsWithChildren) {
  return (
    <section className="panel is-tilted" aria-labelledby="rules-title">
      <div className="panel-body cn-stack cn-gap-16">
        <h2 id="rules-title" className="cn-title cn-m-0">
          Marking instructions
        </h2>
        <ol className="cn-list-none cn-stack cn-gap-16">
          {RULES.map((rule, index) => (
            <li key={rule} className="cn-row cn-top cn-gap-12">
              <span className="mark">{String(index + 1).padStart(2, "0")}</span>
              <span className="cn-copy">{rule}</span>
            </li>
          ))}
        </ol>
        {children}
      </div>
    </section>
  );
}
