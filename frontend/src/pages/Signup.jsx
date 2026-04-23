import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/useAuth";
import { getDashboardPath } from "../utils/routes";
import { clearPendingInvite, getInvitePath, getPendingInvite } from "../utils/invite";
import { getRequestErrorMessage } from "../utils/apiErrors";

const roles = [
  "student",
  "trainer",
  "institution",
  "programme_manager",
  "monitoring_officer"
];

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: roles[0],
    institutionId: ""
  });
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const loadInstitutions = async () => {
      setLoadingInstitutions(true);

      try {
        const res = await API.get("/auth/institutions");
        setInstitutions(res.data.institutions || []);
      } catch {
        setInstitutions([]);
      } finally {
        setLoadingInstitutions(false);
      }
    };

    loadInstitutions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [name]: value
      };

      if (name === "role" && value !== "trainer") {
        nextForm.institutionId = "";
      }

      return nextForm;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload =
        form.role === "trainer"
          ? form
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role
            };

      const res = await API.post("/auth/signup", payload);
      login(res.data.token, res.data.user);
      const pendingInvite = getPendingInvite();
      const isStudentInviteSignup = pendingInvite && res.data.user.role === "student";

      if (pendingInvite && !isStudentInviteSignup) {
        clearPendingInvite();
      }

      const nextPath = isStudentInviteSignup ? getInvitePath(pendingInvite) : getDashboardPath(res.data.user.role);

      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(getRequestErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  const requiresInstitution = form.role === "trainer";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-purple-700">Sign Up</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role.replace("_", " ")}
            </option>
          ))}
        </select>

        {requiresInstitution && (
          <>
            <select
              name="institutionId"
              value={form.institutionId}
              onChange={handleChange}
              className="w-full mb-2 p-2 border rounded"
              required
              disabled={loadingInstitutions}
            >
              <option value="">
                {loadingInstitutions ? "Loading institutions..." : "Select institution"}
              </option>
              {institutions.map((institution) => (
                <option key={institution._id} value={institution._id}>
                  {institution.name || institution.email}
                </option>
              ))}
            </select>
            <p className="mb-4 text-sm text-gray-500">
              Trainers must be linked to an institution so their batches and attendance appear on the institution dashboard.
            </p>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={loading || (requiresInstitution && !form.institutionId)}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <div className="mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-600 hover:underline">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
