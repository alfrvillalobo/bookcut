"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/admin/dashboard", icon: "⚡", label: "Dashboard" },
  { href: "/admin/citas",     icon: "📅", label: "Citas"     },
  { href: "/admin/servicios", icon: "✂️",  label: "Servicios" },
  { href: "/admin/clientes",  icon: "👤", label: "Clientes"  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(3px)",
          }}
          className="lg-hidden"
        />
      )}

      <aside
        className="sidebar"
        style={{
          width: "240px", minHeight: "100vh", flexShrink: 0,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          padding: "1.5rem 1rem",
          position: "fixed", top: 0,
          left: isOpen ? 0 : "-240px",
          height: "100vh", zIndex: 50,
          transition: "left 0.25s ease",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "0.5rem 0.75rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "var(--accent-soft)",
              border: "1px solid rgba(0,255,135,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem",
              boxShadow: "0 0 12px rgba(0,255,135,0.1)",
            }}>✂️</div>
            <span style={{
              fontFamily: "Sora, sans-serif", fontWeight: 700,
              fontSize: "1.1rem", color: "var(--text-primary)",
            }}>
              Book<span style={{ color: "var(--accent)" }}>Cut</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.7rem 0.75rem", borderRadius: "0.75rem",
                  border: "none", cursor: "pointer",
                  textAlign: "left", width: "100%",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.9rem", transition: "all 0.15s",
                  borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  boxShadow: isActive ? "inset 0 0 20px rgba(0,255,135,0.03)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          {/* Link a agenda pública */}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "1rem", paddingTop: "1rem" }}>
            <button
              onClick={() => window.open("/agenda", "_blank")}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.7rem 0.75rem", borderRadius: "0.75rem",
                border: "1px dashed rgba(0,255,135,0.2)", cursor: "pointer",
                textAlign: "left", width: "100%", background: "transparent",
                color: "var(--accent)", fontWeight: 500,
                fontSize: "0.85rem", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-soft)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span>🔗</span> Ver agenda pública
            </button>
          </div>
        </nav>

        {/* Usuario */}
        <div style={{
          borderTop: "1px solid var(--border)", paddingTop: "1rem",
          display: "flex", flexDirection: "column", gap: "0.5rem",
        }}>
          <div style={{
            padding: "0.75rem", borderRadius: "0.75rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}>
            <p style={{
              margin: 0, fontSize: "0.85rem", fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{user?.name}</p>
            <span style={{
              fontSize: "0.72rem", color: "var(--accent)",
              background: "var(--accent-soft)",
              padding: "0.1rem 0.5rem", borderRadius: "999px",
              fontWeight: 600, marginTop: "0.25rem", display: "inline-block",
            }}>Barbero</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "0.65rem", borderRadius: "0.75rem",
              border: "none", background: "transparent",
              color: "var(--text-secondary)", cursor: "pointer",
              fontSize: "0.875rem", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,69,96,0.08)";
              e.currentTarget.style.color = "var(--danger)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}