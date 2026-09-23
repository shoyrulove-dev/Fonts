"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.01, rootMargin: "0px 0px -16px" }
    );

    const observe = (root: ParentNode) => {
      const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
      targets.forEach((target, index) => {
        if (target.dataset.revealReady) return;
        target.dataset.revealReady = "true";
        target.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 45}ms`);
        target.classList.add("reveal-on-scroll");
        const rect = target.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) target.classList.add("is-visible");
        else observer.observe(target);
      });
    };

    observe(document);
    const mutationObserver = new MutationObserver((entries) => entries.forEach((entry) => entry.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) observe(node.parentElement || document);
    })));
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    const safetyTimer = window.setTimeout(() => document.querySelectorAll<HTMLElement>(".reveal-on-scroll").forEach((target) => target.classList.add("is-visible")), 1400);
    return () => { observer.disconnect(); mutationObserver.disconnect(); window.clearTimeout(safetyTimer); };
  }, [pathname]);

  return null;
}
