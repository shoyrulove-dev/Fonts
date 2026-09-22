"use client";

import { useState } from "react";
import fonts from "@/data/google-fonts.json";
import woff2Manifest from "@/data/woff2-manifest.json";

type FontRecord = (typeof fonts)[number] & { files?: string[]; status?: string; tags?: string[] };
type Editable = { name: string; designer: string; category: string; license: string; status: string; supportsVietnamese: boolean; tags: string };

export default function EditFontForm({ font, onClose, onSaved }: { font: FontRecord; onClose: () => void; onSaved: (font: FontRecord) => void }) {
  const [form, setForm] = useState<Editable>({ name: font.name, designer: font.designer || "", category: font.category || "SANS_SERIF", license: font.license, status: (font as FontRecord & { status?: string }).status || "published", supportsVietnamese: font.supportsVietnamese, tags: (font as FontRecord & { tags?: string[] }).tags?.join(", ") || "" });
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(font.files?.length ? font.files : woff2Manifest[font.sourcePath as keyof typeof woff2Manifest] ?? []);
  const [bundling, setBundling] = useState(false);
  const update = (key: keyof Editable, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault(); setMessage("Saving...");
    const tags = form.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    const response = await fetch("/api/admin/fonts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: font.id, ...form, tags }) });
    if (!response.ok) { setMessage("Could not save this record."); return; }
    onSaved({ ...font, ...form, tags, files: uploadedFiles } as FontRecord); setMessage("Saved to MongoDB");
  }

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setMessage(`Uploading ${file.name}...`);
    const body = new FormData(); body.append("fontId", font.id); body.append("file", file);
    const response = await fetch("/api/admin/fonts/upload", { method: "POST", body });
    const data = await response.json();
    setUploading(false); if (response.ok) { setUploadedFiles((current) => [...current, data.key]); setMessage(`Uploaded ${file.name}`); } else setMessage(data.error || "Upload failed");
  }

  async function buildBundle() { setBundling(true); setMessage("Building ZIP on R2..."); const response = await fetch("/api/admin/fonts/bundle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fontId: font.id }) }); const data = await response.json(); setBundling(false); setMessage(response.ok ? "ZIP bundle saved to R2" : data.error || "Bundle failed"); }

  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#18211b]/30 p-5" onClick={onClose}><form onSubmit={save} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-[#829087]">Edit font record</p><h2 className="mt-2 text-3xl font-semibold">{font.name}</h2></div><button type="button" onClick={onClose} className="text-xl text-[#829087]">×</button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field label="Font name" value={form.name} onChange={(value) => update("name", value)} /><Field label="Designer" value={form.designer} onChange={(value) => update("designer", value)} /><Select label="Category" value={form.category} options={["SANS_SERIF", "SERIF", "DISPLAY", "HANDWRITING", "MONOSPACE"]} onChange={(value) => update("category", value)} /><Field label="License" value={form.license} onChange={(value) => update("license", value)} /><Select label="Publishing status" value={form.status} options={["draft", "published", "archived"]} onChange={(value) => update("status", value)} /></div><Field label="Tags (comma separated)" value={form.tags} onChange={(value) => update("tags", value)} /><label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.supportsVietnamese} onChange={(event) => update("supportsVietnamese", event.target.checked)} className="h-4 w-4" /> Supports Vietnamese</label><label className="mt-6 block text-sm font-medium">Upload font file<input type="file" accept=".woff,.woff2,.ttf,.otf" disabled={uploading} onChange={upload} className="mt-2 block w-full rounded-xl border border-dashed border-[#b8c8ba] p-3 text-sm" /><span className="mt-2 block text-xs font-normal text-[#829087]">WOFF2, WOFF, TTF or OTF · max 10 MB · uploaded to R2</span></label><div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f4f6f4] p-4"><div><p className="text-sm font-medium">Pre-generated ZIP</p><p className="mt-1 text-xs text-[#69756c]">Save this bundle on R2 for faster downloads.</p></div><button type="button" disabled={bundling || uploadedFiles.length === 0} onClick={buildBundle} className="rounded-full border border-[#b8c8ba] px-4 py-2 text-xs font-medium">{bundling ? "Building..." : "Build ZIP"}</button></div><div className="mt-7 flex items-center justify-between"><span className="text-sm text-[#52745b]">{message}</span><button className="rounded-full bg-[#1d241f] px-5 py-3 text-sm font-medium text-white">Save changes</button></div></form></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="mt-5 block text-sm font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dce3dd] px-3 outline-none focus:border-[#5e7965]" /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dce3dd] bg-white px-3">{options.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}</select></label>; }
