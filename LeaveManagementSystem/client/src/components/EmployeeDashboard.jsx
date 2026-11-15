import { useEffect, useState } from "react";
import { CalendarDays, Clock3, FilePlus2, CheckCircle2, XCircle, Hourglass, RefreshCw } from "lucide-react";
import api from "../api";

const fmt = (value) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const statusClass = (s) => s.toLowerCase();

export default function EmployeeDashboard({ user }) {
  const [balance, setBalance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ leaveType: "Casual Leave", startDate: "", endDate: "", reason: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const [b, l] = await Promise.all([api.get("/leaves/balance"), api.get("/leaves/mine")]);
      setBalance(b.data); setLeaves(l.data);
    } catch (e) { setError(e.response?.data?.message || "Could not load dashboard"); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const { data } = await api.post("/leaves", form);
      setMessage(data.message);
      setForm({ leaveType: "Casual Leave", startDate: "", endDate: "", reason: "" });
      await load();
    } catch (e) { setError(e.response?.data?.message || "Could not submit request"); }
    finally { setLoading(false); }
  }

  const pending = leaves.filter(x => x.status === "Pending").length;
  const approved = leaves.filter(x => x.status === "Approved").length;
  const rejected = leaves.filter(x => x.status === "Rejected").length;

  return <div className="page-content">
    <div className="page-heading"><div><span className="eyebrow">EMPLOYEE WORKSPACE</span><h1>Good day, {user.name.split(" ")[0]} 👋</h1><p>Manage your time off and keep track of your requests.</p></div><button className="outline-btn" onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon purple"><CalendarDays/></div><div><span>Casual leave available</span><strong>{balance ? balance.casual.available : "—"} <small>days</small></strong><em>{balance ? `${balance.casual.used} of ${balance.casual.total} used` : "Loading balance"}</em></div></div>
      <div className="stat-card"><div className="stat-icon blue"><CalendarDays/></div><div><span>Medical leave available</span><strong>{balance ? balance.medical.available : "—"} <small>days</small></strong><em>{balance ? `${balance.medical.used} of ${balance.medical.total} used` : "Loading balance"}</em></div></div>
      <div className="stat-card"><div className="stat-icon amber"><Hourglass/></div><div><span>Pending requests</span><strong>{pending}</strong><em>Awaiting manager review</em></div></div>
      <div className="stat-card"><div className="stat-icon green"><CheckCircle2/></div><div><span>Approved requests</span><strong>{approved}</strong><em>{rejected} rejected request(s)</em></div></div>
    </div>
    <div className="content-grid">
      <section className="panel apply-panel"><div className="panel-heading"><div><div className="panel-icon"><FilePlus2 size={18}/></div><h2>Apply for leave</h2><p>Fill in the details below to submit a request.</p></div></div>
        {message && <div className="alert success">{message}</div>}{error && <div className="alert error">{error}</div>}
        <form className="leave-form" onSubmit={submit}>
          <label>Leave type<select value={form.leaveType} onChange={e => setForm({...form, leaveType:e.target.value})}><option>Casual Leave</option><option>Medical Leave</option></select></label>
          <div className="form-row"><label>From date<input type="date" min={new Date().toISOString().slice(0,10)} value={form.startDate} onChange={e => setForm({...form,startDate:e.target.value})} required/></label><label>To date<input type="date" min={form.startDate || new Date().toISOString().slice(0,10)} value={form.endDate} onChange={e => setForm({...form,endDate:e.target.value})} required/></label></div>
          <label>Reason for leave<textarea rows="4" placeholder="Briefly explain why you need leave..." value={form.reason} onChange={e => setForm({...form,reason:e.target.value})} required/></label>
          <button className="primary-btn full" disabled={loading}>{loading ? "Submitting..." : "Submit leave request"} <span>→</span></button>
        </form>
        <p className="form-hint">Leave days are counted as calendar days, including weekends.</p>
      </section>
      <section className="panel history-panel"><div className="panel-heading inline-heading"><div><h2>My leave requests</h2><p>Track the status of all your applications.</p></div><span className="count-pill">{leaves.length} total</span></div>
        {leaves.length === 0 ? <div className="empty-state"><div className="empty-icon"><CalendarDays/></div><b>No leave requests yet</b><span>Your submitted requests will appear here.</span></div> :
          <div className="request-list">{leaves.map(leave => <article className="request-item" key={leave._id}><div className="request-top"><div><b>{leave.leaveType}</b><small>{fmt(leave.startDate)} – {fmt(leave.endDate)} · {leave.days} day(s)</small></div><span className={`status ${statusClass(leave.status)}`}>{leave.status}</span></div><p className="request-reason">{leave.reason}</p>{leave.status !== "Pending" && <div className={`manager-response ${leave.status === "Rejected" ? "rejected-response" : ""}`}><b>Manager {leave.status === "Approved" ? "response" : "rejection reason"}</b><span>{leave.managerComment || (leave.status === "Approved" ? "Your leave request has been approved." : "No reason provided.")}</span></div>}<small className="applied-date">Applied on {fmt(leave.createdAt)}</small></article>)}</div>}
      </section>
    </div>
  </div>;
}
