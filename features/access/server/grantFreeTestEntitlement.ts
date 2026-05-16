import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";

export async function grantFreeTestEntitlement(args: {
  userId: string;
  track: StudyTrack;
  year: StudyYear;
}) {
  const admin = createAdminClient();

  const { error } = await admin.from("user_year_entitlements").upsert(
    {
      user_id: args.userId,
      track: args.track,
      year: args.year,
      access_type: "free_test",
      active: true,
    },
    { onConflict: "user_id,track,year" },
  );

  if (error) {
    throw new Error(`Nie udało się aktywować dostępu testowego: ${error.message}`);
  }
}
