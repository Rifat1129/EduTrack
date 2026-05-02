import axios from "axios";

const client = axios.create({
  // VITE_API_URL লাইভ সার্ভারে বসাবো, লোকালপিসিতে localhost কাজ করবে
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;