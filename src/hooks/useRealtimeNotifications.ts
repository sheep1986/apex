import { useNotificationStore } from '@/lib/notification-store';
import { supabase } from '@/services/supabase-client';
import { useEffect, useRef } from 'react';

/**
 * Subscribes to Supabase realtime events for:
 * 1. Hot leads (score >= 70) — fires notification when AI qualifies a lead
 * 2. Call completions — fires notification when a voice call ends
 *
 * Must be mounted inside an authenticated context with a valid org ID.
 */
export function useRealtimeNotifications(organizationId: string | undefined) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    if (!organizationId) return;

    // ── Channel 1: Hot lead detection ──
    const leadsChannel = supabase
      .channel(`hot-leads-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const lead = payload.new as any;
          const oldLead = payload.old as any;

          // Only trigger when score crosses the 70 threshold (wasn't hot before, is hot now)
          const wasHot = (oldLead?.score || 0) >= 70;
          const isHot = (lead?.score || 0) >= 70;

          if (isHot && !wasHot && !seenIds.current.has(lead.id)) {
            seenIds.current.add(lead.id);

            const isUrgent = lead.score >= 90;
            addNotification({
              type: isUrgent ? 'warning' : 'success',
              title: isUrgent ? 'Urgent: Hot Lead Detected' : 'Hot Lead Qualified',
              message: `${lead.name || lead.phone_number} scored ${lead.score}/100${lead.campaign_name ? ` from "${lead.campaign_name}"` : ''}. Ready for human follow-up.`,
              category: 'performance',
              priority: isUrgent ? 'urgent' : 'high',
              source: 'ai-lead-engine',
              metadata: {
                leadId: lead.id,
                score: lead.score,
                phone: lead.phone_number,
              },
              action: {
                label: 'View in Agent Dashboard',
                href: '/agent-dashboard',
              },
            });
          }
        }
      )
      .subscribe();

    // ── Channel 2: Call completions ──
    const callsChannel = supabase
      .channel(`call-events-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'voice_calls',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const call = payload.new as any;
          const oldCall = payload.old as any;

          // Only fire when status transitions TO 'ended'
          if (call.status === 'ended' && oldCall?.status !== 'ended' && !seenIds.current.has(call.id)) {
            seenIds.current.add(call.id);

            const contactName = call.customer_name || call.customer_number || 'Unknown';
            const duration = call.duration_seconds || call.duration || 0;
            const leadScore = call.analysis?.lead_score;
            const isHighValue = leadScore && leadScore >= 70;

            addNotification({
              type: isHighValue ? 'success' : 'info',
              title: isHighValue ? 'High-Value Call Completed' : 'Call Completed',
              message: `Call with ${contactName} ended (${Math.round(duration)}s)${leadScore ? ` — Score: ${leadScore}/100` : ''}`,
              category: 'calls',
              priority: isHighValue ? 'high' : 'low',
              source: 'call-monitor',
              metadata: {
                callId: call.id,
                duration,
                leadScore,
              },
              action: {
                label: 'View Call',
                href: '/all-calls',
              },
              autoHide: !isHighValue,
              hideAfter: 6000,
            });
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(callsChannel);
    };
  }, [organizationId, addNotification]);
}
