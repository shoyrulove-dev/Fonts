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
      { threshold: 0.08, rootMargin: "0px 0px -32px" }
    );

    const observe = (root: ParentNode) => {
      const targets = root.querySelectorAll<HTMLElement>("main > section, main section > header, main article, [data-reveal]");
      targets.forEach((target, index) => {
        if (target.dataset.revealReady) return;
        target.dataset.revealReady = "true";
        target.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 45}ms`);
        target.classList.add("reveal-on-scroll");
        observer.observe(target);
      });
    };

    observe(document);
    const mutationObserver = new MutationObserver((entries) => entries.forEach((entry) => entry.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) observe(node.parentElement || document);
    })));
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutationObserver.disconnect(); };
  }, [pathname]);

  return null;
}
