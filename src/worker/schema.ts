import { z } from "zod";

export const examInputSchema = z.object({
  courseCode: z.string().min(2).max(20),
  courseName: z.string().min(2).max(120),
  term: z.string().min(6).max(20),
  examName: z.string().min(2).max(120),
});

export const voteSchema = z.object({
  voteType: z.enum(["TOUCHING", "TOUCHY"]),
});
