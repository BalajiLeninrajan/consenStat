import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getRecentExams, searchExams, type ExamSummary } from "../lib/api";
import { SHORT_VERDICT, touchingShare, verdictOf } from "../lib/verdict";
import { Input } from "../ui/input";
import { MarkingInstructions } from "../ui/marking-instructions";

const PAGE = 8;

// How many votes each exam took since the previous fetch. The first load
// has nothing to compare against, so nothing counts as new.
function useNewVotes(items: ExamSummary[] | undefined) {
  const previous = useRef<Map<number, number> | null>(null);
  const [fresh, setFresh] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    if (!items) return;
    const last = previous.current;
    const next = new Map<number, number>();
    if (last) {
      for (const exam of items) {
        const before = last.get(exam.id);
        if (before !== undefined && exam.voteCount > before) {
          next.set(exam.id, exam.voteCount - before);
        }
      }
    }
    previous.current = new Map(items.map((exam) => [exam.id, exam.voteCount]));
    setFresh(next);
  }, [items]);

  return fresh;
}

// Ten bubbles, one per tenth of the class that said touching.
function Scale({ touching, total }: { touching: number; total: number }) {
  const filled = total === 0 ? 0 : Math.round((touching / total) * 10);
  return (
    <span
      className="cs-scale"
      role="img"
      aria-label={
        total === 0
          ? "No votes yet"
          : `${touchingShare(touching, total)}% of ${total} voters said touching`
      }
    >
      {Array.from({ length: 10 }, (_, index) => (
        <span
          key={index}
          className={index < filled ? "cs-bubble is-filled" : "cs-bubble"}
          style={{ "--i": index } as CSSProperties}
        />
      ))}
    </span>
  );
}

function Question({
  exam,
  number,
  fresh,
  onSettled,
}: {
  exam: ExamSummary;
  number: number;
  fresh: number | undefined;
  onSettled: () => void;
}) {
  const total = exam.voteCount;
  const votes =
    total === 0 ? "No votes yet" : `${total} ${total === 1 ? "vote" : "votes"}`;

  return (
    <Link
      to={`/exam/${exam.id}`}
      className={`ranked-row cs-q${fresh ? " cs-just-changed" : ""}`}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onSettled();
      }}
    >
      <span className="cs-timing" aria-hidden="true" />
      <span className="cs-num cn-meta">{String(number).padStart(2, "0")}</span>
      <span className="cs-exam">
        <strong className="cn-truncate">
          {exam.courseCode} {exam.examName}
        </strong>
        <span className="cn-meta">
          {exam.termLabel} · {votes}
          {fresh ? `, ${fresh} just now` : ""}
        </span>
      </span>
      <Scale touching={exam.touchingCount} total={total} />
      <b className="cn-value">
        {total === 0 ? "–" : `${touchingShare(exam.touchingCount, total)}%`}
      </b>
      <span className="cs-says">
        {SHORT_VERDICT[verdictOf(exam.touchingCount, total)]}
      </span>
    </Link>
  );
}

export function HomePage() {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const [settled, setSettled] = useState<Set<number>>(new Set());
  const recent = useQuery({
    queryKey: ["recent-exams"],
    queryFn: getRecentExams,
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });
  const search = useQuery({
    queryKey: ["search-exams", query],
    queryFn: () => searchExams(query),
    enabled: query.trim().length > 0,
    refetchInterval: query.trim().length > 0 ? 60000 : false,
    refetchIntervalInBackground: true,
  });

  const fresh = useNewVotes(recent.data);
  useEffect(() => setSettled(new Set()), [fresh]);

  const searching = query.trim().length > 0;
  const items = searching ? (search.data ?? []) : (recent.data ?? []);
  const visibleItems = items.slice(0, visibleCount);
  const isLoading = searching ? search.isLoading : recent.isLoading;

  return (
    <div className="page-enter cs-page">
      <header className="cs-intro">
        <h1 className="cn-display">
          How did your <em>exam</em> go?
        </h1>
        <p className="cn-lede cn-m-0">
          Every Waterloo exam is a question on this sheet. The class fills in
          the bubbles, anonymously, one browser at a time.
        </p>
      </header>

      <section className="panel" aria-labelledby="sheet-title">
        <header className="panel-header">
          <h2 id="sheet-title" className="cn-title">Answer sheet</h2>
          <div className="band-actions cn-gap-16 cn-meta">
            <span className="cn-row">
              <span className="cs-bubble is-filled" aria-hidden="true" />
              Touching
            </span>
            <span className="cn-row">
              <span className="cs-bubble" aria-hidden="true" />
              Touchy
            </span>
          </div>
        </header>

        <div className="cs-search">
          <div className="input-icon">
            <Search aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PAGE);
              }}
              placeholder="Search for your exam"
              aria-label="Search for your exam"
              className="input-lg"
            />
          </div>
        </div>

        {items.length > 0 && (
          <div className="cs-heads cn-label" aria-hidden="true">
            <span />
            <span>No.</span>
            <span>Exam</span>
            <span>
              <span>0%</span>
              <span>Class answer</span>
              <span>100%</span>
            </span>
            <span>Touching</span>
            <span>Verdict</span>
          </div>
        )}

        {isLoading && (
          <div className="empty-state">
            <strong>Scanning for victims…</strong>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="empty-state">
            <strong>No suffering detected.</strong>
            <span>
              {searching
                ? "Nothing on the sheet matches that. List it and be the first to complain."
                : "Be the first to complain."}
            </span>
          </div>
        )}

        {visibleItems.length > 0 && (
          <div>
            {visibleItems.map((exam, index) => (
              <Question
                key={exam.id}
                exam={exam}
                number={index + 1}
                fresh={
                  searching || settled.has(exam.id) ? undefined : fresh.get(exam.id)
                }
                onSettled={() =>
                  setSettled((current) => new Set(current).add(exam.id))
                }
              />
            ))}
          </div>
        )}

        {items.length > 0 && (
          <footer className="panel-footer">
            <span className="cn-meta">
              {visibleItems.length} of {items.length}{" "}
              {items.length === 1 ? "question" : "questions"}
            </span>
            {visibleCount < items.length && (
              <button
                type="button"
                className="btn btn-secondary is-sm"
                onClick={() => setVisibleCount((current) => current + PAGE)}
              >
                Show more
              </button>
            )}
          </footer>
        )}
      </section>

      <aside className="cs-aside">
        <MarkingInstructions>
          <div
            className="cn-row cn-wrap cn-gap-24 cn-meta border-t border-surface-0 pt-4"
            aria-hidden="true"
          >
            <span className="cn-row">
              <span className="cs-bubble is-filled" />
              Right
            </span>
            <span className="cn-row">
              <span className="cs-bubble">✓</span>
              <span className="cs-bubble">✕</span>
              <span className="cs-bubble">·</span>
              Wrong
            </span>
          </div>
        </MarkingInstructions>
        <section className="cn-stack cn-gap-8">
          <h2 className="cn-name cn-m-0">What is this?</h2>
          <p className="cn-copy cn-m-0">
            A crowd-sourced pulse of Waterloo&apos;s academic brutality. Find
            out if you&apos;re the only one who got railed, or if it was a
            collective execution.
          </p>
        </section>
      </aside>
    </div>
  );
}
