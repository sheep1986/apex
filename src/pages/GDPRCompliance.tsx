import { useUserContext } from "@/services/MinimalUserProvider";
import { supabase } from "@/services/supabase-client";
import { voiceService } from "@/services/voice-service";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────

type RecordingPolicy = "always_announce" | "consent_required" | "none";

interface OrgComplianceSettings {
  default_recording_policy: RecordingPolicy;
  data_retention_days: number;
  auto_delete_enabled: boolean;
}

interface AssistantPolicyOverride {
  id: string;
  vapi_assistant_id: string | null;
  name: string;
  recording_policy: RecordingPolicy | null; // null = use org default
}

interface DSARRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  action: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  requested_at: string;
  completed_at: string | null;
  assigned_to: string | null;
  reason: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  details: string;
  created_at: string;
}

// ─── Sub-components ────────────────────────────────────────────────

const POLICY_OPTIONS: { value: RecordingPolicy; label: string; description: string; icon: any }[] = [
  {
    value: "always_announce",
    label: "Always Announce",
    description: "Every call starts with a recording announcement. Required in UK/EU.",
    icon: Mic,
  },
  {
    value: "consent_required",
    label: "Consent Required",
    description: "Ask for explicit consent at the start. End call politely if declined.",
    icon: ShieldCheck,
  },
  {
    value: "none",
    label: "No Recording",
    description: "Disable call recording entirely. Transcripts may still be captured.",
    icon: MicOff,
  },
];

const RETENTION_PRESETS = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 180, label: "6 months" },
  { days: 365, label: "1 year" },
  { days: 730, label: "2 years" },
];

// ─── Recording Policy Tab ──────────────────────────────────────────

function RecordingPolicyTab({
  settings,
  assistants,
  onUpdateOrgPolicy,
  onUpdateAssistantPolicy,
  saving,
}: {
  settings: OrgComplianceSettings;
  assistants: AssistantPolicyOverride[];
  onUpdateOrgPolicy: (policy: RecordingPolicy) => void;
  onUpdateAssistantPolicy: (assistantId: string, policy: RecordingPolicy | null) => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Org Default */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-1 text-lg font-semibold text-white">Organization Default Policy</h3>
        <p className="mb-4 text-sm text-gray-400">
          This policy applies to all assistants unless individually overridden below.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {POLICY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = settings.default_recording_policy === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onUpdateOrgPolicy(opt.value)}
                disabled={saving}
                className={`rounded-lg border p-4 text-left transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                } disabled:opacity-50`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${isSelected ? "text-emerald-400" : "text-gray-400"}`} />
                  <span className={`font-medium ${isSelected ? "text-emerald-400" : "text-white"}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{opt.description}</p>
              </button>
            );
          })}
        </div>

        {settings.default_recording_policy === "always_announce" && (
          <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-900/20 p-3">
            <p className="text-sm text-emerald-300">
              <strong>Announcement text:</strong> "This call may be recorded for quality assurance
              and training purposes."
            </p>
            <p className="mt-1 text-xs text-emerald-400/70">
              This is injected into the assistant's system prompt automatically.
            </p>
          </div>
        )}

        {settings.default_recording_policy === "consent_required" && (
          <div className="mt-4 rounded-lg border border-amber-800 bg-amber-900/20 p-3">
            <p className="text-sm text-amber-300">
              <strong>Consent prompt:</strong> "Before we continue, I need to let you know this call
              will be recorded. Do you consent to the recording?"
            </p>
            <p className="mt-1 text-xs text-amber-400/70">
              If the caller declines, the assistant will end the call politely.
            </p>
          </div>
        )}
      </div>

      {/* Per-Assistant Overrides */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-1 text-lg font-semibold text-white">Per-Assistant Overrides</h3>
        <p className="mb-4 text-sm text-gray-400">
          Override the recording policy for individual assistants.
        </p>

        {assistants.length === 0 ? (
          <p className="text-sm text-gray-500">No assistants found.</p>
        ) : (
          <div className="space-y-3">
            {assistants.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3"
              >
                <div>
                  <span className="font-medium text-white">{a.name}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {a.recording_policy
                      ? POLICY_OPTIONS.find((p) => p.value === a.recording_policy)?.label
                      : "Using org default"}
                  </span>
                </div>
                <select
                  value={a.recording_policy || ""}
                  onChange={(e) =>
                    onUpdateAssistantPolicy(
                      a.id,
                      e.target.value ? (e.target.value as RecordingPolicy) : null
                    )
                  }
                  disabled={saving}
                  className="rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-white"
                >
                  <option value="">Org Default ({settings.default_recording_policy})</option>
                  {POLICY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Data Retention Tab ────────────────────────────────────────────

function DataRetentionTab({
  settings,
  onUpdateRetention,
  onToggleAutoDelete,
  saving,
}: {
  settings: OrgComplianceSettings;
  onUpdateRetention: (days: number) => void;
  onToggleAutoDelete: (enabled: boolean) => void;
  saving: boolean;
}) {
  const nextCleanup = new Date();
  nextCleanup.setDate(nextCleanup.getDate() + 1);
  nextCleanup.setHours(2, 0, 0, 0); // 2am next day

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-1 text-lg font-semibold text-white">Recording Retention Period</h3>
        <p className="mb-4 text-sm text-gray-400">
          Call recordings older than this period will be automatically deleted. Transcripts and
          metadata may be retained longer for analytics.
        </p>

        <div className="flex flex-wrap gap-2">
          {RETENTION_PRESETS.map((preset) => (
            <button
              key={preset.days}
              onClick={() => onUpdateRetention(preset.days)}
              disabled={saving}
              className={`rounded-lg border px-4 py-2 text-sm transition ${
                settings.data_retention_days === preset.days
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              } disabled:opacity-50`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="number"
            min={7}
            max={3650}
            value={settings.data_retention_days}
            onChange={(e) => onUpdateRetention(Math.max(7, parseInt(e.target.value) || 365))}
            disabled={saving}
            className="w-24 rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-white"
          />
          <span className="text-sm text-gray-400">days</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Auto-Delete Recordings</h3>
            <p className="text-sm text-gray-400">
              When enabled, recordings past the retention period are permanently deleted daily at
              2:00 AM UTC.
            </p>
          </div>
          <button
            onClick={() => onToggleAutoDelete(!settings.auto_delete_enabled)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              settings.auto_delete_enabled ? "bg-emerald-500" : "bg-gray-600"
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                settings.auto_delete_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {settings.auto_delete_enabled && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">
              Next scheduled cleanup:{" "}
              <strong className="text-white">
                {nextCleanup.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>{" "}
              at 02:00 UTC
            </span>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-amber-800 bg-amber-900/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <div className="text-sm text-amber-300">
              <strong>Warning:</strong> Deleted recordings cannot be recovered. Ensure you have
              exported any required data before enabling auto-deletion.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DSAR Requests Tab ─────────────────────────────────────────────

function DSARRequestsTab({
  requests,
  loading,
  onRefresh,
  onProcess,
  onComplete,
}: {
  requests: DSARRequest[];
  loading: boolean;
  onRefresh: () => void;
  onProcess: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const [filter, setFilter] = useState("");

  const filtered = requests.filter(
    (r) =>
      !filter ||
      r.email?.toLowerCase().includes(filter.toLowerCase()) ||
      r.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
      r.status.includes(filter.toLowerCase())
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
            Pending
          </span>
        );
      case "in_progress":
        return (
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500"
          />
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <p className="text-gray-400">No data subject requests found.</p>
          <p className="mt-1 text-xs text-gray-500">
            Requests will appear here when users submit data export or deletion requests.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((req) => (
                <tr key={req.id} className="bg-gray-900/50 hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{req.full_name || "Unknown"}</p>
                      <p className="text-xs text-gray-400">{req.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-300">
                      {req.action === "export" ? "Data Export" : "Account Deletion"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-300">
                      {new Date(req.requested_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(req.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {req.status === "pending" && (
                        <button
                          onClick={() => onProcess(req.id)}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
                        >
                          Process
                        </button>
                      )}
                      {req.status === "in_progress" && (
                        <button
                          onClick={() => onComplete(req.id)}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Tab ─────────────────────────────────────────────────

function AuditLogTab({ entries, loading }: { entries: AuditEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-gray-500" />
        <p className="text-gray-400">No audit entries yet.</p>
        <p className="mt-1 text-xs text-gray-500">
          Policy changes, data exports, and deletions are logged here.
        </p>
      </div>
    );
  }

  const actionIcon = (action: string) => {
    if (action.includes("delete") || action.includes("retention")) return Trash2;
    if (action.includes("export")) return Download;
    if (action.includes("policy")) return Shield;
    if (action.includes("dsar")) return User;
    return FileText;
  };

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const Icon = actionIcon(entry.action);
        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-3"
          >
            <div className="mt-0.5 rounded-lg bg-gray-800 p-2">
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">{entry.details}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span>{entry.actor}</span>
                <span>•</span>
                <span>
                  {new Date(entry.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

type TabKey = "recording-policy" | "data-retention" | "dsar-requests" | "audit-log";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "recording-policy", label: "Recording Policy", icon: Mic },
  { key: "data-retention", label: "Data Retention", icon: Calendar },
  { key: "dsar-requests", label: "DSAR Requests", icon: User },
  { key: "audit-log", label: "Audit Log", icon: FileText },
];

export default function GDPRCompliance() {
  const { userContext } = useUserContext();
  const orgId = userContext?.organization_id;

  const [activeTab, setActiveTab] = useState<TabKey>("recording-policy");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // State
  const [settings, setSettings] = useState<OrgComplianceSettings>({
    default_recording_policy: "always_announce",
    data_retention_days: 365,
    auto_delete_enabled: false,
  });
  const [assistants, setAssistants] = useState<AssistantPolicyOverride[]>([]);
  const [dsarRequests, setDsarRequests] = useState<DSARRequest[]>([]);
  const [dsarLoading, setDsarLoading] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ─── Load settings ───────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      // Load org compliance settings
      const { data: org } = await supabase
        .from("organizations")
        .select("settings, data_retention_days")
        .eq("id", orgId)
        .single();

      if (org) {
        const s = org.settings || {};
        setSettings({
          default_recording_policy: s.default_recording_policy || "always_announce",
          data_retention_days: org.data_retention_days || s.data_retention_days || 365,
          auto_delete_enabled: s.auto_delete_enabled || false,
        });
      }

      // Load assistants with their recording_policy overrides
      const { data: assistantRows } = await supabase
        .from("assistants")
        .select("id, name, configuration, vapi_assistant_id")
        .eq("organization_id", orgId)
        .order("name");

      if (assistantRows) {
        setAssistants(
          assistantRows.map((a: any) => ({
            id: a.id,
            vapi_assistant_id: a.vapi_assistant_id || null,
            name: a.name || "Unnamed Assistant",
            recording_policy: a.configuration?.recording_policy || null,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load GDPR settings:", err);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ─── Load DSAR Requests ──────────────────────────────────────
  const loadDSARRequests = useCallback(async () => {
    if (!orgId) return;
    setDsarLoading(true);
    try {
      // Query profiles with deletion requests for org members
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, profiles(id, email, full_name, deletion_requested_at, deletion_scheduled_at, deletion_reason)")
        .eq("organization_id", orgId)
        .not("profiles.deletion_requested_at", "is", null);

      const requests: DSARRequest[] = (members || [])
        .filter((m: any) => m.profiles?.deletion_requested_at)
        .map((m: any) => ({
          id: m.profiles.id,
          user_id: m.user_id,
          email: m.profiles.email || "",
          full_name: m.profiles.full_name || "",
          action: "delete-request",
          status: m.profiles.deletion_scheduled_at
            ? new Date(m.profiles.deletion_scheduled_at) < new Date()
              ? "completed"
              : "pending"
            : "pending",
          requested_at: m.profiles.deletion_requested_at,
          completed_at: null,
          assigned_to: null,
          reason: m.profiles.deletion_reason,
        }));

      setDsarRequests(requests);
    } catch (err) {
      console.error("Failed to load DSAR requests:", err);
    }
    setDsarLoading(false);
  }, [orgId]);

  // ─── Load Audit Log ──────────────────────────────────────────
  const loadAuditLog = useCallback(async () => {
    if (!orgId) return;
    setAuditLoading(true);
    try {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, action, actor_id, details, created_at")
        .eq("organization_id", orgId)
        .in("action", [
          "gdpr_policy_change",
          "gdpr_retention_change",
          "gdpr_data_export",
          "gdpr_data_deletion",
          "gdpr_recording_deleted",
          "recording_policy_updated",
          "retention_policy_updated",
        ])
        .order("created_at", { ascending: false })
        .limit(50);

      setAuditEntries(
        (data || []).map((d: any) => ({
          id: d.id,
          action: d.action,
          actor: d.actor_id?.slice(0, 8) || "system",
          details: typeof d.details === "string" ? d.details : JSON.stringify(d.details),
          created_at: d.created_at,
        }))
      );
    } catch (err) {
      console.error("Failed to load audit log:", err);
    }
    setAuditLoading(false);
  }, [orgId]);

  // Load tab-specific data on tab switch
  useEffect(() => {
    if (activeTab === "dsar-requests") loadDSARRequests();
    if (activeTab === "audit-log") loadAuditLog();
  }, [activeTab, loadDSARRequests, loadAuditLog]);

  // ─── Handlers ────────────────────────────────────────────────

  const updateOrgPolicy = async (policy: RecordingPolicy) => {
    if (!orgId) return;
    setSaving(true);
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

      const updatedSettings = { ...(org?.settings || {}), default_recording_policy: policy };

      await supabase
        .from("organizations")
        .update({ settings: updatedSettings })
        .eq("id", orgId);

      setSettings((prev) => ({ ...prev, default_recording_policy: policy }));

      // Push recording policy to Vapi for all assistants using org default (no per-assistant override)
      const affectedAssistants = assistants.filter(
        (a) => !a.recording_policy && a.vapi_assistant_id
      );
      for (const assistant of affectedAssistants) {
        try {
          // Trigger updateAssistant which re-applies recording policy from DB
          await voiceService.updateAssistant(assistant.vapi_assistant_id!, {});
          // Rate limit: 200ms between Vapi calls to avoid hitting rate limits
          if (affectedAssistants.length > 1) {
            await new Promise((r) => setTimeout(r, 200));
          }
        } catch (err) {
          console.warn(`Failed to sync policy to assistant ${assistant.name}:`, err);
        }
      }

      // Audit log
      await supabase.from("audit_logs").insert({
        organization_id: orgId,
        action: "recording_policy_updated",
        actor_id: userContext?.id,
        details: `Recording policy changed to "${policy}" — synced to ${affectedAssistants.length} assistant(s)`,
        created_at: new Date().toISOString(),
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to update recording policy:", err);
    }
    setSaving(false);
  };

  const updateAssistantPolicy = async (assistantId: string, policy: RecordingPolicy | null) => {
    if (!orgId) return;
    setSaving(true);
    try {
      // Read current configuration
      const { data: assistant } = await supabase
        .from("assistants")
        .select("configuration, vapi_assistant_id")
        .eq("id", assistantId)
        .single();

      const config = { ...(assistant?.configuration || {}), recording_policy: policy };

      await supabase
        .from("assistants")
        .update({ configuration: config })
        .eq("id", assistantId);

      setAssistants((prev) =>
        prev.map((a) => (a.id === assistantId ? { ...a, recording_policy: policy } : a))
      );

      // Push updated policy to Vapi — updateAssistant re-reads policy from DB
      if (assistant?.vapi_assistant_id) {
        try {
          await voiceService.updateAssistant(assistant.vapi_assistant_id, {});
        } catch (err) {
          console.warn("Failed to sync policy to Vapi:", err);
        }
      }
    } catch (err) {
      console.error("Failed to update assistant policy:", err);
    }
    setSaving(false);
  };

  const updateRetention = async (days: number) => {
    if (!orgId) return;
    setSaving(true);
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

      const updatedSettings = { ...(org?.settings || {}), data_retention_days: days };

      await supabase
        .from("organizations")
        .update({ settings: updatedSettings, data_retention_days: days })
        .eq("id", orgId);

      setSettings((prev) => ({ ...prev, data_retention_days: days }));

      // Audit log
      await supabase.from("audit_logs").insert({
        organization_id: orgId,
        action: "retention_policy_updated",
        actor_id: userContext?.id,
        details: `Data retention period changed to ${days} days`,
        created_at: new Date().toISOString(),
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to update retention:", err);
    }
    setSaving(false);
  };

  const toggleAutoDelete = async (enabled: boolean) => {
    if (!orgId) return;
    setSaving(true);
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

      const updatedSettings = { ...(org?.settings || {}), auto_delete_enabled: enabled };

      await supabase
        .from("organizations")
        .update({ settings: updatedSettings })
        .eq("id", orgId);

      setSettings((prev) => ({ ...prev, auto_delete_enabled: enabled }));
    } catch (err) {
      console.error("Failed to toggle auto-delete:", err);
    }
    setSaving(false);
  };

  const processDSAR = async (requestId: string) => {
    // Mark DSAR as in_progress — in a real system this would assign to an admin
    setDsarRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "in_progress" as const } : r))
    );
  };

  const completeDSAR = async (requestId: string) => {
    setDsarRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: "completed" as const, completed_at: new Date().toISOString() }
          : r
      )
    );
  };

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Shield className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">GDPR & Compliance</h1>
            <p className="text-sm text-gray-400">
              Manage recording policies, data retention, and data subject requests.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Status Banner */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-white">Recording Policy</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {POLICY_OPTIONS.find((p) => p.value === settings.default_recording_policy)?.label ||
              "Not set"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2">
            {settings.auto_delete_enabled ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-400" />
            )}
            <span className="text-sm font-medium text-white">Auto-Delete</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {settings.auto_delete_enabled
              ? `Enabled — ${settings.data_retention_days} day retention`
              : "Disabled — recordings kept indefinitely"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-white">DSAR Compliance</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {dsarRequests.filter((r) => r.status === "pending").length} pending requests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-800 text-emerald-400"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "recording-policy" && (
        <RecordingPolicyTab
          settings={settings}
          assistants={assistants}
          onUpdateOrgPolicy={updateOrgPolicy}
          onUpdateAssistantPolicy={updateAssistantPolicy}
          saving={saving}
        />
      )}
      {activeTab === "data-retention" && (
        <DataRetentionTab
          settings={settings}
          onUpdateRetention={updateRetention}
          onToggleAutoDelete={toggleAutoDelete}
          saving={saving}
        />
      )}
      {activeTab === "dsar-requests" && (
        <DSARRequestsTab
          requests={dsarRequests}
          loading={dsarLoading}
          onRefresh={loadDSARRequests}
          onProcess={processDSAR}
          onComplete={completeDSAR}
        />
      )}
      {activeTab === "audit-log" && (
        <AuditLogTab entries={auditEntries} loading={auditLoading} />
      )}
    </div>
  );
}
