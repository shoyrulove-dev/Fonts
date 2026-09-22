"use client";

import Script from "next/script";

export function NativeBanner() {
  return <div className="my-10 overflow-hidden rounded-2xl border border-[#e3e2da] bg-white/60 p-3" aria-label="Advertisement"><Script async src="https://pl31454296.profitableratecpmnetwork.com/0931eb84b45db03f8398c51ccfcbb210/invoke.js" data-cfasync="false" /><div id="container-0931eb84b45db03f8398c51ccfcbb210" /></div>;
}

export function PopunderDownload({ href, children }: { href: string; children: React.ReactNode }) {
  return <><Script src="https://pl31454295.profitableratecpmnetwork.com/10/a7/59/10a75971819636efacdefe7810a72147.js" strategy="afterInteractive" /><a href={href} download className="rounded-full bg-[#dce8dc] px-5 py-3 text-sm font-semibold text-[#1d241f] transition-transform hover:-translate-y-0.5">{children}</a></>;
}
