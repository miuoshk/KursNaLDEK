"use client";

import { useEffect } from "react";
import { recordDeviceVisit } from "@/features/shared/api/recordDeviceVisit";
import {
  classifyDevice,
  collectBrowserDeviceSignals,
} from "@/features/shared/lib/classifyDevice";
import { warsawYmd } from "@/lib/datetime/warsawCalendar";

const STORAGE_PREFIX = "knl-device-visit:2:";

function storageKey(deviceClass: string, day: string): string {
  return `${STORAGE_PREFIX}${day}:${deviceClass}`;
}

function alreadyRecorded(deviceClass: string, day: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(deviceClass, day)) === "1";
  } catch {
    return false;
  }
}

function markRecorded(deviceClass: string, day: string): void {
  try {
    window.localStorage.setItem(storageKey(deviceClass, day), "1");
  } catch {
    // private mode / quota — ping i tak poleci
  }
}

/** Cichy ping klasy urządzenia raz na dzień (Europe/Warsaw) per przeglądarka. */
export function DeviceVisitTracker() {
  useEffect(() => {
    let cancelled = false;
    try {
      const deviceClass = classifyDevice(collectBrowserDeviceSignals());
      const day = warsawYmd(new Date());
      if (alreadyRecorded(deviceClass, day)) return;

      void recordDeviceVisit(deviceClass)
        .then((ok) => {
          if (ok && !cancelled) markRecorded(deviceClass, day);
        })
        .catch(() => {
          // tracker nie może wyłożyć layoutu
        });
    } catch {
      // ignore
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
