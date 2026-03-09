import { z } from "zod";

export const examInputSchema = z.object({
  faculty: z.string().min(2).max(10),
  courseNumber: z.string().min(2).max(10),
  termSeason: z.enum(["fall", "spring", "winter"]),
  termYear: z.coerce.number().int().min(2020).max(2100),
  examName: z.string().min(2).max(120),
});

export const voteSchema = z.object({
  voteType: z.enum(["TOUCHING", "TOUCHY"]),
});
