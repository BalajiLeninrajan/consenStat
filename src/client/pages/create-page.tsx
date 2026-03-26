import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
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
      toast.push("Disaster logged successfully.");
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
    <div className="flex flex-col gap-4 sm:gap-6">
      <Link
        to="/"
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center border-4 border-black bg-[var(--accent-color)] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none sm:static sm:h-auto sm:w-fit sm:border-0 sm:bg-transparent sm:p-0 sm:text-black/60 sm:shadow-none sm:hover:translate-x-0 sm:hover:translate-y-0 sm:hover:text-black"
      >
        <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1 sm:h-5 sm:w-5" />
        <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-[11px] sm:font-black sm:uppercase sm:tracking-[0.16em] sm:sm:tracking-widest">
          Back to list
        </span>
      </Link>

      <Card className="relative mx-auto w-full max-w-[62rem] overflow-hidden border-4 border-black bg-[#f3f0ea] p-0 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),transparent_28%)]" />
        <div className="absolute -right-10 top-10 hidden h-44 w-44 border-4 border-black bg-[var(--accent-color)] lg:block" />
        <div className="relative p-4 sm:p-8 md:p-10">
          <div className="max-w-[50rem]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent-text-color)] sm:text-sm">
              New Submission
            </p>
            <h1 className="mt-3 max-w-[42rem] font-theme-display text-[1.85rem] font-black uppercase leading-[0.92] tracking-[-0.05em] sm:mt-4 sm:text-[3.1rem] md:text-[3.9rem]">
              Add new trauma to the collection.
            </h1>
          </div>

          <form
            className="mt-7 space-y-6 sm:mt-10 sm:space-y-8"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5 min-[840px]:grid-cols-2">
              <label className="space-y-3">
                <span className="block text-[11px] font-black uppercase tracking-[0.16em] sm:text-sm">
                  Faculty
                </span>
                <Input
                  value={form.faculty}
                  onChange={(event) =>
                    updateField("faculty", event.target.value.toUpperCase())
                  }
                  placeholder="CS / MATH / ARTS"
                  className="h-12 border-4 border-black bg-white px-3 text-base font-black uppercase placeholder:text-[#99a1b2] sm:h-14 sm:px-4 sm:text-xl"
                />
              </label>
              <label className="space-y-3">
                <span className="block text-[11px] font-black uppercase tracking-[0.16em] sm:text-sm">
                  Course Number
                </span>
                <Input
                  value={form.courseNumber}
                  onChange={(event) =>
                    updateField(
                      "courseNumber",
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="135"
                  className="h-12 border-4 border-black bg-white px-3 text-base font-black uppercase placeholder:text-[#99a1b2] sm:h-14 sm:px-4 sm:text-xl"
                />
              </label>
              <label className="space-y-3 sm:max-w-[10rem] lg:max-w-none">
                <span className="block text-[11px] font-black uppercase tracking-[0.16em] sm:text-sm">
                  Year
                </span>
                <Input
                  value={form.termYear}
                  onChange={(event) =>
                    updateField("termYear", event.target.value)
                  }
                  inputMode="numeric"
                  placeholder="2026"
                  className="h-12 min-w-0 border-4 border-black bg-white px-3 text-base font-black uppercase sm:h-14 sm:px-4 sm:text-xl"
                />
              </label>
            </div>

            <fieldset className="space-y-3 sm:space-y-4">
              <legend className="text-[11px] font-black uppercase tracking-[0.16em] sm:text-sm">
                When did it happen?
              </legend>
              <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                {termSeasons.map((season) => {
                  const active = form.termSeason === season.value;
                  return (
                    <label
                      key={season.value}
                      className={`flex h-12 cursor-pointer items-center justify-center border-4 text-center text-base font-black uppercase transition sm:h-14 sm:text-lg ${
                        active
                          ? "translate-x-[4px] translate-y-[4px] border-black bg-[var(--accent-color)] text-black shadow-none"
                          : "border-black bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-black/5"
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

            <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
              <label
                htmlFor="exam-name"
                className="text-[11px] font-black uppercase tracking-[0.16em] sm:text-sm"
              >
                Exam Name
              </label>
              <Input
                id="exam-name"
                value={form.examName}
                onChange={(event) =>
                  updateField("examName", event.target.value)
                }
                placeholder="Midterm"
                className="h-12 border-4 border-black bg-white px-3 text-base font-black uppercase placeholder:text-[#99a1b2] sm:h-14 sm:px-4 sm:text-xl"
              />
            </div>

            <div className="border-t-4 border-black pt-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <p className="max-w-md text-[11px] font-black uppercase leading-relaxed text-black/50 sm:text-sm">
                  We&apos;ll check if this violation has already been reported.
                </p>
                <Button
                  type="submit"
                  disabled={
                    !canSubmit ||
                    duplicateMutation.isPending ||
                    createMutation.isPending
                  }
                  className="h-12 w-full border-4 border-black bg-[var(--accent-color)] px-6 text-base text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.45)] sm:h-14 sm:w-auto sm:min-w-64 sm:px-8 sm:text-xl"
                >
                  {createMutation.isPending ? "Logging..." : "Commit Exam"}
                </Button>
              </div>
            </div>

            {(duplicateMutation.error || createMutation.error) && (
              <p className="text-lg font-black uppercase text-red-600">
                {(duplicateMutation.error ?? createMutation.error)?.message}
              </p>
            )}
          </form>
        </div>
      </Card>

      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={
          duplicates?.decision === "block"
            ? "Stop. This disaster is already here."
            : "Possible Doppelganger Detected"
        }
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start gap-3 border-4 border-black bg-red-600 p-4 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:gap-4 sm:p-6">
            <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" />
            <p className="text-sm font-bold uppercase leading-tight sm:text-base">
              {duplicates?.decision === "block"
                ? "This exact exam already exists. Don't be redundant, we have enough of that in class."
                : "This looks suspiciously familiar. Are you sure you're not just repeating someone else's pain?"}
            </p>
          </div>
          <div className="space-y-4">
            {duplicates?.candidates.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/exam/${candidate.id}`}
                onClick={() => setShowDialog(false)}
                className="block transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                <article className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6">
                  <p className="text-lg font-black uppercase tracking-tight sm:text-xl">
                    {candidate.examName}
                  </p>
                  <p className="text-xs font-bold uppercase opacity-60 sm:text-sm">
                    {candidate.termLabel}
                  </p>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-[var(--accent-text-color)] sm:text-xs">
                    {candidate.matchType} • {Math.round(candidate.score * 100)}%
                    Match
                  </p>
                </article>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end sm:gap-4 sm:pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDialog(false)}
              className="border-4 border-black bg-white px-6 py-3 text-sm sm:text-base"
            >
              Back out
            </Button>
            {duplicates?.decision === "warn" && (
              <Button
                className="border-4 border-black bg-[var(--accent-color)] px-6 py-3 text-sm text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:text-base"
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
