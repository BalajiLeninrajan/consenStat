import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getExam, voteOnExam, type VoteType } from "../lib/api";
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

function voteStorageKey(examId: string) {
  return `consenstat:vote:${examId}`;
}

export function ExamPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
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

    const storedVote = window.localStorage.getItem(voteStorageKey(id));
    if (storedVote === "TOUCHING" || storedVote === "TOUCHY") {
      setSelectedVote(storedVote);
    } else {
      setSelectedVote(null);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let isDisposed = false;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socketUrl = `${protocol}://${window.location.host}/api/exams/${id}/ws`;

    const connect = () => {
      if (isDisposed) {
        return;
      }

      setLiveStatus("connecting");
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        setLiveStatus("live");
        queryClient.invalidateQueries({ queryKey: ["exam", id] });
      };

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

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        setLiveStatus("offline");
        queryClient.invalidateQueries({ queryKey: ["exam", id] });

        if (!isDisposed) {
          reconnectTimer = window.setTimeout(connect, 1000);
        }
      };
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [id, queryClient]);

  const vote = useMutation({
    mutationFn: (voteType: VoteType) => voteOnExam(id, voteType),
    onSuccess(data) {
      setSelectedVote(data.yourVote);
      window.localStorage.setItem(voteStorageKey(id), data.yourVote);
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
      <Card className="theme-card card-shadow border-[var(--accent-color)] p-5 sm:p-8">
        <p className="text-lg font-black uppercase text-[var(--accent-text-color)] sm:text-xl">
          This exam is a ghost. Like your social life.
        </p>
      </Card>
    );
  }

  const share = touchingShare(exam.data.touchingCount, exam.data.voteCount);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Link
        to="/"
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center border-4 border-black bg-[var(--accent-color)] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none sm:static sm:h-auto sm:w-fit sm:border-0 sm:bg-transparent sm:p-0 sm:text-black/60 sm:shadow-none sm:hover:translate-x-0 sm:hover:translate-y-0 sm:hover:text-black"
      >
        <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1 sm:h-5 sm:w-5" />
        <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-[11px] sm:font-black sm:uppercase sm:tracking-[0.16em] sm:sm:tracking-widest">
          Back to list
        </span>
      </Link>

      <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="theme-card card-shadow bg-white p-5 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent-text-color)] sm:text-sm sm:tracking-widest">
          {exam.data.courseCode} • {exam.data.termLabel}
        </p>
        <h1 className="mt-3 font-theme-display text-4xl font-black uppercase leading-[0.9] tracking-tighter sm:mt-4 sm:text-6xl">
          {exam.data.examName}
        </h1>

        <div className="mt-6 border-4 border-black bg-black p-4 text-white shadow-[8px_8px_0px_0px_rgba(253,213,79,1)] sm:mt-12 sm:p-8">
          <div className="mb-3 flex flex-col gap-1 text-[11px] font-black uppercase tracking-[0.16em] opacity-80 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:text-sm sm:tracking-widest">
            <span>Consensus</span>
            <span>{share}% consensual</span>
          </div>
          <Progress
            value={share}
            className="h-6 border-4 border-white sm:h-8"
          />
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-stretch gap-0 text-center sm:mt-8">
            <div className="p-3 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60 sm:text-xs sm:tracking-widest">
                Fair
              </p>
              <p className="mt-2 text-3xl font-black sm:text-5xl">
                {exam.data.touchingCount}
              </p>
            </div>
            <div className="flex items-center px-2 text-xs font-bold opacity-60 sm:px-4 sm:text-sm">
              VS.
            </div>
            <div className="p-3 sm:p-6">
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
                ? "bg-[var(--accent-color)] text-black"
                : "bg-black/10 opacity-50"
            }`}
          >
            {liveStatus === "live" ? "Live Suffering" : "Offline"}
          </span>
        </div>

        <fieldset className="mt-6 grid gap-3 sm:mt-8 sm:gap-4">
          <legend className="sr-only">Vote on this exam</legend>
          <label
            className={`flex cursor-pointer items-center justify-between border-4 px-4 py-4 text-left font-black uppercase transition sm:px-8 ${
              selectedVote === "TOUCHING"
                ? "translate-x-1 translate-y-1 border-black bg-[var(--accent-color)] text-black shadow-none"
                : "border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            } ${vote.isPending ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="voteType"
              value="TOUCHING"
              checked={selectedVote === "TOUCHING"}
              onChange={() => vote.mutate("TOUCHING")}
              className="sr-only"
            />
            <span className="text-base sm:text-xl">Touching</span>
            <span className="text-[10px] uppercase opacity-60 sm:text-xs">
              like a warm hug
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-center justify-between border-4 px-4 py-4 text-left font-black uppercase transition sm:px-8 ${
              selectedVote === "TOUCHY"
                ? "translate-x-1 translate-y-1 border-black bg-[var(--accent-color)] text-black shadow-none"
                : "border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            } ${vote.isPending ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="voteType"
              value="TOUCHY"
              checked={selectedVote === "TOUCHY"}
              onChange={() => vote.mutate("TOUCHY")}
              className="sr-only"
            />
            <span className="text-base sm:text-xl">Touchy</span>
            <span className="text-[10px] uppercase opacity-60 sm:text-xs">
              violated my rights
            </span>
          </label>
        </fieldset>

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
    </div>
  );
}
