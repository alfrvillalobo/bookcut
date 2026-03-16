"use client";
import { useEffect, useState } from "react";

interface Slot    { time: string; available: boolean; }
interface Service { id: number; name: string; duration: number; price: number; description: string | null; }

export default function AgendaPublica() {
  const [services, setServices]         = useState<Service[]>([]);
  const [date, setDate]                 = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots]               = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API}/public/services`)
      .then((r) => r.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    fetch(`${API}/public/availability?fecha=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  const available = slots.filter((s) => s.available).length;
  const taken     = slots.filter((s) => !s.available).length;

  const whatsappMsg = encodeURIComponent(
    `Hola! Quiero reservar una cita para el ${new Date(date + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}. ¿Qué horarios tienen disponibles?`
  );

  return (
    <>
      <style>{`
        .agenda-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .agenda-hero h1 {
          font-size: clamp(1.6rem, 5vw, 2.4rem);
        }
        @media (max-width: 768px) {
          .agenda-grid {
            grid-template-columns: 1fr;
          }
          .agenda-header {
            padding: 1rem !important;
          }
          .agenda-hero {
            margin-bottom: 1.5rem !important;
          }
        }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "var(--bg-primary)",
        backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(0,255,135,0.04) 0%, transparent 60%)",
      }}>

        {/* Header */}
        <header className="agenda-header" style={{
          borderBottom: "1px solid var(--border)",
          padding: "1.25rem 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg-secondary)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--accent-soft)", border: "1px solid rgba(0,255,135,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
            }}>✂️</div>
            <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
              Book<span style={{ color: "var(--accent)" }}>Cut</span>
            </span>
          </div>          
        </header>

        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>

          {/* Hero */}
          <div className="agenda-hero" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h1 style={{
              fontFamily: "Sora, sans-serif", fontWeight: 700,
              color: "var(--text-primary)", marginBottom: "0.75rem",
            }}>
              Consulta nuestra{" "}
              <span style={{ color: "var(--accent)" }}>disponibilidad</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "480px", margin: "0 auto" }}>
              Elige una fecha y contáctanos para confirmar tu hora
            </p>
          </div>

          <div className="agenda-grid">

            {/* Columna izquierda */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Selector fecha */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "1rem", padding: "1.5rem",
              }}>
                <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                  📅 Selecciona una fecha
                </h2>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem 1rem",
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                    borderRadius: "0.75rem", color: "var(--text-primary)",
                    fontSize: "0.9rem", outline: "none", colorScheme: "dark",
                  }}
                />

                {/* Resumen disponibilidad */}
                {slots.length > 0 && (
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                    <div style={{
                      flex: 1, padding: "0.75rem", borderRadius: "0.75rem", textAlign: "center",
                      background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)",
                    }}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)", fontFamily: "Sora, sans-serif" }}>{available}</p>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Disponibles</p>
                    </div>
                    <div style={{
                      flex: 1, padding: "0.75rem", borderRadius: "0.75rem", textAlign: "center",
                      background: "rgba(255,69,96,0.06)", border: "1px solid rgba(255,69,96,0.15)",
                    }}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--danger)", fontFamily: "Sora, sans-serif" }}>{taken}</p>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Ocupados</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Horarios */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "1rem", padding: "1.5rem",
              }}>
                <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                  ⏰ Horarios del día
                </h2>
                {loadingSlots ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <span style={{
                      width: "14px", height: "14px", borderRadius: "50%",
                      border: "2px solid var(--accent)", borderTopColor: "transparent",
                      display: "inline-block", animation: "spin 0.8s linear infinite",
                    }} />
                    Cargando horarios...
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
                    {slots.map((slot) => (
                      <div key={slot.time} style={{
                        padding: "0.5rem 0.25rem", borderRadius: "0.5rem", textAlign: "center",
                        background: slot.available ? "rgba(0,255,135,0.06)" : "rgba(255,69,96,0.05)",
                        border: `1px solid ${slot.available ? "rgba(0,255,135,0.15)" : "rgba(255,69,96,0.1)"}`,
                        fontSize: "0.75rem", fontWeight: 600,
                        color: slot.available ? "var(--accent)" : "rgba(255,255,255,0.2)",
                      }}>
                        {slot.time}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Servicios */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "1rem", padding: "1.5rem", flex: 1,
              }}>
                <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                  ✂️ Nuestros servicios
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {services.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Cargando servicios...</p>
                  ) : services.map((s) => (
                    <div key={s.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "0.75rem 1rem", borderRadius: "0.75rem",
                      background: "var(--bg-secondary)", border: "1px solid var(--border)",
                      transition: "border-color 0.15s",
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(0,255,135,0.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{s.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>
                          {s.description && ` · ${s.description}`}
                        </p>
                      </div>
                      <span style={{
                        fontWeight: 700, color: "var(--accent)",
                        fontFamily: "Sora, sans-serif", fontSize: "1rem",
                        whiteSpace: "nowrap", marginLeft: "1rem",
                      }}>
                        ${s.price.toLocaleString("es-CL")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA WhatsApp */}
              <div style={{
                background: "var(--accent-soft)", border: "1px solid rgba(0,255,135,0.2)",
                borderRadius: "1rem", padding: "1.5rem", textAlign: "center",
                boxShadow: "0 0 30px rgba(0,255,135,0.05)",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
                <p style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                  ¿Listo para reservar?
                </p>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                  Escríbenos por WhatsApp y te confirmamos tu hora al instante
                </p>
                
                  <a href={`https://wa.me/56912345678?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block", padding: "0.85rem 1.75rem",
                    borderRadius: "0.75rem", background: "var(--accent)",
                    color: "#080C10", fontWeight: 700, fontSize: "0.9rem",
                    textDecoration: "none", boxShadow: "0 0 20px rgba(0,255,135,0.25)",
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 30px rgba(0,255,135,0.4)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(0,255,135,0.25)"}
                >
                  Reservar por WhatsApp →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
