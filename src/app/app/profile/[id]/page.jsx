'use client';

import { use } from "react";
import { useLWYL } from "../../../contexts/LWYLContext";
import { Viewer } from "../../../components/Viewer";

export default function ProfilePage({ params }) {
  const { id } = use(params);
  const { people, leaderId, photos, onUploadPhoto, selTeamId, orgPeople } = useLWYL();

  const person = people.find(p => p.id === id);
  const leader = people.find(p => p.id === leaderId) || null;
  const teamPeople = selTeamId
    ? orgPeople.filter(p => p.teamId === selTeamId && p.status !== "pending")
    : orgPeople.filter(p => p.status !== "pending");

  if (!person) {
    return (
      <div className="text-center py-15 text-muted">
        <div className="text-4xl mb-3">{"\ud83d\udccb"}</div>
        <div className="text-sm font-semibold">Person not found</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 overflow-y-auto max-h-screen">
      <Viewer
        person={person}
        leader={leader}
        agreements={[]}
        setAgreements={() => {}}
        photos={photos}
        onUploadPhoto={onUploadPhoto}
        initialTab="profile"
        initialShowTips={false}
        initialShowCompare={false}
        onClearShowTips={() => {}}
        onClearShowCompare={() => {}}
        team={teamPeople}
      />
      <div className="text-center pt-2 pb-5 text-[9px] text-muted">
        &copy; Bridging the Connection Gap &middot; Dr. Daniel Truelove Jr.
      </div>
    </div>
  );
}
