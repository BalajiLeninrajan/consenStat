const JSON_HEADERS = {
  "Content-Type": "application/json",
};

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export type VoteType = "TOUCHING" | "TOUCHY";

export type ExamSummary = {
  id: number;
  examName: string;
  courseCode: string;
  termLabel: string;
  touchingCount: number;
  touchyCount: number;
  voteCount: number;
  lastVotedAt: string | null;
};

export type ExamDetail = ExamSummary & {
  createdAt: string;
};

export type DuplicateCandidate = {
  id: number;
  examName: string;
  termLabel: string;
  matchType: "exact" | "similar" | "cross-term";
  score: number;
};

export type DuplicateResponse = {
  decision: "ok" | "warn" | "block";
  normalizedExamName: string;
  candidates: DuplicateCandidate[];
};

export type VoteResponse = {
  examId: number;
  touchingCount: number;
  touchyCount: number;
  voteCount: number;
  lastVotedAt: string;
  yourVote: VoteType;
};

export function getRecentExams() {
  return request<ExamSummary[]>("/api/exams/recent");
}

export function searchExams(query: string) {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("q", query.trim());
  }
  return request<ExamSummary[]>(`/api/exams/search?${params.toString()}`);
}

export function getExam(id: string) {
  return request<ExamDetail>(`/api/exams/${id}`);
}

export function duplicateCheck(payload: {
  faculty: string;
  courseNumber: string;
  termSeason: "fall" | "spring" | "winter";
  termYear: number;
  examName: string;
}) {
  return request<DuplicateResponse>("/api/exams/duplicate-check", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export function createExam(payload: {
  faculty: string;
  courseNumber: string;
  termSeason: "fall" | "spring" | "winter";
  termYear: number;
  examName: string;
}) {
  return request<{ id: number }>("/api/exams", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export function voteOnExam(id: string, voteType: VoteType) {
  return request<VoteResponse>(`/api/exams/${id}/vote`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ voteType }),
  });
}
