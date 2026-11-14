"use client";
/**
 * UX Flow 002 2.2: detalle de rutina. A fixed path, so it is prerendered and precached for offline
 * use; which routine to show is kept on the device, never in the URL (PRD 002 FR-8).
 */
import { RoutineDetailScreen } from "../../_screens/RoutineDetailScreen";

export default function RoutineDetailPage() {
  return <RoutineDetailScreen />;
}
