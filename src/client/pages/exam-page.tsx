import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getExam, voteOnExam, type VoteType } from "../lib/api";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { useToast } from "../ui/toast";

type LiveMessage = {
  type: "snapshot" | "tally";
  examId: number;
  touchingCount: number;
  touchyCount: number;
  voteCount: number;
  lastVotedAt: string | null;
};

function touchingShare(touchingCount: number, voteCount: number) {
  return voteCount === 0 ? 50 : Math.round((touchingCount / voteCount) * 100);
}

export function ExamPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "offline">("connecting");

  const exam = useQuery({
    queryKey: ["exam", id],
    queryFn: () => getExam(id),
  });

  useEffect(() => {
    if (!id) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/api/exams/${id}/ws`);

    socket.onopen = () => setLiveStatus("live");
    socket.onclose = () => setLiveStatus("offline");
    socket.onerror = () => setLiveStatus("offline");
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as LiveMessage;
      queryClient.setQueryData(["exam", id], (current: any) =>
        current
          ? {
              ...current,
              touchingCount: message.touchingCount,
              touchyCount: message.touchyCount,
              voteCount: message.voteCount,
              lastVotedAt: message.lastVotedAt,
            }
          : current,
      );
    };

    return () => {
      socket.close();
    };
  }, [id, queryClient]);

  const vote = useMutation({
    mutationFn: (voteType: VoteType) => voteOnExam(id, voteType),
    onSuccess(data) {
      queryClient.setQueryData(["exam", id], (current: any) =>
        current
          ? {
              ...current,
              touchingCount: data.touchingCount,
              touchyCount: data.touchyCount,
              voteCount: data.voteCount,
              lastVotedAt: data.lastVotedAt,
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: ["recent-exams"] });
      toast.push(`Vote recorded: ${data.yourVote.toLowerCase()}`);
    },
  });

  if (exam.isLoading) {
    return <Card><p className="text-sm text-ink/50">Loading exam...</p></Card>;
  }

  if (exam.error || !exam.data) {
    return <Card><p className="text-sm text-coral">Could not load exam.</p></Card>;
  }

  const share = touchingShare(exam.data.touchingCount, exam.data.voteCount);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="bg-gradient-to-br from-white to-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lagoon">
          {exam.data.courseCode} • {exam.data.termLabel}
        </p>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight text-ink">
          {exam.data.examName}
        </h1>

        <div className="mt-8 rounded-[1.75rem] bg-ink p-6 text-white">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            <span>Touching share</span>
            <span>{share}%</span>
          </div>
          <Progress value={share} className="bg-white/15" />
          <div className="mt-5 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-[1.5rem] bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Touching</p>
              <p className="mt-2 text-4xl font-bold">{exam.data.touchingCount}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Touchy</p>
              <p className="mt-2 text-4xl font-bold">{exam.data.touchyCount}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Cast your vote</h2>
            <p className="text-sm text-ink/55">
              One browser can vote once per exam, but the vote can be changed later.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              liveStatus === "live"
                ? "bg-lagoon/10 text-lagoon"
                : "bg-coral/10 text-coral"
            }`}
          >
            {liveStatus === "live" ? "Live" : liveStatus}
          </span>
        </div>

        <div className="mt-6 grid gap-3">
          <Button
            className="justify-between rounded-[1.5rem] px-6 py-5 text-left"
            onClick={() => vote.mutate("TOUCHING")}
            disabled={vote.isPending}
          >
            <span>Touching</span>
            <span className="text-xs uppercase tracking-[0.18em] text-white/70">
              fair / manageable
            </span>
          </Button>
          <Button
            variant="secondary"
            className="justify-between rounded-[1.5rem] px-6 py-5 text-left"
            onClick={() => vote.mutate("TOUCHY")}
            disabled={vote.isPending}
          >
            <span>Touchy</span>
            <span className="text-xs uppercase tracking-[0.18em] text-ink/50">
              got wrecked
            </span>
          </Button>
        </div>

        <div className="mt-6 space-y-3 rounded-[1.5rem] bg-ink/5 p-5 text-sm text-ink/65">
          <p>Total votes: {exam.data.voteCount}</p>
          <p>
            Last activity: {exam.data.lastVotedAt ? new Date(exam.data.lastVotedAt).toLocaleString() : "No votes yet"}
          </p>
          {vote.error && <p className="font-medium text-coral">{vote.error.message}</p>}
        </div>
      </Card>
    </div>
  );
}
