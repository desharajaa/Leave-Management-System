import { useState } from "react";
import { CalendarDays, LockKeyhole, Mail, UserRound } from "lucide-react";
import api from "../api";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("employee");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); }
  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const payload = mode === "register" ? form : { email: form.email, password: form.password, role };
      const { data } = await api.post(endpoint, payload);
      onLogin(data);
    } catch (err) { setError(err.response?.data?.message || "Unable to connect. Check that the backend is running."); }
    finally { setLoading(false); }
  }

  return <div className="auth-page">
    <div className="auth-brand"><div className="brand-icon"><CalendarDays size={22}/></div><b>LeaveFlow</b></div>
    <div className="auth-layout">
      <section className="auth-intro"><span className="eyebrow">LEAVE MANAGEMENT, SIMPLIFIED</span><h1>Time off, made<br/><span>easy.</span></h1><p>A clear and simple place to request leave, track your balance, and keep your team in sync.</p><div className="intro-points"><div><span className="point-check">✓</span> Apply for leave in minutes</div><div><span className="point-check">✓</span> Track approvals in real time</div><div><span className="point-check">✓</span> Know your leave balance</div></div><div className="intro-decoration"><div className="deco-card"><div className="deco-dot"></div><div><b>Your time matters</b><small>Plan your days with confidence</small></div><CalendarDays size={25}/></div></div></section>
      <section className="auth-card">
        <div className="auth-card-head"><div className="mini-icon"><LockKeyhole size={19}/></div><h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p>{mode === "login" ? "Enter your details to access your portal." : "Register as an employee to get started."}</p></div>
        {mode === "login" && <div className="role-switch"><button className={role === "employee" ? "selected" : ""} onClick={() => setRole("employee")} type="button">Employee</button><button className={role === "manager" ? "selected" : ""} onClick={() => setRole("manager")} type="button">Manager</button></div>}
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && <label>Full name<div className="input-wrap"><UserRound size={17}/><input name="name" placeholder="Your full name" value={form.name} onChange={change} required/></div></label>}
          <label>Email address<div className="input-wrap"><Mail size={17}/><input name="email" type="email" placeholder="you@company.com" value={form.email} onChange={change} required/></div></label>
          <label>Password<div className="input-wrap"><LockKeyhole size={17}/><input name="password" type="password" placeholder="Enter your password" value={form.password} onChange={change} minLength={6} required/></div></label>
          {error && <div className="alert error">{error}</div>}
          <button className="primary-btn full" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"} <span>→</span></button>
        </form>
        <div className="auth-footer">{mode === "login" ? <>New employee? <button onClick={() => {setMode("register");setRole("employee");setError("");}}>Create an account</button></> : <>Already registered? <button onClick={() => {setMode("login");setError("");}}>Sign in</button></>}</div>
        {mode === "login" && <p className="manager-note">Manager accounts are created by the system administrator.</p>}
      </section>
    </div>
    <div className="auth-copyright">© {new Date().getFullYear()} LeaveFlow · Leave management portal</div>
  </div>;
}
