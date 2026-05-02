import axios from "axios";

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

export default publicClient;