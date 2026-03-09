import { Outlet, Link, useLocation } from "react-router-dom";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="grid-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 theme-header px-5 py-5 sm:mb-12 sm:gap-6 sm:px-8 sm:py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/"
              className="font-theme-display text-[2.1rem] font-bold uppercase tracking-tighter sm:text-4xl"
            >
              ConsenStat
            </Link>
            <p className="mt-2 max-w-[18rem] text-xs font-bold uppercase leading-tight sm:max-w-xs sm:text-sm">
              The only place where "it was hard" is a legitimate excuse for
              failing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Badge className="border-2 border-black bg-white px-3 py-2 text-[11px] text-black sm:px-4 sm:text-sm">
              University of Waterloo
            </Badge>
            {location.pathname !== "/create" && (
              <Link to="/create">
                <Button className="border-2 border-black bg-[#ff3e00] px-2 py-1 text-sm text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none sm:text-base">
                  List new exam
                </Button>
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="mt-10 border-t-4 border-black py-6 text-center text-[11px] font-bold uppercase tracking-[0.2em] sm:mt-16 sm:py-10 sm:text-sm sm:tracking-widest">
          <p>
            © 2026 ConsenStat. No feelings were spared in the making of this
            app.
          </p>
        </footer>
      </div>
    </div>
  );
}
