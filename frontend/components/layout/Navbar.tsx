"use client";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/citas":     "Citas",
  "/admin/servicios": "Servicios",
  "/admin/clientes":  "Clientes",
};

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header style={{
      height: "60px",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      background: "var(--bg-primary)",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onMenuClick}
          className="hamburger-btn"
          style={{
            background: "transparent", border: "none",
            cursor: "pointer", padding: "0.4rem",
            borderRadius: "0.5rem", color: "var(--text-secondary)",
            fontSize: "1.25rem", lineHeight: 1,
            transition: "all 0.15s", display: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--accent)";
            e.currentTarget.style.background = "var(--accent-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
          }}
        >☰</button>

        <h2 style={{
          margin: 0, fontFamily: "Sora, sans-serif",
          fontSize: "1rem", fontWeight: 600,
          color: "var(--text-primary)",
        }}>
          {titles[pathname] ?? "BookCut"}
        </h2>
      </div>

      {/* Indicador online */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 8px var(--accent)",
        }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          Online
        </span>
      </div>
    </header>
  );
}