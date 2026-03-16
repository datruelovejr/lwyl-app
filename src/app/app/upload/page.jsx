'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { UploadForm } from "../../components/UploadForm";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const { orgs, selOrgId, selTeamId, addPerson } = useLWYL();
  const router = useRouter();

  return (
    <div style={{ padding: "16px 24px", overflowY: "auto", maxHeight: "100vh" }}>
      <UploadForm
        orgs={orgs}
        selOrgId={selOrgId}
        selTeamId={selTeamId}
        onAdd={(p, opts) => {
          addPerson(p, opts);
          if (!opts?.bulk) router.push(`/app/profile/${p.id}`);
        }}
        onCancel={() => router.push("/app")}
      />
    </div>
  );
}
