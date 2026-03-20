'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { TeamInsights } from "../../components/TeamInsights";
import { LoadingMoment } from "../../components/ui/LoadingMoment";
import { useRouter } from "next/navigation";

export default function TeamPage() {
  const { people, selTeamId, selOrgId, leaderId, user, photos, onUploadPhoto, isLoading } = useLWYL();
  const router = useRouter();

  if (isLoading) return <div className="px-6 py-4"><LoadingMoment message="Reading your team's adaptation costs..." /></div>;

  return (
    <div className="px-6 py-4 overflow-y-auto max-h-screen">
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
