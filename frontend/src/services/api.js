import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const baseURL = configuredBaseUrl.replace(/\/+$/, "");

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default API;
