'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { MethodView } from "../../components/MethodView";
import { LoadingMoment } from "../../components/ui/LoadingMoment";

export default function MethodPage() {
  const { orgPeople, teamPeople, isLoading } = useLWYL();

  if (isLoading) return <div className="px-6 py-4"><LoadingMoment message="Running the full method on your team..." /></div>;

  // Use the selected team when one is picked, otherwise the whole org group.
  const group = (teamPeople && teamPeople.length > 0) ? teamPeople : orgPeople;

  return (
    <div className="px-6 py-4 overflow-y-auto max-h-screen">
      <MethodView people={group} />
    </div>
  );
}
