'use client';

import { useState } from "react";
import { useLWYL } from "../contexts/LWYLContext";
import { useRouter } from "next/navigation";
import { calculateFriction } from "../utils/friction";
import { getEnvironmentTaxSummary } from "../knowledge/assessmentInsights";

// ── Consultant Dashboard ──────────────────────────────────────────
// Shows all client orgs as summary cards. This is Daniel's home base.

export default function ConsultantDashboard() {
  const { orgs, people, selOrgId, setSelOrgId, setSelTeamId } = useLWYL();
  const router = useRouter();
  const [showNewOrg, setShowNewOrg] = useState(false);

  const enterOrg = (orgId) => {
    setSelOrgId(orgId);
    setSelTeamId(null);
    router.push("/app/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Your Organizations</h1>
          <p className="text-sm text-gray-400 mt-1">{orgs.length} client{orgs.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowNewOrg(true)}
          className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors">
          + New Organization
        </button>
      </div>

      {/* Org Cards */}
      {orgs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-base font-bold text-gray-400 mb-2">No organizations yet</div>
          <p className="text-sm text-gray-400 mb-6">Create your first client organization to get started.</p>
          <button
            onClick={() => setShowNewOrg(true)}
            className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors">
            + New Organization
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orgs.map(org => {
            const orgMembers = people.filter(p => p.orgId === org.id);
            const assessed = orgMembers.filter(p => p.status !== "pending" && p.disc);
            const pending = orgMembers.filter(p => p.status === "pending" || !p.disc);

            // Friction summary
            const completePeople = assessed;
            let highFriction = 0;
            for (let i = 0; i < completePeople.length; i++) {
              for (let j = i + 1; j < completePeople.length; j++) {
                const f = calculateFriction(completePeople[i], completePeople[j]);
                if (f.tier === "high") highFriction++;
              }
            }

            // Environment tax — anyone paying high cost
            const highTax = completePeople.filter(p => {
              try { return getEnvironmentTaxSummary(p).totalGap >= 80; } catch { return false; }
            }).length;

            // Status
            let status, statusColor;
            if (assessed.length === 0) {
              status = "Setup";
              statusColor = "bg-gray-100 text-gray-500";
            } else if (pending.length > 0) {
              status = "Assessments Pending";
              statusColor = "bg-amber-50 text-amber-700";
            } else if (highFriction > 0) {
              status = "Needs Attention";
              statusColor = "bg-red-50 text-red-700";
            } else {
              status = "Active";
              statusColor = "bg-emerald-50 text-emerald-700";
            }

            return (
              <button
                key={org.id}
                onClick={() => enterOrg(org.id)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-base font-bold text-gray-900 group-hover:text-sky-600 transition-colors">
                      {org.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {org.teams?.length || 0} team{(org.teams?.length || 0) !== 1 ? "s" : ""} · {orgMembers.length} member{orgMembers.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
                    {status}
                  </span>
                </div>

                {/* Metrics row */}
                <div className="flex gap-6 text-xs">
                  <div>
                    <span className="text-gray-400">Assessed: </span>
                    <span className="font-semibold text-gray-700">{assessed.length}/{orgMembers.length}</span>
                  </div>
                  {highFriction > 0 && (
                    <div>
                      <span className="text-gray-400">High friction: </span>
                      <span className="font-semibold text-red-600">{highFriction} pair{highFriction !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {highTax > 0 && (
                    <div>
                      <span className="text-gray-400">High env tax: </span>
                      <span className="font-semibold text-amber-600">{highTax} person{highTax !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* New Org Wizard Modal */}
      {showNewOrg && <NewOrgWizard onClose={() => setShowNewOrg(false)} />}
    </div>
  );
}

// ── New Org Wizard ────────────────────────────────────────────────
// Step 1: Org name, leader name, pain point
// Step 2: Assessment link — people get added when they complete assessment or via PDF upload

function NewOrgWizard({ onClose }) {
  const { addOrg, updateOrg, addTeam, setSelOrgId } = useLWYL();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [assessmentUrl, setAssessmentUrl] = useState("");
  const [newOrgId, setNewOrgId] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleStep1 = async () => {
    const orgId = await addOrg(orgName.trim());
    setNewOrgId(orgId);
    setSelOrgId(orgId);
    // Create a default team with the org name
    await addTeam(orgName.trim());
    setStep(2);
  };

  const handleFinish = async () => {
    if (assessmentUrl.trim()) {
      await updateOrg(newOrgId, { assessmentUrl: assessmentUrl.trim() });
    }
    onClose();
    router.push("/app/dashboard");
  };

  const handleCopyLink = () => {
    if (assessmentUrl.trim()) {
      navigator.clipboard.writeText(assessmentUrl.trim());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="px-8 pt-6 pb-6">
          {/* Progress */}
          <div className="flex gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-sky-500" : "bg-gray-200"}`} />
            ))}
          </div>

          {/* Step 1: Org Details */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">New Organization</h2>
              <p className="text-xs text-gray-400 mb-6">Set up a new client.</p>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization Name</label>
              <input value={orgName} onChange={e => setOrgName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 mb-4" />

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Leader Name</label>
              <input value={leaderName} onChange={e => setLeaderName(e.target.value)}
                placeholder="Sarah Johnson"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 mb-4" />

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">What challenge is this team facing?</label>
              <textarea value={painPoint} onChange={e => setPainPoint(e.target.value)}
                placeholder="Team friction, communication breakdown, retention..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 mb-6 resize-none" />

              <div className="flex gap-3 justify-end">
                <button onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleStep1} disabled={!orgName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Assessment Link */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Assessment Link</h2>
              <p className="text-xs text-gray-400 mb-6">
                Paste the Innermetrix assessment link for {orgName}. Team members get added automatically when they complete their assessment.
              </p>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Innermetrix Assessment URL</label>
              <input value={assessmentUrl} onChange={e => setAssessmentUrl(e.target.value)}
                placeholder="https://profiles.innermetrix.com/VO/..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-200 mb-2" />

              {assessmentUrl.trim() && (
                <button onClick={handleCopyLink}
                  className={`text-xs font-semibold mb-4 ${linkCopied ? "text-emerald-600" : "text-sky-500 hover:text-sky-600"}`}>
                  {linkCopied ? "Link copied!" : "Copy link to clipboard"}
                </button>
              )}

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">How people get added</div>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex gap-2">
                    <span className="text-sky-500 font-bold">1.</span>
                    <span>Send this link to team members</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sky-500 font-bold">2.</span>
                    <span>They complete their Innermetrix assessment</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sky-500 font-bold">3.</span>
                    <span>Their data appears here automatically</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-400">
                  Fallback: Upload their assessment PDF from the org dashboard
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700">Back</button>
                <button onClick={handleFinish}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors">
                  {assessmentUrl.trim() ? "Done" : "Skip for now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
