import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
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

const VOTE_OPTIONS = [
  {
    value: "TOUCHING" as const,
    label: "Touching",
    hint: "like a warm hug",
  },
  {
    value: "TOUCHY" as const,
    label: "Touchy",
    hint: "violated my rights",
  },
];

function touchingShare(touchingCount: number, voteCount: number) {
  return voteCount === 0 ? 50 : Math.round((touchingCount / voteCount) * 100);
}

function voteStorageKey(examId: string) {
  return `consenstat:vote:${examId}`;
}

function BackLink() {
  return (
    <Link to="/" className="btn btn-secondary back-link">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to list
    </Link>
  );
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
      toast.push(`RECORDED: ${data.yourVote}`);
    },
  });

  if (exam.isLoading) {
    return (
      <Card>
        <p className="cn-meta animate-pulse">LOADING THE TRAUMA REPORT...</p>
      </Card>
    );
  }

  if (exam.error || !exam.data) {
    return (
      <Card>
        <div
          className="banner"
          style={{ "--tone": "var(--red)" } as CSSProperties}
        >
          This exam is a ghost. Like your social life.
        </div>
      </Card>
    );
  }

  const share = touchingShare(exam.data.touchingCount, exam.data.voteCount);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <BackLink />

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <p className="eyebrow">
            {exam.data.courseCode} · {exam.data.termLabel}
          </p>
          <h1 className="display-title">{exam.data.examName}</h1>

          <div className="well mt-8 p-5 sm:p-7">
            <div className="stat-row">
              <span>Consensus</span>
              <b>{share}% CONSENSUAL</b>
            </div>
            <Progress className="is-tall mt-3" value={share} />

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
              <div
                className="metric is-hero"
                style={{ "--accent": "var(--green)" } as CSSProperties}
              >
                <span>Fair</span>
                <strong>{exam.data.touchingCount}</strong>
              </div>
              <span className="cn-microlabel cn-text-overlay-0">
                VS
              </span>
              <div
                className="metric is-hero items-end text-right"
                style={{ "--accent": "var(--red)" } as CSSProperties}
              >
                <span>Fucked</span>
                <strong>{exam.data.touchyCount}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              document
                .getElementById("vote-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="btn-text mt-6 flex w-full items-center justify-center gap-2 sm:hidden"
          >
            Scroll to vote
            <ChevronDown className="h-4 w-4" />
          </button>
        </Card>

        <Card id="vote-section">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="cn-title">Confess</h2>
              <p className="cn-copy mt-2">
                How was the test? Be honest, no one is watching.
              </p>
            </div>
            <span
              className="chip-tone shrink-0"
              style={
                {
                  "--tone":
                    liveStatus === "live" ? "var(--green)" : "var(--overlay-0)",
                } as CSSProperties
              }
            >
              {liveStatus === "live" && <span className="live-dot" />}
              {liveStatus === "live" ? "Live suffering" : "Offline"}
            </span>
          </div>

          <fieldset className="mt-6 border-0 p-0">
            <legend className="sr-only">Vote on this exam</legend>
            <div className="segmented is-stacked">
              {VOTE_OPTIONS.map((option) => {
                const active = selectedVote === option.value;
                return (
                  <label
                    key={option.value}
                    className={`justify-between ${active ? "active" : ""} ${
                      vote.isPending ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="voteType"
                      value={option.value}
                      checked={active}
                      onChange={() => vote.mutate(option.value)}
                      className="sr-only"
                    />
                    <b>{option.label}</b>
                    <small>{option.hint}</small>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-7 flex flex-col gap-2 border-t border-surface-0 pt-5">
            <p className="cn-meta">
              VICTIMS COUNTED: <b>{exam.data.voteCount}</b>
            </p>
            <p className="cn-meta">
              LAST CRY FOR HELP:{" "}
              <b>
                {exam.data.lastVotedAt
                  ? new Date(exam.data.lastVotedAt).toLocaleString()
                  : "PURE SILENCE"}
              </b>
            </p>
            {vote.error && (
              <div
                className="banner mt-2"
                style={{ "--tone": "var(--red)" } as CSSProperties}
              >
                {vote.error.message}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
