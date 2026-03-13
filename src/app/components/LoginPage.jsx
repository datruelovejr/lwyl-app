'use client';

import { useState } from "react";
import { C } from "../constants/colors";
import { signIn, signUp, resetPassword } from "../../lib/supabase";

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [remember, setRemember] = useState(false);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const inputStyle = (field) => ({
    width: "100%", height: 48, padding: "0 16px", borderRadius: 8, fontSize: 16,
    border: `1px solid ${focused === field ? C.blue : "#D1D5DB"}`,
    boxShadow: focused === field ? "0 0 0 3px rgba(41,182,246,0.1)" : "none",
    outline: "none", boxSizing: "border-box", transition: "border 0.15s, box-shadow 0.15s",
    background: "#fff", color: C.text,
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      onLogin();
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess("Account created! Check your email to confirm your account.");
      setMode("signin");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setMode("reset-sent");
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* Desktop branding — hidden on mobile via CSS */}
        <div className="login-branding-desktop" style={{ background: "linear-gradient(160deg, #E3F7FF 0%, #F0FAF0 100%)", padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ marginBottom: 12 }}>
            <circle cx="36" cy="36" r="34" stroke={C.blue} strokeWidth="4" fill="#fff" />
            <circle cx="36" cy="36" r="6" fill={C.blue} />
            <line x1="36" y1="4" x2="36" y2="20" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
            <line x1="36" y1="52" x2="36" y2="68" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
            <line x1="4" y1="36" x2="20" y2="36" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
            <line x1="52" y1="36" x2="68" y2="36" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
            <line x1="36" y1="10" x2="48" y2="28" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 12, letterSpacing: "-0.5px" }}>
            LOVE WHERE<br />YOU LEAD
          </div>
          <div style={{ fontSize: 16, color: C.muted, marginBottom: 40, lineHeight: 1.5 }}>
            The Environment You Need.<br />Right Where You Are.
          </div>

          <svg width="280" height="220" viewBox="0 0 280 220" fill="none">
            <rect x="20" y="180" width="240" height="16" rx="4" fill={C.blue} opacity="0.15" />
            <rect x="40" y="155" width="200" height="16" rx="4" fill={C.blue} opacity="0.2" />
            <rect x="65" y="130" width="155" height="16" rx="4" fill={C.blue} opacity="0.3" />
            <rect x="90" y="105" width="110" height="16" rx="4" fill={C.blue} opacity="0.4" />
            <rect x="115" y="80" width="70" height="16" rx="4" fill={C.blue} opacity="0.55" />
            <line x1="150" y1="80" x2="150" y2="20" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="150,20 175,33 150,46" fill="#FFC107" />
            <circle cx="140" cy="68" r="9" fill={C.blue} />
            <path d="M132 90 Q140 78 148 90 L145 115 H135 Z" fill={C.blue} opacity="0.8" />
            <circle cx="110" cy="93" r="8" fill="#4CAF50" />
            <path d="M103 112 Q110 101 117 112 L115 134 H106 Z" fill="#4CAF50" opacity="0.8" />
            <circle cx="82" cy="118" r="7" fill="#1F2937" />
            <path d="M76 135 Q82 125 88 135 L86 155 H78 Z" fill="#1F2937" opacity="0.8" />
            <path d="M118 100 Q125 90 132 82" stroke={C.blue} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
            <path d="M89 124 Q100 112 103 108" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
          </svg>
        </div>

        {/* Mobile branding — hidden on desktop via CSS */}
        <div className="login-branding-mobile" style={{ background: "linear-gradient(160deg, #E3F7FF 0%, #F0FAF0 100%)", padding: "32px 24px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 4, letterSpacing: "-0.5px" }}>
            LOVE WHERE YOU LEAD
          </div>
          <div style={{ fontSize: 14, color: C.muted }}>The Environment You Need. Right Where You Are.</div>
        </div>

        {/* Form — always visible */}
        <div className="login-form" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {mode === "signin" && (
            <>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Welcome back</div>
              <div style={{ fontSize: 15, color: C.muted, marginBottom: 36 }}>Sign in to your Love Where You Lead account</div>

              {error && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>{error}</div>}
              {success && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#D1FAE5", color: "#059669", fontSize: 14, marginBottom: 20 }}>{success}</div>}

              <form onSubmit={handleSignIn} aria-label="Sign in form">
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    style={inputStyle("email")} autoComplete="email" required />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    style={inputStyle("password")} autoComplete="current-password" required />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.muted, cursor: "pointer" }}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.blue }} />
                    Remember me
                  </label>
                  <button type="button" onClick={() => { resetForm(); setMode("forgot"); }} style={{ background: "none", border: "none", fontSize: 14, color: C.blue, cursor: "pointer", padding: 0, fontWeight: 500 }}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px 24px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : C.blue, color: "#fff", fontSize: 16, fontWeight: 600, cursor: loading ? "default" : "pointer", transition: "background 0.15s" }}>
                  {loading ? "Signing in..." : "Sign In to Your Dashboard"}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: C.muted }}>
                Don't have an account?{" "}
                <button onClick={() => { resetForm(); setMode("signup"); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", padding: 0, fontWeight: 600, fontSize: 14 }}>
                  Create one
                </button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Create your account</div>
              <div style={{ fontSize: 15, color: C.muted, marginBottom: 36 }}>Start your leadership transformation journey</div>

              {error && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>{error}</div>}

              <form onSubmit={handleSignUp} aria-label="Sign up form">
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name"
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                    style={inputStyle("name")} autoComplete="name" required />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    style={inputStyle("email")} autoComplete="email" required />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password (min 6 characters)"
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    style={inputStyle("password")} autoComplete="new-password" required />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password"
                    onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                    style={inputStyle("confirm")} autoComplete="new-password" required />
                </div>

                <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px 24px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : C.blue, color: "#fff", fontSize: 16, fontWeight: 600, cursor: loading ? "default" : "pointer", transition: "background 0.15s" }}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: C.muted }}>
                Already have an account?{" "}
                <button onClick={() => { resetForm(); setMode("signin"); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", padding: 0, fontWeight: 600, fontSize: 14 }}>
                  Sign in
                </button>
              </div>
            </>
          )}

          {mode === "forgot" && (
            <>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Reset your password</div>
              <div style={{ fontSize: 15, color: C.muted, marginBottom: 36 }}>Enter your email and we'll send you a reset link</div>

              {error && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>{error}</div>}

              <form onSubmit={handleForgotPassword} aria-label="Reset password form">
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    style={inputStyle("email")} autoComplete="email" required />
                </div>

                <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px 24px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : C.blue, color: "#fff", fontSize: 16, fontWeight: 600, cursor: loading ? "default" : "pointer", transition: "background 0.15s" }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: C.muted }}>
                <button onClick={() => { resetForm(); setMode("signin"); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", padding: 0, fontWeight: 600, fontSize: 14 }}>
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {mode === "reset-sent" && (
            <>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Check your email</div>
                <div style={{ fontSize: 15, color: C.muted, marginBottom: 36, lineHeight: 1.6 }}>
                  We've sent a password reset link to<br /><strong>{email}</strong>
                </div>
                <button onClick={() => { resetForm(); setMode("signin"); }} style={{ padding: "14px 32px", borderRadius: 8, border: "none", background: C.blue, color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: C.muted }}>
            🔒 Secure Login
          </div>
        </div>
      </div>
    </div>
  );
}
