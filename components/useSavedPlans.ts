"use client";

import { useSyncExternalStore } from "react";
import { readPlansSnapshot, serverPlansSnapshot, subscribePlans } from "@/lib/storage";
import type { Plan } from "@/lib/types";

const hydratedOnClient = () => true;
const hydratedOnServer = () => false;

export function useSavedPlans(): { plans: Plan[]; hydrated: boolean } {
  const plans = useSyncExternalStore(subscribePlans, readPlansSnapshot, serverPlansSnapshot);
  const hydrated = useSyncExternalStore(subscribePlans, hydratedOnClient, hydratedOnServer);
  return { plans, hydrated };
}
