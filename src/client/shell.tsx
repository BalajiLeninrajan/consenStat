import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="wordmark">
          Consen<em>Stat</em>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          {location.pathname !== "/create" && (
            <Link to="/create">
              <Button>List new exam</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="shell-main">
        {/* Keyed on the path so the enter animation re-runs on each route. */}
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="shell-footer">
        <span>CONSENSTAT</span>
        <p>© 2026 · MADE WITH HATE IN WATERLOO</p>
      </footer>
    </div>
  );
}
