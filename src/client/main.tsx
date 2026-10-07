import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
import { AppShell } from "./shell";
import { HomePage } from "./pages/home-page";
import { CreatePage } from "./pages/create-page";
import { ExamPage } from "./pages/exam-page";
import { ToastProvider } from "./ui/toast";
import "./styles.css";
import "./cs.css";

const queryClient = new QueryClient();

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  ui_host: "https://us.posthog.com",
  defaults: "2026-05-30",
  cookieless_mode: "always",
  // HashRouter only changes location.hash, which the default
  // "history_change" pageviews ignore.
  capture_pageview: { path: true, hash: true },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/exam/:id" element={<ExamPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </ToastProvider>
      </QueryClientProvider>
    </PostHogProvider>
  </React.StrictMode>,
);
