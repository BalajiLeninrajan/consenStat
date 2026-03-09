import React from "react";
import ReactDOM from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import { AppShell } from "./shell";
import { HomePage } from "./pages/home-page";
import { CreatePage } from "./pages/create-page";
import { ExamPage } from "./pages/exam-page";
import { ToastProvider } from "./ui/toast";
import "./styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="/create" element={<CreatePage />} />
              <Route path="/exam/:id" element={<ExamPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
