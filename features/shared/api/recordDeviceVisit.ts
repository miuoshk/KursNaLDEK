"use server";

import { z } from "zod";
import { warsawYmd } from "@/lib/datetime/warsawCalendar";
import { createClient } from "@/lib/supabase/server";
import {
  DEVICE_CLASSES,
  type DeviceClass,
} from "@/features/shared/lib/classifyDevice";

const schema = z.object({
  deviceClass: z.enum(DEVICE_CLASSES),
});

export async function recordDeviceVisit(
  deviceClass: DeviceClass,
): Promise<boolean> {
  const parsed = schema.safeParse({ deviceClass });
  if (!parsed.success) return false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("device_visits").upsert(
      {
        user_id: user.id,
        visited_on: warsawYmd(new Date()),
        device_class: parsed.data.deviceClass,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,visited_on,device_class" },
    );

    if (error) {
      console.error("[recordDeviceVisit]", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[recordDeviceVisit]", error);
    return false;
  }
}
