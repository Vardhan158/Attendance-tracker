export const dashboardPathByRole = {
  student: "/student/dashboard",
  trainer: "/trainer/dashboard",
  institution: "/institution/dashboard",
  programme_manager: "/manager/dashboard",
  monitoring_officer: "/monitor/dashboard"
};

export const getDashboardPath = (role) => dashboardPathByRole[role] || "/login";
