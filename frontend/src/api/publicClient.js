import axios from "axios";

const publicClient = axios.create({
  baseURL: "https://edutrack-z7gs.onrender.com",
});

export default publicClient;