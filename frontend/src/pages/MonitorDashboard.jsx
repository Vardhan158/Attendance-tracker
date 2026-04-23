import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Loader from "../components/Loader";
import Error from "../components/Error";
import { fetchProgrammeSummary } from "../services/apiMethods";

const getSummary = (response) => response?.data?.summary || response?.summary || {};

const StatCard = ({ label, value, tone = "blue" }) => {
  const tones = {
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700"
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value ?? 0}</p>
    </div>
  );
};

const StatusCard = ({ label, value, tone }) => {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700"
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value ?? 0}</p>
    </div>
  );
};

const ReadOnlyNotice = () => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold text-slate-900">Read-Only Access</h2>
    <p className="mt-2 text-sm leading-6 text-slate-500">
      Monitoring officers can review programme-wide attendance rates and participation trends here.
      No create, edit, or delete actions are available anywhere in this dashboard.
    </p>
  </section>
);

const MonitorDashboard = () => {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchProgrammeSummary();
        setSummary(getSummary(response));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch programme summary");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const statusCounts = summary.statusCounts || {};

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-900 to-sky-800 px-6 py-8 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100">
            Monitoring Officer
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Programme Attendance Dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-50 sm:text-base">
            Review programme-wide attendance performance through a read-only dashboard with no operational actions.
          </p>
        </section>

        {loading ? (
          <Loader />
        ) : error ? (
          <Error message={error} />
        ) : (
          <>
            <ReadOnlyNotice />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Attendance Rate" value={`${summary.attendancePercentage ?? 0}%`} tone="green" />
              <StatCard label="Institutions" value={summary.totalInstitutions ?? 0} tone="blue" />
              <StatCard label="Batches" value={summary.totalBatches ?? 0} tone="amber" />
              <StatCard label="Sessions" value={summary.totalSessions ?? 0} tone="rose" />
            </section>

            <section className="grid gap-4 md:grid-cols-1">
              <StatusCard label="Present" value={statusCounts.present ?? 0} tone="green" />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">Coverage Snapshot</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A quick read on how broad the current reporting coverage is across the programme.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Students</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalStudents ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Trainers</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalTrainers ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Attendance Records</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalAttendanceRecords ?? 0}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MonitorDashboard;
