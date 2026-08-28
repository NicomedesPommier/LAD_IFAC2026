// =============================================================
// FILE: src/pages/Home.jsx
// Pantalla de inicio + login gate: si no hay sesión, muestra login.
// =============================================================
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/pages/_home.scss";

export default function Home() {
  const navigate = useNavigate();
  const { user, login, logout, register, loading } = useAuth();
  const startRef = useRef(null);
  const [mode, setMode] = useState("login");

  useEffect(() => {
    if (user) startRef.current?.focus();
  }, [user]);

  function handleStart() {
    navigate("/Learn");
  }

  function handleResearch() {
    navigate("/research");
  }

  function handleBetaTest() {
    navigate("/betatest");
  }

  return (
    <div className="screen">
      <div className="overlay overlay--scan" />
      <div className="overlay overlay--vignette" />
      <div className="stars" aria-hidden />
      <div className="stars stars--2" aria-hidden />
      <div className="stars stars--3" aria-hidden />

      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <main className="content">
        <h1 className="title">
          <span>L.A.D</span>
          <small>{user ? "Learn Autonomous Driving" : "LOGIN TO L.A.D"}</small>
        </h1>

        {!user ? (
          <>
            <div className="auth-toggle" role="tablist" aria-label="Auth selector">
              <button
                type="button"
                className={`auth-toggle__btn ${mode === "login" ? "is-active" : ""}`}
                onClick={() => setMode("login")}
                aria-pressed={mode === "login"}
              >
                Log in
              </button>
              <button
                type="button"
                className={`auth-toggle__btn ${mode === "register" ? "is-active" : ""}`}
                onClick={() => setMode("register")}
                aria-pressed={mode === "register"}
              >
                Create account
              </button>
            </div>

            {mode === "login" ? (
              <LoginCard onLogin={login} loading={loading} />
            ) : (
              <RegisterCard
                onRegister={register}
                loading={loading}
                onSwitch={() => setMode("login")}
              />
            )}
          </>
        ) : (
          <div className="menu">
            <button ref={startRef} onClick={handleStart} className="start">
              ▶ START Learning
            </button>
            <button className="btn ghost" disabled>
              MISIONS
            </button>
            <button className="btn" onClick={handleResearch}>
              RESEARCH
            </button>
            <button className="btn" onClick={handleBetaTest}>
              BETA TEST
            </button>
            <button className="btn" onClick={logout}>
              Logout
            </button>
          </div>
        )}

        <div className="hints">
          {user ? (
            <>
              <div>Developed at Universidad Adolfo Ibáñez</div>
            </>
          ) : (
            <div>PLACEHOLDER</div>
          )}
        </div>
      </main>

      <footer className="footer">© {new Date().getFullYear()} Nicomedes Pommier</footer>
    </div>
  );
}

function LoginCard({ onLogin, loading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const ok = await onLogin(username, password);
      if (!ok) setError("Could not login");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <div className="login__panel">
        <div className="login__title">LOGIN</div>
        <label className="login__field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="player1"
            required
          />
        </label>
        <label className="login__field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        {error && <div className="login__error">{error}</div>}
        <button type="submit" className="start" disabled={loading}>
          {loading ? "Connecting…" : "▶ START"}
        </button>
      </div>
    </form>
  );
}

function RegisterCard({ onRegister, loading, onSwitch }) {
  const [form, setForm] = useState({ username: "", password: "", confirm: "", email: "", invite: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    try {
      const ok = await onRegister({
        username: form.username,
        password: form.password,
        email: form.email || undefined,
        inviteCode: form.invite || undefined,
      });
      if (ok) {
        setSuccess("Cuenta creada. Iniciando sesión…");
        setTimeout(() => onSwitch?.(), 1500);
      }
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta");
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <div className="login__panel">
        <div className="login__title">Crear cuenta</div>
        <label className="login__field">
          <span>Username</span>
          <input
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            placeholder="student01"
            required
          />
        </label>
        <label className="login__field">
          <span>Email (opcional)</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="login__field">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        <label className="login__field">
          <span>Confirmar password</span>
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => updateField("confirm", e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        <label className="login__field">
          <span>Invite code (if required)</span>
          <input
            value={form.invite}
            onChange={(e) => updateField("invite", e.target.value)}
            placeholder="beta invite code"
            autoComplete="off"
          />
        </label>
        {error && <div className="login__error">{error}</div>}
        {success && <div className="login__success">{success}</div>}
        <button type="submit" className="start" disabled={loading}>
          {loading ? "Creando…" : "▶ Crear cuenta"}
        </button>
      </div>
    </form>
  );
}
