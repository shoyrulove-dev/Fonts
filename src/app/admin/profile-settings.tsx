"use client";

import { useState, type FormEvent } from "react";

export default function ProfileSettings({ username }: { username: string }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your password could not be updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setEditing(false);
      setMessage("Your password has been updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="max-w-3xl space-y-6">
    <section className="rounded-3xl border border-[#dce3dd] bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e2eee4] text-xl font-semibold text-[#3e6046]" aria-hidden="true">{username.charAt(0).toUpperCase()}</span>
          <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">Administrator</p><h2 className="mt-1 text-2xl font-semibold">{username}</h2></div>
        </div>
        <span className="rounded-full bg-[#e2eee4] px-3 py-1 text-xs font-medium text-[#3e6046]">Active</span>
      </div>
      <div className="mt-8 border-t border-[#edf0ec] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h3 className="font-semibold">Password</h3><p className="mt-1 text-sm text-[#69756c]">Keep your account secure with a unique password.</p></div>
          <button type="button" onClick={() => { setEditing((value) => !value); setError(""); setMessage(""); }} className="rounded-full border border-[#c9d8cb] px-5 py-2.5 text-sm font-medium text-[#3e6046] hover:bg-[#f2f7f2]">{editing ? "Cancel" : "Change password"}</button>
        </div>
        {message && <p role="status" className="mt-5 rounded-xl bg-[#e2eee4] px-4 py-3 text-sm text-[#3e6046]">{message}</p>}
        {editing && <form onSubmit={submit} className="mt-6 max-w-lg space-y-4 border-t border-[#edf0ec] pt-6">
          <p className="text-sm text-[#69756c]">Choose at least 12 characters.</p>
          <label className="block text-sm font-medium">Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce3dd] px-4 outline-none focus:border-[#5e7965]" required /></label>
          <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce3dd] px-4 outline-none focus:border-[#5e7965]" minLength={12} required /></label>
          <label className="block text-sm font-medium">Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce3dd] px-4 outline-none focus:border-[#5e7965]" minLength={12} required /></label>
          {error && <p role="alert" className="rounded-xl bg-[#fbe9e5] px-4 py-3 text-sm text-[#9a4f42]">{error}</p>}
          <button disabled={busy} className="rounded-full bg-[#1d241f] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{busy ? "Saving…" : "Save password"}</button>
        </form>}
      </div>
    </section>
  </div>;
}
