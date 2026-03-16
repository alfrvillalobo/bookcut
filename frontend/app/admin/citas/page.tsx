"use client";
import { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import api from "@/lib/api";

interface Client  { id: number; name: string; email: string | null; phone: string | null; }
interface Service { id: number; name: string; price: number; }
interface AppointmentService { service: Service; }
interface Appointment {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  total: number;
  client: Client;
  services: AppointmentService[];
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
  cancelled: "Cancelada",
  completed: "Completada",
};

export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients]   = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal]   = useState(false);
  const [showDetail, setShowDetail] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<{time: string; available: boolean}[]>([]);
  const [form, setForm] = useState({
    client_id: 0,
    service_ids: [] as number[],
    date: "", time: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const [appts, cls, svcs] = await Promise.all([
      api.get("/appointments/"),
      api.get("/clients/"),
      api.get("/services/"),
    ]);
    setAppointments(appts.data);
    setClients(cls.data);
    setServices(svcs.data);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Cargar disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (!form.date) return;
    api.get(`/public/availability?fecha=${form.date}`)
      .then((res) => setAvailableSlots(res.data.slots))
      .catch(() => setAvailableSlots([]));
  }, [form.date]);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const openCreate = (dateStr?: string) => {
    setErrors({});
    setForm({ client_id: 0, service_ids: [], date: dateStr || "", time: "", notes: "" });
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.client_id || form.client_id === 0)
      errs.client_id = "Selecciona un cliente";
    if (form.service_ids.length === 0)
      errs.service_ids = "Selecciona al menos un servicio";
    if (!form.date)
      errs.date = "Selecciona una fecha";
    else {
      const selected = new Date(`${form.date}T${form.time || "00:00"}:00`);
      const now = new Date();
      if (selected < now)
        errs.time = "No puedes agendar en una hora que ya pasó";
    }
    if (!form.time)
      errs.time = "Selecciona un horario disponible";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const start_time = `${form.date}T${form.time}:00`;
      await api.post("/appointments/", {
        client_id:   form.client_id,
        service_ids: form.service_ids,
        start_time,
        notes: form.notes || null,
      });
      await fetchAll();
      setShowModal(false);
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg).join(", ")
        : detail || "Error al guardar la cita";
      setErrors({ time: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    setConfirmModal({
      title: "¿Marcar como completada?",
      message: "La cita será marcada como completada.",
      onConfirm: async () => {
        await api.patch(`/appointments/${id}`, { status });
        await fetchAll();
        setShowDetail(null);
        setConfirmModal(null);
      }
    });
  };

  const handleDelete = async (id: number) => {
    setConfirmModal({
      title: "¿Cancelar esta cita?",
      message: "La cita será marcada como cancelada. Esta acción no se puede deshacer.",
      onConfirm: async () => {
        await api.delete(`/appointments/${id}`);
        await fetchAll();
        setShowDetail(null);
        setConfirmModal(null);
      }
    });
  };

  // Eventos para FullCalendar
  const calendarEvents = appointments
    .filter((a) => a.status !== "cancelled")
    .map((a) => ({
      id: String(a.id),
      title: a.client.name,
      start: a.start_time,
      end: a.end_time,
      backgroundColor: statusColors[a.status],
      borderColor: statusColors[a.status],
      textColor: "#080C10",
      extendedProps: { appointment: a },
    }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Citas
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            {appointments.filter(a => a.status !== "cancelled").length} citas activas
          </p>
        </div>
        <button onClick={() => openCreate()} style={btnStyle}>+ Nueva cita</button>
      </div>

      {/* VISTA DESKTOP — Calendario + Lista lateral */}
      <div className="citas-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem", alignItems: "start" }}>

        {/* Calendario */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: "1.25rem",
        }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={esLocale}
            headerToolbar={{
              left:   "prev,next today",
              center: "title",
              right:  "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            slotMinTime="12:00:00"
            slotMaxTime="22:00:00"
            slotDuration="01:00:00"
            slotLabelInterval="01:00:00"
            allDaySlot={false}
            height="auto"
            expandRows={true}
            events={calendarEvents}
            eventContent={(arg) => {
              const appt = arg.event.extendedProps.appointment as Appointment;
              const serviceNames = appt.services.map(s => s.service.name).join(" + ");
              return (
                <div style={{ padding: "3px 6px", overflow: "hidden", height: "100%" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#080C10", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {appt.client.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.75)", lineHeight: 1.3, marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {serviceNames}
                  </div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(0,0,0,0.85)", marginTop: "2px" }}>
                    ${appt.total.toLocaleString("es-CL")}
                  </div>
                </div>
              );
            }}
            dateClick={(info) => openCreate(info.dateStr.split("T")[0])}
            eventClick={(info) => {
              const appt = info.event.extendedProps.appointment as Appointment;
              setShowDetail(appt);
            }}
          />
        </div>

        {/* Lista lateral */}
        <div className="citas-lista" style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: "1.25rem",
          position: "sticky", top: "80px",
        }}>
          <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
            📋 Todas las citas
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "600px", overflowY: "auto" }}>
            {appointments.filter(a => a.status !== "cancelled").length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>No hay citas</p>
            ) : appointments
                .filter(a => a.status !== "cancelled")
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .map((a) => (
              <div key={a.id} onClick={() => setShowDetail(a)} style={{
                padding: "0.75rem", borderRadius: "0.75rem",
                background: "var(--bg-secondary)", border: `1px solid ${statusColors[a.status]}25`,
                cursor: "pointer", transition: "all 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = statusColors[a.status] + "60"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = statusColors[a.status] + "25"}
              >
                <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  {new Date(a.start_time).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}
                  {new Date(a.start_time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  {" — "}
                  {new Date(a.end_time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                  {a.client.name}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>✂️ {a.services.map(s => s.service.name).join(" + ")}</p>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: statusColors[a.status], background: `${statusColors[a.status]}15`, padding: "0.15rem 0.5rem", borderRadius: "999px", border: `1px solid ${statusColors[a.status]}30` }}>
                    {statusLabels[a.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VISTA MÓVIL — Lista de citas */}
      <div className="citas-mobile" style={{ display: "none", flexDirection: "column", gap: "0.75rem" }}>
        {appointments.filter(a => a.status !== "cancelled").length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: "1rem", border: "1px dashed var(--border)" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📅</p>
            <p>No hay citas. Crea la primera.</p>
          </div>
        ) : appointments
            .filter(a => a.status !== "cancelled")
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .map((a) => (
          <div key={a.id} onClick={() => setShowDetail(a)} style={{
            padding: "1rem", borderRadius: "1rem",
            background: "var(--bg-card)",
            border: `1px solid ${statusColors[a.status]}25`,
            cursor: "pointer",
          }}>
            {/* Fecha y hora */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)", fontFamily: "Sora, sans-serif" }}>
                  {new Date(a.start_time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {new Date(a.start_time).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: statusColors[a.status], background: `${statusColors[a.status]}15`, padding: "0.2rem 0.6rem", borderRadius: "999px", border: `1px solid ${statusColors[a.status]}30` }}>
                {statusLabels[a.status]}
              </span>
            </div>

            {/* Cliente */}
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              {a.client.name}
            </p>

            {/* Servicios y total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                ✂️ {a.services.map(s => s.service.name).join(" + ")}
              </p>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent)", fontFamily: "Sora, sans-serif" }}>
                ${a.total.toLocaleString("es-CL")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva Cita */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "var(--bg-card)", border: "1px solid rgba(0,255,135,0.15)",
            borderRadius: "1.25rem", padding: "2rem",
            width: "100%", maxWidth: "460px",
            boxShadow: "0 0 40px rgba(0,255,135,0.05)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
              Nueva cita
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Cliente */}
              <div>
                <label style={labelStyle}>Cliente *</label>
                <select
                  value={form.client_id}
                  onChange={(e) => { setForm({ ...form, client_id: Number(e.target.value) }); setErrors({ ...errors, client_id: "" }); }}
                  style={{ ...inputStyle, borderColor: errors.client_id ? "var(--danger)" : "var(--border)" }}
                >
                  <option value={0}>Selecciona un cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ""}</option>
                  ))}
                </select>
                {errors.client_id && <p style={errorStyle}>{errors.client_id}</p>}
              </div>

              {/* Servicios — selección múltiple */}
              <div>
                <label style={labelStyle}>Servicios * (puedes elegir varios)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "200px", overflowY: "auto" }}>
                  {services.map((s) => {
                    const selected = form.service_ids.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          const next = selected
                            ? form.service_ids.filter(id => id !== s.id)
                            : [...form.service_ids, s.id];
                          setForm({ ...form, service_ids: next });
                          setErrors({ ...errors, service_ids: "" });
                        }}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "0.7rem 0.9rem", borderRadius: "0.75rem", cursor: "pointer",
                          background: selected ? "var(--accent-soft)" : "var(--bg-secondary)",
                          border: `1px solid ${selected ? "rgba(0,255,135,0.3)" : "var(--border)"}`,
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div style={{
                            width: "18px", height: "18px", borderRadius: "4px",
                            border: `2px solid ${selected ? "var(--accent)" : "var(--text-secondary)"}`,
                            background: selected ? "var(--accent)" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.7rem", color: "#080C10", fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {selected ? "✓" : ""}
                          </div>
                          <span style={{ fontSize: "0.875rem", color: selected ? "var(--accent)" : "var(--text-primary)", fontWeight: selected ? 600 : 400 }}>
                            {s.name}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: selected ? "var(--accent)" : "var(--text-secondary)", fontFamily: "Sora, sans-serif" }}>
                          ${s.price.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {errors.service_ids && <p style={errorStyle}>{errors.service_ids}</p>}

                {/* Total */}
                {form.service_ids.length > 0 && (
                  <div style={{
                    marginTop: "0.75rem", padding: "0.75rem 1rem",
                    borderRadius: "0.75rem", background: "var(--bg-secondary)",
                    border: "1px solid rgba(0,255,135,0.2)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {form.service_ids.length} servicio{form.service_ids.length > 1 ? "s" : ""} seleccionado{form.service_ids.length > 1 ? "s" : ""}
                    </span>
                    <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "var(--accent)", fontSize: "1rem" }}>
                      Total: ${services
                        .filter(s => form.service_ids.includes(s.id))
                        .reduce((sum, s) => sum + s.price, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label style={labelStyle}>Fecha *</label>
                <input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => { setForm({ ...form, date: e.target.value, time: "" }); setErrors({ ...errors, date: "" }); }}
                  style={{ ...inputStyle, borderColor: errors.date ? "var(--danger)" : "var(--border)", colorScheme: "dark" }}
                />
                {errors.date && <p style={errorStyle}>{errors.date}</p>}
              </div>

              {/* Horarios disponibles */}
              {form.date && availableSlots.length > 0 && (
                <div>
                  <label style={labelStyle}>Horario disponible *</label>
                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem",
                    maxHeight: "160px", overflowY: "auto",
                  }}>
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => { setForm({ ...form, time: slot.time }); setErrors({ ...errors, time: "" }); }}
                        style={{
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          border: form.time === slot.time
                            ? "1px solid var(--accent)"
                            : "1px solid var(--border)",
                          background: !slot.available
                            ? "rgba(255,69,96,0.05)"
                            : form.time === slot.time
                            ? "var(--accent-soft)"
                            : "var(--bg-secondary)",
                          color: !slot.available
                            ? "rgba(255,255,255,0.2)"
                            : form.time === slot.time
                            ? "var(--accent)"
                            : "var(--text-secondary)",
                          fontSize: "0.78rem", fontWeight: 600,
                          cursor: slot.available ? "pointer" : "not-allowed",
                          transition: "all 0.15s",
                        }}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  {errors.time && <p style={errorStyle}>{errors.time}</p>}
                </div>
              )}

              {/* Notas */}
              <div>
                <label style={labelStyle}>Notas (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Cliente frecuente, alérgico a productos con alcohol"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(0,255,135,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setShowModal(false)} style={cancelBtnStyle}>Cancelar</button>
              <button onClick={handleSave} disabled={loading} style={{ ...btnStyle, flex: 1 }}>
                {loading ? "Guardando..." : "Confirmar cita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Cita */}
      {showDetail && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "var(--bg-card)", border: "1px solid rgba(0,255,135,0.15)",
            borderRadius: "1.25rem", padding: "2rem",
            width: "100%", maxWidth: "420px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>
                Detalle de cita
              </h2>
              <span style={{
                padding: "0.25rem 0.75rem", borderRadius: "999px",
                fontSize: "0.75rem", fontWeight: 700,
                background: `${statusColors[showDetail.status]}20`,
                color: statusColors[showDetail.status],
                border: `1px solid ${statusColors[showDetail.status]}40`,
              }}>
                {statusLabels[showDetail.status]}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                { icon: "👤", label: "Cliente",  value: showDetail.client.name },
                { icon: "📞", label: "Teléfono", value: showDetail.client.phone || "—" },
                { icon: "✂️", label: "Servicios", value: showDetail.services.map(s => s.service.name).join(", ") },
                { icon: "📅", label: "Fecha",    value: new Date(showDetail.start_time).toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
                { icon: "⏰", label: "Horario",  value: `${new Date(showDetail.start_time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} — ${new Date(showDetail.end_time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}` },
                { icon: "💰", label: "Total",     value: `$${showDetail.total.toLocaleString()}` },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1rem", marginTop: "0.1rem" }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.1rem" }}>{label}</p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>{value}</p>
                  </div>
                </div>
              ))}
              {showDetail.notes && (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <span>📝</span>
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.1rem" }}>Notas</p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{showDetail.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {showDetail.status === "confirmed" && (
                <button
                  onClick={() => handleStatusChange(showDetail.id, "completed")}
                  style={{ ...btnStyle, width: "100%", background: "var(--success)" }}
                >
                  ✅ Marcar como completada
                </button>
              )}
              {showDetail.status !== "cancelled" && showDetail.status !== "completed" && (
                <button
                  onClick={() => handleDelete(showDetail.id)}
                  style={{
                    ...cancelBtnStyle, width: "100%",
                    borderColor: "rgba(255,69,96,0.3)", color: "var(--danger)",
                  }}
                >
                  Cancelar cita
                </button>
              )}
              <button onClick={() => setShowDetail(null)} style={{ ...cancelBtnStyle, width: "100%" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación */}
      {confirmModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "var(--bg-card)", border: "1px solid rgba(255,69,96,0.2)",
            borderRadius: "1.25rem", padding: "2rem",
            width: "100%", maxWidth: "380px",
            boxShadow: "0 0 40px rgba(255,69,96,0.08)",
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: "rgba(255,69,96,0.1)", border: "1px solid rgba(255,69,96,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem", marginBottom: "1rem",
            }}>⚠️</div>
            <h3 style={{
              fontFamily: "Sora, sans-serif", fontWeight: 700,
              fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.5rem",
            }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              {confirmModal.message}
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1, padding: "0.7rem", borderRadius: "0.75rem",
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", fontWeight: 600,
                  fontSize: "0.875rem", cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1, padding: "0.7rem", borderRadius: "0.75rem",
                  background: "rgba(255,69,96,0.15)", border: "1px solid rgba(255,69,96,0.3)",
                  color: "var(--danger)", fontWeight: 700,
                  fontSize: "0.875rem", cursor: "pointer",
                }}
              >
                Confirmar
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

const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.75rem 1rem",
  background: "var(--bg-secondary)", border: "1px solid var(--border)",
  borderRadius: "0.75rem", color: "var(--text-primary)",
  fontSize: "0.9rem", outline: "none", transition: "border-color 0.15s",
};

const errorStyle: React.CSSProperties = {
  color: "var(--danger)", fontSize: "0.78rem", marginTop: "0.3rem",
};