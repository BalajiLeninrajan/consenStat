import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles } from "lucide-react";
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
  const recent = useQuery({
    queryKey: ["recent-exams"],
    queryFn: getRecentExams,
  });
  const search = useQuery({
    queryKey: ["search-exams", query],
    queryFn: () => searchExams(query),
  });

  const items = query.trim() ? search.data ?? [] : recent.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-gradient-to-br from-white to-panel">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-lagoon/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lagoon">
              <Sparkles className="h-4 w-4" />
              Real-time crowd pulse
            </p>
            <h1 className="max-w-2xl font-display text-5xl font-bold tracking-tight text-ink">
              Find out whether an exam felt touching or touchy.
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink/65">
              Search the latest Waterloo exams, vote once per exam from your browser,
              and watch the tally move live.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by course, term, or exam name"
                  className="pl-11"
                />
              </div>
              <Link to="/create">
                <Button className="w-full sm:w-auto">Add an exam</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-ink/10 bg-ink p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">How it works</p>
            <div className="mt-4 space-y-4 text-sm text-white/80">
              <p>1. Search or create the exact exam.</p>
              <p>2. Vote `Touching` or `Touchy`.</p>
              <p>3. See the crowd move in real time.</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">
                {query.trim() ? "Search results" : "Recently active"}
              </h2>
              <p className="text-sm text-ink/60">
                {query.trim()
                  ? "Exact enough to find what was just written."
                  : "Fresh exam pages with the most recent vote activity."}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {(recent.isLoading || search.isLoading) && (
              <p className="text-sm text-ink/50">Loading exams...</p>
            )}
            {!recent.isLoading && !search.isLoading && items.length === 0 && (
              <p className="text-sm text-ink/50">
                No exams yet. Create the first one for your course.
              </p>
            )}
            {items.map((exam) => {
              const share = voteShare(exam.touchingCount, exam.voteCount);
              return (
                <Link key={exam.id} to={`/exam/${exam.id}`} className="block">
                  <article className="rounded-[1.5rem] border border-ink/10 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-lagoon/30">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">
                          {exam.courseCode} • {exam.termLabel}
                        </p>
                        <h3 className="mt-1 text-xl font-bold text-ink">{exam.examName}</h3>
                      </div>
                      <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
                        {exam.voteCount} votes
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
                        <span>Touching</span>
                        <span>{share}%</span>
                      </div>
                      <Progress value={share} />
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="bg-gradient-to-b from-white to-white/60">
          <h2 className="font-display text-2xl font-bold text-ink">Ground rules</h2>
          <div className="mt-4 space-y-4 text-sm text-ink/65">
            <p>Votes are anonymous. There are no accounts.</p>
            <p>One browser gets one vote per exam, but you can change your mind later.</p>
            <p>Duplicates are warned before creation so the search page stays usable.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
