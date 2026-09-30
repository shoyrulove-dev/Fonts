"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
export default function LocaleSwitcher({ locale }: { locale: Locale }) { const router = useRouter(); function change(next: Locale) { document.cookie = `bliss_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`; router.refresh(); } return <select aria-label="Language" value={locale} onChange={(event) => change(event.target.value as Locale)} className="rounded-full border border-[#c9ccc1] bg-transparent px-2.5 py-1.5 text-xs text-[#697169] outline-none"><option value="en">EN</option><option value="vi">VI</option><option value="zh">中文</option><option value="fr">FR</option></select>; }
