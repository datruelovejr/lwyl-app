'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { RetentionRisk } from "../../components/RetentionRisk";

export default function KRIPage() {
  const { people, selTeamId, selOrgId, leaderId } = useLWYL();
  return <RetentionRisk people={people} teamId={selTeamId} orgId={selOrgId} leaderId={leaderId} />;
}
