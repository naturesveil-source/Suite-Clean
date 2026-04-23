import { useState, useEffect, useRef } from "react";

const SEED_STAFF = [
  { id: 1, name: "Maria G.", role: "Lead Cleaner", color: "#c9a96e", avatar: "MG", phone: "555-0101" },
  { id: 2, name: "Janelle T.", role: "Cleaner", color: "#7eb8b0", avatar: "JT", phone: "555-0102" },
  { id: 3, name: "Devon R.", role: "Cleaner", color: "#b07eb8", avatar: "DR", phone: "555-0103" },
  { id: 4, name: "Sasha L.", role: "Part-Time", color: "#7e9bb8", avatar: "SL", phone: "555-0104" },
];

const TASK_TEMPLATES = [
  { id: 1, name: "Vacuum Suite Floors", area: "Suites", estimatedMin: 8, priority: "high" },
  { id: 2, name: "Mop Hallways", area: "Common", estimatedMin: 12, priority: "high" },
  { id: 3, name: "Clean Restrooms", area: "Restrooms", estimatedMin: 20, priority: "high" },
  { id: 4, name: "Wipe Down Mirrors", area: "Suites", estimatedMin: 5, priority: "medium" },
  { id: 5, name: "Empty All Trash Cans", area: "Common", estimatedMin: 15, priority: "high" },
  { id: 6, name: "Sanitize Door Handles", area: "Common", estimatedMin: 6, priority: "medium" },
  { id: 7, name: "Clean Reception Desk", area: "Reception", estimatedMin: 10, priority: "medium" },
  { id: 8, name: "Restock Supplies", area: "Storage", estimatedMin: 8, priority: "low" },
  { id: 9, name: "Sweep Entrance", area: "Common", estimatedMin: 5, priority: "medium" },
  { id: 10, name: "Wipe Suite Counters", area: "Suites", estimatedMin: 10, priority: "medium" },
  { id: 11, name: "Disinfect Shampoo Bowls", area: "Suites", estimatedMin: 12, priority: "high" },
  { id: 12, name: "Clean Break Room", area: "Common", estimatedMin: 10, priority: "low" },
];

const SEED_SUPPLIES = [
  { id: 1, name: "All-Purpose Cleaner", unit: "bottles", min: 3, quantity: 5 },
  { id: 2, name: "Disinfectant Spray", unit: "cans", min: 2, quantity: 2 },
  { id: 3, name: "Glass Cleaner", unit: "bottles", min: 2, quantity: 4 },
  { id: 4, name: "Floor Cleaner", unit: "gallons", min: 1, quantity: 1 },
  { id: 5, name: "Paper Towels", unit: "rolls", min: 10, quantity: 7 },
  { id: 6, name: "Trash Bags (Large)", unit: "bags", min: 20, quantity: 25 },
  { id: 7, name: "Trash Bags (Small)", unit: "bags", min: 30, quantity: 18 },
  { id: 8, name: "Microfiber Cloths", unit: "cloths", min: 8, quantity: 10 },
  { id: 9, name: "Mop Heads", unit: "heads", min: 2, quantity: 3 },
  { id: 10, name: "Latex Gloves (pairs)", unit: "pairs", min: 15, quantity: 12 },
];

const AREA_COLORS = {
  Suites: "#c9a96e", Common: "#7eb8b0", Restrooms: "#b07eb8",
  Reception: "#7e9bb8", Storage: "#b89e7e",
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const SHIFTS = ["Morning (6am–12pm)","Afternoon (12pm–6pm)","Evening (6pm–10pm)"];
const SHIFT_SHORT = ["Morning","Afternoon","Evening"];
const SHIFT_ICONS = ["☀","⛅","🌙"];

const getWeekDates = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - d.getDay() + i); return d;
});

const dateKey = (d) => d.toISOString().slice(0, 10);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const STAFF_COLORS = ["#c9a96e","#7eb8b0","#b07eb8","#7e9bb8","#b89e7e","#c07878","#7eb87e"];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [staff, setStaff] = useState(SEED_STAFF);
  const [supplies, setSupplies] = useState(SEED_SUPPLIES);
  const [tasks, setTasks] = useState(
    TASK_TEMPLATES.map((t) => ({ ...t, status: "pending", assigneeId: null, elapsed: 0, running: false, startTime: null, notes: "" }))
  );
  const [shifts, setShifts] = useState({});
  const [availability, setAvailability] = useState({});
  const [log, setLog] = useState([]);
  const [staffModal, setStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", role: "", phone: "" });
  const [addSupplyOpen, setAddSupplyOpen] = useState(false);
  const [newSupply, setNewSupply] = useState({ name: "", unit: "", quantity: "", min: "" });
  const [clFilter, setClFilter] = useState("all");
  const [availStaffId, setAvailStaffId] = useState(null);
  const weekDates = getWeekDates();

  useEffect(() => {
    const iv = setInterval(() => {
      setTasks((p) => p.map((t) => t.running ? { ...t, elapsed: Math.floor((Date.now() - t.startTime) / 1000) } : t));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const addLog = (msg) => setLog((p) => [{ msg, time: new Date().toLocaleTimeString() }, ...p.slice(0, 99)]);

  const startTask = (id) => {
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: "in-progress", running: true, startTime: Date.now() - t.elapsed * 1000 } : t));
    const t = tasks.find((t) => t.id === id);
    const a = staff.find(s => s.id === t.assigneeId);
    addLog(`▶ Started: ${t.name}${a ? " · " + a.name : ""}`);
  };
  const pauseTask = (id) => setTasks((p) => p.map((t) => t.id === id ? { ...t, running: false } : t));
  const resumeTask = (id) => setTasks((p) => p.map((t) => t.id === id ? { ...t, running: true, startTime: Date.now() - t.elapsed * 1000 } : t));
  const completeTask = (id) => {
    const t = tasks.find((t) => t.id === id);
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: "done", running: false } : t));
    addLog(`✓ Done: ${t.name} (${fmt(t.elapsed)})`);
  };
  const resetTask = (id) => setTasks((p) => p.map((t) => t.id === id ? { ...t, status: "pending", running: false, elapsed: 0, startTime: null } : t));
  const assignTask = (id, staffId) => setTasks((p) => p.map((t) => t.id === id ? { ...t, assigneeId: staffId ? +staffId : null } : t));
  const setNote = (id, notes) => setTasks((p) => p.map((t) => t.id === id ? { ...t, notes } : t));

  const updateSupply = (id, delta) => {
    const s = supplies.find(s => s.id === id);
    setSupplies((p) => p.map((s) => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s));
    addLog(`${delta > 0 ? "+" : ""}${delta} ${s.name}`);
  };
  const addSupply = () => {
    if (!newSupply.name) return;
    const item = { id: Date.now(), name: newSupply.name, unit: newSupply.unit, quantity: +newSupply.quantity || 0, min: +newSupply.min || 0 };
    setSupplies((p) => [...p, item]);
    setNewSupply({ name: "", unit: "", quantity: "", min: "" });
    setAddSupplyOpen(false);
    addLog(`Added supply: ${item.name}`);
  };

  const addStaff = () => {
    if (!newStaff.name) return;
    const initials = newStaff.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const s = { id: Date.now(), name: newStaff.name, role: newStaff.role || "Cleaner", phone: newStaff.phone, color: STAFF_COLORS[staff.length % STAFF_COLORS.length], avatar: initials };
    setStaff((p) => [...p, s]);
    setNewStaff({ name: "", role: "", phone: "" });
    setStaffModal(false);
    addLog(`Added staff: ${s.name}`);
  };
  const removeStaff = (id) => {
    setStaff((p) => p.filter(s => s.id !== id));
    setTasks((p) => p.map(t => t.assigneeId === id ? { ...t, assigneeId: null } : t));
  };

  const toggleShift = (dateStr, staffId, shiftIdx) => {
    setShifts((p) => {
      const day = { ...(p[dateStr] || {}) };
      if (day[staffId] === shiftIdx) delete day[staffId]; else day[staffId] = shiftIdx;
      return { ...p, [dateStr]: day };
    });
    const s = staff.find(s => s.id === staffId);
    addLog(`Shift: ${s.name} · ${SHIFTS[shiftIdx]} on ${dateStr}`);
  };
  const getShift = (dateStr, staffId) => shifts[dateStr]?.[staffId] ?? null;

  const toggleAvail = (staffId, dateStr, shift) => {
    setAvailability((p) => {
      const sa = { ...(p[staffId] || {}) };
      const ds = sa[dateStr] ? [...sa[dateStr]] : [];
      const idx = ds.indexOf(shift);
      if (idx >= 0) ds.splice(idx, 1); else ds.push(shift);
      sa[dateStr] = ds;
      return { ...p, [staffId]: sa };
    });
    const s = staff.find(s => s.id === staffId);
    addLog(`Availability: ${s.name} · ${shift} on ${dateStr}`);
  };
  const isAvail = (staffId, dateStr, shift) => availability[staffId]?.[dateStr]?.includes(shift) || false;

  const doneTasks = tasks.filter(t => t.status === "done").length;
  const activeTasks = tasks.filter(t => t.status === "in-progress");
  const lowSupplies = supplies.filter(s => s.quantity <= s.min);
  const totalTime = tasks.reduce((a, t) => a + t.elapsed, 0);
  const filteredTasks = clFilter === "all" ? tasks : tasks.filter(t => t.status === clFilter);
  const todayKey = dateKey(new Date());

  const VIEWS = ["dashboard","checklist","schedule","availability","supplies","staff","log"];

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", background: "#f8f7f5", minHeight: "100vh", color: "#1a1814" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Cormorant+Garamond:wght@600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#f0ede8}
        ::-webkit-scrollbar-thumb{background:#c8c4bc;border-radius:2px}
        button{cursor:pointer;border:none;font-family:inherit}
        input,select,textarea{font-family:inherit}
        .nav{background:none;color:#6a6458;font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:7px 13px;border-radius:3px;transition:all .2s;border:1px solid transparent}
        .nav:hover{color:#1a1814;background:#e8e4dc}
        .nav.on{color:#a07840;background:#fdf8f0;border-color:#c9a96e}
        .card{background:#ffffff;border:1px solid #ddd8cc;border-radius:6px}
        .inp{background:#f8f7f5;border:1px solid #ccc8be;border-radius:4px;padding:7px 10px;color:#ede5d5;font-size:12px;outline:none;transition:border .2s;width:100%}
        .inp:focus{border-color:#c9a96e55}
        .sel{background:#f8f7f5;border:1px solid #ccc8be;border-radius:4px;padding:5px 7px;color:#ede5d5;font-size:11px;outline:none}
        .btn{font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:5px 12px;border-radius:3px;transition:all .15s;cursor:pointer}
        .bg{background:#fdf3e3;color:#a07840;border:1px solid #c9a96e}.bg:hover{background:#352a1a}
        .bt{background:#e8f5f4;color:#3a9890;border:1px solid #7eb8b0}.bt:hover{background:#1e2e2a}
        .bb{background:#e8eef5;color:#3a6898;border:1px solid #7e9bb8}.bb:hover{background:#1e2a38}
        .br{background:#fceaea;color:#c05858;border:1px solid #e07878}.br:hover{background:#32201e}
        .row{padding:11px 16px;border-bottom:1px solid #e8e4dc;transition:background .15s}
        .row:last-child{border-bottom:none}
        .row:hover{background:#f8f5f0}
        .pulse{animation:pulse 1.8s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;display:inline-block}
        .av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;flex-shrink:0}
        .chk{width:18px;height:18px;border-radius:3px;border:1px solid #ccc8be;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s}
        .chip{font-size:9px;padding:3px 9px;border-radius:3px;cursor:pointer;transition:all .15s;letter-spacing:.07em;border:1px solid transparent}
        .scell{width:28px;height:28px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .15s;flex-shrink:0}
        .overlay{position:fixed;inset:0;background:#00000060;display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(2px)}
        .modal{background:#ffffff;border:1px solid #ddd8cc;border-radius:8px;padding:26px;width:90%;max-width:420px}
      `}</style>

      <div style={{ borderBottom: "1px solid #e0dcd4", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#c9a96e", letterSpacing: ".06em" }}>Suite Clean</div>
          <div style={{ fontSize: 9, color: "#7a7468", letterSpacing: ".18em", textTransform: "uppercase", marginTop: 1 }}>Salon Suites · Operations Manager</div>
        </div>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {VIEWS.map((v) => <button key={v} className={`nav ${view === v ? "on" : ""}`} onClick={() => setView(v)}>{v}</button>)}
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 980, margin: "0 auto" }}>

        {view === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { l: "Tasks Done", v: `${doneTasks}/${tasks.length}`, c: "#7eb8b0" },
                { l: "Active Now", v: activeTasks.length, c: "#c9a96e" },
                { l: "Time Logged", v: fmt(totalTime), c: "#7e9bb8" },
                { l: "Low Supplies", v: lowSupplies.length, c: lowSupplies.length ? "#c07878" : "#7eb8a0" },
              ].map(({ l, v, c }) => (
                <div key={l} className="card" style={{ padding: "14px 18px" }}>
                  <div style={{ fontSize: 9, color: "#6a6458", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
                  <div style={{ fontSize: 26, color: c, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: "14px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#6a6458", marginBottom: 8, letterSpacing: ".1em" }}>
                <span>DAILY PROGRESS</span><span style={{ color: "#c9a96e" }}>{Math.round(doneTasks / tasks.length * 100)}%</span>
              </div>
              <div style={{ height: 4, background: "#222018", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${doneTasks / tasks.length * 100}%`, background: "linear-gradient(90deg,#c9a96e,#7eb8b0)", borderRadius: 2, transition: "width .6s" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card" style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 9, color: "#6a6458", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 12 }}>Active Tasks</div>
                {activeTasks.length === 0
                  ? <div style={{ fontSize: 11, color: "#aaa49a", textAlign: "center", padding: "14px 0" }}>No active tasks</div>
                  : activeTasks.map(t => {
                    const a = staff.find(s => s.id === t.assigneeId);
                    return (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span className="dot pulse" style={{ background: "#c9a96e" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: "#1a1814" }}>{t.name}</div>
                          {a && <div style={{ fontSize: 9, color: a.color }}>{a.name}</div>}
                        </div>
                        <span style={{ fontSize: 12, color: "#c9a96e", fontWeight: 500 }}>{fmt(t.elapsed)}</span>
                      </div>
                    );
                  })}
              </div>
              <div className="card" style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 9, color: "#6a6458", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 12 }}>Today's Shifts</div>
                {(() => {
                  const ts = shifts[todayKey] || {};
                  const scheduled = staff.filter(s => ts[s.id] !== undefined);
                  return scheduled.length === 0
                    ? <div style={{ fontSize: 11, color: "#aaa49a", textAlign: "center", padding: "14px 0" }}>No shifts scheduled today</div>
                    : scheduled.map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div className="av" style={{ background: s.color + "33", color: s.color }}>{s.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: "#1a1814" }}>{s.name}</div>
                          <div style={{ fontSize: 9, color: "#666" }}>{SHIFT_ICONS[ts[s.id]]} {SHIFTS[ts[s.id]]}</div>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>
            <div className="card" style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 9, color: "#6a6458", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 12 }}>Tasks by Area</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 8 }}>
                {Object.entries(AREA_COLORS).map(([area, color]) => {
                  const at = tasks.filter(t => t.area === area);
                  const dc = at.filter(t => t.status === "done").length;
                  return (
                    <div key={area} style={{ background: "#f0ede8", borderRadius: 4, padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span className="dot" style={{ width: 6, height: 6, background: color }} />
                        <span style={{ fontSize: 10, color: "#666" }}>{area}</span>
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "#666" }}>{dc}/{at.length}</span>
                      </div>
                      <div style={{ height: 3, background: "#252018", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: at.length ? `${dc / at.length * 100}%` : 0, background: color, borderRadius: 2, transition: "width .5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {lowSupplies.length > 0 && (
              <div className="card" style={{ padding: "12px 18px", borderColor: "#3a1e1e" }}>
                <div style={{ fontSize: 9, color: "#c07878", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>⚠ Low Stock Alert</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lowSupplies.map(s => (
                    <span key={s.id} style={{ fontSize: 10, padding: "2px 9px", borderRadius: 10, background: "#2a1414", color: "#c07878", border: "1px solid #3a1e1e" }}>{s.name} · {s.quantity} {s.unit}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === "checklist" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["all","All"],["pending","Pending"],["in-progress","Active"],["done","Done"]].map(([f, l]) => (
                  <button key={f} className={`btn ${clFilter === f ? "bg" : ""}`}
                    style={clFilter !== f ? { background: "#f0ede8", color: "#666", border: "1px solid #ddd8cc" } : {}}
                    onClick={() => setClFilter(f)}>{l}</button>
                ))}
              </div>
              <span style={{ fontSize: 10, color: "#7a7468" }}>{filteredTasks.length} tasks · {fmt(filteredTasks.reduce((a, t) => a + t.elapsed, 0))} logged</span>
            </div>
            <div className="card">
              {filteredTasks.map((task) => {
                const assignee = staff.find(s => s.id === task.assigneeId);
                const isDone = task.status === "done";
                const isActive = task.status === "in-progress";
                return (
                  <div key={task.id} className="row">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div className="chk"
                        style={{ background: isDone ? "#1e3828" : "#181714", borderColor: isDone ? "#2e5838" : "#2e2c26", marginTop: 2 }}
                        onClick={() => isDone ? resetTask(task.id) : isActive ? completeTask(task.id) : startTask(task.id)}>
                        {isDone && <span style={{ color: "#7eb8b0", fontSize: 11 }}>✓</span>}
                        {isActive && <span className="pulse" style={{ color: "#c9a96e", fontSize: 9 }}>●</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: isDone ? "#3a3830" : "#ddd", textDecoration: isDone ? "line-through" : "none" }}>{task.name}</span>
                          <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 10, background: AREA_COLORS[task.area] + "22", color: AREA_COLORS[task.area] }}>{task.area}</span>
                          <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 10,
                            background: task.priority === "high" ? "#3a1a1a" : task.priority === "medium" ? "#2a2818" : "#1a2818",
                            color: task.priority === "high" ? "#c07878" : task.priority === "medium" ? "#c9a96e" : "#7eb87e" }}>
                            {task.priority}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 7 }}>
                          <span style={{ fontSize: 10, color: "#7a7468" }}>est. {task.estimatedMin}m</span>
                          {task.elapsed > 0 && <span style={{ fontSize: 10, color: isActive ? "#c9a96e" : "#4a4840" }}>{isActive ? "⏱ " : ""}{fmt(task.elapsed)}</span>}
                          <select className="sel" value={task.assigneeId || ""} onChange={(e) => assignTask(task.id, e.target.value)}>
                            <option value="">Unassigned</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          {assignee && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <div className="av" style={{ width: 20, height: 20, fontSize: 8, background: assignee.color + "33", color: assignee.color }}>{assignee.avatar}</div>
                              <span style={{ fontSize: 10, color: assignee.color }}>{assignee.name}</span>
                            </div>
                          )}
                        </div>
                        <input className="inp" placeholder="Add a note…" value={task.notes}
                          onChange={(e) => setNote(task.id, e.target.value)}
                          style={{ fontSize: 11, padding: "4px 8px", background: "#f8f7f5", borderColor: "#1e1c16" }} />
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0, marginTop: 2 }}>
                        {task.status === "pending" && <button className="btn bt" onClick={() => startTask(task.id)}>▶</button>}
                        {isActive && task.running && <button className="btn bg" onClick={() => pauseTask(task.id)}>⏸</button>}
                        {isActive && !task.running && <button className="btn bt" onClick={() => resumeTask(task.id)}>▶</button>}
                        {isActive && <button className="btn bb" onClick={() => completeTask(task.id)}>✓</button>}
                        {isDone && <button className="btn br" onClick={() => resetTask(task.id)}>↺</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "schedule" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 10, color: "#6a6458", letterSpacing: ".12em", textTransform: "uppercase" }}>Weekly Shift Schedule</div>
              <div style={{ fontSize: 10, color: "#7a7468" }}>{weekDates[0].toLocaleDateString()} – {weekDates[6].toLocaleDateString()}</div>
            </div>
            <div className="card" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd8cc" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9, color: "#6a6458", letterSpacing: ".12em", fontWeight: 400 }}>STAFF</th>
                    {weekDates.map((d) => (
                      <th key={dateKey(d)} style={{ padding: "10px 6px", textAlign: "center", fontWeight: 400 }}>
                        <div style={{ fontSize: 9, letterSpacing: ".1em", color: dateKey(d) === todayKey ? "#c9a96e" : "#4a4840" }}>{DAYS[d.getDay()]}</div>
                        <div style={{ fontSize: 13, color: dateKey(d) === todayKey ? "#c9a96e" : "#666", marginTop: 2 }}>{d.getDate()}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #e0dcd4" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="av" style={{ background: s.color + "33", color: s.color }}>{s.avatar}</div>
                          <div>
                            <div style={{ fontSize: 12, color: "#333" }}>{s.name}</div>
                            <div style={{ fontSize: 9, color: "#666" }}>{s.role}</div>
                          </div>
                        </div>
                      </td>
                      {weekDates.map((d) => {
                        const dk = dateKey(d);
                        const shiftIdx = getShift(dk, s.id);
                        const avails = availability[s.id]?.[dk] || [];
                        return (
                          <td key={dk} style={{ padding: "6px 4px", textAlign: "center", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                              {avails.length > 0 && (
                                <div style={{ display: "flex", gap: 2, marginBottom: 1 }} title={`Available: ${avails.join(", ")}`}>
                                  {avails.map((_, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#7eb8b066" }} />)}
                                </div>
                              )}
                              {[0, 1, 2].map((idx) => (
                                <div key={idx} className="scell" title={SHIFTS[idx]}
                                  style={{
                                    background: shiftIdx === idx ? s.color + "40" : "#1a1814",
                                    border: `1px solid ${shiftIdx === idx ? s.color + "80" : "#222018"}`,
                                    color: shiftIdx === idx ? s.color : "#333",
                                  }}
                                  onClick={() => toggleShift(dk, s.id, idx)}>
                                  {SHIFT_ICONS[idx]}
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
              {SHIFT_ICONS.map((ic, i) => <span key={i} style={{ fontSize: 10, color: "#555" }}>{ic} {SHIFTS[i]}</span>)}
            </div>
          </div>
        )}

        {view === "availability" && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: "#6a6458", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>Post Shift Availability</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {staff.map(s => (
                  <button key={s.id}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 4, cursor: "pointer", border: `1px solid ${availStaffId === s.id ? s.color + "88" : "#222018"}`, background: availStaffId === s.id ? s.color + "1a" : "#131210", transition: "all .15s" }}
                    onClick={() => setAvailStaffId(availStaffId === s.id ? null : s.id)}>
                    <div className="av" style={{ width: 22, height: 22, fontSize: 9, background: s.color + "33", color: s.color }}>{s.avatar}</div>
                    <span style={{ fontSize: 11, color: availStaffId === s.id ? s.color : "#888" }}>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {availStaffId ? (() => {
              const s = staff.find(m => m.id === availStaffId);
              return (
                <>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid #e0dcd4", display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="av" style={{ background: s.color + "33", color: s.color }}>{s.avatar}</div>
                      <div>
                        <div style={{ fontSize: 13, color: "#1a1814" }}>{s.name}</div>
                        <div style={{ fontSize: 9, color: "#6a6458" }}>Tap a shift to toggle availability</div>
                      </div>
                    </div>
                    {weekDates.map((d) => {
                      const dk = dateKey(d);
                      const isPast = d < new Date() && dk !== todayKey;
                      const isToday = dk === todayKey;
                      return (
                        <div key={dk} className="row" style={{ display: "flex", alignItems: "center", gap: 12, opacity: isPast ? .35 : 1, flexWrap: "wrap" }}>
                          <div style={{ width: 78, flexShrink: 0 }}>
                            <div style={{ fontSize: 12, color: isToday ? "#c9a96e" : "#bbb" }}>{DAYS[d.getDay()]}</div>
                            <div style={{ fontSize: 9, color: "#6a6458" }}>{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                            {SHIFTS.map((shift, i) => {
                              const on = isAvail(s.id, dk, shift);
                              return (
                                <button key={shift} className="chip" disabled={isPast}
                                  style={{ background: on ? s.color + "2a" : "#181714", color: on ? s.color : "#4a4840", borderColor: on ? s.color + "55" : "#222018" }}
                                  onClick={() => toggleAvail(s.id, dk, shift)}>
                                  {SHIFT_ICONS[i]} {SHIFT_SHORT[i]}
                                </button>
                              );
                            })}
                          </div>
                          {(availability[s.id]?.[dk]?.length > 0) && (
                            <span style={{ fontSize: 9, color: "#7eb8b0", flexShrink: 0 }}>✓ posted</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#6a6458", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 10 }}>Team Availability — This Week</div>
                    <div className="card" style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #e0dcd4" }}>
                            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, color: "#6a6458", letterSpacing: ".12em", fontWeight: 400, whiteSpace: "nowrap" }}>STAFF</th>
                            {weekDates.map(d => (
                              <th key={dateKey(d)} style={{ padding: "10px 6px", textAlign: "center", fontSize: 9, color: dateKey(d) === todayKey ? "#c9a96e" : "#4a4840", fontWeight: 400 }}>
                                {DAYS[d.getDay()]}<br />{d.getDate()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {staff.map(sm => (
                            <tr key={sm.id} style={{ borderBottom: "1px solid #e0dcd4" }}>
                              <td style={{ padding: "8px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div className="av" style={{ width: 20, height: 20, fontSize: 8, background: sm.color + "33", color: sm.color }}>{sm.avatar}</div>
                                  <span style={{ fontSize: 11, color: sm.color, whiteSpace: "nowrap" }}>{sm.name}</span>
                                </div>
                              </td>
                              {weekDates.map(d => {
                                const dk = dateKey(d);
                                const avails = availability[sm.id]?.[dk] || [];
                                return (
                                  <td key={dk} style={{ padding: "6px 4px", textAlign: "center", verticalAlign: "middle" }}>
                                    {avails.length > 0
                                      ? <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                                        {avails.map((sh, i) => (
                                          <div key={i} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 2, background: sm.color + "1a", color: sm.color, whiteSpace: "nowrap" }}>
                                            {SHIFT_ICONS[SHIFTS.indexOf(sh)]} {SHIFT_SHORT[SHIFTS.indexOf(sh)]}
                                          </div>
                                        ))}
                                      </div>
                                      : <span style={{ fontSize: 9, color: "#1e1c16" }}>—</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })() : (
              <div style={{ textAlign: "center", padding: "50px 0", fontSize: 12, color: "#aaa49a" }}>
                Select a staff member above to post or view availability
              </div>
            )}
          </div>
        )}

        {view === "supplies" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: lowSupplies.length ? "#c07878" : "#4a4840" }}>
                {lowSupplies.length > 0 ? `⚠ ${lowSupplies.length} item${lowSupplies.length > 1 ? "s" : ""} low` : `${supplies.length} items tracked`}
              </span>
              <button className="btn bt" onClick={() => setAddSupplyOpen(!addSupplyOpen)}>+ Add Item</button>
            </div>
            {addSupplyOpen && (
              <div className="card" style={{ padding: "14px 18px", marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["name","Item name","text",160],["unit","Unit","text",120],["quantity","Qty","number",60],["min","Min","number",60]].map(([k, ph, tp, w]) => (
                  <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 9, color: "#6a6458", letterSpacing: ".1em", textTransform: "uppercase" }}>{ph}</label>
                    <input className="inp" style={{ width: w }} type={tp} placeholder={ph} value={newSupply[k]}
                      onChange={e => setNewSupply(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
                <button className="btn bt" onClick={addSupply}>Save</button>
                <button className="btn" style={{ background: "#f0ede8", color: "#666", border: "1px solid #ddd8cc" }} onClick={() => setAddSupplyOpen(false)}>Cancel</button>
              </div>
            )}
            <div className="card">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px 70px", gap: 8, padding: "8px 16px", borderBottom: "1px solid #e0dcd4" }}>
                {["Item","Min Stock","Quantity","Status"].map(h => <div key={h} style={{ fontSize: 9, color: "#7a7468", letterSpacing: ".12em", textTransform: "uppercase" }}>{h}</div>)}
              </div>
              {supplies.map(s => {
                const low = s.quantity <= s.min;
                return (
                  <div key={s.id} className="row" style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px 70px", alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: low ? "#e0c0c0" : "#ccc" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#7a7468" }}>{s.min} {s.unit}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => updateSupply(s.id, -1)} style={{ width: 24, height: 24, borderRadius: 3, background: "#e8e4dc", color: "#c9a96e", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccc8be" }}>−</button>
                      <span style={{ fontSize: 14, color: low ? "#c07878" : "#ddd", fontWeight: 500, minWidth: 24, textAlign: "center" }}>{s.quantity}</span>
                      <button onClick={() => updateSupply(s.id, 1)} style={{ width: 24, height: 24, borderRadius: 3, background: "#e8e4dc", color: "#c9a96e", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccc8be" }}>+</button>
                    </div>
                    <div>
                      <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 10, background: low ? "#3a1414" : "#143a22", color: low ? "#c07878" : "#7eb87e", letterSpacing: ".1em" }}>{low ? "LOW" : "OK"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "staff" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: "#6a6458" }}>{staff.length} team members</span>
              <button className="btn bg" onClick={() => setStaffModal(true)}>+ Add Staff</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 12 }}>
              {staff.map(s => {
                const myTasks = tasks.filter(t => t.assigneeId === s.id);
                const myDone = myTasks.filter(t => t.status === "done").length;
                const myTime = myTasks.reduce((a, t) => a + t.elapsed, 0);
                const todayShiftIdx = getShift(todayKey, s.id);
                const weekAvail = weekDates.filter(d => (availability[s.id]?.[dateKey(d)]?.length || 0) > 0).length;
                return (
                  <div key={s.id} className="card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                      <div className="av" style={{ width: 42, height: 42, fontSize: 14, background: s.color + "33", color: s.color, border: `1px solid ${s.color}44` }}>{s.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: "#1a1814", marginBottom: 2 }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: s.color }}>{s.role}</div>
                        {s.phone && <div style={{ fontSize: 10, color: "#7a7468", marginTop: 2 }}>{s.phone}</div>}
                      </div>
                      <button className="btn br" style={{ fontSize: 9, padding: "3px 8px" }} onClick={() => removeStaff(s.id)}>✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 14 }}>
                      {[
                        ["Tasks", `${myDone}/${myTasks.length}`],
                        ["Time", fmt(myTime)],
                        ["Shift", todayShiftIdx !== null ? SHIFT_ICONS[todayShiftIdx] : "—"],
                        ["Avail", `${weekAvail}d`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ textAlign: "center", background: "#f0ede8", borderRadius: 4, padding: "8px 4px" }}>
                          <div style={{ fontSize: 15, color: s.color, fontWeight: 500 }}>{v}</div>
                          <div style={{ fontSize: 8, color: "#7a7468", letterSpacing: ".1em", marginTop: 2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {myTasks.length > 0 && (
                      <>
                        <div style={{ fontSize: 8, color: "#7a7468", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 6 }}>Assigned Tasks</div>
                        {myTasks.slice(0, 4).map(t => (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: t.status === "done" ? "#7eb8b0" : t.status === "in-progress" ? "#c9a96e" : "#3a3830" }}>
                              {t.status === "done" ? "✓" : t.status === "in-progress" ? "▶" : "○"}
                            </span>
                            <span style={{ fontSize: 10, color: t.status === "done" ? "#3a3830" : "#888", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.name}</span>
                            {t.elapsed > 0 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#7a7468" }}>{fmt(t.elapsed)}</span>}
                          </div>
                        ))}
                        {myTasks.length > 4 && <div style={{ fontSize: 9, color: "#7a7468", marginTop: 2 }}>+{myTasks.length - 4} more</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "log" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: "#6a6458" }}>{log.length} entries</span>
              <button className="btn br" onClick={() => setLog([])}>Clear Log</button>
            </div>
            <div className="card">
              {log.length === 0
                ? <div style={{ padding: 48, textAlign: "center", fontSize: 12, color: "#222018" }}>No activity yet.</div>
                : log.map((e, i) => (
                  <div key={i} className="row" style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                    <span style={{ fontSize: 10, color: "#8a8478", fontStyle: "italic", flexShrink: 0 }}>{e.time}</span>
                    <span style={{ fontSize: 12, color: "#555" }}>{e.msg}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>

      {staffModal && (
        <div className="overlay" onClick={() => setStaffModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#c9a96e", marginBottom: 20 }}>Add Staff Member</div>
            {[["name","Full Name","text"],["role","Role (e.g. Lead Cleaner)","text"],["phone","Phone Number","tel"]].map(([k, ph, tp]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: "#6a6458", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 5 }}>{ph}</div>
                <input className="inp" type={tp} placeholder={ph} value={newStaff[k]}
                  onChange={e => setNewStaff(p => ({ ...p, [k]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addStaff()} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn bg" style={{ flex: 1, padding: "10px" }} onClick={addStaff}>Add to Team</button>
              <button className="btn" style={{ padding: "10px 16px", background: "#f0ede8", color: "#666", border: "1px solid #ddd8cc" }} onClick={() => setStaffModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
