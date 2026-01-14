import { Outlet, NavLink } from "react-router-dom";
import TopNav from "../components/ui/TopNav";

export default function DashLayout() {
  return (
    <div className="flex min-h-screen bg-muted/40">
      
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background p-4">
        <h2 className="text-xl font-bold mb-6">Doctor Assist</h2>

        <nav className="space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${
                isActive ? "bg-muted font-medium" : "hover:bg-muted"
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/patients"
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${
                isActive ? "bg-muted font-medium" : "hover:bg-muted"
              }`
            }
          >
            Patients
          </NavLink>

          <NavLink
            to="/appointments"
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${
                isActive ? "bg-muted font-medium" : "hover:bg-muted"
              }`
            }
          >
            Appointments
          </NavLink>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
