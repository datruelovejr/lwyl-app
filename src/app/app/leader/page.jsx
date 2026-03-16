'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { LeaderInsights } from "../../components/LeaderInsights";

export default function LeaderPage() {
  const { people, selTeamId, selOrgId, leaderId } = useLWYL();
  return <LeaderInsights people={people} teamId={selTeamId} orgId={selOrgId} leaderId={leaderId} />;
}
