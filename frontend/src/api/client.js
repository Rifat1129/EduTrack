import axios from "axios";

const client = axios.create({
  // baseURL: "/api", // এটা মুছে দাও
  baseURL: "https://edutrack-z7gs.onrender.com/api", // ✅ এটা বসাও
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;