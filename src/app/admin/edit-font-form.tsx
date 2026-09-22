"use client";

import { useState } from "react";
import fonts from "@/data/google-fonts.json";

type FontRecord = (typeof fonts)[number];

export default function EditFontForm({ font, onClose, onSaved }: { font: FontRecord; onClose: () => void; onSaved: (font: FontRecord) => void }) {
  const [form, setForm] = useState({ name: font.name, designer: font.designer || "", category: font.category || "SANS_SERIF", license: font.license, supportsVietnamese: font.supportsVietnamese, tags: (font as FontRecord & { tags?: string[] }).tags?.join(", ") || "" });
  const [status, setStatus] = useState("");
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Saving…");
    const response = await fetch("/api/admin/fonts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: font.id, ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) }) });
    if (!response.ok) { setStatus("Could not save this record."); return; }
    onSaved({ ...font, ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) } as FontRecord);
    setStatus("Saved to MongoDB");
  }
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#18211b]/30 p-5" onClick={onClose}><form onSubmit={save} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-[#829087]">Edit font record</p><h2 className="mt-2 text-3xl font-semibold">{font.name}</h2></div><button type="button" onClick={onClose} className="text-xl text-[#829087]">×</button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field label="Font name" value={form.name} onChange={(value) => update("name", value)} /><Field label="Designer" value={form.designer} onChange={(value) => update("designer", value)} /><label className="text-sm font-medium">Category<select value={form.category} onChange={(event) => update("category", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dce3dd] bg-white px-3">{["SANS_SERIF", "SERIF", "DISPLAY", "HANDWRITING", "MONOSPACE"].map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}</select></label><Field label="License" value={form.license} onChange={(value) => update("license", value)} /></div><Field label="Tags (comma separated)" value={form.tags} onChange={(value) => update("tags", value)} /><label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.supportsVietnamese} onChange={(event) => update("supportsVietnamese", event.target.checked)} className="h-4 w-4" /> Supports Vietnamese</label><div className="mt-7 flex items-center justify-between"><span className="text-sm text-[#52745b]">{status}</span><button className="rounded-full bg-[#1d241f] px-5 py-3 text-sm font-medium text-white">Save changes</button></div></form></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="mt-5 block text-sm font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dce3dd] px-3 outline-none focus:border-[#5e7965]" /></label>;
}
