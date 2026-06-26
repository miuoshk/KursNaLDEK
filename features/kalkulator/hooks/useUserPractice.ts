"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createKalkulatorClient } from "@/features/kalkulator/lib/supabase";
import { useKalkulatorAuth } from "@/features/kalkulator/context/AuthContext";
import type { Practice } from "@/features/kalkulator/types/practice";

export function useUserPractice() {
  const { user } = useKalkulatorAuth();
  const supabase = useMemo(() => createKalkulatorClient(), []);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setPractice(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("practices")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[kalkulator] load practice failed", error.message);
      setPractice(null);
    } else {
      setPractice(data as Practice | null);
    }

    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { practice, loading, reload };
}
