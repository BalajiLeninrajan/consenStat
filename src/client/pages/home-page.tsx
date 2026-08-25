import { useQuery } from "@tanstack/react-query";
import { Search, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, type CSSProperties } from "react";
import { getRecentExams, searchExams } from "../lib/api";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";

const ACCENT_COLORS = [
  "var(--mauve)",
  "var(--teal)",
  "var(--yellow)",
  "var(--blue)",
  "var(--peach)",
  "var(--pink)",
];

const FINE_PRINT = [
  "One browser, one vote. Don't be a slut for statistics.",
  "Votes are anonymous. Your TA won't find you here.",
  "Don't create duplicates, we have enough problems already.",
];

function voteShare(touching: number, total: number) {
  return total === 0 ? 50 : Math.round((touching / total) * 100);
}

export function HomePage() {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
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

  const items = query.trim() ? (search.data ?? []) : (recent.data ?? []);
  const featured = !query.trim() && items.length > 0 ? items[0] : null;
  const listItems = featured ? items.slice(1) : items;
  const visibleItems = listItems.slice(0, visibleCount);
  const hasMore = visibleCount < listItems.length;
  const isLoading = recent.isLoading || search.isLoading;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="input-icon">
        <Search aria-hidden="true" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="SEARCH FOR YOUR EXAM"
          aria-label="Search for your exam"
          className="input-lg"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.75fr)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          {featured && (
            <Link
              to={`/exam/${featured.id}`}
              className="block"
              style={{ "--accent": ACCENT_COLORS[0] } as CSSProperties}
            >
              <article className="accent-card flex flex-col gap-5 p-6 sm:p-8 sm:pl-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="eyebrow mb-0">Latest trauma</span>
                  <span className="chip">
                    {featured.voteCount} TOTAL VICTIMS
                  </span>
                </div>
                <div>
                  <span className="cn-label cn-text-accent">{featured.courseCode}</span>
                  <h2 className="cn-display-sm mt-2">{featured.examName}</h2>
                  <p className="cn-meta mt-3">{featured.termLabel}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="stat-row">
                    <span>Consensus</span>
                    <b>
                      {voteShare(featured.touchingCount, featured.voteCount)}%
                      CONSENSUAL
                    </b>
                  </div>
                  <Progress
                    className="is-tall"
                    value={voteShare(featured.touchingCount, featured.voteCount)}
                  />
                </div>
              </article>
            </Link>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {isLoading && (
              <p className="cn-meta col-span-full animate-pulse">
                SCANNING FOR VICTIMS...
              </p>
            )}

            {items.length === 0 && !isLoading && (
              <Card className="col-span-full">
                <div className="empty-state">
                  <strong>No suffering detected.</strong>
                  <span>Be the first to complain.</span>
                  <Link to="/create" className="mt-2">
                    <Button>Submit disaster</Button>
                  </Link>
                </div>
              </Card>
            )}

            {visibleItems.map((exam, index) => {
              const share = voteShare(exam.touchingCount, exam.voteCount);
              return (
                <Link
                  key={exam.id}
                  to={`/exam/${exam.id}`}
                  className="block"
                  style={
                    {
                      "--accent":
                        ACCENT_COLORS[(index + 1) % ACCENT_COLORS.length],
                    } as CSSProperties
                  }
                >
                  <article className="accent-card flex h-full flex-col justify-between gap-5">
                    <div>
                      <span className="cn-label cn-text-accent">{exam.courseCode}</span>
                      <h3 className="cn-title mt-2">{exam.examName}</h3>
                      <p className="cn-meta mt-2">{exam.termLabel}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="stat-row">
                        <span>Consensus</span>
                        <b>{share}%</b>
                      </div>
                      <Progress value={share} />
                      <p className="cn-meta">{exam.voteCount} VICTIMS</p>
                    </div>
                  </article>
                </Link>
              );
            })}

            {hasMore && (
              <div className="col-span-full">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setVisibleCount((current) => current + 5)}
                >
                  Show more
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-6 lg:gap-8">
          <Card className="is-tilted">
            <h2 className="cn-title">Fine print</h2>
            <ul className="mt-5 flex flex-col gap-4">
              {FINE_PRINT.map((rule, index) => (
                <li key={rule} className="flex items-start gap-3">
                  <span className="mark-solid">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="cn-copy">{rule}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-mauve" />
              <h2 className="cn-title">What is this?</h2>
            </div>
            <p className="cn-copy mt-4">
              A crowd-sourced pulse of Waterloo&apos;s academic brutality. Find
              out if you&apos;re the only one who got railed, or if it was a
              collective execution.
            </p>
            <Link to="/create" className="mt-6 block">
              <Button className="w-full">List new exam</Button>
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
