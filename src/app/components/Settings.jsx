'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "../utils/useIsMobile";
import { resetSetupWizard } from "./SetupWizard";
import { createInvite } from "../../lib/supabase";

export function Settings({
  org, orgs, orgPeople, people, selOrgId, setSelOrgId, selTeamId, setSelTeamId,
  leaderId, setLeaderId, openAssessment, copyAssessmentLink,
  addOrg, updateOrg, addTeam, updateTeam, deleteTeam, addPendingPerson, deletePerson,
  viewMode, toggleViewMode,
}) {
  const isMobile = useIsMobile();

  const [editOrgName, setEditOrgName] = useState(org?.name || "");
  const [editOrgUrl, setEditOrgUrl] = useState(org?.assessmentUrl || "");
  const [orgSaved, setOrgSaved] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Invite state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitePersonId, setInvitePersonId] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleCreateInvite = async () => {
    setInviteLoading(true);
    try {
      const invite = await createInvite({
        organizationId: selOrgId,
        personId: invitePersonId || null,
        role: 'owner',
      });
      const link = `${window.location.origin}/invite/${invite.token}`;
      setInviteLink(link);
    } catch (err) {
      console.error('Failed to create invite:', err);
      alert('Failed to create invite. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteLinkCopied(true);
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setInvitePersonId("");
    setInviteLink("");
    setInviteLinkCopied(false);
  };

  const handleSaveOrg = () => {
    if (editOrgName.trim()) {
      updateOrg(selOrgId, { name: editOrgName.trim(), assessmentUrl: editOrgUrl.trim() });
      setOrgSaved(true);
      setTimeout(() => setOrgSaved(false), 2000);
    }
  };

  const handleCopyLink = () => {
    copyAssessmentLink();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className={`max-w-3xl mx-auto px-8 py-6 ${isMobile ? 'px-4 py-4' : ''}`}>
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Settings</h1>
      <div className="text-xs text-gray-400 mb-7">Manage your organization, teams, and members</div>

      {/* ── View Mode Toggle ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5"
      >
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">View Mode</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Viewing as: {viewMode === 'admin' ? 'Admin' : 'Team Member'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {viewMode === 'admin'
                ? 'You see all admin controls, upload, and org settings.'
                : 'You see the app as a regular team member would.'}
            </div>
          </div>
          <button
            onClick={toggleViewMode}
            className="relative w-12 h-7 rounded-full border-none cursor-pointer transition-colors duration-200 shrink-0"
            style={{ background: viewMode === 'member' ? 'var(--disc-c)' : 'var(--border-default, #d1d5db)' }}
            aria-label="Toggle view mode"
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
              style={{ left: viewMode === 'member' ? 'calc(100% - 1.625rem)' : '0.125rem' }}
            />
          </button>
        </div>
      </motion.div>

      {/* ── Organization ── */}
      {viewMode === 'admin' && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Organization</div>

        {orgs.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Switch Organization</label>
            <select
              value={selOrgId}
              onChange={e => { setSelOrgId(e.target.value); setSelTeamId(null); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Name</label>
          <input value={editOrgName} onChange={e => setEditOrgName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
        </div>

        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Assessment Link</label>
          <input value={editOrgUrl} onChange={e => setEditOrgUrl(e.target.value)} placeholder="https://profiles.innermetrix.com/VO/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-200" />
          <div className="text-[11px] text-gray-400 mt-1">Everyone who takes this link joins this organization.</div>
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={handleSaveOrg} className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 cursor-pointer border-none">{orgSaved ? "Saved!" : "Save"}</button>
          {org?.assessmentUrl && (
            <>
              <button onClick={openAssessment} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Take Assessment</button>
              <button onClick={handleCopyLink} className={`px-4 py-2 rounded-xl border border-gray-200 text-sm cursor-pointer ${linkCopied ? 'bg-green-100 text-green-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {linkCopied ? "Link Copied!" : "Copy Link"}
              </button>
            </>
          )}
        </div>
      </div>}

      {/* ── Invite Leader ── */}
      {viewMode === 'admin' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Invite Leader</div>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Send an invite link to give a leader ownership of this organization. When they sign up, they'll automatically be connected.
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 cursor-pointer border-none"
          >
            Generate Invite Link
          </button>
        </div>
      )}

      {viewMode === 'admin' && (<>
      {/* ── Teams ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Teams</div>

        {org?.teams.map(t => {
          const count = orgPeople.filter(p => p.teamId === t.id).length;
          const isEditing = editingTeamId === t.id;

          return (
            <div key={t.id} className="flex items-center gap-2 py-2 border-b border-gray-50">
              {isEditing ? (
                <>
                  <input value={editTeamName} onChange={e => setEditTeamName(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === "Enter") { updateTeam(t.id, editTeamName.trim()); setEditingTeamId(null); } if (e.key === "Escape") setEditingTeamId(null); }}
                    className="flex-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                  <button onClick={() => { updateTeam(t.id, editTeamName.trim()); setEditingTeamId(null); }} className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 cursor-pointer border-none">Save</button>
                  <button onClick={() => setEditingTeamId(null)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">{t.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({count} members)</span>
                  </div>
                  <button onClick={() => { setEditingTeamId(t.id); setEditTeamName(t.name); }} className="px-3 py-1 rounded-xl border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50 cursor-pointer">Edit</button>
                  <button onClick={() => { if (confirm(`Delete "${t.name}" and all ${count} members?`)) deleteTeam(t.id); }} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 cursor-pointer border-none">Delete</button>
                </>
              )}
            </div>
          );
        })}

        <div className="flex gap-2 mt-3">
          <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="New team name..."
            onKeyDown={e => { if (e.key === "Enter" && newTeamName.trim()) { addTeam(newTeamName.trim()); setNewTeamName(""); } }}
            className="flex-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
          <button onClick={() => { if (newTeamName.trim()) { addTeam(newTeamName.trim()); setNewTeamName(""); } }} className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 cursor-pointer border-none">Add Team</button>
        </div>
      </div>

      {/* ── Members ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Team Members</div>

        {orgPeople.map(p => {
          const isPending = p.status === "pending";
          const isLeader = p.id === leaderId;
          return (
            <div key={p.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50">
              <div className="flex-1">
                <span className={`text-sm font-semibold ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>{p.name}</span>
                {isLeader && <span className="text-[11px] text-sky-400 ml-2">★ Leader</span>}
                {isPending && <span className="text-[11px] text-gray-400 ml-2">Pending</span>}
              </div>
              <button onClick={() => setLeaderId(isLeader ? null : p.id)}
                className={`px-3 py-1 rounded-xl border border-gray-200 bg-white text-xs cursor-pointer hover:bg-gray-50 ${isLeader ? 'text-yellow-500' : 'text-gray-400'}`}>
                {isLeader ? "★ Leader" : "☆ Set Leader"}
              </button>
              <button onClick={() => { if (confirm(`Remove ${p.name}? This cannot be undone.`)) deletePerson(p.id); }} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 cursor-pointer border-none">Remove</button>
            </div>
          );
        })}

        <div className="flex gap-2 mt-3">
          <input value={pendingName} onChange={e => setPendingName(e.target.value)} placeholder="Add expected member..."
            onKeyDown={e => { if (e.key === "Enter" && pendingName.trim()) { addPendingPerson(pendingName.trim()); setPendingName(""); } }}
            className="flex-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
          <button onClick={() => { if (pendingName.trim()) { addPendingPerson(pendingName.trim()); setPendingName(""); } }} className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 cursor-pointer border-none">Add</button>
        </div>
      </div>
      </>)}

      {/* ── Setup Wizard ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Getting Started</div>
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          Re-run the intro wizard that walks you through what this app does and where to start.
        </p>
        <button
          onClick={() => {
            resetSetupWizard();
            window.location.reload();
          }}
          className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Re-run Setup Wizard
        </button>
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={resetInviteModal}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Invite Leader</h2>
              <button
                onClick={resetInviteModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {!inviteLink ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Generate an invite link for <strong>{org?.name}</strong>. The person who accepts this invite will become the owner of this organization.
                </p>

                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Link to existing profile? (optional)
                  </label>
                  <select
                    value={invitePersonId}
                    onChange={e => setInvitePersonId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="">No - they'll upload their assessment later</option>
                    {orgPeople.filter(p => p.disc).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    If they already have assessment data in the system, link it to their account.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetInviteModal}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInvite}
                    disabled={inviteLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 cursor-pointer border-none disabled:opacity-50"
                  >
                    {inviteLoading ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Invite Link Ready</div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="w-full bg-transparent text-xs font-mono text-gray-600 border-none outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">
                    This link expires in 7 days and can only be used once.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetInviteModal}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    onClick={handleCopyInviteLink}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border-none ${
                      inviteLinkCopied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {inviteLinkCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
