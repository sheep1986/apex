import { supabase } from "@/services/supabase-client";
import {
  CheckCircle2,
  Circle,
  Phone,
  Plus,
  Rocket,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Types ─────────────────────────────────────────────────────────

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  route: string;
  icon: any;
}

interface ActivationChecklistProps {
  orgId: string;
  onboardedAt: string | null;
}

// ─── Component ─────────────────────────────────────────────────────

export function ActivationChecklist({ orgId, onboardedAt }: ActivationChecklistProps) {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadChecklist = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("activation_checklist, first_call_at")
        .eq("id", orgId)
        .single();

      const ac = org?.activation_checklist || {};

      // Also check if they have assistants, phone numbers, campaigns, deals
      const [assistants, phones, campaigns, deals] = await Promise.all([
        supabase.from("assistants").select("id").eq("organization_id", orgId).limit(1),
        supabase.from("voice_phone_numbers").select("id").eq("organization_id", orgId).limit(1),
        supabase.from("campaigns").select("id").eq("organization_id", orgId).limit(1),
        supabase.from("crm_deals").select("id").eq("organization_id", orgId).limit(1),
      ]);

      const items: ChecklistItem[] = [
        {
          key: "create_org",
          label: "Create your organization",
          description: "Set up your company profile",
          completed: true, // Always done if they're on dashboard
          route: "/organization-settings",
          icon: Users,
        },
        {
          key: "choose_plan",
          label: "Choose a plan",
          description: "Select the right plan for your needs",
          completed: ac.choose_plan || true, // Done if onboarded
          route: "/billing",
          icon: Zap,
        },
        {
          key: "create_assistant",
          label: "Create an AI assistant",
          description: "Build your first voice AI employee",
          completed: ac.create_assistant || (assistants.data && assistants.data.length > 0) || false,
          route: "/ai-assistants",
          icon: Rocket,
        },
        {
          key: "assign_phone",
          label: "Assign a phone number",
          description: "Get a number for inbound and outbound calls",
          completed: ac.assign_phone || (phones.data && phones.data.length > 0) || false,
          route: "/telephony",
          icon: Phone,
        },
        {
          key: "first_test_call",
          label: "Make your first test call",
          description: "Verify your assistant sounds perfect",
          completed: ac.first_test_call || !!org?.first_call_at || false,
          route: "/telephony",
          icon: Phone,
        },
        {
          key: "first_campaign",
          label: "Launch your first campaign",
          description: "Start reaching out to leads at scale",
          completed: ac.first_campaign || (campaigns.data && campaigns.data.length > 0) || false,
          route: "/campaigns/new",
          icon: Target,
        },
        {
          key: "first_deal",
          label: "Create your first deal",
          description: "Track revenue in your sales pipeline",
          completed: ac.first_deal || (deals.data && deals.data.length > 0) || false,
          route: "/pipeline",
          icon: TrendingUp,
        },
      ];

      setChecklist(items);
    } catch (err) {
      console.error("Failed to load activation checklist:", err);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  // Don't show if dismissed or if all items complete
  if (dismissed || loading) return null;

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const allComplete = completedCount === totalCount;

  // Don't show if all complete
  if (allComplete) return null;

  // Don't show if onboarded more than 14 days ago
  if (onboardedAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(onboardedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 14) return null;
  }

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-5 py-3">
        <div className="flex items-center gap-3">
          <Rocket className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Get Started — {completedCount} of {totalCount} complete
            </h3>
            <p className="text-xs text-gray-400">Complete these steps to unlock Trinity's full potential</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-gray-300"
          title="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-5 pt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="p-4 grid gap-1.5">
        {checklist.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => !item.completed && navigate(item.route)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                item.completed
                  ? "bg-gray-800/30 opacity-60"
                  : "bg-gray-800/50 hover:bg-gray-800"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0 text-gray-600" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    item.completed ? "text-gray-500 line-through" : "text-white"
                  }`}
                >
                  {item.label}
                </p>
                {!item.completed && (
                  <p className="text-xs text-gray-400">{item.description}</p>
                )}
              </div>
              {!item.completed && <Icon className="h-4 w-4 flex-shrink-0 text-gray-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
