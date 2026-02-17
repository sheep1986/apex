import { useUserContext } from "@/services/MinimalUserProvider";
import { supabase } from "@/services/supabase-client";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Filter,
  Frown,
  Loader2,
  Meh,
  Mic,
  Phone,
  Search,
  Smile,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────

interface CallQARecord {
  id: string;
  phone_number?: string;
  customer_number?: string;
  status: string;
  duration_seconds: number;
  cost: number;
  created_at: string;
  ended_reason?: string;
  qa_score?: number;
  sentiment?: string;
  outcome?: string;
  qa_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  recording_policy?: string;
  // Joined data
  campaign_name?: string;
  contact_name?: string;
  transcript_summary?: string;
  transcript_full?: string;
  provider_recording_ref?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function sentimentIcon(sentiment?: string) {
  switch (sentiment) {
    case "positive":
      return <Smile className="h-4 w-4 text-emerald-400" />;
    case "negative":
      return <Frown className="h-4 w-4 text-red-400" />;
    default:
      return <Meh className="h-4 w-4 text-gray-400" />;
  }
}

function sentimentBadge(sentiment?: string) {
  switch (sentiment) {
    case "positive":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          <Smile className="h-3 w-3" /> Positive
        </span>
      );
    case "negative":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
          <Frown className="h-3 w-3" /> Negative
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400">
          <Meh className="h-3 w-3" /> Neutral
        </span>
      );
  }
}

function outcomeBadge(outcome?: string) {
  switch (outcome) {
    case "interested":
      return (
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          Interested
        </span>
      );
    case "callback":
      return (
        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
          Callback
        </span>
      );
    case "not_interested":
      return (
        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
          Not Interested
        </span>
      );
    case "voicemail":
      return (
        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
          Voicemail
        </span>
      );
    case "no_answer":
      return (
        <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400">
          No Answer
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-500">
          {outcome || "Unknown"}
        </span>
      );
  }
}

function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readOnly && onChange?.(star)}
          disabled={readOnly}
          className={`transition ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Expanded Row Detail ───────────────────────────────────────────

function CallDetailPanel({
  call,
  onSaveReview,
  saving,
}: {
  call: CallQARecord;
  onSaveReview: (callId: string, data: { qa_score?: number; sentiment?: string; outcome?: string; qa_notes?: string }) => void;
  saving: boolean;
}) {
  const [editScore, setEditScore] = useState(call.qa_score || 3);
  const [editSentiment, setEditSentiment] = useState(call.sentiment || "neutral");
  const [editOutcome, setEditOutcome] = useState(call.outcome || "other");
  const [editNotes, setEditNotes] = useState(call.qa_notes || "");

  return (
    <div className="border-t border-gray-700 bg-gray-900/80 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Transcript / Recording */}
        <div className="space-y-3">
          {call.transcript_summary && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Call Summary
              </p>
              <p className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-gray-300">
                {call.transcript_summary}
              </p>
            </div>
          )}

          {call.transcript_full && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Transcript Preview
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs text-gray-400">
                {call.transcript_full.slice(0, 1000)}
                {call.transcript_full.length > 1000 && "..."}
              </div>
            </div>
          )}

          {call.provider_recording_ref && (
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-400">Recording available</span>
            </div>
          )}

          {!call.transcript_summary && !call.transcript_full && (
            <p className="text-sm text-gray-500">No transcript data available for this call.</p>
          )}
        </div>

        {/* Right: QA Scoring Form */}
        <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
          <h4 className="text-sm font-semibold text-white">Quality Assessment</h4>

          {/* Score */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">QA Score</label>
            <StarRating value={editScore} onChange={setEditScore} />
          </div>

          {/* Sentiment */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Sentiment</label>
            <div className="flex gap-2">
              {(["positive", "neutral", "negative"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setEditSentiment(s)}
                  className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs capitalize transition ${
                    editSentiment === s
                      ? s === "positive"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : s === "negative"
                          ? "border-red-500 bg-red-500/10 text-red-400"
                          : "border-gray-500 bg-gray-500/10 text-gray-300"
                      : "border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {sentimentIcon(s)} {s}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Outcome</label>
            <select
              value={editOutcome}
              onChange={(e) => setEditOutcome(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-white"
            >
              <option value="interested">Interested</option>
              <option value="callback">Callback</option>
              <option value="not_interested">Not Interested</option>
              <option value="voicemail">Voicemail</option>
              <option value="no_answer">No Answer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add review notes..."
              rows={2}
              className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>

          {/* Save */}
          <button
            onClick={() =>
              onSaveReview(call.id, {
                qa_score: editScore,
                sentiment: editSentiment,
                outcome: editOutcome,
                qa_notes: editNotes,
              })
            }
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {call.reviewed_at ? "Update Review" : "Mark Reviewed"}
          </button>

          {call.reviewed_at && (
            <p className="text-xs text-gray-500">
              Reviewed on{" "}
              {new Date(call.reviewed_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function CallQualityReview() {
  const { userContext } = useUserContext();
  const orgId = userContext?.organization_id;

  const [calls, setCalls] = useState<CallQARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [reviewedFilter, setReviewedFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // ─── Fetch calls ────────────────────────────────────────────
  const fetchCalls = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      // Fetch recent voice calls (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: callRows } = await supabase
        .from("voice_calls")
        .select(
          "id, phone_number, customer_number, status, duration_seconds, cost, created_at, ended_reason, qa_score, sentiment, outcome, qa_notes, reviewed_by, reviewed_at, recording_policy"
        )
        .eq("organization_id", orgId)
        .eq("status", "ended")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(200);

      if (!callRows) {
        setCalls([]);
        setLoading(false);
        return;
      }

      // Fetch private data for transcript summaries
      const callIds = callRows.map((c: any) => c.id);
      const { data: privateRows } = await supabase
        .from("voice_call_private")
        .select("voice_call_id, transcript_summary, transcript_full, provider_recording_ref")
        .in("voice_call_id", callIds);

      const privateMap = new Map(
        (privateRows || []).map((p: any) => [p.voice_call_id, p])
      );

      const enrichedCalls: CallQARecord[] = callRows.map((c: any) => {
        const priv = privateMap.get(c.id) || {};
        return {
          ...c,
          transcript_summary: priv.transcript_summary,
          transcript_full: priv.transcript_full,
          provider_recording_ref: priv.provider_recording_ref,
        };
      });

      setCalls(enrichedCalls);
    } catch (err) {
      console.error("Failed to fetch QA calls:", err);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // ─── Save Review ─────────────────────────────────────────────
  const saveReview = async (
    callId: string,
    data: { qa_score?: number; sentiment?: string; outcome?: string; qa_notes?: string }
  ) => {
    setSaving(true);
    try {
      await supabase
        .from("voice_calls")
        .update({
          ...data,
          reviewed_by: userContext?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", callId);

      // Update local state
      setCalls((prev) =>
        prev.map((c) =>
          c.id === callId
            ? {
                ...c,
                ...data,
                reviewed_by: userContext?.id,
                reviewed_at: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to save review:", err);
    }
    setSaving(false);
  };

  // ─── Filter ──────────────────────────────────────────────────
  const filteredCalls = calls.filter((c) => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchesPhone =
        c.phone_number?.toLowerCase().includes(q) ||
        c.customer_number?.toLowerCase().includes(q);
      const matchesContact = c.contact_name?.toLowerCase().includes(q);
      if (!matchesPhone && !matchesContact) return false;
    }
    if (sentimentFilter !== "all" && c.sentiment !== sentimentFilter) return false;
    if (outcomeFilter !== "all" && c.outcome !== outcomeFilter) return false;
    if (reviewedFilter === "reviewed" && !c.reviewed_at) return false;
    if (reviewedFilter === "unreviewed" && c.reviewed_at) return false;
    return true;
  });

  // ─── Stats ───────────────────────────────────────────────────
  const avgScore =
    calls.filter((c) => c.qa_score).length > 0
      ? calls.filter((c) => c.qa_score).reduce((sum, c) => sum + (c.qa_score || 0), 0) /
        calls.filter((c) => c.qa_score).length
      : 0;

  const sentimentCounts = {
    positive: calls.filter((c) => c.sentiment === "positive").length,
    neutral: calls.filter((c) => c.sentiment === "neutral").length,
    negative: calls.filter((c) => c.sentiment === "negative").length,
  };

  const unreviewedCount = calls.filter((c) => !c.reviewed_at).length;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Star className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Call Quality Review</h1>
              <p className="text-sm text-gray-400">
                Review and score call quality. Auto-scored by AI, manually reviewable.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                showFilters
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs font-medium text-gray-400">Avg QA Score</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{avgScore.toFixed(1)}</span>
            <StarRating value={Math.round(avgScore)} readOnly />
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs font-medium text-gray-400">Sentiment</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <ThumbsUp className="h-3 w-3" /> {sentimentCounts.positive}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Meh className="h-3 w-3" /> {sentimentCounts.neutral}
            </span>
            <span className="flex items-center gap-1 text-xs text-red-400">
              <ThumbsDown className="h-3 w-3" /> {sentimentCounts.negative}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs font-medium text-gray-400">Awaiting Review</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{unreviewedCount}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs font-medium text-gray-400">Total Calls (30d)</p>
          <p className="mt-1 text-2xl font-bold text-white">{calls.length}</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search phone..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500"
            />
          </div>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            <option value="all">All Outcomes</option>
            <option value="interested">Interested</option>
            <option value="callback">Callback</option>
            <option value="not_interested">Not Interested</option>
            <option value="voicemail">Voicemail</option>
            <option value="no_answer">No Answer</option>
          </select>
          <select
            value={reviewedFilter}
            onChange={(e) => setReviewedFilter(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="reviewed">Reviewed</option>
            <option value="unreviewed">Unreviewed</option>
          </select>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
          <Phone className="mx-auto mb-3 h-10 w-10 text-gray-500" />
          <p className="text-gray-400">No calls found for the selected filters.</p>
          <p className="mt-1 text-xs text-gray-500">
            Completed calls from the last 30 days will appear here with QA scores.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">QA Score</th>
                <th className="px-4 py-3">Sentiment</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCalls.map((call) => (
                <CallRow
                  key={call.id}
                  call={call}
                  isExpanded={expandedId === call.id}
                  onToggle={() => setExpandedId(expandedId === call.id ? null : call.id)}
                  onSaveReview={saveReview}
                  saving={saving}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Call Row Component ────────────────────────────────────────────

function CallRow({
  call,
  isExpanded,
  onToggle,
  onSaveReview,
  saving,
}: {
  call: CallQARecord;
  isExpanded: boolean;
  onToggle: () => void;
  onSaveReview: (callId: string, data: any) => void;
  saving: boolean;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer bg-gray-900/50 transition hover:bg-gray-800/50"
      >
        <td className="px-4 py-3">
          <div>
            <p className="text-sm text-white">
              {new Date(call.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(call.created_at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-gray-300">
            {call.customer_number || call.phone_number || "—"}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-300">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            {formatDuration(call.duration_seconds)}
          </div>
        </td>
        <td className="px-4 py-3">
          <StarRating value={call.qa_score || 0} readOnly />
        </td>
        <td className="px-4 py-3">{sentimentBadge(call.sentiment)}</td>
        <td className="px-4 py-3">{outcomeBadge(call.outcome)}</td>
        <td className="px-4 py-3">
          {call.reviewed_at ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Reviewed
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
              Pending
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <CallDetailPanel call={call} onSaveReview={onSaveReview} saving={saving} />
          </td>
        </tr>
      )}
    </>
  );
}
