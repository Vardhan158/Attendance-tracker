import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const sidebarLinks = {
  student: [
    { to: "/student/dashboard", label: "Dashboard" },
  ],
  trainer: [
    { to: "/trainer/dashboard", label: "Dashboard" },
    { to: "/trainer/sessions", label: "Sessions" },
  ],
  institution: [
    { to: "/institution/dashboard", label: "Dashboard" },
    { to: "/institution/batches", label: "Batches" },
    { to: "/institution/trainers", label: "Trainers" },
  ],
  programme_manager: [
    { to: "/manager/dashboard", label: "Attendance Summary" },
  ],
  monitoring_officer: [
    { to: "/monitor/dashboard", label: "Dashboard" },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;
  const links = sidebarLinks[user.role] || [];
  return (
    <>
      <aside className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <nav className="flex gap-2 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                location.pathname === link.to
                  ? "bg-slate-900 font-medium text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <aside className="hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="p-6">
          <div className="mb-8">
            <div className="text-xl font-semibold text-slate-900">SkillBridge</div>
            <p className="mt-1 text-sm text-slate-500 capitalize">{user.role.replace("_", " ")}</p>
          </div>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block rounded-xl px-4 py-3 text-sm transition ${
                  location.pathname === link.to
                    ? "bg-slate-900 font-medium text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
