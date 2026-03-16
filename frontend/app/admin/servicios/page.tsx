"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
}

const empty = { name: "", description: "", price: 0 };

const validateForm = (form: typeof empty) => {
  const errors: { name?: string; description?: string; price?: string } = {};
  if (!form.name || form.name.trim().length < 2)
    errors.name = "Nombre debe tener al menos 2 caracteres";
  if (!form.price || form.price <= 0)
    errors.price = "El precio debe ser mayor a 0";
  return errors;
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Service | null>(null);
  const [form, setForm]           = useState(empty);
  const [errors, setErrors] = useState<{ name?: string; description?: string; price?: string }>({});
  const [loading, setLoading]     = useState(false);
  
  const fetchServices = async () => {
    const res = await api.get("/services/");
    setServices(res.data);
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setErrors({}); setShowModal(true); };
  const openEdit   = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || "", price: s.price });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (editing) {
        await api.patch(`/services/${editing.id}`, form);
      } else {
        await api.post("/services/", form);
      }
      await fetchServices();
      setShowModal(false);
    } catch {
      setErrors({ name: "Error al guardar. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    await api.delete(`/services/${id}`);
    await fetchServices();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Servicios
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            {services.length} servicios activos
          </p>
        </div>
        <button onClick={openCreate} style={btnStyle}>+ Nuevo servicio</button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {services.map((s) => (
          <div key={s.id} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "1rem", padding: "1.25rem", transition: "border-color 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(0,255,135,0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: "1rem" }}>
                <h3 style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{s.name}</h3>
                {s.description && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{s.description}</p>
                )}
              </div>
              <span style={{
                fontSize: "1.2rem", fontWeight: 700,
                color: "var(--accent)", fontFamily: "Sora, sans-serif",
                whiteSpace: "nowrap",
              }}>
                ${s.price.toLocaleString("es-CL")}
              </span>
            </div>
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: "0.5rem",
              paddingTop: "0.75rem", borderTop: "1px solid var(--border)",
            }}>
              <button onClick={() => openEdit(s)} style={editBtnStyle}>Editar</button>
              <button onClick={() => handleDelete(s.id)} style={deleteBtnStyle}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div style={{
          textAlign: "center", padding: "3rem",
          color: "var(--text-secondary)", background: "var(--bg-card)",
          borderRadius: "1rem", border: "1px dashed var(--border)",
        }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✂️</p>
          <p>No hay servicios aún. Crea el primero.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "var(--bg-card)", border: "1px solid rgba(0,255,135,0.15)",
            borderRadius: "1.25rem", padding: "2rem", width: "100%", maxWidth: "400px",
            boxShadow: "0 0 40px rgba(0,255,135,0.05)",
          }}>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
              {editing ? "Editar servicio" : "Nuevo servicio"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Nombre *",      key: "name",        type: "text",   placeholder: "Ej: Corte clásico" },
                { label: "Descripción",   key: "description", type: "text",   placeholder: "Opcional"          },
                { label: "Precio ($) *",  key: "price",       type: "number", placeholder: "10000"             },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => {
                      setForm({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value });
                      if ((errors as any)[key]) setErrors({ ...errors, [key]: undefined });
                    }}
                    style={{ ...inputStyle, borderColor: (errors as any)[key] ? "var(--danger)" : "var(--border)" }}
                    onFocus={(e) => { if (!(errors as any)[key]) e.target.style.borderColor = "rgba(0,255,135,0.4)"; }}
                    onBlur={(e)  => { if (!(errors as any)[key]) e.target.style.borderColor = "var(--border)"; }}
                  />
                  {(errors as any)[key] && (
                    <p style={{ color: "var(--danger)", fontSize: "0.78rem", marginTop: "0.3rem" }}>
                      {(errors as any)[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setShowModal(false)} style={cancelBtnStyle}>Cancelar</button>
              <button onClick={handleSave} disabled={loading} style={{ ...btnStyle, flex: 1 }}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.65rem 1.25rem", borderRadius: "0.75rem",
  background: "var(--accent)", border: "none",
  color: "#080C10", fontWeight: 700, fontSize: "0.875rem",
  cursor: "pointer", boxShadow: "0 0 15px rgba(0,255,135,0.2)",
};
const cancelBtnStyle: React.CSSProperties = {
  padding: "0.65rem 1.25rem", borderRadius: "0.75rem",
  background: "transparent", border: "1px solid var(--border)",
  color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem",
  cursor: "pointer", flex: 1,
};
const editBtnStyle: React.CSSProperties = {
  padding: "0.35rem 0.75rem", borderRadius: "0.5rem",
  background: "var(--accent-soft)", border: "1px solid rgba(0,255,135,0.2)",
  color: "var(--accent)", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
};
const deleteBtnStyle: React.CSSProperties = {
  padding: "0.35rem 0.75rem", borderRadius: "0.5rem",
  background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.2)",
  color: "var(--danger)", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)",
  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.75rem 1rem",
  background: "var(--bg-secondary)", border: "1px solid var(--border)",
  borderRadius: "0.75rem", color: "var(--text-primary)",
  fontSize: "0.9rem", outline: "none", transition: "border-color 0.15s",
};