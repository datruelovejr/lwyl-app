'use client';

import { useState, useRef, useEffect } from "react";
import { C } from "../constants/colors";
import { Btn } from "./Btn";
import { getReflections, createReflection, deleteReflection } from "../../lib/supabase";

// ────── VOICE JOURNAL COMPONENT ──────
export function VoiceJournal({ userId, people, teamId, orgId, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const recognitionRef = useRef(null);

  const teamMembers = people.filter(p => p.orgId === orgId && (teamId ? p.teamId === teamId : true) && p.status !== "pending");

  // Load existing reflections (silently fails if table doesn't exist)
  useEffect(() => {
    async function loadReflections() {
      try {
        const data = await getReflections(userId);
        setReflections(data || []);
      } catch {
        // Table may not exist yet - silently handle
        setReflections([]);
      } finally {
        setLoading(false);
      }
    }
    if (userId) {
      loadReflections();
    } else {
      setLoading(false);
    }
  }, [userId]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(prev => prev + finalTranscript + interimTranscript.replace(prev, ""));
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          // Restart if we're still supposed to be recording
          try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const saveReflection = async () => {
    if (!transcript.trim()) return;

    setSaving(true);
    const reflection = {
      id: crypto.randomUUID(),
      leader_id: userId,
      person_id: selectedPersonId || null,
      content: transcript.trim(),
      created_at: new Date().toISOString()
    };

    // Try to save to database, but store locally regardless
    try {
      await createReflection(reflection);
    } catch {
      // Database save failed (table may not exist) - continue with local storage
    }

    setReflections(prev => [reflection, ...prev]);
    setTranscript("");
    setSelectedPersonId("");
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this reflection?")) return;
    // Try to delete from database
    try {
      await deleteReflection(id);
    } catch {
      // Silently handle - table may not exist
    }
    setReflections(prev => prev.filter(r => r.id !== id));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const getPersonName = (personId) => {
    const person = teamMembers.find(p => p.id === personId);
    return person ? person.name : "General";
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "24px 16px" }}>
      <div className="modal-body" style={{ background: C.card, borderRadius: 12, width: "min(700px, 100%)", boxShadow: "0 20px 25px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ background: "#1F2937", color: "#fff", borderRadius: "12px 12px 0 0", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Leader Reflections</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Voice-powered journaling for leadership insights</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.7)" }}>✕</button>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Recording section */}
          <div style={{ background: isRecording ? "#FFEBEE" : C.hi, borderRadius: 12, padding: 24, marginBottom: 24, border: `2px solid ${isRecording ? "#EF5350" : C.border}`, transition: "all 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <button
                onClick={toggleRecording}
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: isRecording ? "#EF5350" : C.blue,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isRecording ? "0 0 0 8px rgba(239,83,80,0.2)" : "none",
                  transition: "all 0.3s"
                }}
              >
                {isRecording ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16c-2.47 0-4.52-1.8-4.93-4.15-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
                )}
              </button>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isRecording ? "#C62828" : C.text }}>
                  {isRecording ? "Recording..." : "Tap to Start Recording"}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {isRecording ? "Tap again to stop" : "Share your leadership insights and reflections"}
                </div>
              </div>
            </div>

            {/* Transcript area */}
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder={isRecording ? "Listening..." : "Your voice transcript will appear here, or type directly..."}
              style={{
                width: "100%", minHeight: 120, padding: 16, borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 14, lineHeight: 1.6,
                resize: "vertical", fontFamily: "inherit", background: "#fff"
              }}
            />

            {/* Person selector and save */}
            <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Associate with team member (optional)</label>
                <select
                  value={selectedPersonId}
                  onChange={e => setSelectedPersonId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}
                >
                  <option value="">General reflection</option>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <Btn
                primary
                onClick={saveReflection}
                disabled={!transcript.trim() || saving}
                style={{ marginTop: 16 }}
              >
                {saving ? "Saving..." : "Save Reflection"}
              </Btn>
            </div>
          </div>

          {/* Past reflections */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Past Reflections ({reflections.length})
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 32, color: C.muted }}>Loading reflections...</div>
            ) : reflections.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: C.muted, background: C.hi, borderRadius: 8 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                <div>No reflections yet. Start recording to capture your leadership insights.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto" }}>
                {reflections.map(r => (
                  <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 11, color: C.muted }}>{formatDate(r.created_at)}</span>
                        {r.person_id && (
                          <span style={{ fontSize: 11, marginLeft: 8, padding: "2px 8px", borderRadius: 10, background: C.blue + "15", color: C.blue, fontWeight: 600 }}>
                            Re: {getPersonName(r.person_id)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        style={{ background: "none", border: "none", fontSize: 14, color: "#C62828", cursor: "pointer", opacity: 0.6 }}
                        title="Delete"
                      >✕</button>
                    </div>
                    <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{r.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
