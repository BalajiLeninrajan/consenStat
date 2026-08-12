import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const getDefaultSemester = () => {
  const month = new Date().getMonth();
  if (month >= 0 && month <= 3) return "winter";
  if (month >= 4 && month <= 7) return "spring";
  return "fall";
};

const initialState: FormState = {
  faculty: "",
  courseNumber: "",
  termSeason: getDefaultSemester(),
  termYear: new Date().getFullYear().toString(),
  examName: "",
};

const termSeasons = [
  { value: "winter", label: "Winter", hint: "Jan – Apr" },
  { value: "spring", label: "Spring", hint: "May – Aug" },
  { value: "fall", label: "Fall", hint: "Sep – Dec" },
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
      toast.push("DISASTER LOGGED SUCCESSFULLY");
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

  const submitError = duplicateMutation.error ?? createMutation.error;
  const isBusy = duplicateMutation.isPending || createMutation.isPending;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <Link to="/" className="back-link">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to list
      </Link>

      <Card className="mx-auto w-full max-w-[62rem] p-6 sm:p-9">
        <p className="eyebrow">New submission</p>
        <h1 className="display-title max-w-[18ch]">
          Add new <em>trauma</em> to the collection.
        </h1>

        <form className="mt-9 flex flex-col gap-7" onSubmit={handleSubmit}>
          <div className="field grid gap-5 min-[840px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem]">
            <label>
              Faculty
              <Input
                value={form.faculty}
                onChange={(event) =>
                  updateField("faculty", event.target.value.toUpperCase())
                }
                placeholder="CS / MATH / ARTS"
              />
            </label>
            <label>
              Course number
              <Input
                value={form.courseNumber}
                onChange={(event) =>
                  updateField("courseNumber", event.target.value.toUpperCase())
                }
                placeholder="135"
              />
            </label>
            <label>
              Year
              <Input
                value={form.termYear}
                onChange={(event) => updateField("termYear", event.target.value)}
                inputMode="numeric"
                placeholder="2026"
              />
            </label>
          </div>

          <fieldset className="border-0 p-0">
            <legend className="field-label">When did it happen?</legend>
            <div className="segmented">
              {termSeasons.map((season) => {
                const active = form.termSeason === season.value;
                return (
                  <label
                    key={season.value}
                    className={active ? "is-active" : undefined}
                  >
                    <input
                      type="radio"
                      name="termSeason"
                      value={season.value}
                      checked={active}
                      onChange={() => updateField("termSeason", season.value)}
                      className="sr-only"
                    />
                    <span className="flex flex-col gap-1">
                      <b>{season.label}</b>
                      <small>{season.hint}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="exam-name">Exam name</label>
            <Input
              id="exam-name"
              value={form.examName}
              onChange={(event) => updateField("examName", event.target.value)}
              placeholder="Midterm"
            />
          </div>

          {submitError && (
            <div
              className="banner"
              style={{ "--tone": "var(--red)" } as CSSProperties}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {submitError.message}
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-[var(--surface-0)] pt-6 md:flex-row md:items-center md:justify-between">
            <p className="meta-line max-w-md">
              WE&apos;LL CHECK IF THIS VIOLATION HAS ALREADY BEEN REPORTED.
            </p>
            <Button
              type="submit"
              disabled={!canSubmit || isBusy}
              className="w-full md:w-auto md:min-w-[13rem]"
            >
              {createMutation.isPending ? "Logging…" : "Commit exam"}
            </Button>
          </div>
        </form>
      </Card>

      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={
          duplicates?.decision === "block"
            ? "Stop. This disaster is already here."
            : "Possible doppelganger detected"
        }
      >
        <div className="flex flex-col gap-5">
          <div
            className="banner items-start"
            style={
              {
                "--tone":
                  duplicates?.decision === "block"
                    ? "var(--red)"
                    : "var(--peach)",
              } as CSSProperties
            }
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {duplicates?.decision === "block"
                ? "This exact exam already exists. Don't be redundant, we have enough of that in class."
                : "This looks suspiciously familiar. Are you sure you're not just repeating someone else's pain?"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {duplicates?.candidates.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/exam/${candidate.id}`}
                onClick={() => setShowDialog(false)}
                className="block"
                style={{ "--entity-color": "var(--peach)" } as CSSProperties}
              >
                <article className="entity-card gap-2">
                  <h3 className="entity-title">{candidate.examName}</h3>
                  <p className="entity-meta">{candidate.termLabel}</p>
                  <p className="entity-code mt-1">
                    {candidate.matchType} · {Math.round(candidate.score * 100)}%
                    MATCH
                  </p>
                </article>
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>
              Back out
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
    </div>
  );
}
