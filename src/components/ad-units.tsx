"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export function NativeBanner() {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      void fetch("/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "ad_impression", slug: window.location.pathname }) });
      observer.disconnect();
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} role="complementary" className="my-10 min-h-24 overflow-hidden rounded-2xl border border-[#e3e2da] bg-white/60 p-3" aria-label="Advertisement">{visible && <><Script id="bliss-native-banner" async src="https://pl31454296.profitableratecpmnetwork.com/0931eb84b45db03f8398c51ccfcbb210/invoke.js" data-cfasync="false" /><div id="container-0931eb84b45db03f8398c51ccfcbb210" /></>}</div>;
}

export function PopunderDownload({ href, children }: { href: string; children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  function loadPopunder() {
    if (loaded || document.querySelector('script[data-bliss-popunder="true"]')) return;
    const script = document.createElement("script");
    script.src = "https://pl31454295.profitableratecpmnetwork.com/10/a7/59/10a75971819636efacdefe7810a72147.js";
    script.async = true;
    script.dataset.blissPopunder = "true";
    document.body.appendChild(script);
    setLoaded(true);
  }
  return <a href={href} download onPointerDown={loadPopunder} className="rounded-full bg-[#dce8dc] px-5 py-3 text-sm font-semibold text-[#1d241f] transition-transform hover:-translate-y-0.5">{children}</a>;
}
