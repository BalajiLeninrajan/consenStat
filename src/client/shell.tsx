import { Outlet, Link, useLocation } from "react-router-dom";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar is-split">
        <Link to="/" className="wordmark is-lg">
          Consen<em>Stat</em>
        </Link>
        <div className="cn-row cn-gap-12">
          {location.pathname !== "/create" && (
            <Link to="/create" className="btn btn-primary">
              List new exam
            </Link>
          )}
        </div>
      </header>

      {/* Each page puts .page-enter on its own section container, so the
          sections assemble 40ms apart. */}
      <main className="page-main">
        <Outlet />
      </main>

      <footer className="page-footer">
        <span>ConsenStat</span>
        <p>© 2026 · Made with hate in Waterloo</p>
      </footer>
    </div>
  );
}
