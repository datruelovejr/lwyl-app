'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { FrictionMap } from "../../components/FrictionMap";
import { LoadingMoment } from "../../components/ui/LoadingMoment";

export default function FrictionPage() {
  const { people, selTeamId, selOrgId, isLoading } = useLWYL();

  if (isLoading) return <div className="px-8 py-6"><LoadingMoment message="Mapping your team's relationship network..." /></div>;

  return (
    <FrictionMap
      people={people}
      teamId={selTeamId}
      orgId={selOrgId}
      isPage={true}
    />
  );
}
