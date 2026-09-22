"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    if (response.ok) router.push("/admin");
    else { const data = await response.json(); setError(data.error || "Unable to sign in"); setLoading(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f6f4ee] px-6 text-[#1d241f]"><form onSubmit={submit} className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl shadow-[#1d241f]/5"><div className="flex items-center gap-3"><Image src="/icon.svg" alt="Bliss Fonts" width={38} height={38} /><div><p className="font-semibold">Bliss Fonts</p><p className="text-xs text-[#829087]">Admin workspace</p></div></div><h1 className="mt-12 text-3xl font-semibold tracking-tight">Welcome back.</h1><p className="mt-2 text-sm text-[#697169]">Sign in to manage your font catalog.</p><label className="mt-8 block text-sm font-medium">Username<input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#d8d7cc] px-4 outline-none focus:border-[#5e7965]" autoComplete="username" /></label><label className="mt-5 block text-sm font-medium">Password<input value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#d8d7cc] px-4 outline-none focus:border-[#5e7965]" type="password" autoComplete="current-password" /></label>{error && <p className="mt-4 rounded-xl bg-[#fbe9e5] px-4 py-3 text-sm text-[#9a4f42]">{error}</p>}<button disabled={loading} className="mt-7 h-12 w-full rounded-full bg-[#1d241f] text-sm font-medium text-white disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button></form></main>;
}
