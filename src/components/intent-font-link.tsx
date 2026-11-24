"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export function IntentFontLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefetched = useRef(false);
  const cancel = () => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => cancel, []);

  const prefetch = () => {
    cancel();
    if (prefetched.current) return;
    prefetched.current = true;
    router.prefetch(href);
  };

  return <Link href={href} className={className} prefetch={false}
    onPointerEnter={event => {
      if (event.pointerType === "mouse" && !prefetched.current) timer.current = setTimeout(prefetch, 150);
    }}
    onPointerLeave={cancel} onFocus={prefetch} onBlur={cancel}>{children}</Link>;
}
