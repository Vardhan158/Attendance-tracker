import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import MonitorDashboard from "./pages/MonitorDashboard";
import JoinBatch from "./pages/JoinBatch";
import ToastContainer from "./components/ToastContainer";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={2000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/join-batch/:batchId" element={<JoinBatch />} />

          {/* Student */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
          </Route>

          {/* Trainer */}
          <Route element={<ProtectedRoute allowedRoles={["trainer"]} />}>
            <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
            <Route path="/trainer/sessions" element={<TrainerDashboard view="sessions" />} />
          </Route>

          {/* Institution */}
          <Route element={<ProtectedRoute allowedRoles={["institution"]} />}>
            <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
            <Route path="/institution/batches" element={<InstitutionDashboard view="batches" />} />
            <Route path="/institution/trainers" element={<InstitutionDashboard view="trainers" />} />
          </Route>

          {/* Programme Manager */}
          <Route element={<ProtectedRoute allowedRoles={["programme_manager"]} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/summary" element={<ManagerDashboard />} />
          </Route>

          {/* Monitoring Officer */}
          <Route element={<ProtectedRoute allowedRoles={["monitoring_officer"]} />}>
            <Route path="/monitor/dashboard" element={<MonitorDashboard />} />
          </Route>

          {/* Default */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
