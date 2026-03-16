'use client';

import { use } from "react";
import { useLWYL } from "../../../contexts/LWYLContext";
import { Viewer } from "../../../components/Viewer";
import { C } from "../../../constants/colors";

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
      <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Person not found</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 24px", overflowY: "auto", maxHeight: "100vh" }}>
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
      <div style={{ textAlign: "center", padding: "8px 0 20px", fontSize: 9, color: C.muted }}>
        © Bridging the Connection Gap · Dr. Daniel Truelove Jr.
      </div>
    </div>
  );
}
