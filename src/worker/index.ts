import { Hono } from "hono";
import { ExamRoom } from "./room";
import { examInputSchema, voteSchema } from "./schema";
import type { Bindings, TallyPayload, VoteType } from "./types";
import {
  formatCourseCode,
  json,
  normalizeCourseNumber,
  normalizeFaculty,
  normalizeText,
  parseCookie,
  parseTerm,
  sha256,
  signCookieValue,
  similarityScore,
  verifyCookieValue,
} from "./utils";

const app = new Hono<{ Bindings: Bindings }>();

app.onError((error) => {
  const status =
    error instanceof Error && error.message === "Not found" ? 404 : 400;
  return json({ error: error.message || "Request failed" }, { status });
});

app.get("/api/exams/recent", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT
      exams.id,
      exams.exam_name,
      exams.created_at,
      courses.code AS course_code,
      terms.label AS term_label,
      COALESCE(exam_stats.touching_count, 0) AS touching_count,
      COALESCE(exam_stats.touchy_count, 0) AS touchy_count,
      COALESCE(exam_stats.vote_count, 0) AS vote_count,
      exam_stats.last_voted_at
    FROM exams
    JOIN courses ON courses.id = exams.course_id
    JOIN terms ON terms.id = exams.term_id
    LEFT JOIN exam_stats ON exam_stats.exam_id = exams.id
    ORDER BY exam_stats.last_voted_at DESC NULLS LAST, exams.created_at DESC
    LIMIT 20`,
  ).all();

  return json(result.results.map(mapExamRow));
});

app.get("/api/exams/search", async (c) => {
  const q = normalizeText(c.req.query("q") ?? "");
  const like = `%${q}%`;
  const result =
    q.length === 0
      ? await c.env.DB.prepare(
          `SELECT
            exams.id,
            exams.exam_name,
            exams.created_at,
            courses.code AS course_code,
            terms.label AS term_label,
            COALESCE(exam_stats.touching_count, 0) AS touching_count,
            COALESCE(exam_stats.touchy_count, 0) AS touchy_count,
            COALESCE(exam_stats.vote_count, 0) AS vote_count,
            exam_stats.last_voted_at
          FROM exams
          JOIN courses ON courses.id = exams.course_id
          JOIN terms ON terms.id = exams.term_id
          LEFT JOIN exam_stats ON exam_stats.exam_id = exams.id
          ORDER BY exams.created_at DESC
          LIMIT 20`,
        ).all()
      : await c.env.DB.prepare(
          `SELECT
            exams.id,
            exams.exam_name,
            exams.created_at,
            courses.code AS course_code,
            terms.label AS term_label,
            COALESCE(exam_stats.touching_count, 0) AS touching_count,
            COALESCE(exam_stats.touchy_count, 0) AS touchy_count,
            COALESCE(exam_stats.vote_count, 0) AS vote_count,
            exam_stats.last_voted_at
          FROM exams
          JOIN courses ON courses.id = exams.course_id
          JOIN terms ON terms.id = exams.term_id
          LEFT JOIN exam_stats ON exam_stats.exam_id = exams.id
          WHERE lower(courses.code) LIKE ?1
             OR lower(courses.faculty) LIKE ?1
             OR lower(courses.course_number) LIKE ?1
             OR lower(exams.exam_name) LIKE ?1
             OR lower(terms.label) LIKE ?1
          ORDER BY exam_stats.last_voted_at DESC NULLS LAST, exams.created_at DESC
          LIMIT 20`,
        )
          .bind(like)
          .all();

  return json(result.results.map(mapExamRow));
});

app.get("/api/exams/:id", async (c) => {
  const exam = await c.env.DB.prepare(
    `SELECT
      exams.id,
      exams.exam_name,
      exams.created_at,
      courses.code AS course_code,
      terms.label AS term_label,
      COALESCE(exam_stats.touching_count, 0) AS touching_count,
      COALESCE(exam_stats.touchy_count, 0) AS touchy_count,
      COALESCE(exam_stats.vote_count, 0) AS vote_count,
      exam_stats.last_voted_at
    FROM exams
    JOIN courses ON courses.id = exams.course_id
    JOIN terms ON terms.id = exams.term_id
    LEFT JOIN exam_stats ON exam_stats.exam_id = exams.id
    WHERE exams.id = ?1`,
  )
    .bind(c.req.param("id"))
    .first();

  if (!exam) {
    throw new Error("Not found");
  }

  return json(mapExamRow(exam));
});

app.post("/api/exams/duplicate-check", async (c) => {
  const payload = examInputSchema.parse(await c.req.json());
  const faculty = normalizeFaculty(payload.faculty);
  const courseNumber = normalizeCourseNumber(payload.courseNumber);
  const courseCode = formatCourseCode(faculty, courseNumber);
  const term = parseTerm(payload.termSeason, payload.termYear);
  const examNameNormalized = normalizeText(payload.examName);

  const candidates = await c.env.DB.prepare(
    `SELECT
      exams.id,
      exams.exam_name,
      exams.exam_name_normalized,
      terms.label AS term_label,
      terms.year,
      terms.season
    FROM exams
    JOIN courses ON courses.id = exams.course_id
    JOIN terms ON terms.id = exams.term_id
    WHERE courses.code = ?1`,
  )
    .bind(courseCode)
    .all();

  const scored = candidates.results
    .map((row) => {
      const score = similarityScore(
        examNameNormalized,
        String(row.exam_name_normalized),
      );
      const isSameTerm =
        Number(row.year) === term.year && String(row.season) === term.season;
      const matchType =
        examNameNormalized === row.exam_name_normalized
          ? "exact"
          : isSameTerm && score >= 0.55
            ? "similar"
            : !isSameTerm && score >= 0.55
              ? "cross-term"
              : null;

      return matchType
        ? {
            id: Number(row.id),
            examName: String(row.exam_name),
            termLabel: String(row.term_label),
            matchType,
            score,
            isSameTerm,
          }
        : null;
    })
    .filter(Boolean) as Array<{
    id: number;
    examName: string;
    termLabel: string;
    matchType: "exact" | "similar" | "cross-term";
    score: number;
    isSameTerm: boolean;
  }>;

  const decision = scored.some(
    (candidate) => candidate.matchType === "exact" && candidate.isSameTerm,
  )
    ? "block"
    : scored.some(
          (candidate) =>
            candidate.matchType === "similar" && candidate.isSameTerm,
        )
      ? "warn"
      : "ok";

  return json({
    decision,
    normalizedExamName: examNameNormalized,
    candidates: scored.sort((a, b) => b.score - a.score),
  });
});

app.post("/api/exams", async (c) => {
  const payload = examInputSchema.parse(await c.req.json());
  const faculty = normalizeFaculty(payload.faculty);
  const courseNumber = normalizeCourseNumber(payload.courseNumber);
  const courseCode = formatCourseCode(faculty, courseNumber);
  const term = parseTerm(payload.termSeason, payload.termYear);
  const examName = payload.examName.trim();
  const examNameNormalized = normalizeText(examName);

  const duplicate = await c.env.DB.prepare(
    `SELECT exams.id
     FROM exams
     JOIN courses ON courses.id = exams.course_id
     JOIN terms ON terms.id = exams.term_id
     WHERE courses.code = ?1 AND terms.year = ?2 AND terms.season = ?3 AND exams.exam_name_normalized = ?4`,
  )
    .bind(courseCode, term.year, term.season, examNameNormalized)
    .first();

  if (duplicate) {
    return json({ error: "Exam already exists" }, { status: 409 });
  }

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO courses (faculty, course_number, code)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(faculty, course_number) DO UPDATE SET code = excluded.code`,
    ).bind(faculty, courseNumber, courseCode),
    c.env.DB.prepare(
      `INSERT INTO terms (year, season, label)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(year, season) DO UPDATE SET label = excluded.label`,
    ).bind(term.year, term.season, term.label),
  ]);

  const course = await c.env.DB.prepare(
    `SELECT id FROM courses WHERE code = ?1`,
  )
    .bind(courseCode)
    .first<{ id: number }>();
  const termRow = await c.env.DB.prepare(
    `SELECT id FROM terms WHERE year = ?1 AND season = ?2`,
  )
    .bind(term.year, term.season)
    .first<{ id: number }>();

  const created = await c.env.DB.prepare(
    `INSERT INTO exams (course_id, term_id, exam_name, exam_name_normalized)
     VALUES (?1, ?2, ?3, ?4)
     RETURNING id`,
  )
    .bind(course?.id, termRow?.id, examName, examNameNormalized)
    .first<{ id: number }>();

  if (!created) {
    throw new Error("Could not create exam");
  }

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO exam_stats (exam_id, touching_count, touchy_count, vote_count, last_voted_at)
     VALUES (?1, 0, 0, 0, NULL)`,
  )
    .bind(created.id)
    .run();

  return json({ id: created.id }, { status: 201 });
});

app.post("/api/exams/:id/vote", async (c) => {
  const examId = Number(c.req.param("id"));
  if (Number.isNaN(examId)) {
    throw new Error("Invalid exam id");
  }

  const { voteType } = voteSchema.parse(await c.req.json());
  const cookieName = "cs_device";
  const currentCookie = parseCookie(c.req.header("Cookie") ?? null, cookieName);
  let deviceId = await verifyCookieValue(c.env.COOKIE_SECRET, currentCookie);
  let needsCookie = false;

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    needsCookie = true;
  }

  const deviceIdHash = await sha256(deviceId);
  const previous = await c.env.DB.prepare(
    `SELECT vote_type FROM votes WHERE exam_id = ?1 AND device_id_hash = ?2`,
  )
    .bind(examId, deviceIdHash)
    .first<{ vote_type: VoteType }>();

  const now = new Date().toISOString();
  await c.env.DB.batch(
    previous
      ? [
          c.env.DB.prepare(
            `UPDATE votes
             SET vote_type = ?1, updated_at = ?2
             WHERE exam_id = ?3 AND device_id_hash = ?4`,
          ).bind(voteType, now, examId, deviceIdHash),
        ]
      : [
          c.env.DB.prepare(
            `INSERT INTO votes (exam_id, device_id_hash, vote_type, updated_at)
             VALUES (?1, ?2, ?3, ?4)`,
          ).bind(examId, deviceIdHash, voteType, now),
        ],
  );

  const touchingDelta =
    previous?.vote_type === "TOUCHING"
      ? voteType === "TOUCHY"
        ? -1
        : 0
      : voteType === "TOUCHING"
        ? 1
        : 0;
  const touchyDelta =
    previous?.vote_type === "TOUCHY"
      ? voteType === "TOUCHING"
        ? -1
        : 0
      : voteType === "TOUCHY"
        ? 1
        : 0;
  const voteCountDelta = previous ? 0 : 1;

  await c.env.DB.prepare(
    `INSERT INTO exam_stats (exam_id, touching_count, touchy_count, vote_count, last_voted_at)
     VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(exam_id) DO UPDATE SET
       touching_count = exam_stats.touching_count + excluded.touching_count,
       touchy_count = exam_stats.touchy_count + excluded.touchy_count,
       vote_count = exam_stats.vote_count + excluded.vote_count,
       last_voted_at = excluded.last_voted_at`,
  )
    .bind(examId, touchingDelta, touchyDelta, voteCountDelta, now)
    .run();

  const stats = await c.env.DB.prepare(
    `SELECT touching_count, touchy_count, vote_count, last_voted_at
     FROM exam_stats WHERE exam_id = ?1`,
  )
    .bind(examId)
    .first<{
      touching_count: number;
      touchy_count: number;
      vote_count: number;
      last_voted_at: string;
    }>();

  if (!stats) {
    throw new Error("Could not read updated stats");
  }

  await broadcastTally(c.env, {
    type: "tally",
    examId,
    touchingCount: Number(stats.touching_count),
    touchyCount: Number(stats.touchy_count),
    voteCount: Number(stats.vote_count),
    lastVotedAt: String(stats.last_voted_at),
  });

  const headers = new Headers();
  if (needsCookie) {
    const signedValue = await signCookieValue(c.env.COOKIE_SECRET, deviceId);
    headers.append(
      "Set-Cookie",
      `${cookieName}=${encodeURIComponent(signedValue)}; Path=/; HttpOnly; SameSite=Lax; Secure`,
    );
  }

  return json(
    {
      examId,
      touchingCount: Number(stats.touching_count),
      touchyCount: Number(stats.touchy_count),
      voteCount: Number(stats.vote_count),
      lastVotedAt: String(stats.last_voted_at),
      yourVote: voteType,
    },
    { headers },
  );
});

app.get("/api/exams/:id/ws", async (c) => {
  const examId = Number(c.req.param("id"));
  const stub = c.env.EXAM_ROOMS.get(
    c.env.EXAM_ROOMS.idFromName(String(examId)),
  );

  const stats = await c.env.DB.prepare(
    `SELECT touching_count, touchy_count, vote_count, last_voted_at
     FROM exam_stats WHERE exam_id = ?1`,
  )
    .bind(examId)
    .first<{
      touching_count: number;
      touchy_count: number;
      vote_count: number;
      last_voted_at: string | null;
    }>();

  await stub.fetch("https://room/snapshot", {
    method: "POST",
    body: JSON.stringify({
      type: "snapshot",
      examId,
      touchingCount: Number(stats?.touching_count ?? 0),
      touchyCount: Number(stats?.touchy_count ?? 0),
      voteCount: Number(stats?.vote_count ?? 0),
      lastVotedAt: stats?.last_voted_at ?? null,
    } satisfies TallyPayload),
  });

  return stub.fetch(c.req.raw);
});

app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

async function broadcastTally(env: Bindings, payload: TallyPayload) {
  const stub = env.EXAM_ROOMS.get(
    env.EXAM_ROOMS.idFromName(String(payload.examId)),
  );
  await stub.fetch("https://room/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function mapExamRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    examName: String(row.exam_name),
    courseCode: String(row.course_code),
    termLabel: String(row.term_label),
    touchingCount: Number(row.touching_count ?? 0),
    touchyCount: Number(row.touchy_count ?? 0),
    voteCount: Number(row.vote_count ?? 0),
    lastVotedAt: row.last_voted_at ? String(row.last_voted_at) : null,
    createdAt: row.created_at ? String(row.created_at) : "",
  };
}

export default app;
export { ExamRoom };
