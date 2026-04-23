import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Loader from "../components/Loader";
import Error from "../components/Error";
import { fetchInstitutionSummary, fetchInstitutions, fetchProgrammeSummary } from "../services/apiMethods";

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

const SummaryBadge = ({ value }) => {
  const numericValue = Number(value) || 0;
  const toneClass =
    numericValue >= 80
      ? "bg-emerald-100 text-emerald-700"
      : numericValue >= 60
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${toneClass}`}>
      {numericValue}% attendance
    </span>
  );
};

const EmptyState = ({ message }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
    {message}
  </div>
);

const InstitutionCard = ({ institution, rank }) => {
  const attendancePercentage = Number(institution.attendancePercentage) || 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Institution {rank}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {institution.institutionName || institution.name || institution.email || "Unnamed institution"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{institution.email || "No email available"}</p>
        </div>
        <SummaryBadge value={attendancePercentage} />
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            attendancePercentage >= 80
              ? "bg-emerald-500"
              : attendancePercentage >= 60
                ? "bg-amber-500"
                : "bg-rose-500"
          }`}
          style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Batches</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{institution.totalBatches ?? 0}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Students</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{institution.totalStudents ?? 0}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sessions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{institution.totalSessions ?? 0}</p>
        </div>
      </div>
    </article>
  );
};

const InstitutionTable = ({ institutions }) => (
  <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-6 py-5">
      <h2 className="text-xl font-semibold text-slate-900">Attendance Across Institutions</h2>
      <p className="mt-1 text-sm text-slate-500">
        Compare attendance performance, batch coverage, and session activity in one place.
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-slate-50 text-sm text-slate-500">
          <tr>
            <th className="px-6 py-4 font-semibold">Institution</th>
            <th className="px-6 py-4 font-semibold">Attendance</th>
            <th className="px-6 py-4 font-semibold">Batches</th>
            <th className="px-6 py-4 font-semibold">Students</th>
            <th className="px-6 py-4 font-semibold">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {institutions.map((institution) => (
            <tr key={institution.institutionId || institution._id} className="border-t border-slate-100">
              <td className="px-6 py-4">
                <p className="font-semibold text-slate-900">
                  {institution.institutionName || institution.name || institution.email}
                </p>
                <p className="text-sm text-slate-500">{institution.email || "No email available"}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex min-w-[180px] items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-sky-500"
                      style={{ width: `${Math.min(Number(institution.attendancePercentage) || 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {Number(institution.attendancePercentage) || 0}%
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-700">{institution.totalBatches ?? 0}</td>
              <td className="px-6 py-4 text-slate-700">{institution.totalStudents ?? 0}</td>
              <td className="px-6 py-4 text-slate-700">{institution.totalSessions ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const ManagerDashboard = () => {
  const [programmeSummary, setProgrammeSummary] = useState({});
  const [institutionSummaries, setInstitutionSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [institutionsRes, programmeSummaryRes] = await Promise.all([
          fetchInstitutions(),
          fetchProgrammeSummary()
        ]);

        const institutions = institutionsRes?.institutions || [];
        const summaries = await Promise.all(
          institutions.map(async (institution) => {
            const response = await fetchInstitutionSummary(institution._id);
            return {
              ...institution,
              ...getSummary(response)
            };
          })
        );

        summaries.sort(
          (left, right) =>
            (Number(right.attendancePercentage) || 0) - (Number(left.attendancePercentage) || 0)
        );

        setProgrammeSummary(getSummary(programmeSummaryRes));
        setInstitutionSummaries(summaries);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch programme summary");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-800 px-6 py-8 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-100">
            Programme Manager
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Attendance Summary Across All Institutions</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-50 sm:text-base">
            Track overall attendance health, compare institution performance, and spot where support is needed most.
          </p>
        </section>

        {loading ? (
          <Loader />
        ) : error ? (
          <Error message={error} />
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Overall Attendance" value={`${programmeSummary.attendancePercentage ?? 0}%`} tone="green" />
              <StatCard label="Institutions" value={programmeSummary.totalInstitutions ?? institutionSummaries.length} />
              <StatCard label="Students" value={programmeSummary.totalStudents ?? 0} tone="amber" />
              <StatCard label="Sessions" value={programmeSummary.totalSessions ?? 0} tone="rose" />
            </section>

            {institutionSummaries.length ? (
              <>
                <section className="grid gap-5 xl:grid-cols-2">
                  {institutionSummaries.map((institution, index) => (
                    <InstitutionCard
                      key={institution.institutionId || institution._id}
                      institution={institution}
                      rank={index + 1}
                    />
                  ))}
                </section>
                <InstitutionTable institutions={institutionSummaries} />
              </>
            ) : (
              <EmptyState message="No institution attendance summary is available yet." />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
