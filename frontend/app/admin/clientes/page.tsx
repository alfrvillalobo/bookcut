"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

const empty = { name: "", email: "", phone: "" };

const validateForm = (form: typeof empty) => {
  const errors: { name?: string; email?: string; phone?: string } = {};
  if (!form.name || form.name.trim().length < 2)
    errors.name = "Nombre debe tener al menos 2 caracteres";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Email inválido";
  if (form.phone && !/^\+?[\d\s\-]{7,15}$/.test(form.phone))
    errors.phone = "Teléfono inválido";
  return errors;
};

export default function ClientesPage() {
  const [clients, setClients]     = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Client | null>(null);
  const [form, setForm]           = useState(empty);
  const [errors, setErrors]       = useState<{ name?: string; email?: string; phone?: string }>({});
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");

  const fetchClients = async () => {
    const res = await api.get("/clients/");
    setClients(res.data);
  };

  useEffect(() => { fetchClients(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setErrors({}); setShowModal(true); };
  const openEdit   = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "" });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (editing) {
        await api.patch(`/clients/${editing.id}`, form);
      } else {
        await api.post("/clients/", form);
      }
      await fetchClients();
      setShowModal(false);
    } catch {
      setErrors({ name: "Error al guardar. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    await api.delete(`/clients/${id}`);
    await fetchClients();
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Clientes
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            {clients.length} clientes registrados
          </p>
        </div>
        <button onClick={openCreate} style={btnStyle}>+ Nuevo cliente</button>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="🔍  Buscar por nombre, email o teléfono..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "0.75rem 1rem",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "0.75rem", color: "var(--text-primary)",
          fontSize: "0.9rem", outline: "none", marginBottom: "1rem",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => e.target.style.borderColor = "rgba(0,255,135,0.3)"}
        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
      />

      {/* VISTA DESKTOP — Tabla */}
      <div className="clientes-table" style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "1rem", overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Nombre", "Email", "Teléfono", "Acciones"].map((h) => (
                <th key={h} style={{
                  padding: "0.9rem 1.25rem", textAlign: "left",
                  fontSize: "0.75rem", fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  background: "var(--bg-secondary)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "50%",
                      background: "var(--accent-soft)", border: "1px solid rgba(0,255,135,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)",
                    }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  {c.email || <span style={{ opacity: 0.4 }}>—</span>}
                </td>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  {c.phone || <span style={{ opacity: 0.4 }}>—</span>}
                </td>
                <td style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => openEdit(c)} style={editBtnStyle}>Editar</button>
                    <button onClick={() => handleDelete(c.id)} style={deleteBtnStyle}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👤</p>
            <p>{search ? "No se encontraron resultados" : "No hay clientes aún."}</p>
          </div>
        )}
      </div>

      {/* VISTA MÓVIL — Cards */}
      <div className="clientes-mobile" style={{ display: "none", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: "1rem", border: "1px dashed var(--border)" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👤</p>
            <p>{search ? "No se encontraron resultados" : "No hay clientes aún."}</p>
          </div>
        ) : filtered.map((c) => (
          <div key={c.id} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "1rem", padding: "1rem",
            transition: "border-color 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: "var(--accent-soft)", border: "1px solid rgba(0,255,135,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", fontWeight: 700, color: "var(--accent)",
                }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>{c.name}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => openEdit(c)} style={editBtnStyle}>Editar</button>
                <button onClick={() => handleDelete(c.id)} style={deleteBtnStyle}>Eliminar</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
              {c.email && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  📧 {c.email}
                </p>
              )}
              {c.phone && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  📞 {c.phone}
                </p>
              )}
              {!c.email && !c.phone && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", opacity: 0.5 }}>Sin datos de contacto</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "var(--bg-card)", border: "1px solid rgba(0,255,135,0.15)",
            borderRadius: "1.25rem", padding: "2rem",
            width: "100%", maxWidth: "420px",
            boxShadow: "0 0 40px rgba(0,255,135,0.05)",
          }}>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
              {editing ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Nombre *",  key: "name",  type: "text",  placeholder: "Ej: Juan Pérez"       },
                { label: "Email",     key: "email", type: "email", placeholder: "juan@email.com"       },
                { label: "Teléfono", key: "phone", type: "text",  placeholder: "+56 9 1234 5678"      },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => {
                      setForm({ ...form, [key]: e.target.value });
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
  color: "var(--text-secondary)", fontWeight: 600,
  fontSize: "0.875rem", cursor: "pointer", flex: 1,
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