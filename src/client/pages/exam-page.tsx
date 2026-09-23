import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getExam, voteOnExam, type ExamDetail, type VoteType } from "../lib/api";
import {
  ago,
  inSentence,
  touchingShare,
  verdictOf,
  verdictSentence,
} from "../lib/verdict";
import { MarkingInstructions } from "../ui/marking-instructions";
import { useToast } from "../ui/toast";

type LiveMessage = {
  type: "snapshot" | "tally";
  examId: number;
  touchingCount: number;
  touchyCount: number;
  voteCount: number;
  lastVotedAt: string | null;
};

type Line = "fair" | "wrecked";

const VOTE_OPTIONS = [
  { value: "TOUCHING" as const, label: "Touching", hint: "like a warm hug" },
  { value: "TOUCHY" as const, label: "Touchy", hint: "violated my rights" },
];

// A line holds about ten groups of five before it wraps, so past fifty
// votes each stroke stands for more than one.
const SCALES = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
function strokeScale(largest: number) {
  return SCALES.find((scale) => largest / scale <= 50) ?? SCALES[SCALES.length - 1];
}

function voteStorageKey(examId: string) {
  return `consenstat:vote:${examId}`;
}

function withTally(current: ExamDetail | undefined, tally: Omit<LiveMessage, "type" | "examId">) {
  return current
    ? {
        ...current,
        touchingCount: tally.touchingCount,
        touchyCount: tally.touchyCount,
        voteCount: tally.voteCount,
        lastVotedAt: tally.lastVotedAt,
      }
    : current;
}

// One stroke per vote (or per `scale` votes), struck through in fives.
function Tally({ strokes }: { strokes: number }) {
  const groups = Math.ceil(strokes / 5);
  return (
    <span className="cs-tally" aria-hidden="true">
      {Array.from({ length: groups }, (_, group) => {
        const inGroup = Math.min(5, strokes - group * 5);
        return (
          <span key={group} className="cs-group" style={{ "--g": group } as CSSProperties}>
            {Array.from({ length: Math.min(inGroup, 4) }, (_, stroke) => (
              <i key={stroke} style={{ "--s": stroke } as CSSProperties} />
            ))}
            {inGroup === 5 && <i className="cs-strike" />}
          </span>
        );
      })}
    </span>
  );
}

export function ExamPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "offline">(
    "connecting",
  );
  // A counter per line. Each bump remounts that line's flash, so back to
  // back votes replay it and nothing waits on animationend.
  const [flash, setFlash] = useState<Record<Line, number>>({ fair: 0, wrecked: 0 });
  const [, setNow] = useState(() => Date.now());
  // The reader's own vote is confirmed by the toast, so it doesn't settle.
  const ownVoteAt = useRef(0);

  const exam = useQuery({
    queryKey: ["exam", id],
    queryFn: () => getExam(id),
  });

  useEffect(() => {
    if (!id) return;
    const storedVote = window.localStorage.getItem(voteStorageKey(id));
    setSelectedVote(
      storedVote === "TOUCHING" || storedVote === "TOUCHY" ? storedVote : null,
    );
  }, [id]);

  // Keep "the last one 4 minutes ago" honest while the page sits open.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  // M4: when a count goes up under the reader, that tally line settles.
  const previous = useRef<{ id: string; fair: number; wrecked: number } | null>(null);
  const fair = exam.data?.touchingCount;
  const wrecked = exam.data?.touchyCount;
  useEffect(() => {
    if (fair === undefined || wrecked === undefined) return;
    const last = previous.current;
    if (!last || last.id !== id) {
      setFlash({ fair: 0, wrecked: 0 });
    } else if (Date.now() - ownVoteAt.current > 2000) {
      const upFair = fair > last.fair;
      const upWrecked = wrecked > last.wrecked;
      if (upFair || upWrecked) {
        setFlash((current) => ({
          fair: current.fair + (upFair ? 1 : 0),
          wrecked: current.wrecked + (upWrecked ? 1 : 0),
        }));
      }
    }
    previous.current = { id, fair, wrecked };
  }, [id, fair, wrecked]);

  useEffect(() => {
    if (!id) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let isDisposed = false;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socketUrl = `${protocol}://${window.location.host}/api/exams/${id}/ws`;

    const connect = () => {
      if (isDisposed) return;

      // A retry after a drop still reads as reconnecting.
      setLiveStatus((current) => (current === "offline" ? current : "connecting"));
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        setLiveStatus("live");
        queryClient.invalidateQueries({ queryKey: ["exam", id] });
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as LiveMessage;
        queryClient.setQueryData<ExamDetail>(["exam", id], (current) =>
          withTally(current, message),
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
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [id, queryClient]);

  const vote = useMutation({
    mutationFn: (voteType: VoteType) => voteOnExam(id, voteType),
    onMutate() {
      ownVoteAt.current = Date.now();
    },
    onSuccess(data) {
      setSelectedVote(data.yourVote);
      window.localStorage.setItem(voteStorageKey(id), data.yourVote);
      queryClient.setQueryData<ExamDetail>(["exam", id], (current) =>
        withTally(current, data),
      );
      queryClient.invalidateQueries({ queryKey: ["recent-exams"] });
      toast.push(
        `Recorded: ${VOTE_OPTIONS.find((option) => option.value === data.yourVote)?.label ?? data.yourVote}`,
      );
    },
  });

  const back = (
    <Link to="/" className="btn-text cn-row cn-gap-8 self-start">
      <ArrowLeft aria-hidden="true" />
      All exams
    </Link>
  );

  if (exam.isLoading) {
    return (
      <div className="page-enter cs-page">
        <header className="cs-intro">{back}</header>
        <div className="empty-state">
          <strong>Loading the trauma report…</strong>
        </div>
      </div>
    );
  }

  if (exam.error || !exam.data) {
    return (
      <div className="page-enter cs-page">
        <header className="cs-intro">
          {back}
          <h1 className="cn-display is-sm">This exam is a ghost.</h1>
          <p className="cn-lede cn-m-0">
            Like your social life. It may have been removed, or the link is wrong.
          </p>
        </header>
      </div>
    );
  }

  const data = exam.data;
  const total = data.voteCount;
  const share = touchingShare(data.touchingCount, total);
  const verdict = verdictOf(data.touchingCount, total);
  const scale = strokeScale(Math.max(data.touchingCount, data.touchyCount));
  const strokes = (count: number) =>
    count === 0 ? 0 : Math.max(1, Math.round(count / scale));
  const lastVote = ago(data.lastVotedAt);

  const lines: { key: Line; label: string; count: number }[] = [
    { key: "fair", label: "Touching", count: data.touchingCount },
    { key: "wrecked", label: "Touchy", count: data.touchyCount },
  ];

  return (
    <div key={id} className="page-enter cs-page" style={{ "--cs-aside-rows": 3 } as CSSProperties}>
      <header className="cs-intro">
        {back}
        <h1 className="cn-display is-sm">
          Did the {data.courseCode} {inSentence(data.examName)} wreck{" "}
          <em>everyone</em>?
        </h1>
      </header>

      <section className="cs-answer" aria-labelledby="verdict">
        {total > 0 ? (
          <>
            <p className="cs-figure" aria-hidden="true">
              {share}
              <small>%</small>
            </p>
            <div className="cs-verdict">
              <p id="verdict" className="cn-title cn-text-text cn-m-0">
                <span className="cn-sr-only">{share}% </span>say it was fair.
              </p>
              <p className="cn-lede cn-m-0">
                {verdictSentence(data.touchyCount, total, verdict)}
              </p>
            </div>
          </>
        ) : (
          <div className="cs-verdict">
            <p id="verdict" className="cn-title cn-text-text cn-m-0">
              Nobody has voted yet.
            </p>
            <p className="cn-lede cn-m-0">
              Go first. Your vote is the whole tally until someone else shows up.
            </p>
          </div>
        )}
      </section>

      <section
        className="cs-sheet well cn-bg-well"
        aria-label={`The tally: ${data.touchingCount} touching, ${data.touchyCount} touchy`}
      >
        {lines.map((line) => (
          <div key={line.key} className={`cs-line cs-ink-${line.key}`}>
            {flash[line.key] > 0 && (
              <span key={flash[line.key]} className="cs-flash" aria-hidden="true" />
            )}
            <span className="cn-label">{line.label}</span>
            <Tally strokes={strokes(line.count)} />
            <b className="cn-value">{line.count}</b>
          </div>
        ))}
        <p className="cn-meta cn-row cn-gap-8 cn-m-0">
          {liveStatus === "live" && <span className="live-dot" aria-hidden="true" />}
          <span>
            {liveStatus === "live"
              ? "Live."
              : liveStatus === "connecting"
                ? "Connecting."
                : "Reconnecting."}{" "}
            {total === 0
              ? "The first vote draws the first stroke."
              : `${scale === 1 ? "One stroke per vote" : `One stroke per ${scale} votes`}${
                  lastVote ? `, the last one ${lastVote}.` : "."
                }`}
          </span>
        </p>
      </section>

      <section className="cn-stack cn-gap-12" aria-labelledby="your-turn">
        <h2 id="your-turn" className="cn-title cn-m-0">
          {selectedVote ? "Changed your mind?" : "Your turn. How was it?"}
        </h2>
        <fieldset className="cn-m-0 cn-p-0 border-0" disabled={vote.isPending}>
          <legend className="cn-sr-only">Vote on this exam</legend>
          <div className="segmented">
            {VOTE_OPTIONS.map((option) => {
              const active = selectedVote === option.value;
              return (
                <label
                  key={option.value}
                  className={`${active ? "active" : ""} ${
                    vote.isPending ? "opacity-60" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="voteType"
                    value={option.value}
                    checked={active}
                    onChange={() => vote.mutate(option.value)}
                    className="cn-sr-only"
                  />
                  <b>{option.label}</b>
                  <small className="cn-auto-l">{option.hint}</small>
                </label>
              );
            })}
          </div>
        </fieldset>
        {vote.error && (
          <div className="banner" style={{ "--tone": "var(--red)" } as CSSProperties}>
            {vote.error.message}
          </div>
        )}
      </section>

      <aside className="cs-aside">
        <MarkingInstructions />
      </aside>
    </div>
  );
}
