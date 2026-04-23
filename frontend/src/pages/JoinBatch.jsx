import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { joinBatch } from "../services/apiMethods";
import { useAuth } from "../context/useAuth";
import { clearPendingInvite, savePendingInvite } from "../utils/invite";

const JoinBatch = () => {
  const { batchId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const inviteToken = searchParams.get("token");
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Checking invite...");

  useEffect(() => {
    const acceptInvite = async () => {
      if (!batchId || !inviteToken) {
        setStatus("error");
        setMessage("This invite link is missing required information.");
        return;
      }

      if (!authToken) {
        savePendingInvite({ batchId, token: inviteToken });
        setStatus("login_required");
        setMessage("Login or sign up as a student to join this batch.");
        return;
      }

      if (user?.role !== "student") {
        clearPendingInvite();
        setStatus("error");
        setMessage("Only students can use batch invite links.");
        return;
      }

      try {
        await joinBatch(batchId, inviteToken);
        clearPendingInvite();
        setStatus("success");
        setMessage("You joined the batch successfully.");
        setTimeout(() => navigate("/student/dashboard", { replace: true }), 900);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Failed to join batch.");
      }
    };

    acceptInvite();
  }, [authToken, batchId, inviteToken, navigate, user?.role]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <p className="text-sm font-medium uppercase tracking-wide text-purple-700">SkillBridge Invite</p>
        <h1 className="mt-2 text-2xl font-bold">Join Batch</h1>
        <p className="mt-3 text-gray-600">{message}</p>

        {status === "checking" && (
          <div className="mt-6 h-2 overflow-hidden rounded bg-purple-100">
            <div className="h-full w-1/2 animate-pulse rounded bg-purple-600" />
          </div>
        )}

        {status === "login_required" && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700" to="/login">
              Login
            </Link>
            <Link className="rounded border border-purple-200 px-4 py-2 text-purple-700 hover:bg-purple-50" to="/signup">
              Sign Up
            </Link>
          </div>
        )}

        {status === "success" && (
          <Link className="mt-6 inline-block rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700" to="/student/dashboard">
            Go to Dashboard
          </Link>
        )}

        {status === "error" && (
          <Link className="mt-6 inline-block rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700" to="/login">
            Back to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default JoinBatch;
