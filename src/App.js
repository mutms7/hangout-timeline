import React from "react";
import "./style.css";

export default function App() {
  return (
    <div>
      <h1>Hello StackBlitz!</h1>
      <p>Start editing to see some magic happen :)</p>
    </div>
  );
}
import { useState, useRef, useCallback } from "react";

const HOURS = [];
for (let h = 15; h <= 28; h++) {
  const displayH = h >= 24 ? h - 24 : h;
  const ampm = displayH >= 12 && displayH < 24 ? "PM" : "AM";
  const display = displayH === 0 ? 12 : displayH > 12 ? displayH - 12 : displayH;
  HOURS.push({ value: h, label: `${display}${ampm}` });
}

const PALETTE = [
  "#E8645A", "#5B8DEF", "#F5A623", "#7ED69E", "#C084FC",
  "#F472B6", "#38BDF8", "#FACC15", "#FB923C", "#34D399",
  "#A78BFA", "#F87171", "#2DD4BF", "#818CF8", "#FCA5A5",
];

const toMinutes = (h) => (h >= 15 ? (h - 15) * 60 : (h - 15 + 24) * 60);
const totalMinutes = 13 * 60;

function formatHalf(val) {
  const whole = Math.floor(val);
  const min = val % 1 >= 0.5 ? "30" : "00";
  const h = whole >= 24 ? whole - 24 : whole;
  const ampm = h >= 12 && h < 24 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${min} ${ampm}`;
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
  const trackRef = useRef(null);
  const photoInputRef = useRef(null);

  const addPerson = () => {
    if (!newName.trim()) return;
    setPeople((p) => [
      ...p,
      {
        id: Date.now(),
        name: newName.trim(),
        start: Number(newStart),
        end: Number(newEnd),
        color: PALETTE[p.length % PALETTE.length],
      },
    ]);
    setNewName("");
  };

  const addActivity = () => {
    if (!newActivity.trim()) return;
    setActivities((a) => [
      ...a,
      {
        id: Date.now(),
        title: newActivity.trim(),
        start: Number(newActStart),
        end: Number(newActEnd),
      },
    ]);
    setNewActivity("");
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            src: ev.target.result,
            time: Number(newPhotoTime),
            caption: newPhotoCaption.trim() || "",
            fileName: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    setNewPhotoCaption("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const removePhoto = (id) => setPhotos((p) => p.filter((x) => x.id !== id));
  const removePerson = (id) => setPeople((p) => p.filter((x) => x.id !== id));
  const removeActivity = (id) => setActivities((a) => a.filter((x) => x.id !== id));

  const sorted = [...people].sort((a, b) => {
    if (sortMode === "appearance") return a.start - b.start;
    if (sortMode === "longest") return (b.end - b.start) - (a.end - a.start);
    return 0;
  });

  const pctOf = (hour) => (toMinutes(hour) / totalMinutes) * 100;

  const handleBarMouseDown = (e, personId, edge) => {
    e.preventDefault();
    setDragging({ personId, edge });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const rawHour = 15 + pct * 13;
      const snapped = snapToHalf(Math.max(15, Math.min(28, rawHour)));
      setPeople((prev) =>
        prev.map((p) => {
          if (p.id !== dragging.personId) return p;
          if (dragging.edge === "start") return { ...p, start: Math.min(snapped, p.end - 0.5) };
          if (dragging.edge === "end") return { ...p, end: Math.max(snapped, p.start + 0.5) };
          return p;
        })
      );
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const timeOpts = [];
  for (let h = 15; h <= 28; h += 0.5) {
    timeOpts.push(
      <option key={h} value={h}>
        {formatHalf(h)}
      </option>
    );
  }

  const sortedPhotos = [...photos].sort((a, b) => a.time - b.time);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0D0D",
        color: "#E8E8E8",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        padding: "32px 24px",
        userSelect: dragging ? "none" : "auto",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              background: "linear-gradient(135deg, #E8645A, #F5A623)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            HANGOUT TIMELINE
          </h1>
          <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0", letterSpacing: "0.08em" }}>
            3:00 PM → 4:00 AM
          </p>
        </div>

        {/* Activities Section */}
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
            <select value={newActStart} onChange={(e) => setNewActStart(Number(e.target.value))} style={selectStyle}>
              {timeOpts}
            </select>
            <span style={{ color: "#555", fontSize: 12 }}>→</span>
            <select value={newActEnd} onChange={(e) => setNewActEnd(Number(e.target.value))} style={selectStyle}>
              {timeOpts}
            </select>
            <button onClick={addActivity} style={btnStyle}>+ Add</button>
          </div>
          {activities.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: "#FACC15", fontWeight: 600 }}>{a.title}</span>
              <span style={{ color: "#555" }}>{formatHalf(a.start)} – {formatHalf(a.end)}</span>
              <button onClick={() => removeActivity(a.id)} style={removeBtnStyle}>✕</button>
            </div>
          ))}
        </div>

        {/* Add Person */}
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
            <select value={newStart} onChange={(e) => setNewStart(Number(e.target.value))} style={selectStyle}>
              {timeOpts}
            </select>
            <span style={{ color: "#555", fontSize: 12 }}>→</span>
            <select value={newEnd} onChange={(e) => setNewEnd(Number(e.target.value))} style={selectStyle}>
              {timeOpts}
            </select>
            <button onClick={addPerson} style={btnStyle}>+ Add</button>
          </div>
        </div>

        {/* Photos Section */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Photos</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: sortedPhotos.length ? 14 : 0 }}>
            <input
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
              placeholder="Caption (optional)"
              style={{ ...inputStyle, flex: "1 1 120px", minWidth: 100 }}
            />
            <select value={newPhotoTime} onChange={(e) => setNewPhotoTime(Number(e.target.value))} style={selectStyle}>
              {timeOpts}
            </select>
            <label style={{ ...btnStyle, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <span style={{ fontSize: 14 }}>📷</span> Upload
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
          {sortedPhotos.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {sortedPhotos.map((p) => (
                <div
                  key={p.id}
                  style={{ position: "relative", width: 80, cursor: "pointer" }}
                  onClick={() => setLightbox(p)}
                >
                  <img
                    src={p.src}
                    alt={p.caption || "photo"}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "2px solid #333",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.target.style.borderColor = "#E8645A")}
                    onMouseLeave={(e) => (e.target.style.borderColor = "#333")}
                  />
                  <div style={{ fontSize: 9, color: "#888", marginTop: 3, textAlign: "center", lineHeight: 1.2 }}>
                    {formatHalf(p.time)}
                  </div>
                  {p.caption && (
                    <div style={{ fontSize: 9, color: "#aaa", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.caption}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      background: "#E8645A",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      fontSize: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sort Controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["appearance", "longest"].map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              style={{
                background: sortMode === mode ? "#E8645A" : "#1A1A1A",
                color: sortMode === mode ? "#fff" : "#888",
                border: sortMode === mode ? "1px solid #E8645A" : "1px solid #333",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 11,
                fontFamily: "inherit",
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              {mode === "appearance" ? "First Appearance" : "Longest Stay"}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div
          style={{
            background: "#161616",
            borderRadius: 10,
            padding: "20px 20px 12px",
            border: "1px solid #222",
            overflowX: "auto",
          }}
        >
          {/* Activity bars at top */}
          {activities.length > 0 && (
            <div style={{ position: "relative", marginBottom: 16 }}>
              <div style={{ position: "relative", height: activities.length * 28, marginLeft: 100 }}>
                {activities.map((a, i) => {
                  const left = pctOf(a.start);
                  const width = pctOf(a.end) - pctOf(a.start);
                  return (
                    <div
                      key={a.id}
                      style={{
                        position: "absolute",
                        top: i * 28,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: 22,
                        background: "rgba(250, 204, 21, 0.12)",
                        border: "1px solid rgba(250, 204, 21, 0.3)",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "#FACC15",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        padding: "0 6px",
                      }}
                    >
                      {a.title}
                    </div>
                  );
                })}
              </div>
              <div style={{ borderBottom: "1px solid #2A2A2A", marginTop: 8 }} />
            </div>
          )}

          {/* Photo pins row */}
          {sortedPhotos.length > 0 && (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <div style={{ position: "relative", height: 52, marginLeft: 100 }}>
                {sortedPhotos.map((p) => {
                  const left = pctOf(p.time);
                  return (
                    <div
                      key={p.id}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
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
                          width: 36,
                          height: 36,
                          objectFit: "cover",
                          borderRadius: 5,
                          border: "2px solid #E8645A",
                          boxShadow: "0 0 8px rgba(232,100,90,0.3)",
                        }}
                      />
                      <div style={{ width: 1, height: 10, background: "#E8645A55" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ borderBottom: "1px solid #2A2A2A" }} />
            </div>
          )}

          {/* Hour headers */}
          <div style={{ display: "flex", marginLeft: 100, position: "relative", height: 20, marginBottom: 4 }}>
            {HOURS.map((h, i) => (
              <div
                key={h.value}
                style={{
                  position: "absolute",
                  left: `${(i / 13) * 100}%`,
                  fontSize: 9,
                  color: "#555",
                  transform: "translateX(-50%)",
                  letterSpacing: "0.04em",
                }}
              >
                {h.label}
              </div>
            ))}
          </div>

          {/* Grid lines + bars */}
          <div ref={trackRef} style={{ position: "relative", marginLeft: 100 }}>
            {HOURS.map((h, i) => (
              <div
                key={h.value}
                style={{
                  position: "absolute",
                  left: `${(i / 13) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: i === 0 ? "transparent" : "#1E1E1E",
                  zIndex: 0,
                }}
              />
            ))}

            {sorted.length === 0 && (
              <div
                style={{
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#444",
                  fontSize: 12,
                  fontStyle: "italic",
                }}
              >
                Add people to see the timeline
              </div>
            )}

            {sorted.map((person) => {
              const left = pctOf(person.start);
              const width = pctOf(person.end) - pctOf(person.start);
              const duration = person.end - person.start;
              const hrs = Math.floor(duration);
              const mins = (duration % 1) * 60;
              const durLabel = mins > 0 ? `${hrs}h${mins}m` : `${hrs}h`;

              return (
                <div
                  key={person.id}
                  style={{
                    position: "relative",
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: "100%",
                      paddingRight: 10,
                      width: 90,
                      textAlign: "right",
                      fontSize: 12,
                      fontWeight: 600,
                      color: person.color,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {person.name}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: `${left}%`,
                      width: `${width}%`,
                      height: 24,
                      background: `${person.color}22`,
                      border: `1.5px solid ${person.color}88`,
                      borderRadius: 5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: person.color,
                      fontWeight: 600,
                      cursor: "default",
                      minWidth: 20,
                    }}
                  >
                    <div
                      onMouseDown={(e) => handleBarMouseDown(e, person.id, "start")}
                      style={{
                        position: "absolute",
                        left: -3,
                        top: 0,
                        bottom: 0,
                        width: 8,
                        cursor: "ew-resize",
                        borderRadius: "4px 0 0 4px",
                      }}
                    />
                    <span style={{ pointerEvents: "none" }}>{durLabel}</span>
                    <div
                      onMouseDown={(e) => handleBarMouseDown(e, person.id, "end")}
                      style={{
                        position: "absolute",
                        right: -3,
                        top: 0,
                        bottom: 0,
                        width: 8,
                        cursor: "ew-resize",
                        borderRadius: "0 4px 4px 0",
                      }}
                    />
                    <button
                      onClick={() => removePerson(person.id)}
                      style={{
                        position: "absolute",
                        right: -22,
                        background: "none",
                        border: "none",
                        color: "#555",
                        fontSize: 12,
                        cursor: "pointer",
                        padding: 2,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {people.length > 0 && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 14,
                borderTop: "1px solid #222",
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                fontSize: 11,
                color: "#666",
              }}
            >
              <span><span style={{ color: "#888" }}>People:</span> {people.length}</span>
              <span>
                <span style={{ color: "#888" }}>Peak overlap:</span>{" "}
                {(() => {
                  let max = 0;
                  for (let t = 15; t <= 28; t += 0.5) {
                    const count = people.filter((p) => p.start <= t && p.end > t).length;
                    if (count > max) max = count;
                  }
                  return max;
                })()}
              </span>
              <span>
                <span style={{ color: "#888" }}>Longest stay:</span>{" "}
                {(() => {
                  const p = [...people].sort((a, b) => (b.end - b.start) - (a.end - a.start))[0];
                  const d = p.end - p.start;
                  return `${p.name} (${Math.floor(d)}h${(d % 1) * 60 > 0 ? (d % 1) * 60 + "m" : ""})`;
                })()}
              </span>
              <span><span style={{ color: "#888" }}>Photos:</span> {photos.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "pointer",
            padding: 24,
          }}
        >
          <img
            src={lightbox.src}
            alt={lightbox.caption || ""}
            style={{
              maxWidth: "90vw",
              maxHeight: "75vh",
              borderRadius: 10,
              border: "2px solid #333",
              objectFit: "contain",
            }}
          />
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#E8E8E8", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
              {formatHalf(lightbox.time)}
            </div>
            {lightbox.caption && (
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                {lightbox.caption}
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: "#161616",
  borderRadius: 10,
  padding: 20,
  marginBottom: 16,
  border: "1px solid #222",
};

const sectionLabel = {
  fontSize: 11,
  color: "#888",
  letterSpacing: "0.1em",
  marginBottom: 12,
  textTransform: "uppercase",
};

const inputStyle = {
  background: "#0D0D0D",
  border: "1px solid #333",
  borderRadius: 6,
  color: "#E8E8E8",
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  flex: "1 1 120px",
  minWidth: 100,
  outline: "none",
};

const selectStyle = {
  background: "#0D0D0D",
  border: "1px solid #333",
  borderRadius: 6,
  color: "#E8E8E8",
  padding: "8px 8px",
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  cursor: "pointer",
  outline: "none",
};

const btnStyle = {
  background: "#E8645A",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const removeBtnStyle = {
  background: "none",
  border: "none",
  color: "#555",
  fontSize: 11,
  cursor: "pointer",
  padding: "2px 4px",
  lineHeight: 1,
};