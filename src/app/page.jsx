'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app");
  }, [router]);

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", background: "#F9FAFB", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #E5E7EB", borderTopColor: "#29B6F6", borderRadius: "50%", animation: "lwyl-spin 0.8s linear infinite" }} />
        <style>{`@keyframes lwyl-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
