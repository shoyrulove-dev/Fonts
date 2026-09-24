"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CatalogFont } from "@/lib/catalog";
import ProfileSettings from "./profile-settings";
import EditFontForm from "./edit-font-form";
import AddFontForm from "./add-font-form";
import BulkImportForm from "./bulk-import-form";

type FontRecord = CatalogFont & { tags?: string[] };
type CatalogSummary = { total: number; published: number; hidden: number; archive: number; international: number; compatible: number; personalUse: number };
type MetricData = {
  download?: number;
  font_view?: number;
  ad_impression?: number;
  ad_error?: number;
  days?: number;
  timezone?: string;
  periodEnd?: string;
  topDownloads?: { _id: string; count: number }[];
  dailyDownloads?: { _id: string; count: number }[];
  dailyViews?: { _id: string; count: number }[];
  recentErrors?: { slug?: string; message?: string; createdAt?: string }[];
};
type StorageData = { packages: number; bytes: number; latest: string | null; scannedAt: string };
type FontCollection = { name: string; families: number; previewFamilies: number; files: number; packages: number; published: number; hidden: number; personalUse: number };
type FontCollectionsData = { collections: FontCollection[]; totals: { collections: number; families: number; files: number } };
const sections = [
  "Overview",
  "Fonts Manager",
  "Font library",
  "Vietnamese collection",
  "File library",
  "Search visibility",
] as const;
type Section = (typeof sections)[number] | "Profile";
export default function AdminDashboard({
  fonts: initialFonts,
  username,
  initialSummary,
  assetFiles,
  assetFamilies,
}: {
  fonts: FontRecord[];
  username: string;
  initialSummary: CatalogSummary;
  assetFiles: number;
  assetFamilies: number;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState(initialFonts);
  const [summary, setSummary] = useState(initialSummary);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(Math.max(1, Math.ceil(initialSummary.total / 30)));
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [section, setSection] = useState<Section>("Overview");
  const [selected, setSelected] = useState<FontRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [metrics, setMetrics] = useState<MetricData>({});
  const [metricDays, setMetricDays] = useState(30);
  const [metricTimezone, setMetricTimezone] = useState("Asia/Bangkok");
  const [storage, setStorage] = useState<StorageData | null>(null);
  const [fontCollections, setFontCollections] = useState<FontCollectionsData | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [publishingReady, setPublishingReady] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  async function publishReadyFonts() {
    setPublishingReady(true);
    setPublishMessage("");
    try {
      const response = await fetch("/api/admin/fonts/publish-ready", { method: "POST", credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review failed");
      setSummary((current) => ({ ...current, published: current.published + data.published, hidden: data.remaining }));
      setPublishMessage(`${data.published} ready fonts published · ${data.remaining} still need review`);
    } catch { setPublishMessage("Could not review hidden fonts. Please try again."); }
    finally { setPublishingReady(false); }
  }
  async function logOut() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Sign out failed");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
      setLogoutError("Could not sign out. Please try again.");
    }
  }
  useEffect(() => {
    const params = new URLSearchParams({ days: String(metricDays), timezone: metricTimezone });
    fetch(`/api/metrics?${params}`, { credentials: "include" }).then(async (response) => { if (response.ok) setMetrics(await response.json()); }).catch(() => {});
  }, [metricDays, metricTimezone]);
  useEffect(() => {
    if (section !== "File library" || storage) return;
    fetch("/api/admin/storage", { credentials: "include" }).then(async (response) => { if (response.ok) setStorage(await response.json()); }).catch(() => {});
  }, [section, storage]);
  useEffect(() => {
    if (section !== "Fonts Manager" || fontCollections) return;
    fetch("/api/admin/fonts?view=collections", { credentials: "include" }).then(async (response) => { if (response.ok) setFontCollections(await response.json()); }).catch(() => {});
  }, [section, fontCollections]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingFonts(true);
      const params = new URLSearchParams({ limit: "30", page: String(page) });
      if (query.trim()) params.set("q", query.trim());
      try {
        const response = await fetch(`/api/admin/fonts?${params}`, { credentials: "include", signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          setCatalog(data.fonts);
          setPages(data.pages);
          if (data.summary) setSummary(data.summary);
        }
      } finally { if (!controller.signal.aborted) setLoadingFonts(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [page, query]);
  const handleSaved = (updated: FontRecord) => {
    setCatalog((current) =>
      current.map((font) =>
        font.id === updated.id ? { ...font, ...updated } : font,
      ),
    );
    setSelected(null);
  };
  const handleAdded = (created: FontRecord) => {
    setCatalog((current) => [created, ...current]);
    setSummary((current) => ({ ...current, total: current.total + 1, hidden: current.hidden + 1 }));
    setAdding(false);
  };
  return (
    <main className="min-h-screen bg-[#f4f6f4] text-[#18211b]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#dce3dd] bg-[#fbfcfa] p-5 lg:flex">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-3"
          >
            <Image src="/icon.svg" alt="Bliss Fonts" width={36} height={36} />
            <span className="font-semibold tracking-tight">Bliss Fonts</span>
          </Link>
          <p className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#92a097]">
            Workspace
          </p>
          <nav aria-label="Dashboard sections" className="mt-3 space-y-1">
            {sections.map((item) => (
              <button
                type="button"
                onClick={() => setSection(item)}
                key={item}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${section === item ? "bg-[#e2eee4] font-medium text-[#3e6046]" : "text-[#69756c] hover:bg-[#f0f4ef]"}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-4 pt-8">
            <div className="rounded-2xl bg-[#1d241f] p-4 text-[#f6f4ee]">
              <p className="text-xs text-[#b5cbb6]">Your collection</p>
              <p className="mt-2 text-sm font-medium">
                {assetFamilies.toLocaleString("en-US")} families ready to
                preview
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-white/15">
                <div
                  className="h-1.5 rounded-full bg-[#b5cbb6]"
                  style={{
                    width: `${Math.min((assetFamilies / Math.max(summary.total, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-[#a2b3a4]">
                {assetFiles.toLocaleString("en-US")} font files prepared
              </p>
            </div>
            <Link
              href="/"
              className="block rounded-xl px-3 py-2 text-sm text-[#69756c] hover:bg-[#f0f4ef]"
            >
              ← View live site
            </Link>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="relative z-30 border-b border-[#dce3dd] bg-[#fbfcfa] px-5 py-4 sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src="/icon.svg"
                  alt=""
                  width={32}
                  height={32}
                  className="lg:hidden"
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#829087]">
                    Bliss Fonts / Workspace
                  </p>
                  <h1 className="mt-1 truncate text-xl font-semibold">
                    {section === "Profile" ? "My profile" : section}
                  </h1>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  onClick={() => setAccountOpen((value) => !value)}
                  className="flex items-center gap-3 rounded-full border border-[#dce3dd] bg-white p-1 pr-3 text-left hover:border-[#aabdae]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e2eee4] text-sm font-semibold text-[#3e6046]">
                    {username.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm font-medium sm:block">
                    {username}
                  </span>
                  <span aria-hidden="true" className="text-xs text-[#69756c]">
                    ⌄
                  </span>
                </button>
                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[#dce3dd] bg-white p-2 shadow-xl shadow-[#1d241f]/10"
                  >
                    <p className="px-3 py-2 text-xs text-[#829087]">
                      Signed in as {username}
                    </p>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setSection("Profile");
                        setAccountOpen(false);
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[#f0f4ef]"
                    >
                      My profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={loggingOut}
                      onClick={logOut}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#9a4f42] hover:bg-[#fff3ef] disabled:opacity-50"
                    >
                      {loggingOut ? "Signing out…" : "Log out"}
                    </button>
                    {logoutError && (
                      <p
                        role="alert"
                        className="px-3 py-2 text-xs text-[#9a4f42]"
                      >
                        {logoutError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>
          <nav
            aria-label="Dashboard sections"
            className="flex gap-2 overflow-x-auto border-b border-[#dce3dd] bg-[#fbfcfa] px-5 py-3 lg:hidden"
          >
            {sections.map((item) => (
              <button
                type="button"
                onClick={() => setSection(item)}
                key={item}
                className={`shrink-0 rounded-full px-4 py-2 text-sm ${section === item ? "bg-[#e2eee4] font-medium text-[#3e6046]" : "text-[#69756c] hover:bg-[#f0f4ef]"}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
            {section === "Profile" ? (
              <ProfileSettings username={username} />
            ) : section === "Overview" ? (
              <Overview
                summary={summary}
                assetFiles={assetFiles}
                assetFamilies={assetFamilies}
                metrics={metrics}
                metricDays={metricDays}
                metricTimezone={metricTimezone}
                setMetricDays={setMetricDays}
                setMetricTimezone={setMetricTimezone}
                publishingReady={publishingReady}
                publishMessage={publishMessage}
                publishReadyFonts={publishReadyFonts}
              />
            ) : section === "Font library" ? (
              <Library
                results={catalog}
                query={query}
                setQuery={(value) => { setQuery(value); setPage(1); }}
                page={page}
                pages={pages}
                loading={loadingFonts}
                setPage={setPage}
                onAdd={() => setAdding(true)}
                onImport={() => setImporting(true)}
                onSelect={setSelected}
              />
            ) : section === "Fonts Manager" ? (
              <FontsManager data={fontCollections} />
            ) : section === "Vietnamese collection" ? (
              <VietnameseCollection
                archiveCount={summary.archive}
                compatibleCount={summary.compatible}
                personalUseCount={summary.personalUse}
                onSelect={setSelected}
              />
            ) : section === "File library" ? (
              <FileLibrary
                catalog={catalog}
                assetFiles={assetFiles}
                assetFamilies={assetFamilies}
                storage={storage}
              />
            ) : (
              <SearchVisibility totalPages={summary.published + 15} />
            )}
          </div>
        </div>
      </div>
      {selected && (
        <EditFontForm
          font={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
      {adding && (
        <AddFontForm onClose={() => setAdding(false)} onSaved={handleAdded} />
      )}
      {importing && <BulkImportForm onClose={() => setImporting(false)} />}
    </main>
  );
}

const collectionDescriptions: Record<string, string> = {
  "Google Fonts": "International open-source catalog",
  iCIEL: "Vietnamese iCIEL collection",
  SVN: "Vietnamese SVN collection",
  SFU: "Vietnamese SFU collection",
  UTM: "Vietnamese UTM collection",
  UVF: "Vietnamese UVF collection",
  UVN: "Vietnamese UVN collection",
  "Manual imports": "Fonts added individually",
  "Other sources": "Fonts from other collections",
};

function FontsManager({ data }: { data: FontCollectionsData | null }) {
  if (!data) return <section className="rounded-3xl border border-[#dce3dd] bg-white p-6 text-sm text-[#69756c]">Loading font collections…</section>;
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Font collections" value={data.totals.collections.toLocaleString("en-US")} note="Imported sources in your catalog" />
        <Metric label="Font families" value={data.totals.families.toLocaleString("en-US")} note="Across every collection" />
        <Metric label="Preview files" value={data.totals.files.toLocaleString("en-US")} note="Prepared styles and weights" />
      </div>
      <div className="mt-6 rounded-3xl border border-[#dce3dd] bg-white p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">Collection inventory</p>
          <h2 className="mt-2 text-2xl font-semibold">Your font collections</h2>
          <p className="mt-2 text-sm text-[#69756c]">See which collections have been imported and how many fonts each one contains.</p>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#edf0ec] text-xs uppercase tracking-wider text-[#92a097]">
              <tr><th className="pb-3">Collection</th><th className="pb-3">Families</th><th className="pb-3">Preview files</th><th className="pb-3">License</th><th className="pb-3">Availability</th></tr>
            </thead>
            <tbody>
              {data.collections.map((item) => (
                <tr key={item.name} className="border-b border-[#f0f2ef] last:border-0">
                  <td className="py-4"><span className="font-medium">{item.name}</span><span className="mt-1 block text-xs text-[#92a097]">{collectionDescriptions[item.name] || "Imported font collection"}</span></td>
                  <td className="py-4 font-medium">{item.families.toLocaleString("en-US")}</td>
                  <td className="py-4 text-[#69756c]">{item.files.toLocaleString("en-US")}</td>
                  <td className="py-4 text-[#69756c]">{item.personalUse === item.families ? "Personal Use" : item.personalUse ? `${item.personalUse.toLocaleString("en-US")} Personal Use` : "Open source"}</td>
                  <td className="py-4"><span className={`rounded-full px-3 py-1 text-xs ${item.previewFamilies === item.families && item.hidden === 0 ? "bg-[#e2eee4] text-[#3e6046]" : "bg-[#fff3df] text-[#8a5b22]"}`}>{item.previewFamilies === item.families && item.hidden === 0 ? "Ready" : `${item.previewFamilies}/${item.families} ready`}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Overview({
  summary,
  assetFiles,
  assetFamilies,
  metrics,
  metricDays,
  metricTimezone,
  setMetricDays,
  setMetricTimezone,
  publishingReady,
  publishMessage,
  publishReadyFonts,
}: {
  summary: CatalogSummary;
  assetFiles: number;
  assetFamilies: number;
  metrics: MetricData;
  metricDays: number;
  metricTimezone: string;
  setMetricDays: (days: number) => void;
  setMetricTimezone: (timezone: string) => void;
  publishingReady: boolean;
  publishMessage: string;
  publishReadyFonts: () => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          label="Total catalog"
          value={summary.total.toLocaleString("en-US")}
          note={`${summary.published.toLocaleString("en-US")} published · ${summary.hidden.toLocaleString("en-US")} hidden`}
        />
        <Metric
          label="International families"
          value={summary.international.toLocaleString("en-US")}
          note={`${summary.compatible.toLocaleString("en-US")} also support Vietnamese`}
        />
        <Metric
          label="Vietnamese archive"
          value={summary.archive.toLocaleString("en-US")}
          note="Imported Vietnamese font families"
        />
        <Metric
          label="Families with preview"
          value={assetFamilies.toLocaleString("en-US")}
          note={`${assetFiles.toLocaleString("en-US")} WOFF2 style and weight files`}
        />
        <Metric
          label="Recorded downloads"
          value={(metrics.download || 0).toLocaleString("en-US")}
          note={`Last ${metricDays} days · older checks may be included`}
        />
        <Metric
          label="Ad views"
          value={(metrics.ad_impression || 0).toLocaleString("en-US")}
          note={metrics.ad_error ? `${metrics.ad_error} delivery issues to review` : `Last ${metricDays} days`}
        />
      </div>
      {summary.hidden > 0 && (
        <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#eadbc6] bg-[#fff8ee] p-5">
          <div><p className="font-medium">{summary.hidden} hidden fonts are ready for a final check</p><p className="mt-1 text-sm text-[#7c6a54]">Only fonts with a prepared preview or download package will be published.</p>{publishMessage && <p className="mt-2 text-xs text-[#52745b]">{publishMessage}</p>}</div>
          <button type="button" disabled={publishingReady} onClick={publishReadyFonts} className="rounded-full bg-[#1d241f] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{publishingReady ? "Reviewing…" : "Review and publish"}</button>
        </section>
      )}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <DownloadChart downloads={metrics.dailyDownloads || []} views={metrics.dailyViews || []} periodEnd={metrics.periodEnd} days={metricDays} timezone={metricTimezone} setDays={setMetricDays} setTimezone={setMetricTimezone} />
        <section className="rounded-3xl border border-[#dce3dd] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">
            Most downloaded
          </p>
          <h2 className="mt-2 text-2xl font-semibold">What visitors choose</h2>
          <div className="mt-6 space-y-4">
            {(metrics.topDownloads || []).length ? (
              metrics.topDownloads?.map((item, index) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between border-b border-[#edf0ec] pb-3"
                >
                  <span className="text-sm">
                    <span className="mr-3 text-[#829087]">0{index + 1}</span>
                    {item._id}
                  </span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[#69756c]">
                Download activity will appear here as visitors use the
                collection.
              </p>
            )}
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-3xl border border-[#dce3dd] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">
          Download checks
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Items needing review</h2>
        {(metrics.recentErrors || []).length ? (
          <div className="mt-5 space-y-3">
            {metrics.recentErrors?.map((item, index) => (
              <p
                key={index}
                className="rounded-xl bg-[#fff7ed] px-4 py-3 text-sm text-[#7c5b2f]"
              >
                {item.slug || "A font"}: {item.message || "needs a quick check"}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#52745b]">
            All recent download checks have passed.
          </p>
        )}
      </section>
    </>
  );
}

function DownloadChart({ downloads, views, periodEnd, days, timezone, setDays, setTimezone }: { downloads: { _id: string; count: number }[]; views: { _id: string; count: number }[]; periodEnd?: string; days: number; timezone: string; setDays: (days: number) => void; setTimezone: (timezone: string) => void }) {
  const downloadMap = new Map(downloads.map((item) => [item._id, item.count]));
  const viewMap = new Map(views.map((item) => [item._id, item.count]));
  const hasActivity = downloads.length > 0 || views.length > 0;
  const endTime = periodEnd ? Date.parse(`${periodEnd}T00:00:00Z`) : 0;
  const dates = hasActivity && endTime ? Array.from({ length: days }, (_, index) => new Date(endTime - (days - 1 - index) * 86400000).toISOString().slice(0, 10)) : [];
  const rows = dates.map((date) => ({ date, downloads: downloadMap.get(date) || 0, views: viewMap.get(date) || 0 }));
  const niceMax = (value: number) => {
    if (value <= 1) return 1;
    const scale = 10 ** Math.floor(Math.log10(value));
    const ratio = value / scale;
    return (ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * scale;
  };
  const downloadMax = niceMax(Math.max(...rows.map((item) => item.downloads), 1));
  const viewMax = niceMax(Math.max(...rows.map((item) => item.views), 1));
  const width = 820;
  const height = 300;
  const left = 54;
  const right = 58;
  const top = 30;
  const bottom = 44;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const step = rows.length > 1 ? plotWidth / (rows.length - 1) : plotWidth;
  const x = (index: number) => rows.length > 1 ? left + index * step : left + plotWidth / 2;
  const barWidth = Math.max(5, Math.min(20, plotWidth / Math.max(rows.length, 1) * 0.55));
  const yDownload = (value: number) => top + plotHeight - (value / downloadMax) * plotHeight;
  const yView = (value: number) => top + plotHeight - (value / viewMax) * plotHeight;
  const line = rows.map((item, index) => `${x(index)},${yView(item.views)}`).join(" ");
  const labelEvery = Math.max(1, Math.ceil(rows.length / 6));
  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const exportCsv = () => {
    const csv = ["date,downloads,font_previews", ...rows.map((item) => `${item.date},${item.downloads},${item.views}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bliss-fonts-activity-${days}-days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="rounded-3xl border border-[#dce3dd] bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">Last {days} days</p><h2 className="mt-2 text-2xl font-semibold">Downloads and previews</h2></div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#69756c]">
          {[7, 30, 90].map((value) => <button type="button" key={value} onClick={() => setDays(value)} className={`rounded-full px-3 py-1.5 ${days === value ? "bg-[#1d241f] text-white" : "border border-[#dce3dd]"}`}>{value}d</button>)}
          <select aria-label="Chart timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} className="rounded-full border border-[#dce3dd] bg-white px-3 py-1.5"><option value="Asia/Bangkok">Bangkok time</option><option value="UTC">UTC</option></select>
          <button type="button" onClick={exportCsv} disabled={!rows.length} className="rounded-full border border-[#dce3dd] px-3 py-1.5 disabled:opacity-40">Export CSV</button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#69756c]"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#78907c]" />Downloads</span><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-[#d98252]" />Font previews</span></div>
      {rows.length ? (
        <div className="mt-6 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[640px]" role="img" aria-labelledby="download-chart-title download-chart-description">
            <title id="download-chart-title">Downloads and font previews over the last {days} days</title>
            <desc id="download-chart-description">Bars use the left axis for downloads. The orange line uses the right axis for font previews.</desc>
            <text x={left} y={15} className="fill-[#69756c] text-[11px]">Downloads</text><text x={width - right} y={15} textAnchor="end" className="fill-[#9a5f3d] text-[11px]">Previews</text>
            {[0, 1, 2, 3, 4].map((tick) => { const y = top + plotHeight - (tick / 4) * plotHeight; return <g key={tick}><line x1={left} x2={width - right} y1={y} y2={y} stroke="#e5e9e5" /><text x={left - 9} y={y + 4} textAnchor="end" className="fill-[#829087] text-[10px]">{Math.round(downloadMax * tick / 4)}</text><text x={width - right + 9} y={y + 4} className="fill-[#9a7259] text-[10px]">{Math.round(viewMax * tick / 4)}</text></g>; })}
            {rows.map((item, index) => <rect key={item.date} x={x(index) - barWidth / 2} y={yDownload(item.downloads)} width={barWidth} height={Math.max(top + plotHeight - yDownload(item.downloads), item.downloads ? 2 : 0)} rx="3" fill="#78907c"><title>{formatDate(item.date)}: {item.downloads} downloads</title></rect>)}
            <polyline points={line} fill="none" stroke="#d98252" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {rows.map((item, index) => <circle key={item.date} cx={x(index)} cy={yView(item.views)} r="3.5" fill="#d98252" stroke="white" strokeWidth="2"><title>{formatDate(item.date)}: {item.views} previews</title></circle>)}
            {rows.map((item, index) => (index % labelEvery === 0 || index === rows.length - 1) && <text key={item.date} x={x(index)} y={height - 15} textAnchor="middle" className="fill-[#829087] text-[10px]">{formatDate(item.date)}</text>)}
          </svg>
        </div>
      ) : (
        <div className="mt-8 flex h-48 items-center justify-center rounded-2xl bg-[#f4f6f4] text-sm text-[#69756c]">
          Activity will appear here as visitors preview and download fonts.
        </div>
      )}
      <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-[#edf0ec] pt-4 text-xs text-[#69756c]">
        <span>{rows.reduce((sum, item) => sum + item.downloads, 0).toLocaleString("en-US")} downloads</span>
        <span>{rows.reduce((sum, item) => sum + item.views, 0).toLocaleString("en-US")} font previews</span>
      </div>
    </section>
  );
}
function Library({
  results,
  query,
  setQuery,
  onAdd,
  onImport,
  onSelect,
  page,
  pages,
  loading,
  setPage,
}: {
  results: FontRecord[];
  query: string;
  setQuery: (value: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onSelect: (font: FontRecord) => void;
  page: number;
  pages: number;
  loading: boolean;
  setPage: (page: number) => void;
}) {
  return (
    <section className="rounded-3xl border border-[#dce3dd] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">
            Collection manager
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Your font library</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onImport}
            className="rounded-full border border-[#dce3dd] px-4 py-2 text-sm text-[#52745b]"
          >
            Import list
          </button>
          <button
            onClick={onAdd}
            className="rounded-full bg-[#1d241f] px-4 py-2 text-sm text-white"
          >
            + Add font
          </button>
        </div>
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-6 h-12 w-full rounded-xl border border-[#dce3dd] px-4 outline-none focus:border-[#5e7965]"
        placeholder="Search by name, designer or style…"
      />
      <div aria-busy={loading} className={`mt-5 overflow-x-auto ${loading ? "opacity-60" : ""}`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#edf0ec] text-xs uppercase tracking-wider text-[#92a097]">
            <tr>
              <th className="pb-3">Family</th>
              <th className="pb-3">Style</th>
              <th className="pb-3">Language</th>
              <th className="pb-3">License</th>
              <th className="pb-3">Visibility</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {results.map((font) => (
              <tr key={font.id} className="border-b border-[#f0f2ef]">
                <td className="py-4 font-medium">
                  {font.name}
                  <span className="mt-1 block text-xs font-normal text-[#92a097]">
                    {font.designer || "Google Fonts"}
                  </span>
                </td>
                <td className="py-4 text-[#69756c]">
                  {font.category?.replace("_", " ")}
                </td>
                <td className="py-4">
                  {font.supportsVietnamese ? "Vietnamese" : "International"}
                </td>
                <td className="py-4 text-[#69756c]">{font.license}</td>
                <td className="py-4">
                  <Status status={font.status || "published"} />
                </td>
                <td className="py-4 text-right">
                  <button
                    onClick={() => onSelect(font)}
                    className="text-xs font-medium text-[#52745b]"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[#69756c]">
        <span>Page {page} of {pages}</span>
        <div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="rounded-full border border-[#dce3dd] px-4 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages || loading} onClick={() => setPage(page + 1)} className="rounded-full border border-[#dce3dd] px-4 py-2 disabled:opacity-40">Next</button></div>
      </div>
    </section>
  );
}
function VietnameseCollection({
  archiveCount,
  compatibleCount,
  personalUseCount,
  onSelect,
}: {
  archiveCount: number;
  compatibleCount: number;
  personalUseCount: number;
  onSelect: (font: FontRecord) => void;
}) {
  const [fonts, setFonts] = useState<FontRecord[]>([]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(archiveCount);
  const [loading, setLoading] = useState(false);
  const groups = ["ALL", "SFU", "SVN", "UTM", "UVF", "UVN", "iCIEL"];
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ collection: "vietnamese", limit: "40", page: String(page), group });
      if (query.trim()) params.set("q", query.trim());
      try {
        const response = await fetch(`/api/admin/fonts?${params}`, { credentials: "include", signal: controller.signal });
        if (response.ok) { const data = await response.json(); setFonts(data.fonts); setPages(data.pages); setTotal(data.total); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [group, page, query]);
  const results = fonts;
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Vietnamese archive"
          value={archiveCount.toLocaleString("en-US")}
          note="Actual Vietnamese font packages"
        />
        <Metric
          label="Compatible fonts"
          value={compatibleCount.toLocaleString("en-US")}
          note="Google fonts with Vietnamese glyphs"
        />
        <Metric
          label="Personal Use"
          value={personalUseCount.toLocaleString("en-US")}
          note="Review each original license"
        />
      </div>
      <div className="mt-6 rounded-3xl border border-[#dce3dd] bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">
              Vietnamese archive manager
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Vietnamese font packages
            </h2>
            <p className="mt-2 text-sm text-[#69756c]">
              Manage the imported Vietnamese collections here. Google fonts with
              Vietnamese support are kept in the separate compatible group.
            </p>
          </div>
          <a
            href="/vietnamese"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#dce3dd] px-4 py-2 text-sm text-[#52745b]"
          >
            Open public collection ↗
          </a>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            className="h-11 flex-1 rounded-xl border border-[#dce3dd] px-4 text-sm outline-none focus:border-[#5e7965]"
            placeholder="Search Vietnamese fonts or source…"
          />
          <select
            value={group}
            onChange={(event) => { setGroup(event.target.value); setPage(1); }}
            className="h-11 rounded-xl border border-[#dce3dd] bg-white px-4 text-sm"
          >
            {groups.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All Vietnamese collections" : item}
              </option>
            ))}
          </select>
        </div>
        <div aria-busy={loading} className={loading ? "mt-5 overflow-x-auto opacity-60" : "mt-5 overflow-x-auto"}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#edf0ec] text-xs uppercase tracking-wider text-[#92a097]">
              <tr>
                <th className="pb-3">Font</th>
                <th className="pb-3">Collection</th>
                <th className="pb-3">Style</th>
                <th className="pb-3">License</th>
                <th className="pb-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {results.map((font) => (
                <tr key={font.id} className="border-b border-[#f0f2ef]">
                  <td className="py-4 font-medium">
                    {font.name}
                    <span className="mt-1 block text-xs font-normal text-[#92a097]">
                      {font.designer || "Not specified"}
                    </span>
                  </td>
                  <td className="py-4 text-[#52745b]">
                    {font.sourceGroup || "Vietnamese"}
                  </td>
                  <td className="py-4 text-[#69756c]">
                    {font.category?.replace("_", " ")}
                  </td>
                  <td className="py-4 text-[#69756c]">{font.license}</td>
                  <td className="py-4">
                    <Status status={font.status || "published"} />
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => onSelect(font)}
                      className="text-xs font-medium text-[#52745b]"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-[#829087]">
          Showing {results.length} of {total.toLocaleString("en-US")} packages.
        </p>
        <div className="mt-4 flex items-center justify-between text-sm text-[#69756c]"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="rounded-full border border-[#dce3dd] px-4 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages || loading} onClick={() => setPage(page + 1)} className="rounded-full border border-[#dce3dd] px-4 py-2 disabled:opacity-40">Next</button></div></div>
      </div>
    </section>
  );
}
function FileLibrary({
  catalog,
  assetFiles,
  assetFamilies,
  storage,
}: {
  catalog: FontRecord[];
  assetFiles: number;
  assetFamilies: number;
  storage: StorageData | null;
}) {
  const prepared = catalog
    .filter((font) => font.files?.length || font.bundleKey || font.sourcePath)
    .slice(0, 60);
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Preview files"
          value={assetFiles.toLocaleString("en-US")}
          note="WOFF2 styles and weights"
        />
        <Metric
          label="Families with preview"
          value={assetFamilies.toLocaleString("en-US")}
          note="At least one prepared WOFF2 file"
        />
        <Metric
          label="Download packages"
          value={storage ? storage.packages.toLocaleString("en-US") : "Loading…"}
          note={storage ? `${formatBytes(storage.bytes)} cached · refreshed every 15 minutes` : "Counting ZIP files in storage"}
        />
      </div>
      <div className="mt-6 rounded-3xl border border-[#dce3dd] bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">
              Asset inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Prepared font files</h2>
            <p className="mt-2 text-sm text-[#69756c]">
              These are the font families connected to preview files or
              downloadable packages.
            </p>
          </div>
          <a
            href="https://assets.blissbiovn.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#dce3dd] px-4 py-2 text-sm text-[#52745b]"
          >
            Open asset storage ↗
          </a>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-[#edf0ec] text-xs uppercase tracking-wider text-[#92a097]">
              <tr>
                <th className="pb-3">Family</th>
                <th className="pb-3">Source</th>
                <th className="pb-3">Preview</th>
                <th className="pb-3">ZIP</th>
              </tr>
            </thead>
            <tbody>
              {prepared.map((font) => (
                <tr key={font.id} className="border-b border-[#f0f2ef]">
                  <td className="py-4 font-medium">
                    {font.name}
                    <span className="mt-1 block text-xs font-normal text-[#92a097]">
                      {font.license}
                    </span>
                  </td>
                  <td className="py-4 text-[#69756c]">
                    {font.sourceGroup || "Google Fonts"}
                  </td>
                  <td className="py-4">
                    <Status
                      status={
                        font.sourcePath || font.files?.length
                          ? "published"
                          : "draft"
                      }
                    />
                  </td>
                  <td className="py-4">
                    {font.bundleKey ? (
                      <span className="text-[#52745b]">Ready</span>
                    ) : (
                      <span className="text-[#9a8060]">On first download</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-[#829087]">
          Showing {prepared.length} families with known assets. ZIP files are
          generated on first download and then cached for faster delivery.
        </p>
      </div>
    </section>
  );
}
function SearchVisibility({ totalPages }: { totalPages: number }) {
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Discoverable pages"
          value={totalPages.toLocaleString("en-US")}
          note="Font, collection and guide pages"
        />
        <Metric
          label="Sitemap"
          value="Available"
          note="Ready for Search Console"
        />
        <Metric
          label="Public health"
          value="Checked"
          note="Live site and assets respond"
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#dce3dd] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">
            Search files
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Submit these URLs</h2>
          <div className="mt-5 space-y-3 text-sm">
            <a
              className="block rounded-xl bg-[#f4f6f4] px-4 py-3 text-[#52745b]"
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
            >
              https://fonts.blissbiovn.com/sitemap.xml ↗
            </a>
            <a
              className="block rounded-xl bg-[#f4f6f4] px-4 py-3 text-[#52745b]"
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
            >
              https://fonts.blissbiovn.com/robots.txt ↗
            </a>
          </div>
        </section>
        <section className="rounded-3xl border border-[#dce3dd] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">
            What is covered
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Public pages</h2>
          <div className="mt-5 space-y-3 text-sm text-[#69756c]">
            <p className="flex justify-between border-b border-[#edf0ec] pb-3">
              <span>Font detail pages</span>
              <strong className="text-[#18211b]">
                {Math.max(totalPages - 15, 0).toLocaleString("en-US")}
              </strong>
            </p>
            <p className="flex justify-between border-b border-[#edf0ec] pb-3">
              <span>Collection and guide pages</span>
              <strong className="text-[#18211b]">15</strong>
            </p>
            <p className="flex justify-between">
              <span>Canonical and social metadata</span>
              <strong className="text-[#3e6046]">Ready</strong>
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dce3dd] bg-white p-5">
      <p className="text-sm text-[#69756c]">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-[#52745b]">{note}</p>
    </div>
  );
}
function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
function Status({ status }: { status: string }) {
  const label =
    status === "draft"
      ? "Private"
      : status === "archived"
        ? "Archived"
        : "Live";
  const style =
    status === "draft"
      ? "bg-[#fff0d5] text-[#916d2e]"
      : status === "archived"
        ? "bg-[#f0f1f0] text-[#7b847d]"
        : "bg-[#e2eee4] text-[#3e6046]";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${style}`}>{label}</span>
  );
}
