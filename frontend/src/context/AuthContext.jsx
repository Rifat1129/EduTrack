import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";
import publicClient from "../api/publicClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await client.get("/me"); // GET /api/me
      setUser(res.data);
    } catch (e) {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(email, password) {
    const res = await publicClient.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(payload) {
    // payload: {full_name,email,password,role,university_id?}
    const res = await publicClient.post("/auth/register", payload);
    return res.data;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, reload: loadMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);