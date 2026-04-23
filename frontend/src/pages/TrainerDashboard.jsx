import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Loader from "../components/Loader";
import Error from "../components/Error";
import {
  fetchBatches,
  fetchTrainerSessions,
  createSession,
  fetchSessionAttendance,
  generateInvite,
  assignBatchStudents,
  fetchBatchStudents
} from "../services/apiMethods";
import { notifyError, notifySuccess } from "../utils/toast";

const getSessionId = (session) => session._id || session.id || session.sessionId;
const getBatchId = (session) => {
  if (!session?.batchId) {
    return "";
  }

  return typeof session.batchId === "object" ? session.batchId._id || session.batchId.id : session.batchId;
};

const getBatchName = (session, batches) => {
  if (typeof session.batchId === "object") {
    return session.batchId.name || "Assigned batch";
  }

  return batches.find((batch) => (batch._id || batch.id) === getBatchId(session))?.name || "Assigned batch";
};

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

const normalizeAttendanceRows = (data) => data.data?.students || data.students || data.attendance || [];
const normalizeAssignedStudents = (data) => data.data?.assignedStudents || data.assignedStudents || [];

const EmptyState = ({ title, message }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 text-sm text-gray-500">{message}</p>
  </div>
);

const AttendancePanel = ({ rows }) => {
  if (!rows?.length) {
    return <p className="text-sm text-gray-500">No attendance records found for this session yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="min-w-full text-left">
        <thead className="bg-gray-50 text-sm text-gray-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Student</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.studentId || row._id || `attendance-row-${index}`} className="border-t border-gray-100">
              <td className="px-4 py-3 font-medium text-gray-900">{row.name || row.studentName || "Student"}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{row.email || "No email available"}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-gray-700">
                  {(row.status || "not_marked").replace("_", " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TrainerDashboard = ({ view = "dashboard" }) => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState({});
  const [inviteLinks, setInviteLinks] = useState({});
  const [expandedSessionId, setExpandedSessionId] = useState("");
  const [loadingAttendanceId, setLoadingAttendanceId] = useState("");
  const [generatingInviteId, setGeneratingInviteId] = useState("");
  const [assignedStudents, setAssignedStudents] = useState({});
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [studentEmails, setStudentEmails] = useState("");
  const [enrollingStudents, setEnrollingStudents] = useState(false);
  const [loadingBatchStudentsId, setLoadingBatchStudentsId] = useState("");
  const [form, setForm] = useState({
    batchId: "",
    title: "",
    date: "",
    startTime: "",
    endTime: ""
  });

  const loadTrainerData = async () => {
    setLoading(true);
    setError("");

    try {
      const [sessionData, batchData] = await Promise.all([fetchTrainerSessions(), fetchBatches()]);
      const nextSessions = sessionData.sessions || sessionData || [];
      const nextBatches = batchData.batches || batchData || [];

      setSessions(nextSessions);
      setBatches(nextBatches);
      setSelectedBatchId((currentBatchId) => currentBatchId || nextBatches[0]?._id || nextBatches[0]?.id || "");
      setForm((currentForm) => ({
        ...currentForm,
        batchId: currentForm.batchId || nextBatches[0]?._id || nextBatches[0]?.id || ""
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch trainer data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainerData();
  }, []);

  useEffect(() => {
    if (!selectedBatchId || assignedStudents[selectedBatchId]) {
      return;
    }

    const loadBatchStudents = async () => {
      setLoadingBatchStudentsId(selectedBatchId);

      try {
        const data = await fetchBatchStudents(selectedBatchId);
        setAssignedStudents((currentAssignedStudents) => ({
          ...currentAssignedStudents,
          [selectedBatchId]: normalizeAssignedStudents(data)
        }));
      } catch (err) {
        notifyError(err.response?.data?.message || "Failed to fetch enrolled students");
      } finally {
        setLoadingBatchStudentsId("");
      }
    };

    loadBatchStudents();
  }, [assignedStudents, selectedBatchId]);

  const handleFormChange = (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value
    }));
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();

    try {
      await createSession(form);
      notifySuccess("Session created successfully");
      setForm({
        batchId: batches[0]?._id || batches[0]?.id || "",
        title: "",
        date: "",
        startTime: "",
        endTime: ""
      });
      await loadTrainerData();
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to create session");
    }
  };

  const handleEnrollStudents = async (event) => {
    event.preventDefault();

    if (!selectedBatchId) {
      notifyError("Select a batch first");
      return;
    }

    const emails = studentEmails
      .split(/[\n,]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (!emails.length) {
      notifyError("Enter at least one student email");
      return;
    }

    setEnrollingStudents(true);

    try {
      const data = await assignBatchStudents(selectedBatchId, emails);
      setAssignedStudents((currentAssignedStudents) => ({
        ...currentAssignedStudents,
        [selectedBatchId]: normalizeAssignedStudents(data)
      }));
      setStudentEmails("");
      notifySuccess("Student emails assigned to the batch");
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to enroll students");
    } finally {
      setEnrollingStudents(false);
    }
  };

  const handleViewAttendance = async (sessionId) => {
    if (!sessionId) {
      return;
    }

    if (expandedSessionId === sessionId && attendance[sessionId]) {
      setExpandedSessionId("");
      return;
    }

    setExpandedSessionId(sessionId);

    if (attendance[sessionId]) {
      return;
    }

    setLoadingAttendanceId(sessionId);

    try {
      const data = await fetchSessionAttendance(sessionId);
      setAttendance((currentAttendance) => ({
        ...currentAttendance,
        [sessionId]: normalizeAttendanceRows(data)
      }));
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to fetch attendance");
    } finally {
      setLoadingAttendanceId("");
    }
  };

  const handleGenerateInvite = async (sessionId, batchId) => {
    if (!sessionId || !batchId) {
      notifyError("Batch information is missing for this session");
      return;
    }

    setGeneratingInviteId(sessionId);

    try {
      const data = await generateInvite(batchId);
      const inviteLink = data.data?.inviteLink || data.inviteLink || data.link || "";

      setInviteLinks((currentLinks) => ({
        ...currentLinks,
        [sessionId]: inviteLink
      }));

      notifySuccess("Invite link generated");
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to generate invite link");
    } finally {
      setGeneratingInviteId("");
    }
  };

  const handleCopyInvite = async (inviteLink) => {
    if (!inviteLink) {
      notifyError("Generate an invite link first");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      notifySuccess("Invite link copied");
    } catch {
      notifyError("Unable to copy invite link");
    }
  };

  const upcomingSessions = sessions.slice().sort((left, right) => new Date(left.date) - new Date(right.date));
  const title = view === "sessions" ? "Trainer Sessions" : "Trainer Dashboard";
  const selectedBatchStudents = assignedStudents[selectedBatchId] || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Trainer</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Create sessions, add students to assigned batches, review attendance, and share invite links.
          </p>
        </section>

        {loading ? (
          <Loader />
        ) : error ? (
          <Error message={error} />
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-900">Enroll Students In A Batch</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add student emails to a batch first, then share the invite link so only those students can join.
                </p>
              </div>

              {batches.length ? (
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <form onSubmit={handleEnrollStudents} className="space-y-4">
                    <select
                      value={selectedBatchId}
                      onChange={(event) => setSelectedBatchId(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                      required
                    >
                      <option value="">Select batch</option>
                      {batches.map((batch) => (
                        <option key={batch._id || batch.id} value={batch._id || batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={studentEmails}
                      onChange={(event) => setStudentEmails(event.target.value)}
                      placeholder={"Enter one or more student emails\nstudent1@example.com\nstudent2@example.com"}
                      className="min-h-40 w-full rounded-lg border border-slate-300 px-4 py-3"
                      required
                    />

                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={enrollingStudents}
                    >
                      {enrollingStudents ? "Saving..." : "Enroll Students"}
                    </button>
                  </form>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Assigned Student Emails</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Students must log in with one of these emails before the invite link will work.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                        {selectedBatchStudents.length} assigned
                      </span>
                    </div>

                    <div className="mt-4">
                      {loadingBatchStudentsId === selectedBatchId ? (
                        <Loader />
                      ) : selectedBatchStudents.length ? (
                        <div className="space-y-2">
                          {selectedBatchStudents.map((student, index) => (
                            <div
                              key={student._id || student.email || `assigned-student-${index}`}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                            >
                              {student.email}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No student emails have been assigned to this batch yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No batches assigned"
                  message="A trainer can enroll students only after a batch is assigned."
                />
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-900">Create Session</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add a new class session with title, date, start time, end time, and batch.
                </p>
              </div>

              {batches.length ? (
                <form onSubmit={handleCreateSession} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                  <select
                    name="batchId"
                    value={form.batchId}
                    onChange={handleFormChange}
                    className="rounded-lg border border-slate-300 px-4 py-3 xl:col-span-2"
                    required
                  >
                    <option value="">Select batch</option>
                    {batches.map((batch) => (
                      <option key={batch._id || batch.id} value={batch._id || batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="Session title"
                    className="rounded-lg border border-slate-300 px-4 py-3 xl:col-span-2"
                    required
                  />
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleFormChange}
                    className="rounded-lg border border-slate-300 px-4 py-3"
                    required
                  />
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleFormChange}
                    className="rounded-lg border border-slate-300 px-4 py-3"
                    required
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleFormChange}
                    className="rounded-lg border border-slate-300 px-4 py-3"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 xl:col-span-2"
                  >
                    Create Session
                  </button>
                </form>
              ) : (
                <EmptyState
                  title="No batches assigned"
                  message="A trainer can create sessions only after a batch is assigned."
                />
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">My Sessions</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    View attendance for your sessions and generate invite links for the related batch.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  {sessions.length} sessions
                </span>
              </div>

              {upcomingSessions.length ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session, index) => {
                    const sessionId = getSessionId(session);
                    const batchId = getBatchId(session);
                    const batchName = getBatchName(session, batches);
                    const sessionAttendance = attendance[sessionId];
                    const inviteLink = inviteLinks[sessionId];
                    const isAttendanceOpen = expandedSessionId === sessionId;

                    return (
                      <article
                        key={sessionId || `trainer-session-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {session.title || session.name || "Untitled session"}
                              </h3>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                {batchName}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {formatDate(session.date)} | {session.startTime} - {session.endTime}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
                              onClick={() => handleViewAttendance(sessionId)}
                            >
                              {isAttendanceOpen ? "Hide Attendance" : "View Attendance"}
                            </button>
                            <button
                              className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                              onClick={() => handleGenerateInvite(sessionId, batchId)}
                              disabled={generatingInviteId === sessionId || !batchId}
                            >
                              {generatingInviteId === sessionId ? "Generating..." : "Generate Invite Link"}
                            </button>
                          </div>
                        </div>

                        {inviteLink && (
                          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-sm font-semibold text-green-800">Batch Invite Link</p>
                            <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-center">
                              <a
                                href={inviteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-sm text-emerald-700 underline"
                              >
                                {inviteLink}
                              </a>
                              <button
                                className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                                onClick={() => handleCopyInvite(inviteLink)}
                              >
                                Copy Link
                              </button>
                            </div>
                          </div>
                        )}

                        {isAttendanceOpen && (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                              Attendance Details
                            </h4>
                            {loadingAttendanceId === sessionId ? (
                              <Loader />
                            ) : (
                              <AttendancePanel rows={sessionAttendance} />
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No sessions created yet"
                  message="Use the form above to schedule your first session."
                />
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrainerDashboard;
