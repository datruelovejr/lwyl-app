'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { TeamInsights } from "../../components/TeamInsights";
import { useRouter } from "next/navigation";

export default function TeamPage() {
  const { people, selTeamId, selOrgId, leaderId, user, photos, onUploadPhoto } = useLWYL();
  const router = useRouter();

  return (
    <div style={{ padding: "16px 24px", overflowY: "auto", maxHeight: "100vh" }}>
      <TeamInsights
        people={people}
        teamId={selTeamId}
        orgId={selOrgId}
        leaderId={leaderId}
        userId={user?.id}
        photos={photos}
        onUploadPhoto={onUploadPhoto}
        onViewProfile={(personId) => router.push(`/app/profile/${personId}`)}
        onCompare={(personId) => router.push(`/app/profile/${personId}`)}
        onShowTips={(personId) => router.push(`/app/profile/${personId}`)}
      />
    </div>
  );
}
