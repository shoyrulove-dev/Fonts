"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { specimenText } from "@/lib/i18n";

type SpecimenFont = {
  slug: string;
  name: string;
  license: string;
  file: string;
};

export default function DynamicSpecimen({ fonts, locale = "en" }: { fonts: SpecimenFont[]; locale?: Locale }) {
  const [font, setFont] = useState<SpecimenFont | null>(null);

  const chooseFont = useCallback(() => {
    if (!fonts.length) return;
    const previous = window.sessionStorage.getItem("bliss-specimen");
    const choices =
      fonts.length > 1 ? fonts.filter((item) => item.slug !== previous) : fonts;
    const next =
      choices[Math.floor(Math.random() * choices.length)] ?? fonts[0];
    window.sessionStorage.setItem("bliss-specimen", next.slug);
    setFont(next);
  }, [fonts]);

  useEffect(() => {
    const timer = window.setTimeout(chooseFont, 0);
    return () => window.clearTimeout(timer);
  }, [chooseFont]);

  const family = font
    ? `BlissHero-${font.slug.replace(/[^a-z0-9]/gi, "")}`
    : "inherit";
  const face = font
    ? `@font-face{font-family:'${family}';src:url('https://assets.blissbiovn.com/${font.file}') format('woff2');font-display:swap;}`
    : "";
  const sample = specimenText[locale];

  return (
    <div data-reveal className="relative mx-auto w-full max-w-sm">
      {face && <style dangerouslySetInnerHTML={{ __html: face }} />}
      <div className="absolute -right-4 top-10 h-48 w-48 rounded-full bg-[#c97d61] opacity-20 blur-3xl" />
      <div className="relative rotate-1 rounded-[1.75rem] bg-[#1d241f] p-7 text-[#f6f4ee] shadow-2xl shadow-[#1d241f]/15">
        <div className="flex items-start justify-between border-b border-white/15 pb-5">
          <button
            type="button"
            onClick={chooseFont}
            className="text-xs uppercase tracking-[0.22em] text-[#b5cbb6] transition hover:text-white"
            aria-label="New specimen"
          >
            New specimen ↻
          </button>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs">
            {font?.license || "Font"}
          </span>
        </div>
        <p
          className="mt-8 text-[6.5rem] leading-[.8] tracking-[-0.1em]"
          style={{ fontFamily: family }}
        >
          Aa
        </p>
        <p
          className="mt-7 text-xl leading-tight text-[#dce8dc]"
          style={{ fontFamily: family }}
        >
          {sample.line}
          <br />
          {sample.detail}
        </p>
        <div className="mt-8 flex items-end justify-between gap-4 text-xs text-[#a2b3a4]">
          {font ? (
            <Link
              href={`/font/${font.slug}`}
              className="max-w-[75%] truncate hover:text-white"
            >
              {font.name} ↗
            </Link>
          ) : (
            <span>BLISS FONTS</span>
          )}
          <span>2026</span>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-4 rounded-2xl bg-[#e7c4a6] px-4 py-3 text-sm shadow-lg shadow-[#1d241f]/10">
        <span className="block text-[10px] uppercase tracking-wider text-[#765948]">
          Live specimen
        </span>
        <span className="mt-1 block max-w-52 truncate font-medium text-[#3d3028]">
          {font?.name || (locale === "vi" ? "Mỗi lần vào là một font khác" : locale === "zh" ? "每次访问显示不同字体" : locale === "fr" ? "Une police différente à chaque visite" : "A different font each visit")}
        </span>
      </div>
    </div>
  );
}
