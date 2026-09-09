import { Outlet, Link, useLocation } from "react-router-dom";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar is-split">
        <Link to="/" className="wordmark is-lg">
          Consen<em>Stat</em>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          {location.pathname !== "/create" && (
            <Link to="/create" className="btn btn-primary">
              List new exam
            </Link>
          )}
        </div>
      </header>

      <main className="page-main">
        {/* Keyed on the path so the enter animation re-runs on each route. */}
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="footer-neu">
        <span>ConsenStat</span>
        <p>© 2026 · Made with hate in Waterloo</p>
      </footer>
    </div>
  );
}
