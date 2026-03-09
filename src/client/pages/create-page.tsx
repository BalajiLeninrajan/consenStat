import { useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createExam, duplicateCheck, type DuplicateResponse } from "../lib/api";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";

type FormState = {
  faculty: string;
  courseNumber: string;
  termSeason: "fall" | "spring" | "winter";
  termYear: string;
  examName: string;
};

const initialState: FormState = {
  faculty: "",
  courseNumber: "",
  termSeason: "fall",
  termYear: new Date().getFullYear().toString(),
  examName: "",
};

const termSeasons = [
  { value: "fall", label: "Fall" },
  { value: "spring", label: "Spring" },
  { value: "winter", label: "Winter" },
] as const;

export function CreatePage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [duplicates, setDuplicates] = useState<DuplicateResponse | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const duplicateMutation = useMutation({
    mutationFn: duplicateCheck,
    onSuccess(data) {
      setDuplicates(data);
      if (data.decision !== "ok") {
        setShowDialog(true);
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: createExam,
    onSuccess(data) {
      toast.push("Exam created.");
      navigate(`/exam/${data.id}`);
    },
  });

  const canSubmit = useMemo(
    () =>
      form.faculty.trim() &&
      form.courseNumber.trim() &&
      form.termYear.trim() &&
      form.examName.trim(),
    [form],
  );

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const result = await duplicateMutation.mutateAsync({
      ...form,
      termYear: Number(form.termYear),
    });
    if (result.decision === "ok") {
      createMutation.mutate({
        ...form,
        termYear: Number(form.termYear),
      });
    }
  }

  return (
    <>
      <Card className="mx-auto max-w-3xl bg-gradient-to-br from-white to-panel">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lagoon">
            Add an exam
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
            Create a page only if the exam is actually distinct.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ink/60">
            Waterloo only for v1. Use the faculty and course number students will
            actually search, then pick the matching term and exam name.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Faculty</span>
              <Input
                value={form.faculty}
                onChange={(event) => updateField("faculty", event.target.value.toUpperCase())}
                placeholder="CS"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Course number</span>
              <Input
                value={form.courseNumber}
                onChange={(event) => updateField("courseNumber", event.target.value.toUpperCase())}
                placeholder="245"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Year</span>
              <Input
                value={form.termYear}
                onChange={(event) => updateField("termYear", event.target.value)}
                inputMode="numeric"
                placeholder="2026"
              />
            </label>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-ink">Term</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {termSeasons.map((season) => {
                const active = form.termSeason === season.value;
                return (
                  <label
                    key={season.value}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-lagoon bg-lagoon/10 text-lagoon"
                        : "border-ink/10 bg-white/70 text-ink/65"
                    }`}
                  >
                    <input
                      type="radio"
                      name="termSeason"
                      value={season.value}
                      checked={active}
                      onChange={() => updateField("termSeason", season.value)}
                      className="sr-only"
                    />
                    {season.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Exam name</span>
            <Input
              value={form.examName}
              onChange={(event) => updateField("examName", event.target.value)}
              placeholder="Final exam"
            />
          </label>
          <div className="flex items-center justify-between gap-4 pt-4">
            <p className="text-sm text-ink/50">
              Duplicate check runs before creation and may stop exact collisions.
            </p>
            <Button
              type="submit"
              disabled={!canSubmit || duplicateMutation.isPending || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Check and create"}
            </Button>
          </div>
          {(duplicateMutation.error || createMutation.error) && (
            <p className="text-sm font-medium text-coral">
              {(duplicateMutation.error ?? createMutation.error)?.message}
            </p>
          )}
        </form>
      </Card>

      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={
          duplicates?.decision === "block"
            ? "That exam already exists"
            : "This might be a duplicate"
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-coral/10 p-4 text-sm text-ink/75">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-coral" />
            <p>
              {duplicates?.decision === "block"
                ? "Exact normalized match in the same course and term. Reuse the existing exam page."
                : "Close match detected. Create anyway only if this is meaningfully different."}
            </p>
          </div>
          <div className="space-y-3">
            {duplicates?.candidates.map((candidate) => (
              <article key={candidate.id} className="rounded-2xl border border-ink/10 p-4">
                <p className="text-sm font-semibold text-ink">{candidate.examName}</p>
                <p className="text-sm text-ink/55">{candidate.termLabel}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-lagoon">
                  {candidate.matchType} • {Math.round(candidate.score * 100)}%
                </p>
              </article>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>
              Back
            </Button>
            {duplicates?.decision === "warn" && (
              <Button
                onClick={() => {
                  setShowDialog(false);
                  createMutation.mutate({
                    ...form,
                    termYear: Number(form.termYear),
                  });
                }}
              >
                Create anyway
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
