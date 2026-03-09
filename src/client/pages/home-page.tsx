import { useQuery } from "@tanstack/react-query";
import { Search, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { getRecentExams, searchExams } from "../lib/api";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";

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

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black sm:left-6 sm:h-6 sm:w-6" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="SEARCH FOR YOUR EXAM"
          className="h-14 border-4 border-black bg-white pl-12 pr-4 text-base font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all focus:translate-x-1 focus:translate-y-1 focus:shadow-none sm:h-20 sm:pl-16 sm:pr-8 sm:text-2xl"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.6fr]">
        <div className="order-first space-y-5 sm:space-y-8">
          {featured && (
            <Link to={`/exam/${featured.id}`} className="block">
              <Card className="theme-card card-shadow border-4 border-black bg-[var(--accent-color)] p-5 text-black transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none sm:p-10">
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="w-fit border-4 border-black bg-black px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent-text-color)] sm:px-4 sm:text-sm sm:tracking-widest">
                      LATEST TRAUMA
                    </span>
                    <span className="w-fit border-2 border-black/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] sm:text-sm sm:tracking-widest">
                      {featured.voteCount} TOTAL VICTIMS
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] opacity-80 sm:text-xl sm:tracking-widest">
                      {featured.courseCode} • {featured.termLabel}
                    </p>
                    <h2 className="mt-3 font-theme-display text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:mt-2 sm:text-7xl">
                      {featured.examName}
                    </h2>
                  </div>
                  <div className="mt-2 sm:mt-4">
                    <div className="mb-3 flex flex-col gap-1 text-sm font-black uppercase tracking-[0.14em] sm:mb-4 sm:flex-row sm:justify-between sm:text-xl sm:tracking-widest">
                      <span>Consensus</span>
                      <span>
                        {voteShare(featured.touchingCount, featured.voteCount)}%
                        consensual
                      </span>
                    </div>
                    <Progress
                      value={voteShare(
                        featured.touchingCount,
                        featured.voteCount,
                      )}
                      className="h-7 sm:h-10"
                    />
                  </div>
                </div>
              </Card>
            </Link>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {(recent.isLoading || search.isLoading) && (
              <p className="col-span-full animate-pulse text-lg font-black uppercase sm:text-2xl">
                SCANNING FOR VICTIMS...
              </p>
            )}
            {items.length === 0 &&
              !recent.isLoading &&
              !search.isLoading && (
                <Card className="theme-card card-shadow col-span-full border-4 border-black bg-white p-6 sm:p-8">
                  <p className="text-xl font-black uppercase sm:text-2xl">
                    No suffering detected. Be the first to complain.
                  </p>
                  <Link to="/create" className="mt-6 inline-block">
                    <Button className="border-4 border-black bg-[var(--accent-color)] px-6 py-3 text-base text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:px-8 sm:py-4 sm:text-xl">
                      SUBMIT DISASTER
                    </Button>
                  </Link>
                </Card>
              )}
            {visibleItems.map((exam) => {
              const share = voteShare(exam.touchingCount, exam.voteCount);
              return (
                <Link key={exam.id} to={`/exam/${exam.id}`} className="block">
                  <article className="theme-card card-shadow flex h-full flex-col justify-between border-4 border-black bg-white p-5 transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none sm:p-6">
                    <div>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent-text-color)] sm:text-xs sm:tracking-widest">
                          {exam.courseCode} • {exam.termLabel}
                        </p>
                        <span className="shrink-0 bg-black px-2 py-1 text-[9px] font-black uppercase text-white sm:text-[10px]">
                          {exam.voteCount} VICTIMS
                        </span>
                      </div>
                      <h3 className="mb-6 text-xl font-black uppercase leading-none tracking-tight sm:text-2xl">
                        {exam.examName}
                      </h3>
                    </div>
                    <div className="mt-auto">
                      <div className="mb-2 flex justify-between text-[9px] font-black uppercase sm:text-[10px]">
                        <span>CONSENSUS</span>
                        <span>{share}% CONSENSUAL</span>
                      </div>
                      <Progress value={share} className="h-4 border-2" />
                    </div>
                  </article>
                </Link>
              );
            })}
            {hasMore && (
              <div className="col-span-full">
                <Button
                  variant="secondary"
                  className="w-full border-4 border-black bg-white px-6 py-3 text-sm text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:w-auto sm:text-base"
                  onClick={() => setVisibleCount((current) => current + 5)}
                >
                  Show More
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside className="order-last space-y-5 lg:order-none lg:space-y-8">
          <Card className="theme-card card-shadow border-4 border-black bg-black p-6 text-[var(--accent-text-color)] sm:p-8">
            <h2 className="mb-5 font-theme-display text-xl font-black uppercase tracking-tighter sm:mb-6 sm:text-2xl">
              Ground rules
            </h2>
            <ul className="space-y-3 text-xs font-bold uppercase leading-tight text-black sm:space-y-4 sm:text-sm">
              <li className="flex gap-3">
                <span className="bg-[var(--accent-color)] text-black px-1 shrink-0">
                  01
                </span>
                <span>
                  One browser, one vote. Don't be a slut for statistics.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="bg-[var(--accent-color)] text-black px-1 shrink-0">
                  02
                </span>
                <span>Votes are anonymous. Your TA won't find you here.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-[var(--accent-color)] text-black px-1 shrink-0">
                  03
                </span>
                <span>
                  Don't create duplicates, we have enough problems already
                </span>
              </li>
            </ul>
          </Card>

          <Card className="theme-card card-shadow border-4 border-black bg-white p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3 text-[var(--accent-text-color)]">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              <h2 className="font-theme-display text-xl font-black uppercase tracking-tighter sm:text-2xl">
                WHAT IS THIS?
              </h2>
            </div>
            <p className="text-xs font-bold uppercase leading-tight sm:text-sm">
              A crowd-sourced pulse of Waterloo's academic brutality. Find out
              if you're the only one who got wrecked, or if it was a collective
              execution.
            </p>
            <Link to="/create" className="mt-6 block sm:mt-8">
              <Button className="w-full border-4 border-black bg-white py-3 text-sm text-black transition-colors hover:bg-[var(--accent-color)] hover:text-black sm:py-4 sm:text-base">
                LIST NEW EXAM
              </Button>
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
