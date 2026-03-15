import { useState, useRef, useCallback, useEffect } from "react";
import './style.css';

const PALETTE = [
  "#E8645A","#5B8DEF","#F5A623","#7ED69E","#C084FC",
  "#F472B6","#38BDF8","#FACC15","#FB923C","#34D399",
  "#A78BFA","#F87171","#2DD4BF","#818CF8","#FCA5A5",
];

function formatHalf(val) {
  const whole = Math.floor(val);
  const min = val % 1 >= 0.5 ? "30" : "00";
  const h = whole >= 24 ? whole - 24 : whole;
  const ampm = (h >= 12 && h < 24) ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${min}${ampm}`;
}

const snapToHalf = (v) => Math.round(v * 2) / 2;

export default function HangoutTimeline() {
  const [people, setPeople] = useState([]);
  const [activities, setActivities] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [sortMode, setSortMode] = useState("appearance");
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState(15);
  const [newEnd, setNewEnd] = useState(22);
  const [newActivity, setNewActivity] = useState("");
  const [newActStart, setNewActStart] = useState(15);
  const [newActEnd, setNewActEnd] = useState(17);
  const [newPhotoTime, setNewPhotoTime] = useState(15);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [dragging, setDragging] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [timeStart, setTimeStart] = useState(15);
  const [timeEnd, setTimeEnd] = useState(28);
  const [editingPerson, setEditingPerson] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const trackRef = useRef(null);
  const photoInputRef = useRef(null);

  // Load from URL hash on mount
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const decoded = JSON.parse(atob(hash));
      if (decoded.people) setPeople(decoded.people);
      if (decoded.activities) setActivities(decoded.activities);
      if (typeof decoded.timeStart === "number") setTimeStart(decoded.timeStart);
      if (typeof decoded.timeEnd === "number") setTimeEnd(decoded.timeEnd);
    } catch {}
  }, []);

  // ESC closes modals
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setEditingPerson(null);
        setEditingPhoto(null);
        setLightbox(null);
        setShowImport(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pctOf = useCallback(
    (hour) => ((hour - timeStart) / (timeEnd - timeStart)) * 100,
    [timeStart, timeEnd]
  );

  // Hour tick marks for the current range
  const hours = [];
  for (let h = timeStart; h <= timeEnd; h++) {
    hours.push({ value: h, label: formatHalf(h) });
  }

  // Time select options for current range
  const makeTimeOpts = (start, end) => {
    const opts = [];
    for (let h = start; h <= end; h += 0.5) {
      opts.push(<option key={h} value={h}>{formatHalf(h)}</option>);
    }
    return opts;
  };
  const timeOpts = makeTimeOpts(timeStart, timeEnd);

  // Options for the time-range settings card (wide range: 6AM to noon next day)
  const rangeOpts = [];
  for (let h = 6; h <= 36; h++) {
    rangeOpts.push(
      <option key={h} value={h}>
        {formatHalf(h)}{h >= 24 ? " (+1d)" : ""}
      </option>
    );
  }

  const clampToRange = (v, start, end) => Math.max(start, Math.min(end, v));

  const handleTimeStartChange = (val) => {
    if (val >= timeEnd - 1) return;
    setTimeStart(val);
    setNewStart((s) => clampToRange(s, val, timeEnd));
    setNewEnd((e) => clampToRange(e, val, timeEnd));
    setNewActStart((s) => clampToRange(s, val, timeEnd));
    setNewActEnd((e) => clampToRange(e, val, timeEnd));
    setNewPhotoTime((t) => clampToRange(t, val, timeEnd));
  };

  const handleTimeEndChange = (val) => {
    if (val <= timeStart + 1) return;
    setTimeEnd(val);
    setNewStart((s) => clampToRange(s, timeStart, val));
    setNewEnd((e) => clampToRange(e, timeStart, val));
    setNewActStart((s) => clampToRange(s, timeStart, val));
    setNewActEnd((e) => clampToRange(e, timeStart, val));
    setNewPhotoTime((t) => clampToRange(t, timeStart, val));
  };

  const addPerson = () => {
    if (!newName.trim()) return;
    setPeople((p) => [...p, {
      id: Date.now(),
      name: newName.trim(),
      start: Number(newStart),
      end: Number(newEnd),
      color: PALETTE[p.length % PALETTE.length],
    }]);
    setNewName("");
  };

  const addActivity = () => {
    if (!newActivity.trim()) return;
    setActivities((a) => [...a, {
      id: Date.now(),
      title: newActivity.trim(),
      start: Number(newActStart),
      end: Number(newActEnd),
    }]);
    setNewActivity("");
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => [...prev, {
          id: Date.now() + Math.random(),
          src: ev.target.result,
          time: Number(newPhotoTime),
          caption: newPhotoCaption.trim() || "",
          fileName: file.name,
        }]);
      };
      reader.readAsDataURL(file);
    });
    setNewPhotoCaption("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const removePhoto = (id) => setPhotos((p) => p.filter((x) => x.id !== id));
  const removePerson = (id) => setPeople((p) => p.filter((x) => x.id !== id));
  const removeActivity = (id) => setActivities((a) => a.filter((x) => x.id !== id));
  const updatePerson = (id, changes) => setPeople((p) => p.map((x) => x.id === id ? { ...x, ...changes } : x));
  const updatePhoto = (id, changes) => setPhotos((p) => p.map((x) => x.id === id ? { ...x, ...changes } : x));

  const sorted = [...people].sort((a, b) => {
    if (sortMode === "appearance") return a.start - b.start;
    if (sortMode === "longest")   return (b.end - b.start) - (a.end - a.start);
    if (sortMode === "leave")     return a.end - b.end;
    return 0;
  });

  const handleBarMouseDown = (e, personId, edge) => {
    e.preventDefault();
    setDragging({ personId, edge });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const rawHour = timeStart + pct * (timeEnd - timeStart);
    const snapped = snapToHalf(Math.max(timeStart, Math.min(timeEnd, rawHour)));
    setPeople((prev) => prev.map((p) => {
      if (p.id !== dragging.personId) return p;
      if (dragging.edge === "start") return { ...p, start: Math.min(snapped, p.end - 0.5) };
      if (dragging.edge === "end")   return { ...p, end: Math.max(snapped, p.start + 0.5) };
      return p;
    }));
  }, [dragging, timeStart, timeEnd]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const sortedPhotos = [...photos].sort((a, b) => a.time - b.time);

  // Share: encode people + activities + time range to URL hash (no photos — too large)
  const handleShare = () => {
    const data = { people, activities, timeStart, timeEnd };
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
      const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
      navigator.clipboard.writeText(url).then(() => {
        setShareMsg("Link copied! (photos not included)");
        setTimeout(() => setShareMsg(""), 3500);
      }).catch(() => {
        setShareMsg("Clipboard blocked — use Export instead");
        setTimeout(() => setShareMsg(""), 3500);
      });
    } catch {
      setShareMsg("Failed to encode data");
      setTimeout(() => setShareMsg(""), 3500);
    }
  };

  const handleExportJSON = () => {
    const data = { people, activities, photos, timeStart, timeEnd };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hangout-timeline.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (data.people) setPeople(data.people);
      if (data.activities) setActivities(data.activities);
      if (data.photos) setPhotos(data.photos);
      if (typeof data.timeStart === "number") setTimeStart(data.timeStart);
      if (typeof data.timeEnd === "number") setTimeEnd(data.timeEnd);
      setShowImport(false);
      setImportText("");
    } catch {
      alert("Invalid JSON — make sure you pasted the full exported file.");
    }
  };

  const numHours = hours.length - 1 || 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0D0D",
        color: "#E8E8E8",
        fontFamily: "'Inter', 'system-ui', -apple-system, 'Segoe UI', sans-serif",
        padding: "24px 16px",
        boxSizing: "border-box",
        userSelect: dragging ? "none" : "auto",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              margin: 0,
              background: "linear-gradient(135deg, #E8645A 0%, #F5A623 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              HANGOUT TIMELINE
            </h1>
            <p style={{ fontSize: 12, color: "#555", margin: "5px 0 0", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
              {formatHalf(timeStart)} → {formatHalf(timeEnd)}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {shareMsg && (
              <span style={{ fontSize: 11, color: "#7ED69E", fontFamily: "'JetBrains Mono', monospace" }}>
                {shareMsg}
              </span>
            )}
            <button onClick={handleShare} style={btnSecStyle}>🔗 Share Link</button>
            <button onClick={handleExportJSON} style={btnSecStyle}>↑ Export</button>
            <button onClick={() => setShowImport((v) => !v)} style={btnSecStyle}>↓ Import</button>
          </div>
        </div>

        {/* ── Import panel ── */}
        {showImport && (
          <div style={cardStyle}>
            <div style={sectionLabel}>Import JSON</div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste exported JSON here…"
              style={{
                ...inputStyle,
                width: "100%",
                height: 90,
                resize: "vertical",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={handleImport} style={btnStyle}>Load</button>
              <button onClick={() => { setShowImport(false); setImportText(""); }} style={btnSecStyle}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Time Range ── */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Time Range</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#888" }}>From</span>
            <select
              value={timeStart}
              onChange={(e) => handleTimeStartChange(Number(e.target.value))}
              style={selectStyle}
            >
              {rangeOpts.filter((o) => o.props.value < timeEnd)}
            </select>
            <span style={{ color: "#444", fontSize: 13 }}>→</span>
            <select
              value={timeEnd}
              onChange={(e) => handleTimeEndChange(Number(e.target.value))}
              style={selectStyle}
            >
              {rangeOpts.filter((o) => o.props.value > timeStart)}
            </select>
            <span style={{ fontSize: 12, color: "#444", fontFamily: "monospace" }}>
              {timeEnd - timeStart}h window
            </span>
          </div>
        </div>

        {/* ── Activities ── */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Activities / Phases</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: activities.length ? 14 : 0 }}>
            <input
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addActivity()}
              placeholder="e.g. Board Games"
              style={inputStyle}
            />
            <select value={newActStart} onChange={(e) => { const v = Number(e.target.value); setNewActStart(v); if (v >= newActEnd) setNewActEnd(Math.min(v + 1, timeEnd)); }} style={selectStyle}>{timeOpts}</select>
            <span style={{ color: "#555", fontSize: 13 }}>→</span>
            <select value={newActEnd} onChange={(e) => { const v = Number(e.target.value); setNewActEnd(v); if (v <= newActStart) setNewActStart(Math.max(v - 1, timeStart)); }} style={selectStyle}>{timeOpts}</select>
            <button onClick={addActivity} style={btnStyle}>+ Add</button>
          </div>
          {activities.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#FACC15", fontWeight: 600 }}>{a.title}</span>
              <span style={{ fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>
                {formatHalf(a.start)} – {formatHalf(a.end)}
              </span>
              <button onClick={() => removeActivity(a.id)} style={removeBtnStyle}>✕</button>
            </div>
          ))}
        </div>

        {/* ── Add Person ── */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Add Person</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson()}
              placeholder="Name"
              style={{ ...inputStyle, flex: "1 1 100px", minWidth: 80 }}
            />
            <select value={newStart} onChange={(e) => { const v = Number(e.target.value); setNewStart(v); if (v >= newEnd) setNewEnd(Math.min(v + 1, timeEnd)); }} style={selectStyle}>{timeOpts}</select>
            <span style={{ color: "#555", fontSize: 13 }}>→</span>
            <select value={newEnd} onChange={(e) => { const v = Number(e.target.value); setNewEnd(v); if (v <= newStart) setNewStart(Math.max(v - 1, timeStart)); }} style={selectStyle}>{timeOpts}</select>
            <button onClick={addPerson} style={btnStyle}>+ Add</button>
          </div>
        </div>

        {/* ── Photos ── */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Photos</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: sortedPhotos.length ? 18 : 0 }}>
            <input
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
              placeholder="Caption (optional)"
              style={{ ...inputStyle, flex: "1 1 120px", minWidth: 100 }}
            />
            <select value={newPhotoTime} onChange={(e) => setNewPhotoTime(Number(e.target.value))} style={selectStyle}>{timeOpts}</select>
            <label style={{ ...btnStyle, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              📷 Upload
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: "none" }} />
            </label>
          </div>
          {sortedPhotos.length > 0 && (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {sortedPhotos.map((p) => (
                <div key={p.id} style={{ position: "relative", width: 160 }}>
                  {editingPhoto === p.id ? (
                    <div style={{ background: "#111", borderRadius: 10, padding: 10, width: 160, boxSizing: "border-box", border: "1px solid #333" }}>
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>Caption</div>
                      <input
                        defaultValue={p.caption}
                        placeholder="Caption"
                        onBlur={(e) => updatePhoto(p.id, { caption: e.target.value })}
                        style={{ ...inputStyle, fontSize: 11, padding: "5px 7px", marginBottom: 8, width: "100%", boxSizing: "border-box" }}
                        autoFocus
                      />
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>Time</div>
                      <select
                        value={p.time}
                        onChange={(e) => updatePhoto(p.id, { time: Number(e.target.value) })}
                        style={{ ...selectStyle, fontSize: 11, width: "100%", marginBottom: 10 }}
                      >
                        {timeOpts}
                      </select>
                      <button
                        onClick={() => setEditingPhoto(null)}
                        style={{ ...btnStyle, fontSize: 11, padding: "5px 0", width: "100%", textAlign: "center" }}
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <img
                        src={p.src}
                        alt={p.caption || "photo"}
                        onClick={() => setLightbox(p)}
                        style={{
                          width: 160,
                          height: 160,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "2px solid #2a2a2a",
                          cursor: "pointer",
                          display: "block",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.target.style.borderColor = "#E8645A")}
                        onMouseLeave={(e) => (e.target.style.borderColor = "#2a2a2a")}
                      />
                      <div style={{ fontSize: 10, color: "#666", marginTop: 5, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatHalf(p.time)}
                      </div>
                      {p.caption && (
                        <div style={{ fontSize: 10, color: "#999", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                          {p.caption}
                        </div>
                      )}
                      <button
                        onClick={() => setEditingPhoto(p.id)}
                        title="Edit caption/time"
                        style={{
                          position: "absolute", top: -7, left: -7,
                          background: "#2a2a2a", color: "#bbb", border: "1px solid #444",
                          borderRadius: "50%", width: 22, height: 22, fontSize: 11,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >✎</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}
                        style={{
                          position: "absolute", top: -7, right: -7,
                          background: "#E8645A", color: "#fff", border: "none",
                          borderRadius: "50%", width: 22, height: 22, fontSize: 11,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >✕</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sort Controls ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#555", marginRight: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sort by</span>
          {[
            { mode: "appearance", label: "First Arrival" },
            { mode: "longest",    label: "Longest Stay" },
            { mode: "leave",      label: "First to Leave" },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              style={{
                background: sortMode === mode ? "#E8645A" : "#161616",
                color: sortMode === mode ? "#fff" : "#777",
                border: sortMode === mode ? "1px solid #E8645A" : "1px solid #2a2a2a",
                borderRadius: 6,
                padding: "7px 16px",
                fontSize: 12,
                fontFamily: "inherit",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Timeline ── */}
        <div
          style={{
            background: "#161616",
            borderRadius: 12,
            padding: "20px 40px 16px 20px",
            border: "1px solid #222",
            overflowX: "auto",
          }}
        >
          {/* Activity bars */}
          {activities.length > 0 && (
            <div style={{ position: "relative", marginBottom: 16 }}>
              <div style={{ position: "relative", height: activities.length * 28, marginLeft: 116 }}>
                {activities.map((a, i) => {
                  const left = pctOf(a.start);
                  const width = pctOf(a.end) - pctOf(a.start);
                  return (
                    <div key={a.id} style={{
                      position: "absolute",
                      top: i * 28,
                      left: `${left}%`,
                      width: `${width}%`,
                      height: 22,
                      background: "rgba(250,204,21,0.10)",
                      border: "1px solid rgba(250,204,21,0.28)",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#FACC15",
                      letterSpacing: "0.04em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      padding: "0 6px",
                    }}>
                      {a.title}
                    </div>
                  );
                })}
              </div>
              <div style={{ borderBottom: "1px solid #222", marginTop: 8 }} />
            </div>
          )}

          {/* Photo pins row */}
          {sortedPhotos.length > 0 && (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <div style={{ position: "relative", height: 72, marginLeft: 116 }}>
                {sortedPhotos.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      position: "absolute",
                      left: `${pctOf(p.time)}%`,
                      transform: "translateX(-50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setLightbox(p)}
                  >
                    <img
                      src={p.src}
                      alt={p.caption || ""}
                      style={{
                        width: 58,
                        height: 58,
                        objectFit: "cover",
                        borderRadius: 7,
                        border: "2px solid #E8645A",
                        boxShadow: "0 0 12px rgba(232,100,90,0.4)",
                      }}
                    />
                    <div style={{ width: 1, height: 10, background: "#E8645A55" }} />
                  </div>
                ))}
              </div>
              <div style={{ borderBottom: "1px solid #222" }} />
            </div>
          )}

          {/* Hour headers */}
          <div style={{ display: "flex", marginLeft: 116, position: "relative", height: 22, marginBottom: 4 }}>
            {hours.map((h, i) => (
              <div key={h.value} style={{
                position: "absolute",
                left: `${(i / numHours) * 100}%`,
                fontSize: 10,
                color: "#4a4a4a",
                transform: "translateX(-50%)",
                letterSpacing: "0.02em",
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: "nowrap",
              }}>
                {h.label}
              </div>
            ))}
          </div>

          {/* Grid lines + person bars */}
          <div ref={trackRef} style={{ position: "relative", marginLeft: 116 }}>
            {hours.map((h, i) => (
              <div key={h.value} style={{
                position: "absolute",
                left: `${(i / numHours) * 100}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: i === 0 ? "transparent" : "#1d1d1d",
                zIndex: 0,
              }} />
            ))}

            {sorted.length === 0 && (
              <div style={{
                height: 70,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3a3a3a",
                fontSize: 13,
                fontStyle: "italic",
                letterSpacing: "0.02em",
              }}>
                Add people to see the timeline
              </div>
            )}

            {sorted.map((person, idx) => {
              const left = pctOf(person.start);
              const width = pctOf(person.end) - pctOf(person.start);
              const duration = person.end - person.start;
              const hrs = Math.floor(duration);
              const mins = Math.round((duration % 1) * 60);
              const durLabel = mins > 0 ? `${hrs}h${mins}m` : `${hrs}h`;
              const rank = idx + 1;

              return (
                <div key={person.id} style={{
                  position: "relative",
                  height: 54,
                  display: "flex",
                  alignItems: "center",
                  zIndex: 1,
                }}>
                  {/* Rank + name label */}
                  <div style={{
                    position: "absolute",
                    right: "100%",
                    paddingRight: 10,
                    width: 106,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                  }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#3a3a3a",
                      fontFamily: "'JetBrains Mono', monospace",
                      minWidth: 18,
                      textAlign: "right",
                    }}>
                      #{rank}
                    </span>
                    <span
                      onClick={() => setEditingPerson({ ...person })}
                      title="Click to edit"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: person.color,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: "pointer",
                        maxWidth: 80,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {person.name}
                    </span>
                  </div>

                  {/* Bar */}
                  <div style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${width}%`,
                    height: 34,
                    background: `${person.color}1e`,
                    border: `1.5px solid ${person.color}77`,
                    borderRadius: 7,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: person.color,
                    fontWeight: 700,
                    cursor: "default",
                    minWidth: 28,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.02em",
                  }}>
                    <div
                      onMouseDown={(e) => handleBarMouseDown(e, person.id, "start")}
                      style={{ position: "absolute", left: -4, top: 0, bottom: 0, width: 10, cursor: "ew-resize", borderRadius: "5px 0 0 5px" }}
                    />
                    <span style={{ pointerEvents: "none" }}>{durLabel}</span>
                    <div
                      onMouseDown={(e) => handleBarMouseDown(e, person.id, "end")}
                      style={{ position: "absolute", right: -4, top: 0, bottom: 0, width: 10, cursor: "ew-resize", borderRadius: "0 5px 5px 0" }}
                    />
                    <button
                      onClick={() => removePerson(person.id)}
                      style={{
                        position: "absolute",
                        right: -28,
                        background: "none",
                        border: "none",
                        color: "#444",
                        fontSize: 13,
                        cursor: "pointer",
                        padding: "2px 4px",
                        lineHeight: 1,
                      }}
                    >✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          {people.length > 0 && (
            <div style={{
              marginTop: 22,
              paddingTop: 14,
              borderTop: "1px solid #1e1e1e",
              display: "flex",
              gap: 22,
              flexWrap: "wrap",
              fontSize: 12,
              color: "#555",
              letterSpacing: "0.01em",
            }}>
              <span><span style={{ color: "#777" }}>People:</span> {people.length}</span>
              <span>
                <span style={{ color: "#777" }}>Peak overlap:</span>{" "}
                {(() => {
                  let max = 0;
                  for (let t = timeStart; t <= timeEnd; t += 0.5) {
                    const c = people.filter((p) => p.start <= t && p.end > t).length;
                    if (c > max) max = c;
                  }
                  return max;
                })()}
              </span>
              <span>
                <span style={{ color: "#777" }}>Longest stay:</span>{" "}
                {(() => {
                  const p = [...people].sort((a, b) => (b.end - b.start) - (a.end - a.start))[0];
                  const d = p.end - p.start;
                  const m = Math.round((d % 1) * 60);
                  return `${p.name} (${Math.floor(d)}h${m > 0 ? m + "m" : ""})`;
                })()}
              </span>
              <span>
                <span style={{ color: "#777" }}>First arrival:</span>{" "}
                {[...people].sort((a, b) => a.start - b.start)[0].name}
              </span>
              <span><span style={{ color: "#777" }}>Photos:</span> {photos.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Person Modal ── */}
      {editingPerson && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.78)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9998, padding: 24,
          }}
          onClick={() => setEditingPerson(null)}
        >
          <div
            style={{
              background: "#181818",
              border: "1px solid #2e2e2e",
              borderRadius: 14,
              padding: 26,
              width: 340,
              maxWidth: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
              Edit Person
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={fieldLabel}>Name</div>
              <input
                value={editingPerson.name}
                onChange={(e) => setEditingPerson((ep) => ({ ...ep, name: e.target.value }))}
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={fieldLabel}>Arrival</div>
                <select
                  value={editingPerson.start}
                  onChange={(e) => { const v = Number(e.target.value); setEditingPerson((ep) => ({ ...ep, start: v, end: v >= ep.end ? Math.min(v + 1, timeEnd) : ep.end })); }}
                  style={{ ...selectStyle, width: "100%" }}
                >
                  {timeOpts}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={fieldLabel}>Departure</div>
                <select
                  value={editingPerson.end}
                  onChange={(e) => { const v = Number(e.target.value); setEditingPerson((ep) => ({ ...ep, end: v, start: v <= ep.start ? Math.max(v - 1, timeStart) : ep.start })); }}
                  style={{ ...selectStyle, width: "100%" }}
                >
                  {timeOpts}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={fieldLabel}>Color</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {PALETTE.map((c) => (
                  <div
                    key={c}
                    onClick={() => setEditingPerson((ep) => ({ ...ep, color: c }))}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: c,
                      cursor: "pointer",
                      outline: editingPerson.color === c ? `3px solid ${c}` : "none",
                      outlineOffset: 2,
                      transition: "outline 0.1s",
                      boxShadow: editingPerson.color === c ? `0 0 0 1px #0D0D0D` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  updatePerson(editingPerson.id, {
                    name: editingPerson.name,
                    start: editingPerson.start,
                    end: editingPerson.end,
                    color: editingPerson.color,
                  });
                  setEditingPerson(null);
                }}
                style={{ ...btnStyle, flex: 1, padding: "9px 0" }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingPerson(null)}
                style={{ ...btnSecStyle, flex: 1, padding: "9px 0" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.90)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            zIndex: 9999, cursor: "pointer", padding: 24,
          }}
        >
          <img
            src={lightbox.src}
            alt={lightbox.caption || ""}
            style={{
              maxWidth: "90vw",
              maxHeight: "76vh",
              borderRadius: 10,
              border: "1px solid #333",
              objectFit: "contain",
            }}
          />
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#ccc", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
              {formatHalf(lightbox.time)}
            </div>
            {lightbox.caption && (
              <div style={{ fontSize: 13, color: "#888", marginTop: 5 }}>
                {lightbox.caption}
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#444", marginTop: 14 }}>
            press Esc or click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ──

const cardStyle = {
  background: "#161616",
  borderRadius: 10,
  padding: 20,
  marginBottom: 14,
  border: "1px solid #1e1e1e",
};

const sectionLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: "#555",
  letterSpacing: "0.1em",
  marginBottom: 12,
  textTransform: "uppercase",
};

const fieldLabel = {
  fontSize: 11,
  color: "#555",
  marginBottom: 5,
  letterSpacing: "0.04em",
};

const inputStyle = {
  background: "#0f0f0f",
  border: "1px solid #2a2a2a",
  borderRadius: 7,
  color: "#E8E8E8",
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "'Inter', system-ui, sans-serif",
  flex: "1 1 120px",
  minWidth: 100,
  outline: "none",
};

const selectStyle = {
  background: "#0f0f0f",
  border: "1px solid #2a2a2a",
  borderRadius: 7,
  color: "#E8E8E8",
  padding: "8px 10px",
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  cursor: "pointer",
  outline: "none",
};

const btnStyle = {
  background: "#E8645A",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  padding: "9px 18px",
  fontSize: 12,
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: "0.02em",
};

const btnSecStyle = {
  background: "#161616",
  color: "#777",
  border: "1px solid #2a2a2a",
  borderRadius: 7,
  padding: "8px 14px",
  fontSize: 12,
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "0.01em",
};

const removeBtnStyle = {
  background: "none",
  border: "none",
  color: "#444",
  fontSize: 11,
  cursor: "pointer",
  padding: "2px 4px",
  lineHeight: 1,
};
