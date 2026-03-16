"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Stats {
  citas_hoy: number;
  citas_mes: number;
  semana: { date: string; citas: number }[];
}

interface AppointmentService { service: { name: string; price: number; duration: number }; }
interface Appointment {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  total: number;
  client: { name: string; phone: string | null };
  services: AppointmentService[];
}

interface Ingresos {
  ingresos_semana: number;
  ingresos_mes: number;
  por_dia: { date: string; ingresos: number }[];
}

const statusColors: Record<string, string> = {
  confirmed: "#00FF87",
  pending:   "#FFB800",
  cancelled: "#FF4560",
  completed: "#6B7F70",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmada",
  pending:   "Pendiente",
  completed: "Completada",
  cancelled: "Cancelada",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [today, setToday]   = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingresos, setIngresos] = useState<Ingresos | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/stats/dashboard"),
      api.get("/appointments/today"),
      api.get("/stats/ingresos"),
    ]).then(([s, t, i]) => {
      setStats(s.data);
      setToday(t.data);
      setIngresos(i.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            width: "18px", height: "18px", borderRadius: "50%",
            border: "2px solid var(--accent)", borderTopColor: "transparent",
            display: "inline-block", animation: "spin 0.8s linear infinite",
          }} />
          Cargando...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const maxCitas = Math.max(...(stats?.semana.map(d => d.citas) || [1]), 1);
  const proximasCitas = today.filter(a => a.status !== "cancelled" && a.status !== "completed");
  const ingresosDia = today
    .filter(a => a.status === "completed")
    .reduce((sum, a) => sum + a.total, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Bienvenida */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Hola, {user?.name.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/citas")}
          style={{
            padding: "0.65rem 1.25rem", borderRadius: "0.75rem",
            background: "var(--accent)", border: "none",
            color: "#080C10", fontWeight: 700, fontSize: "0.875rem",
            cursor: "pointer", boxShadow: "0 0 15px rgba(0,255,135,0.2)",
          }}
        >
          + Nueva cita
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {[
          { icon: "📅", label: "Citas hoy",       value: stats?.citas_hoy ?? 0,  accent: true,  suffix: "" },
          { icon: "📆", label: "Citas este mes",   value: stats?.citas_mes ?? 0,  accent: false, suffix: "" },
          { icon: "⏳", label: "Próximas hoy",     value: proximasCitas.length,   accent: false, suffix: "" },
          { icon: "💰", label: "Ingresos del día", value: ingresosDia,            accent: false, suffix: "$", prefix: true },
        ].map(({ icon, label, value, accent, suffix, prefix }) => (
          <div key={label} style={{
            background: "var(--bg-card)",
            border: `1px solid ${accent ? "rgba(0,255,135,0.2)" : "var(--border)"}`,
            borderRadius: "1rem", padding: "1.25rem",
            boxShadow: accent ? "0 0 20px rgba(0,255,135,0.05)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: accent ? "var(--accent-soft)" : "var(--bg-secondary)",
                border: `1px solid ${accent ? "rgba(0,255,135,0.2)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem",
              }}>{icon}</div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{label}</span>
            </div>
            <p style={{
              fontFamily: "Sora, sans-serif", fontSize: "1.75rem", fontWeight: 700,
              color: accent ? "var(--accent)" : "var(--text-primary)",
            }}>
              {prefix ? `$${value.toLocaleString()}` : value}{!prefix && suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico + Próximas citas */}
      <div className="dashboard-charts" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Card Ingresos */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid rgba(0,255,135,0.15)",
        borderRadius: "1rem", padding: "1.5rem",
        boxShadow: "0 0 30px rgba(0,255,135,0.04)",
      }}>
        <h3 style={{
          fontFamily: "Sora, sans-serif", fontWeight: 600,
          fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "1.25rem",
        }}>
          💰 Ingresos
        </h3>

        {/* Totales */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Esta semana", value: ingresos?.ingresos_semana ?? 0 },
            { label: "Este mes",    value: ingresos?.ingresos_mes    ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} style={{
              padding: "1.1rem", borderRadius: "0.875rem",
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              textAlign: "center",
            }}>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                {label}
              </p>
              <p style={{
                fontFamily: "Sora, sans-serif", fontSize: "1.6rem", fontWeight: 700,
                color: value > 0 ? "var(--accent)" : "var(--text-secondary)",
              }}>
                ${value.toLocaleString("es-CL")}
              </p>
            </div>
          ))}
        </div>

        {/* Gráfico de barras por día */}
        {ingresos && ingresos.por_dia.length > 0 ? (
          <div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Ingresos por día esta semana
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "80px" }}>
              {ingresos.por_dia.map((d) => {
                const maxVal = Math.max(...ingresos.por_dia.map(x => x.ingresos), 1);
                const height = d.ingresos > 0 ? (d.ingresos / maxVal) * 100 : 4;
                const isToday = d.date === new Date().toISOString().split("T")[0];
                return (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", height: "100%" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--accent)", fontWeight: 700, minHeight: "0.9rem" }}>
                      {d.ingresos > 0 ? `$${(d.ingresos / 1000).toFixed(0)}k` : ""}
                    </span>
                    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end" }}>
                      <div style={{
                        width: "100%",
                        height: `${height}%`,
                        background: isToday ? "var(--accent)" : "rgba(0,255,135,0.25)",
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.3s ease",
                        boxShadow: isToday ? "0 0 10px rgba(0,255,135,0.3)" : "none",
                      }} />
                    </div>
                    <span style={{
                      fontSize: "0.65rem",
                      color: isToday ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: isToday ? 700 : 400,
                    }}>
                      {new Date(d.date + "T12:00:00").toLocaleDateString("es-CL", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: "center", padding: "1rem 0",
            color: "var(--text-secondary)", fontSize: "0.875rem",
          }}>
            <p>Los ingresos se calculan con citas marcadas como <strong style={{ color: "var(--accent)" }}>completadas</strong></p>
          </div>
        )}
      </div>

        {/* Gráfico */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: "1.5rem",
        }}>
          <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "1.25rem" }}>
            Citas — últimos 7 días
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "120px" }}>
            {stats?.semana.map((d) => {
              const height = (d.citas / maxCitas) * 100;
              const isToday = d.date === new Date().toISOString().split("T")[0];
              return (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", height: "100%" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 700, minHeight: "1rem" }}>
                    {d.citas > 0 ? d.citas : ""}
                  </span>
                  <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end" }}>
                    <div style={{
                      width: "100%",
                      height: d.citas === 0 ? "4px" : `${height}%`,
                      background: isToday ? "var(--accent)" : "rgba(0,255,135,0.25)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                      boxShadow: isToday ? "0 0 10px rgba(0,255,135,0.3)" : "none",
                    }} />
                  </div>
                  <span style={{
                    fontSize: "0.65rem",
                    color: isToday ? "var(--accent)" : "var(--text-secondary)",
                    fontWeight: isToday ? 700 : 400,
                  }}>
                    {new Date(d.date + "T12:00:00").toLocaleDateString("es-CL", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda de hoy */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: "1.5rem", overflow: "hidden",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
              Agenda de hoy
            </h3>
            <span style={{
              fontSize: "0.72rem", fontWeight: 700,
              color: "var(--accent)", background: "var(--accent-soft)",
              padding: "0.2rem 0.6rem", borderRadius: "999px",
              border: "1px solid rgba(0,255,135,0.2)",
            }}>
              {today.filter(a => a.status !== "cancelled").length} citas
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "200px", overflowY: "auto" }}>
            {today.filter(a => a.status !== "cancelled").length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🌿</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Sin citas para hoy</p>
              </div>
            ) : today
                .filter(a => a.status !== "cancelled")
                .map((a) => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem", borderRadius: "0.75rem",
                background: "var(--bg-secondary)", border: "1px solid var(--border)",
              }}>
                <div style={{
                  fontSize: "0.75rem", fontWeight: 700,
                  color: "var(--accent)", minWidth: "42px", textAlign: "center",
                  fontFamily: "Sora, sans-serif",
                }}>
                  {new Date(a.start_time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{a.client.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {a.services.map(s => s.service.name).join(" + ")}
                  </p>
                </div>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700,
                  color: statusColors[a.status],
                  background: `${statusColors[a.status]}15`,
                  padding: "0.2rem 0.5rem", borderRadius: "999px",
                  border: `1px solid ${statusColors[a.status]}30`,
                  whiteSpace: "nowrap",
                }}>
                  {statusLabels[a.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>    
    </div>
  );
}