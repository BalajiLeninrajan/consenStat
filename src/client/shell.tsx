import { Outlet, Link, useLocation } from "react-router-dom";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="grid-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/65 px-6 py-5 shadow-card backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/" className="font-display text-3xl font-bold tracking-tight text-ink">
              ConsenStat
            </Link>
            <p className="mt-1 text-sm text-ink/60">
              Waterloo exam vibes, live and anonymous.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge>University of Waterloo</Badge>
            {location.pathname !== "/create" && (
              <Link to="/create">
                <Button>Create exam</Button>
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
