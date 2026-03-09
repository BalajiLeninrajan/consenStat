export type Bindings = {
  DB: D1Database;
  EXAM_ROOMS: DurableObjectNamespace;
  COOKIE_SECRET: string;
  ASSETS: Fetcher;
};

export type VoteType = "TOUCHING" | "TOUCHY";

export type TallyPayload = {
  type: "snapshot" | "tally";
  examId: number;
  touchingCount: number;
  touchyCount: number;
  voteCount: number;
  lastVotedAt: string | null;
};
