import { useAuth } from "../context/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <p className="text-lg font-semibold text-slate-900">SkillBridge</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Attendance Portal</p>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-sm capitalize text-slate-600 sm:inline-flex">
              {user.role.replace("_", " ")}
            </span>
            <button
              onClick={logout}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
