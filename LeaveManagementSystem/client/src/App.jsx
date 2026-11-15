import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { CalendarDays, ClipboardList, LogOut, ShieldCheck } from "lucide-react";
import api from "./api";
import AuthPage from "./components/AuthPage";
import EmployeeDashboard from "./components/EmployeeDashboard";
import ManagerDashboard from "./components/ManagerDashboard";

function Protected({ user, role, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "manager" ? "/manager" : "/employee"} replace />;
  return children;
}

function Layout({ user, onLogout, children }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><CalendarDays size={21}/></div><div><b>LeaveFlow</b><small>People operations</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <div className="side-link active"><ClipboardList size={18}/>{user.role === "manager" ? "Manager overview" : "My leave portal"}</div>
      <div className="side-bottom"><div className="profile"><div className="avatar">{user.name?.charAt(0).toUpperCase()}</div><div className="profile-info"><b>{user.name}</b><small>{user.role}</small></div></div><button className="logout" onClick={onLogout}><LogOut size={17}/> Sign out</button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="mobile-brand">LeaveFlow</div><div className="topbar-right"><span className="secure"><ShieldCheck size={15}/> Secure workspace</span><span className="top-user">{user.name}</span></div></header>{children}</main>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leave_user")); } catch { return null; }
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("leave_token")) { setUser(null); return; }
    api.get("/auth/me").then(({ data }) => {
      setUser(data.user); localStorage.setItem("leave_user", JSON.stringify(data.user));
    }).catch(() => { localStorage.clear(); setUser(null); });
  }, []);

  function login(data) {
    localStorage.setItem("leave_token", data.token);
    localStorage.setItem("leave_user", JSON.stringify(data.user));
    setUser(data.user);
    navigate(data.user.role === "manager" ? "/manager" : "/employee");
  }
  function logout() {
    localStorage.removeItem("leave_token"); localStorage.removeItem("leave_user");
    setUser(null); navigate("/login");
  }

  return <Routes>
    <Route path="/login" element={user ? <Navigate to={user.role === "manager" ? "/manager" : "/employee"}/> : <AuthPage onLogin={login}/>}/>
    <Route path="/employee" element={<Protected user={user} role="employee"><Layout user={user} onLogout={logout}><EmployeeDashboard user={user}/></Layout></Protected>}/>
    <Route path="/manager" element={<Protected user={user} role="manager"><Layout user={user} onLogout={logout}><ManagerDashboard/></Layout></Protected>}/>
    <Route path="*" element={<Navigate to={user ? (user.role === "manager" ? "/manager" : "/employee") : "/login"} replace/>}/>
  </Routes>;
}
