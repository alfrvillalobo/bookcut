"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/admin/dashboard");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
      backgroundImage: "radial-gradient(ellipse at 60% 20%, rgba(0,255,135,0.04) 0%, transparent 60%)",
    }}>
      <div style={{
        width: "100%", maxWidth: "400px",
        background: "var(--bg-card)",
        border: "1px solid rgba(0,255,135,0.15)",
        borderRadius: "1.5rem",
        padding: "2.5rem",
        boxShadow: "0 0 40px rgba(0,255,135,0.05)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "16px",
            background: "var(--accent-soft)",
            border: "1px solid rgba(0,255,135,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.75rem", margin: "0 auto 1.25rem",
            boxShadow: "0 0 20px rgba(0,255,135,0.1)",
          }}>✂️</div>
          <h1 style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "1.6rem", fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}>
            Book<span style={{ color: "var(--accent)" }}>Cut</span>
          </h1>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: "0.85rem", marginTop: "0.35rem",
          }}>
            Panel de administración
          </p>
        </div>

        {/* Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{
              fontSize: "0.78rem", fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase", letterSpacing: "0.06em",
              display: "block", marginBottom: "0.5rem",
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bookcut.com"
              style={{
                width: "100%", padding: "0.8rem 1rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                color: "var(--text-primary)",
                fontSize: "0.9rem", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => e.target.style.borderColor = "rgba(0,255,135,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div>
            <label style={{
              fontSize: "0.78rem", fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase", letterSpacing: "0.06em",
              display: "block", marginBottom: "0.5rem",
            }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%", padding: "0.8rem 1rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                color: "var(--text-primary)",
                fontSize: "0.9rem", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => e.target.style.borderColor = "rgba(0,255,135,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          {error && (
            <p style={{
              color: "var(--danger)", fontSize: "0.82rem",
              textAlign: "center", padding: "0.5rem",
              background: "rgba(255,69,96,0.08)",
              borderRadius: "0.5rem",
            }}>{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: "0.9rem",
              borderRadius: "0.75rem",
              background: loading ? "rgba(0,255,135,0.3)" : "var(--accent)",
              border: "none",
              color: "#080C10",
              fontWeight: 700, fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              marginTop: "0.5rem",
              letterSpacing: "0.02em",
              boxShadow: loading ? "none" : "0 0 20px rgba(0,255,135,0.2)",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.boxShadow = "0 0 30px rgba(0,255,135,0.4)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.boxShadow = "0 0 20px rgba(0,255,135,0.2)";
            }}
          >
            {loading ? "Ingresando..." : "Ingresar →"}
          </button>
        </div>
      </div>
    </div>
  );
}