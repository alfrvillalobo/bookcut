"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading || !user) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          color: "var(--accent)", fontFamily: "Sora, sans-serif",
          fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.75rem",
        }}>
          <span style={{
            width: "18px", height: "18px", borderRadius: "50%",
            border: "2px solid var(--accent)",
            borderTopColor: "transparent",
            display: "inline-block",
            animation: "spin 0.8s linear infinite",
          }} />
          Cargando...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-content">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, padding: "1.5rem", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}