'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { UploadForm } from "../../components/UploadForm";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const { orgs, selOrgId, selTeamId, addPerson } = useLWYL();
  const router = useRouter();
  const [error, setError] = useState(null);

  const handleAdd = async (p, opts) => {
    setError(null);
    try {
      await addPerson(p, opts);
      // Small delay to ensure React commits state update before navigation
      await new Promise(resolve => setTimeout(resolve, 50));
      if (!opts?.bulk) router.push(`/app/profile/${p.id}`);
    } catch (err) {
      console.error('[Upload] Failed to add person:', err);
      setError(err.message || 'Failed to add person. Please try again.');
    }
  };

  return (
    <div style={{ padding: "16px 24px", overflowY: "auto", maxHeight: "100vh" }}>
      {error && (
        <div style={{
          padding: "12px 16px",
          marginBottom: 16,
          background: "#FFEBEE",
          border: "1px solid #EF9A9A",
          borderRadius: 8,
          color: "#C62828",
          fontSize: 14
        }}>
          {error}
        </div>
      )}
      <UploadForm
        orgs={orgs}
        selOrgId={selOrgId}
        selTeamId={selTeamId}
        onAdd={handleAdd}
        onCancel={() => router.push("/app")}
      />
    </div>
  );
}
