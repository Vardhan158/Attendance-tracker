import API from "../services/api";

export const fetchSessions = async () => {
  const res = await API.get("/sessions");
  return res.data;
};

export const markAttendance = async (sessionId, status = "present") => {
  const res = await API.post(`/attendance/mark`, { sessionId, status });
  return res.data;
};

export const fetchTrainerSessions = async () => {
  const res = await API.get("/sessions");
  return res.data;
};

export const createSession = async (data) => {
  const res = await API.post("/sessions", data);
  return res.data;
};

export const fetchBatches = async () => {
  const res = await API.get("/batches");
  return res.data;
};

export const createBatch = async (data) => {
  const res = await API.post("/batches", data);
  return res.data;
};

export const assignBatchStudents = async (batchId, emails) => {
  const res = await API.post(`/batches/${batchId}/students`, { emails });
  return res.data;
};

export const fetchBatchStudents = async (batchId) => {
  const res = await API.get(`/batches/${batchId}/students`);
  return res.data;
};

export const fetchSessionAttendance = async (sessionId) => {
  const res = await API.get(`/sessions/${sessionId}/attendance`);
  return res.data;
};

export const generateInvite = async (batchId) => {
  const res = await API.post(`/batches/${batchId}/invite`);
  return res.data;
};

export const joinBatch = async (batchId, token) => {
  const res = await API.post(`/batches/${batchId}/join`, { token });
  return res.data;
};

export const fetchBatchSummary = async (batchId) => {
  const res = await API.get(`/batches/${batchId}/summary`);
  return res.data;
};

export const fetchInstitutionSummary = async (institutionId) => {
  const res = await API.get(`/institutions/${institutionId}/summary`);
  return res.data;
};

export const fetchInstitutions = async () => {
  const res = await API.get("/batches/institutions");
  return res.data;
};

export const fetchProgrammeSummary = async () => {
  const res = await API.get(`/programme/summary`);
  return res.data;
};
