import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

/**
 * GDPR Recording Retention Cleanup
 *
 * Runs daily at 2:00 AM UTC.
 * For each org with auto_delete_enabled, deletes recording references
 * older than the org's data_retention_days.
 *
 * Does NOT delete transcripts or call metadata — only recording references.
 * This ensures analytics remain valid while PII (audio) is purged.
 */
async function retentionCleanup() {
  console.log("[gdpr-retention] Starting daily retention cleanup...");

  try {
    // 1. Get all orgs with auto-delete enabled
    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id, settings, data_retention_days")
      .not("settings", "is", null);

    if (orgError) {
      console.error("[gdpr-retention] Failed to load orgs:", orgError);
      return;
    }

    const eligibleOrgs = (orgs || []).filter(
      (o: any) => o.settings?.auto_delete_enabled === true
    );

    if (eligibleOrgs.length === 0) {
      console.log("[gdpr-retention] No orgs with auto-delete enabled. Skipping.");
      return;
    }

    console.log(`[gdpr-retention] Processing ${eligibleOrgs.length} org(s) with auto-delete enabled`);

    let totalDeleted = 0;

    for (const org of eligibleOrgs) {
      const retentionDays = org.data_retention_days || org.settings?.data_retention_days || 365;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoff = cutoffDate.toISOString();

      console.log(`[gdpr-retention] Org ${org.id}: retention=${retentionDays}d, cutoff=${cutoff.slice(0, 10)}`);

      // 2. Find recordings older than retention period
      const { data: expiredRecordings, error: queryError } = await supabase
        .from("voice_call_recordings")
        .select("id, voice_call_id")
        .eq("organization_id", org.id)
        .lt("created_at", cutoff)
        .eq("status", "available")
        .limit(500); // Process in batches

      if (queryError) {
        console.error(`[gdpr-retention] Query failed for org ${org.id}:`, queryError);
        continue;
      }

      if (!expiredRecordings || expiredRecordings.length === 0) {
        console.log(`[gdpr-retention] Org ${org.id}: No expired recordings`);
        continue;
      }

      console.log(`[gdpr-retention] Org ${org.id}: ${expiredRecordings.length} expired recording(s)`);

      const recordingIds = expiredRecordings.map((r: any) => r.id);
      const callIds = [...new Set(expiredRecordings.map((r: any) => r.voice_call_id).filter(Boolean))];

      // 3. Mark recordings as deleted (soft delete — update status)
      const { error: deleteError } = await supabase
        .from("voice_call_recordings")
        .update({
          status: "deleted",
          provider_recording_ref: null, // Remove the actual URL
          updated_at: new Date().toISOString(),
        })
        .in("id", recordingIds);

      if (deleteError) {
        console.error(`[gdpr-retention] Delete failed for org ${org.id}:`, deleteError);
        continue;
      }

      // 4. Clear recording references from voice_call_private
      if (callIds.length > 0) {
        await supabase
          .from("voice_call_private")
          .update({
            provider_recording_ref: null,
            updated_at: new Date().toISOString(),
          })
          .in("voice_call_id", callIds)
          .catch((err: any) => {
            console.warn(`[gdpr-retention] Failed to clear private recording refs:`, err?.message);
          });
      }

      totalDeleted += expiredRecordings.length;

      // 5. Audit log
      await supabase
        .from("audit_logs")
        .insert({
          organization_id: org.id,
          action: "gdpr_recording_deleted",
          actor_id: "system",
          details: `Auto-deleted ${expiredRecordings.length} recording(s) older than ${retentionDays} days`,
          created_at: new Date().toISOString(),
        })
        .catch(() => {});

      // 6. Create notification for org admins
      await supabase
        .from("notifications")
        .insert({
          organization_id: org.id,
          type: "gdpr_retention",
          title: "Recording Cleanup Complete",
          message: `${expiredRecordings.length} recording(s) older than ${retentionDays} days have been automatically deleted per your GDPR retention policy.`,
          created_at: new Date().toISOString(),
        })
        .catch(() => {});
    }

    console.log(`[gdpr-retention] Cleanup complete. Total recordings deleted: ${totalDeleted}`);
  } catch (error) {
    console.error("[gdpr-retention] Unexpected error:", error);
  }
}

// Schedule: daily at 2:00 AM UTC
export const handler = schedule("0 2 * * *", async () => {
  await retentionCleanup();
  return { statusCode: 200, body: "OK" };
});
