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
  courseCode: string;
  courseName: string;
  term: string;
  examName: string;
};

const initialState: FormState = {
  courseCode: "",
  courseName: "",
  term: "",
  examName: "",
};

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
      form.courseCode.trim() &&
      form.courseName.trim() &&
      form.term.trim() &&
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

    const result = await duplicateMutation.mutateAsync(form);
    if (result.decision === "ok") {
      createMutation.mutate(form);
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
            Waterloo only for v1. Use the exact course code and the clearest exam name
            students will search for later.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Course code</span>
              <Input
                value={form.courseCode}
                onChange={(event) => updateField("courseCode", event.target.value.toUpperCase())}
                placeholder="CS 245"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Term</span>
              <Input
                value={form.term}
                onChange={(event) => updateField("term", event.target.value)}
                placeholder="Fall 2026"
              />
            </label>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Course name</span>
            <Input
              value={form.courseName}
              onChange={(event) => updateField("courseName", event.target.value)}
              placeholder="Linear Algebra 2"
            />
          </label>
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
                  createMutation.mutate(form);
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
