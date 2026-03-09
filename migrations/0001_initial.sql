CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  season TEXT NOT NULL,
  label TEXT NOT NULL,
  UNIQUE(year, season)
);

CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  term_id INTEGER NOT NULL,
  exam_name TEXT NOT NULL,
  exam_name_normalized TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, term_id, exam_name_normalized),
  FOREIGN KEY(course_id) REFERENCES courses(id),
  FOREIGN KEY(term_id) REFERENCES terms(id)
);

CREATE TABLE IF NOT EXISTS votes (
  exam_id INTEGER NOT NULL,
  device_id_hash TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('TOUCHING', 'TOUCHY')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (exam_id, device_id_hash),
  FOREIGN KEY(exam_id) REFERENCES exams(id)
);

CREATE TABLE IF NOT EXISTS exam_stats (
  exam_id INTEGER PRIMARY KEY,
  touching_count INTEGER NOT NULL DEFAULT 0,
  touchy_count INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER NOT NULL DEFAULT 0,
  last_voted_at TEXT,
  FOREIGN KEY(exam_id) REFERENCES exams(id)
);

CREATE INDEX IF NOT EXISTS idx_exams_course_term
  ON exams(course_id, term_id, exam_name_normalized);

CREATE INDEX IF NOT EXISTS idx_votes_exam
  ON votes(exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_stats_recent
  ON exam_stats(last_voted_at DESC);
