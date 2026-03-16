'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { FrictionMap } from "../../components/FrictionMap";

export default function FrictionPage() {
  const { people, selTeamId, selOrgId } = useLWYL();

  return (
    <FrictionMap
      people={people}
      teamId={selTeamId}
      orgId={selOrgId}
      isPage={true}
    />
  );
}
