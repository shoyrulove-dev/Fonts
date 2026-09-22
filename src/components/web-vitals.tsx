"use client";

import { useReportWebVitals } from "next/web-vitals";

export default function WebVitals() {
  useReportWebVitals((metric) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", metric.name, { value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value), metric_id: metric.id, metric_value: metric.value, metric_delta: metric.delta });
  });
  return null;
}

declare global { interface Window { gtag?: (...args: unknown[]) => void; } }
