import axios from "axios";

const publicClient = axios.create({
  // baseURL: "", // এটা মুছে দাও
  baseURL: "https://edutrack-z7gs.onrender.com", // ✅ এটা বসাও
});

export default publicClient;