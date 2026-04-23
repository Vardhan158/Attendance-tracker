import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Loader from "../components/Loader";
import Error from "../components/Error";
import { createBatch, fetchInstitutionSummary } from "../services/apiMethods";
import { useAuth } from "../context/useAuth";
import API from "../services/api";
import { notifyError, notifySuccess } from "../utils/toast";

const getSummary = (summaryResponse) => summaryResponse?.data?.summary || summaryResponse?.summary || {};

const StatCard = ({ label, value, accent = "purple" }) => {
  const accentClasses = {
    purple: "border-slate-200 bg-white text-slate-700",
    green: "border-slate-200 bg-white text-slate-700",
    blue: "border-slate-200 bg-white text-slate-700",
    amber: "border-slate-200 bg-white text-slate-700"
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${accentClasses[accent]}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value ?? 0}</p>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
    {message}
  </div>
);

const CreateBatchPanel = ({
  trainers,
  form,
  onChange,
  onSubmit,
  creatingBatch
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Create Batch And Assign Trainer</h2>
      <p className="mt-1 text-sm text-gray-500">
        Create a batch under this institution and link it to a trainer so sessions can be scheduled right away.
      </p>
    </div>

    {trainers.length ? (
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Batch name"
          className="rounded-lg border border-slate-300 px-4 py-3"
          required
        />
        <select
          name="trainerId"
          value={form.trainerId}
          onChange={onChange}
          className="rounded-lg border border-slate-300 px-4 py-3"
          required
        >
          <option value="">Select trainer</option>
          {trainers.map((trainer) => (
            <option key={trainer._id || trainer.id} value={trainer._id || trainer.id}>
              {trainer.name || trainer.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 xl:col-span-2"
          disabled={creatingBatch}
        >
          {creatingBatch ? "Creating..." : "Create Batch"}
        </button>
      </form>
    ) : (
      <EmptyState message="Add trainer accounts under this institution first, then create and assign batches." />
    )}
  </section>
);

const BatchesPanel = ({ batches }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold">Batches</h2>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
        {batches.length} total
      </span>
    </div>
    {batches.length ? (
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Batch Name</th>
              <th className="px-4 py-3 font-semibold">Batch ID</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch._id || batch.id} className="border-t">
                <td className="px-4 py-3 font-medium">{batch.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{batch._id || batch.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState message="No batches found." />
    )}
  </section>
);

const TrainersPanel = ({ trainers }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold">Trainers</h2>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
        {trainers.length} total
      </span>
    </div>
    {trainers.length ? (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {trainers.map((trainer) => (
          <div key={trainer._id || trainer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold">{trainer.name || "Unnamed trainer"}</p>
            <p className="mt-1 text-sm text-gray-500">{trainer.email}</p>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState message="No trainers found." />
    )}
  </section>
);

const AttendanceSummaryPanel = ({ summary }) => {
  const batches = summary.batches || [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Attendance Summary</h2>
          <p className="text-sm text-gray-500">{summary.institutionName || "Institution"} performance overview</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {summary.attendancePercentage ?? 0}% attendance
        </span>
      </div>
      {batches.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Batch</th>
                <th className="px-4 py-3 font-semibold">Students</th>
                <th className="px-4 py-3 font-semibold">Sessions</th>
                <th className="px-4 py-3 font-semibold">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.batchId} className="border-t">
                  <td className="px-4 py-3 font-medium">{batch.batchName}</td>
                  <td className="px-4 py-3">{batch.totalStudents}</td>
                  <td className="px-4 py-3">{batch.totalSessions}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 rounded bg-gray-200">
                        <div
                          className="h-2 rounded bg-green-500"
                          style={{ width: `${Math.min(batch.attendancePercentage || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{batch.attendancePercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No attendance summary available yet." />
      )}
    </section>
  );
};

const InstitutionDashboard = ({ view = "dashboard" }) => {
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: "",
    trainerId: ""
  });
  const { user } = useAuth();
  const summaryData = getSummary(summary);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [batchesRes, trainersRes, summaryRes] = await Promise.all([
        API.get("/batches"),
        API.get("/batches/trainers"),
        fetchInstitutionSummary(user?.institutionId || user?.id || "me")
      ]);
      const nextBatches = batchesRes.data.batches || [];
      const nextTrainers = trainersRes.data.trainers || [];

      setBatches(nextBatches);
      setTrainers(nextTrainers);
      setSummary(summaryRes);
      setBatchForm((currentForm) => ({
        ...currentForm,
        trainerId: currentForm.trainerId || nextTrainers[0]?._id || nextTrainers[0]?.id || ""
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch institution data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, user?.institutionId]);

  const handleBatchFormChange = (event) => {
    setBatchForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value
    }));
  };

  const handleCreateBatch = async (event) => {
    event.preventDefault();
    setCreatingBatch(true);

    try {
      await createBatch(batchForm);
      notifySuccess("Batch created and assigned successfully");
      setBatchForm({
        name: "",
        trainerId: trainers[0]?._id || trainers[0]?.id || ""
      });
      await loadData();
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to create batch");
    } finally {
      setCreatingBatch(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Institution</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          {view === "batches" ? "Batches" : view === "trainers" ? "Trainers" : "Institution Dashboard"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage institution activity, assigned trainers, batches, and attendance health.
        </p>
      </div>
      {loading ? (
        <Loader />
      ) : error ? (
        <Error message={error} />
      ) : (
        <div className="space-y-6">
          {view === "dashboard" && (
            <CreateBatchPanel
              trainers={trainers}
              form={batchForm}
              onChange={handleBatchFormChange}
              onSubmit={handleCreateBatch}
              creatingBatch={creatingBatch}
            />
          )}
          {view === "dashboard" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Batches" value={summaryData.totalBatches ?? batches.length} />
              <StatCard label="Total Trainers" value={trainers.length} accent="blue" />
              <StatCard label="Total Students" value={summaryData.totalStudents} accent="amber" />
              <StatCard label="Attendance" value={`${summaryData.attendancePercentage ?? 0}%`} accent="green" />
            </div>
          )}
          {(view === "dashboard" || view === "batches") && (
            <BatchesPanel batches={batches} />
          )}
          {(view === "dashboard" || view === "trainers") && (
            <TrainersPanel trainers={trainers} />
          )}
          {view === "dashboard" && (
            <AttendanceSummaryPanel summary={summaryData} />
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstitutionDashboard;
