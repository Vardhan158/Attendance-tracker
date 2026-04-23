import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Loader from "../components/Loader";
import Error from "../components/Error";
import { fetchBatches, fetchSessions, markAttendance } from "../services/apiMethods";
import { notifySuccess, notifyError } from "../utils/toast";

const getSessionId = (session) => session._id || session.id || session.sessionId;
const getBatchId = (batch) => batch?._id || batch?.id;

const formatDate = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(`1970-01-01T${value}`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
};

const getSessionDateTime = (session, timeField = "startTime") => {
  if (!session?.date) {
    return null;
  }

  const baseDate = new Date(session.date);

  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const [hours, minutes] = (session[timeField] || (timeField === "endTime" ? "23:59" : "00:00")).split(":");
  const nextDate = new Date(baseDate);
  nextDate.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return nextDate;
};

const normalizeAttendanceStatus = (status) => {
  if (!status || status === "not_marked") {
    return "Not marked";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const isMarkedPresent = (status) => status?.toLowerCase() === "present";

const isActiveSession = (session) => {
  if (!session) {
    return false;
  }

  if (typeof session.isActive === "boolean") {
    return session.isActive;
  }

  const endDateTime = getSessionDateTime(session, "endTime") || getSessionDateTime(session, "startTime");

  if (!endDateTime) {
    return true;
  }

  return endDateTime >= new Date();
};

const getBatchName = (session, batchesById) => {
  if (session?.batchId && typeof session.batchId === "object") {
    return session.batchId.name || "Enrolled batch";
  }

  const batchId = typeof session?.batchId === "string" ? session.batchId : session?.batchId?.toString?.();
  return batchesById.get(batchId)?.name || "Enrolled batch";
};

const StatCard = ({ label, value, tone = "blue" }) => {
  const tones = {
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700"
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

const EmptyState = ({ title, message }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    <p className="mt-2 text-sm text-slate-500">{message}</p>
  </div>
);

const StudentDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingSessionId, setMarkingSessionId] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [sessionData, batchData] = await Promise.all([fetchSessions(), fetchBatches()]);
      setSessions(sessionData.sessions || sessionData || []);
      setBatches(batchData.batches || batchData || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch student dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (sessionId) => {
    if (!sessionId) {
      return;
    }

    setMarkingSessionId(sessionId);

    try {
      const data = await markAttendance(sessionId);
      const attendance = data.data?.attendance || data.attendance;

      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          getSessionId(session) === sessionId
            ? {
                ...session,
                attendanceStatus: attendance?.status || "present",
                markedAt: attendance?.markedAt || new Date().toISOString()
              }
            : session
        )
      );

      notifySuccess("Attendance marked successfully");
      await loadDashboard();
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setMarkingSessionId("");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const batchesById = new Map(batches.map((batch) => [getBatchId(batch)?.toString(), batch]));
  const sortedSessions = sessions.slice().sort((left, right) => {
    const leftDate = getSessionDateTime(left)?.getTime() || 0;
    const rightDate = getSessionDateTime(right)?.getTime() || 0;
    return leftDate - rightDate;
  });
  const activeSessions = sortedSessions.filter(isActiveSession);
  const markedSessions = sessions.filter((session) => isMarkedPresent(session.attendanceStatus));
  const sessionsToRender = activeSessions.length ? activeSessions : sortedSessions;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-700 px-6 py-8 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-100">Student</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">My Batches And Sessions</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-50 sm:text-base">
            View your enrolled batches, track your sessions, and mark attendance for classes you attend.
          </p>
        </section>

        {loading ? (
          <Loader />
        ) : error ? (
          <Error message={error} />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <StatCard label="My Batches" value={batches.length} tone="blue" />
              <StatCard label="My Sessions" value={sessions.length} tone="green" />
              <StatCard label="Attendance Marked" value={markedSessions.length} tone="amber" />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">My Batches</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    These are the batches you are currently enrolled in.
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                  {batches.length} batches
                </span>
              </div>

              {batches.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {batches.map((batch, index) => (
                    <article
                      key={getBatchId(batch) || `student-batch-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Batch</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {batch.name || "Unnamed batch"}
                      </h3>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No batches joined yet"
                  message="Once you join a batch using a trainer invite, it will appear here."
                />
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">My Sessions</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeSessions.length
                      ? "Your active sessions are shown first."
                      : "No active sessions were found, so all your enrolled sessions are shown here."}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                  {sessionsToRender.length} shown
                </span>
              </div>

              {sessionsToRender.length ? (
                <div className="space-y-4">
                  {sessionsToRender.map((session, index) => {
                    const sessionId = getSessionId(session);
                    const alreadyMarked = isMarkedPresent(session.attendanceStatus);

                    return (
                      <article
                        key={sessionId || `student-session-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {session.title || session.name || "Untitled session"}
                              </h3>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {getBatchName(session, batchesById)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                              <span>{formatDate(session.date)}</span>
                              {(session.startTime || session.endTime) && (
                                <span>
                                  {formatTime(session.startTime) || "Start time pending"}
                                  {session.endTime ? ` - ${formatTime(session.endTime)}` : ""}
                                </span>
                              )}
                            </div>

                            <div>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                                  alreadyMarked
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {normalizeAttendanceStatus(session.attendanceStatus)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-3">
                            <button
                              className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                              onClick={() => handleMarkAttendance(sessionId)}
                              disabled={!sessionId || alreadyMarked || markingSessionId === sessionId}
                            >
                              {alreadyMarked
                                ? "Attendance Marked"
                                : markingSessionId === sessionId
                                  ? "Marking..."
                                  : "Mark Attendance"}
                            </button>

                            {session.markedAt && (
                              <p className="text-xs text-slate-500">
                                Marked on {new Date(session.markedAt).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No sessions available yet"
                  message="Once your trainer schedules sessions for your batch, they will appear here."
                />
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
