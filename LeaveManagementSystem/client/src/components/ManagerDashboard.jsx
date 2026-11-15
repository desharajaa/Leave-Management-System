import { useEffect, useMemo, useState } from "react";
import { Check, X, Users, Hourglass, CheckCircle2, XCircle, RefreshCw, ClipboardList } from "lucide-react";
import api from "../api";

const fmt = (value) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function ManagerDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    try { const { data } = await api.get("/leaves/all"); setLeaves(data); setError(""); }
    catch (e) { setError(e.response?.data?.message || "Could not load requests"); }
  }
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(x => x.status === "Pending").length,
    approved: leaves.filter(x => x.status === "Approved").length,
    rejected: leaves.filter(x => x.status === "Rejected").length
  }), [leaves]);
  const visible = filter === "All" ? leaves : leaves.filter(x => x.status === filter);

  async function review(id, status, managerComment = "") {
    setBusy(id); setError(""); setSuccess("");
    try {
      const { data } = await api.patch(`/leaves/${id}/review`, { status, managerComment });
      setSuccess(data.message); setRejecting(null); setComment(""); await load();
    } catch (e) { setError(e.response?.data?.message || "Could not update request"); }
    finally { setBusy(""); }
  }

  return <div className="page-content">
    <div className="page-heading"><div><span className="eyebrow">MANAGER WORKSPACE</span><h1>Leave requests overview</h1><p>Review employee applications and manage leave decisions.</p></div><button className="outline-btn" onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    <div className="stats-grid manager-stats">
      <div className="stat-card"><div className="stat-icon purple"><Users/></div><div><span>Total requests</span><strong>{counts.total}</strong><em>All employee applications</em></div></div>
      <div className="stat-card"><div className="stat-icon amber"><Hourglass/></div><div><span>Pending review</span><strong>{counts.pending}</strong><em>Needs your attention</em></div></div>
      <div className="stat-card"><div className="stat-icon green"><CheckCircle2/></div><div><span>Approved</span><strong>{counts.approved}</strong><em>Accepted applications</em></div></div>
      <div className="stat-card"><div className="stat-icon red"><XCircle/></div><div><span>Rejected</span><strong>{counts.rejected}</strong><em>Declined applications</em></div></div>
    </div>
    <section className="panel manager-requests"><div className="panel-heading inline-heading"><div><h2>Employee leave applications</h2><p>Review each request and take action on pending applications.</p></div><span className="count-pill">{visible.length} requests</span></div>
      {error && <div className="alert error">{error}</div>}{success && <div className="alert success">{success}</div>}
      <div className="filter-tabs">{["All","Pending","Approved","Rejected"].map(s => <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s}{s === "Pending" && counts.pending > 0 ? ` (${counts.pending})` : ""}</button>)}</div>
      {visible.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardList/></div><b>No {filter.toLowerCase()} requests</b><span>New employee applications will appear here.</span></div> :
      <div className="manager-list">{visible.map(leave => <article className="manager-item" key={leave._id}>
        <div className="manager-item-main"><div className="employee-avatar">{leave.employee?.name?.charAt(0).toUpperCase() || "E"}</div><div className="employee-details"><div className="employee-title"><b>{leave.employee?.name || "Employee"}</b><span className={`status ${leave.status.toLowerCase()}`}>{leave.status}</span></div><small>{leave.employee?.email}</small><div className="leave-meta"><span>{leave.leaveType}</span><span>{fmt(leave.startDate)} – {fmt(leave.endDate)}</span><span>{leave.days} day(s)</span></div><p className="request-reason"><b>Reason:</b> {leave.reason}</p>{leave.status !== "Pending" && <div className="manager-response"><b>Manager comment</b><span>{leave.managerComment || "—"}</span></div>}<small className="applied-date">Applied on {fmt(leave.createdAt)}</small></div></div>
        {leave.status === "Pending" && <div className="review-actions">{rejecting === leave._id ? <div className="reject-box"><label>Reason for rejection<textarea rows="2" placeholder="Enter a reason (required)" value={comment} onChange={e => setComment(e.target.value)}/></label><div><button className="reject-btn" disabled={!comment.trim() || busy === leave._id} onClick={() => review(leave._id,"Rejected",comment)}><X size={15}/> Confirm reject</button><button className="cancel-btn" onClick={() => {setRejecting(null);setComment("");}}>Cancel</button></div></div> : <><button className="approve-btn" disabled={busy === leave._id} onClick={() => review(leave._id,"Approved")}><Check size={16}/> Approve</button><button className="reject-btn" disabled={busy === leave._id} onClick={() => {setRejecting(leave._id);setComment("");}}><X size={16}/> Reject</button></>}</div>}
      </article>)}</div>}
    </section>
  </div>;
}
