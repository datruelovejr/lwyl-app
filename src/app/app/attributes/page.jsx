'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { TeamCoreAttributes } from "../../components/TeamCoreAttributes";
import { LoadingMoment } from "../../components/ui/LoadingMoment";

export default function AttributesPage() {
  const { people, selTeamId, selOrgId, isLoading } = useLWYL();

  if (isLoading) return <div className="px-6 py-4"><LoadingMoment message="Reading the team's core attributes..." /></div>;

  const team = people.filter(
    (p) => p.orgId === selOrgId && (selTeamId ? p.teamId === selTeamId : true) && p.status !== "pending"
  );

  return (
    <div className="px-6 py-4 overflow-y-auto max-h-screen">
      <TeamCoreAttributes people={team} />
    </div>
  );
}
