import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const [liveStatus, setLiveStatus] = useState<
    "connecting" | "live" | "offline"
  >("connecting");

  const exam = useQuery({
    queryKey: ["exam", id],
    queryFn: () => getExam(id),
  });

  useEffect(() => {
    if (!id) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(
      `${protocol}://${window.location.host}/api/exams/${id}/ws`,
    );

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
      toast.push(`Recorded: ${data.yourVote.toLowerCase()}`);
    },
  });

  if (exam.isLoading) {
    return (
      <Card className="theme-card card-shadow p-5 sm:p-8">
        <p className="text-lg font-black uppercase sm:text-xl">
          Loading the trauma report...
        </p>
      </Card>
    );
  }

  if (exam.error || !exam.data) {
    return (
      <Card className="theme-card card-shadow border-[#ff3e00] p-5 sm:p-8">
        <p className="text-lg font-black uppercase text-[#ff3e00] sm:text-xl">
          This exam is a ghost. Like your social life.
        </p>
      </Card>
    );
  }

  const share = touchingShare(exam.data.touchingCount, exam.data.voteCount);

  return (
    <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="theme-card card-shadow bg-white p-5 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff3e00] sm:text-sm sm:tracking-widest">
          {exam.data.courseCode} • {exam.data.termLabel}
        </p>
        <h1 className="mt-3 font-theme-display text-4xl font-black uppercase leading-[0.9] tracking-tighter sm:mt-4 sm:text-6xl">
          {exam.data.examName}
        </h1>

        <div className="mt-6 border-4 border-black bg-black p-4 text-white shadow-[8px_8px_0px_0px_rgba(255,62,0,1)] sm:mt-12 sm:p-8">
          <div className="mb-3 flex flex-col gap-1 text-[11px] font-black uppercase tracking-[0.16em] opacity-80 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:text-sm sm:tracking-widest">
            <span>Gentleness Rating</span>
            <span>{share}% consensual</span>
          </div>
          <Progress value={share} className="h-6 border-4 border-white sm:h-8" />
          <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:mt-8 sm:gap-6">
            <div className="border-4 border-white bg-white/10 p-3 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60 sm:text-xs sm:tracking-widest">
                Fair
              </p>
              <p className="mt-2 text-3xl font-black sm:text-5xl">
                {exam.data.touchingCount}
              </p>
            </div>
            <div className="border-4 border-white bg-white/10 p-3 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60 sm:text-xs sm:tracking-widest">
                Fucked
              </p>
              <p className="mt-2 text-3xl font-black sm:text-5xl">
                {exam.data.touchyCount}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="theme-card card-shadow bg-white p-5 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2 className="font-theme-display text-3xl font-black uppercase tracking-tighter sm:text-4xl">
              Confess
            </h2>
            <p className="mt-2 text-xs font-bold uppercase opacity-60 sm:text-sm">
              How was the test? Be honest, no one is watching.
            </p>
          </div>
          <span
            className={`w-fit border-2 border-black px-3 py-1 text-[11px] font-black uppercase sm:text-xs ${
              liveStatus === "live"
                ? "bg-[#ff3e00] text-black"
                : "bg-black/10 opacity-50"
            }`}
          >
            {liveStatus === "live" ? "Live Suffering" : "Offline"}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4">
          <Button
            className="h-auto justify-between border-4 border-black bg-white px-4 py-4 text-left text-base font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none sm:h-20 sm:px-8 sm:text-xl"
            onClick={() => vote.mutate("TOUCHING")}
            disabled={vote.isPending}
          >
            <span>Touching</span>
            <span className="text-[10px] font-black uppercase opacity-60 sm:text-xs">
              felt like a hug
            </span>
          </Button>
          <Button
            variant="secondary"
            className="h-auto justify-between border-4 border-black bg-[#ff3e00] px-4 py-4 text-left text-base font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none sm:h-20 sm:px-8 sm:text-xl"
            onClick={() => vote.mutate("TOUCHY")}
            disabled={vote.isPending}
          >
            <span>Touchy</span>
            <span className="text-[10px] font-black uppercase opacity-60 sm:text-xs">
              violated my rights
            </span>
          </Button>
        </div>

        <div className="mt-8 space-y-3 border-t-4 border-black pt-5 text-xs font-bold uppercase opacity-70 sm:mt-12 sm:space-y-4 sm:pt-8 sm:text-sm">
          <p>Victims counted: {exam.data.voteCount}</p>
          <p>
            Last cry for help:{" "}
            {exam.data.lastVotedAt
              ? new Date(exam.data.lastVotedAt).toLocaleString()
              : "Pure silence"}
          </p>
          {vote.error && (
            <p className="font-black text-red-600">{vote.error.message}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
