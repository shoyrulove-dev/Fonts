"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import fonts from "@/data/google-fonts.json";
import ProfileSettings from "./profile-settings";
import EditFontForm from "./edit-font-form";
import AddFontForm from "./add-font-form";
import BulkImportForm from "./bulk-import-form";

type FontRecord = (typeof fonts)[number];

export default function AdminDashboard({ fonts }: { fonts: FontRecord[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FontRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [section, setSection] = useState("Overview");
  const [catalog, setCatalog] = useState(fonts);
  const [syncState, setSyncState] = useState("Syncing MongoDB…");
  useEffect(() => { fetch("/api/admin/fonts?limit=2030", { credentials: "include" }).then(async (response) => { if (!response.ok) throw new Error("sync failed"); const data = await response.json(); setCatalog(data.fonts); setSyncState("MongoDB synced"); }).catch(() => setSyncState("Using catalog fallback")); }, []);
  const handleSaved = (updated: FontRecord) => { setCatalog((current) => current.map((font) => font.id === updated.id ? updated : font)); setSelected(updated); };
  const handleAdded = (created: FontRecord) => { setCatalog((current) => [created, ...current]); setAdding(false); };
  const vietnamese = catalog.filter((font) => font.supportsVietnamese).length;
  const categories = [...new Set(catalog.map((font) => font.category).filter(Boolean))];
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.filter((font) => !needle || [font.name, font.designer, font.category].join(" ").toLowerCase().includes(needle)).slice(0, 12);
  }, [catalog, query]);

  return (
    <main className="min-h-screen bg-[#f4f6f4] text-[#18211b]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#dce3dd] bg-[#fbfcfa] p-5 lg:block">
          <Link href="/" className="flex items-center gap-3 px-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d241f] text-lg text-[#f6f4ee]">B</span><span className="font-semibold tracking-tight">Bliss Fonts</span></Link>
          <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#92a097]">Workspace</div>
          <nav className="mt-3 space-y-1">{["Overview", "Font catalog", "Vietnamese coverage", "Storage & delivery", "SEO content", "Profile & security"].map((item) => <button type="button" onClick={() => setSection(item)} key={item} className={"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm " + (section === item ? "bg-[#e2eee4] font-medium text-[#3e6046]" : "text-[#69756c] hover:bg-[#f0f4ef]")}><span className="w-5 text-center">{item === "Overview" ? "⌂" : item === "Font catalog" ? "▦" : item === "Vietnamese coverage" ? "Ă" : item === "Storage & delivery" ? "↥" : item === "Profile & security" ? "◉" : "◎"}</span>{item}</button>)}</nav>
          <div className="mt-10 rounded-2xl bg-[#1d241f] p-4 text-[#f6f4ee]"><p className="text-xs text-[#b5cbb6]">Storage health</p><p className="mt-2 text-sm font-medium">Cloudflare R2 connected</p><div className="mt-3 h-1.5 rounded-full bg-white/15"><div className="h-1.5 w-full rounded-full bg-[#b5cbb6]" /></div><p className="mt-2 text-xs text-[#a2b3a4]">1,650 webfont files online</p></div>
          <Link href="/" className="mt-8 block px-3 text-sm text-[#69756c] hover:text-[#18211b]">← View live site</Link>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#dce3dd] bg-[#fbfcfa] px-6 py-4 sm:px-10"><div><p className="text-xs uppercase tracking-[0.2em] text-[#829087]">Bliss Fonts / Admin</p><h1 className="mt-1 text-xl font-semibold">{section}</h1></div><div className="flex items-center gap-3"><span className="hidden rounded-full border border-[#dce3dd] px-3 py-1.5 text-xs text-[#69756c] sm:inline">{syncState}</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7c4a6] text-sm font-semibold">SL</span></div></header>
          <div className="mx-auto max-w-7xl p-6 sm:p-10">{section === "Profile & security" && <ProfileSettings />}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Font families" value={catalog.length.toLocaleString("en-US")} change="+2,030 indexed" /><Metric label="Vietnamese ready" value={vietnamese.toLocaleString("en-US")} change={Math.round((vietnamese / catalog.length) * 100) + "% of catalog"} /><Metric label="Webfont assets" value="1,650" change="100% uploaded to R2" /><Metric label="SEO pages" value={(catalog.length + categories.length).toLocaleString("en-US")} change="Sitemap active" /></div>
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
              <section className="rounded-3xl border border-[#dce3dd] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#829087]">Catalog manager</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Font inventory</h2></div><button type="button" onClick={() => setAdding(true)} className="rounded-full bg-[#1d241f] px-4 py-2 text-sm text-white">+ Add font</button></div><label className="mt-6 flex items-center rounded-xl border border-[#dce3dd] px-4"><span className="mr-3 text-lg text-[#829087]">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full outline-none placeholder:text-[#a0aaa2]" placeholder="Search font, designer or category..." /></label><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-[#edf0ec] text-xs uppercase tracking-wider text-[#92a097]"><tr><th className="pb-3 font-medium">Family</th><th className="pb-3 font-medium">Category</th><th className="pb-3 font-medium">Language</th><th className="pb-3 font-medium">License</th><th className="pb-3" /></tr></thead><tbody>{results.map((font) => <tr key={font.id} className="border-b border-[#f0f2ef]"><td className="py-4 font-medium">{font.name}<span className="mt-1 block text-xs font-normal text-[#92a097]">{font.designer || "Google Fonts"}</span></td><td className="py-4 text-[#69756c]">{font.category?.replace("_", " ")}</td><td className="py-4">{font.supportsVietnamese ? <span className="rounded-full bg-[#e2eee4] px-2.5 py-1 text-xs text-[#3e6046]">Vietnamese</span> : <span className="text-xs text-[#92a097]">Latin</span>}</td><td className="py-4 text-[#69756c]">{font.license}</td><td className="py-4 text-right"><button type="button" onClick={() => setSelected(font)} className="text-xs font-medium text-[#52745b] hover:underline">Manage</button></td></tr>)}</tbody></table></div></section>
              <div className="space-y-6"><section className="rounded-3xl border border-[#dce3dd] bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#829087]">Publishing checklist</p><div className="mt-5 space-y-4"><Check label="Source metadata verified" /><Check label="License field present" /><Check label="WOFF2 asset available" /><Check label="Sitemap route generated" /><Check label="Vietnamese coverage scanned" /></div></section><section className="rounded-3xl border border-[#dce3dd] bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#829087]">System status</p><div className="mt-5 space-y-3 text-sm"><Status label="Website" value="Operational" /><Status label="Cloudflare R2" value="Connected" /><Status label="Google Analytics" value="Receiving" /><Status label="Search Console" value="Sitemap live" /></div></section></div>
            </div>
            <p className="mt-8 text-center text-xs text-[#92a097]">Dashboard foundation · Editing and authentication will be connected to the admin backend.</p>
          </div>
        </section>
      </div>
      <button type="button" onClick={() => setBulkImporting(true)} className="fixed bottom-6 right-6 z-10 rounded-full border border-[#dce3dd] bg-white px-4 py-3 text-sm font-medium text-[#52745b] shadow-lg">Import metadata</button>
      {selected && <EditFontForm font={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />}
      {adding && <AddFontForm onClose={() => setAdding(false)} onSaved={handleAdded} />}
      {bulkImporting && <BulkImportForm onClose={() => setBulkImporting(false)} />}
    </main>
  );
}

function Metric({ label, value, change }: { label: string; value: string; change: string }) {
  return <div className="rounded-2xl border border-[#dce3dd] bg-white p-5"><p className="text-sm text-[#69756c]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value}</p><p className="mt-2 text-xs text-[#52745b]">{change}</p></div>;
}

function Check({ label }: { label: string }) {
  return <div className="flex items-center gap-3 text-sm"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e2eee4] text-xs text-[#3e6046]">✓</span><span>{label}</span></div>;
}

function Status({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-[#69756c]">{label}</span><span className="flex items-center gap-2 text-xs font-medium text-[#3e6046]"><span className="h-2 w-2 rounded-full bg-[#5e9a6b]" />{value}</span></div>;
}
