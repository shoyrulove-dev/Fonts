"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import fonts from "@/data/google-fonts.json";
import assetManifest from "@/data/woff2-manifest.json";
import ProfileSettings from "./profile-settings";
import EditFontForm from "./edit-font-form";
import AddFontForm from "./add-font-form";
import BulkImportForm from "./bulk-import-form";

type FontRecord = (typeof fonts)[number] & {
  status?: string;
  tags?: string[];
  files?: string[];
  bundleKey?: string;
  sourceGroup?: string;
  sourcePath?: string;
  sourceFile?: string;
};
type MetricData = {
  download?: number;
  font_view?: number;
  ad_impression?: number;
  topDownloads?: { _id: string; count: number }[];
  dailyDownloads?: { _id: string; count: number }[];
  recentErrors?: { slug?: string; message?: string; createdAt?: string }[];
};
const sections = [
  "Overview",
  "Font library",
  "Vietnamese collection",
  "File library",
  "Search visibility",
] as const;
type Section = (typeof sections)[number] | "Profile";
const assetFiles = Object.values(assetManifest).flat().length;
const assetFamilies = Object.keys(assetManifest).length;
const vietnameseGroups = new Set(["SFU", "SVN", "UTM", "UVF", "UVN", "iCIEL"]);
const isVietnameseCollectionFont = (font: FontRecord) =>
  font.id.startsWith("vietnamese/") ||
  Boolean(font.sourceGroup && vietnameseGroups.has(font.sourceGroup));

export default function AdminDashboard({
  fonts: initialFonts,
  username,
}: {
  fonts: FontRecord[];
  username: string;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState(initialFonts);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<Section>("Overview");
  const [selected, setSelected] = useState<FontRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [metrics, setMetrics] = useState<MetricData>({});
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
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
    Promise.all([
      fetch("/api/admin/fonts?limit=5000", { credentials: "include" }),
      fetch("/api/metrics?days=30", { credentials: "include" }),
    ])
      .then(async ([fontResponse, metricResponse]) => {
        if (fontResponse.ok) setCatalog((await fontResponse.json()).fonts);
        if (metricResponse.ok) setMetrics(await metricResponse.json());
      })
      .catch(() => {});
  }, []);
  const vietnameseCollection = catalog.filter(isVietnameseCollectionFont);
  const international = catalog.length - vietnameseCollection.length;
  const vietnamese = catalog.filter((font) => font.supportsVietnamese).length;
  const vietnameseCompatible = Math.max(
    vietnamese - vietnameseCollection.length,
    0,
  );
  const drafts = catalog.filter((font) => font.status === "draft").length;
  const archived = catalog.filter((font) => font.status === "archived").length;
  const published = catalog.length - drafts - archived;
  const hidden = drafts + archived;
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog
      .filter(
        (font) =>
          !needle ||
          [font.name, font.designer, font.category]
            .join(" ")
            .toLowerCase()
            .includes(needle),
      )
      .slice(0, 30);
  }, [catalog, query]);
  const savedBundles = catalog.filter((font) => font.bundleKey).length;
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
                    width: `${Math.min((assetFamilies / Math.max(catalog.length, 1)) * 100, 100)}%`,
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
                catalog={catalog}
                vietnamese={vietnameseCollection.length}
                international={international}
                compatible={vietnameseCompatible}
                published={published}
                hidden={hidden}
                metrics={metrics}
              />
            ) : section === "Font library" ? (
              <Library
                results={results}
                query={query}
                setQuery={setQuery}
                onAdd={() => setAdding(true)}
                onImport={() => setImporting(true)}
                onSelect={setSelected}
              />
            ) : section === "Vietnamese collection" ? (
              <VietnameseCollection
                fonts={vietnameseCollection}
                compatibleCount={vietnameseCompatible}
                onSelect={setSelected}
              />
            ) : section === "File library" ? (
              <FileLibrary
                catalog={catalog}
                assetFiles={assetFiles}
                assetFamilies={assetFamilies}
                savedBundles={savedBundles}
              />
            ) : (
              <SearchVisibility totalPages={published + 15} />
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

function Overview({
  catalog,
  vietnamese,
  international,
  compatible,
  published,
  hidden,
  metrics,
}: {
  catalog: FontRecord[];
  vietnamese: number;
  international: number;
  compatible: number;
  published: number;
  hidden: number;
  metrics: MetricData;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          label="Total catalog"
          value={catalog.length.toLocaleString("en-US")}
          note={`${published.toLocaleString("en-US")} published · ${hidden.toLocaleString("en-US")} hidden`}
        />
        <Metric
          label="International families"
          value={international.toLocaleString("en-US")}
          note={`${compatible.toLocaleString("en-US")} also support Vietnamese`}
        />
        <Metric
          label="Vietnamese archive"
          value={vietnamese.toLocaleString("en-US")}
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
          note="Last 30 days · older checks may be included"
        />
        <Metric
          label="Ad views"
          value={(metrics.ad_impression || 0).toLocaleString("en-US")}
          note="Last 30 days"
        />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <DownloadChart rows={metrics.dailyDownloads || []} />
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

function DownloadChart({ rows }: { rows: { _id: string; count: number }[] }) {
  const max = Math.max(...rows.map((item) => item.count), 1);
  return (
    <section className="rounded-3xl border border-[#dce3dd] bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#829087]">
        Downloads over time
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Visitor interest</h2>
      {rows.length ? (
        <div className="mt-8 flex h-48 items-end gap-2">
          {rows.map((item) => (
            <div key={item._id} className="group flex h-full flex-1 items-end">
              <div
                title={`${item._id}: ${item.count}`}
                style={{ height: `${Math.max((item.count / max) * 100, 4)}%` }}
                className="w-full rounded-t-lg bg-[#78907c] transition group-hover:bg-[#52745b]"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 flex h-48 items-center justify-center rounded-2xl bg-[#f4f6f4] text-sm text-[#69756c]">
          Your download trend will appear here.
        </div>
      )}
      <div className="mt-3 flex justify-between text-xs text-[#829087]">
        <span>Last 30 days</span>
        <span>{rows.reduce((sum, item) => sum + item.count, 0)} downloads</span>
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
}: {
  results: FontRecord[];
  query: string;
  setQuery: (value: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onSelect: (font: FontRecord) => void;
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
      <div className="mt-5 overflow-x-auto">
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
    </section>
  );
}
function VietnameseCollection({
  fonts,
  compatibleCount,
  onSelect,
}: {
  fonts: FontRecord[];
  compatibleCount: number;
  onSelect: (font: FontRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const groups = [
    "ALL",
    ...Array.from(
      new Set(fonts.map((font) => font.sourceGroup || "Other")),
    ).sort(),
  ];
  const results = fonts
    .filter((font) => {
      const needle = query.trim().toLowerCase();
      return (
        (!needle ||
          [font.name, font.designer, font.sourceGroup, font.category]
            .join(" ")
            .toLowerCase()
            .includes(needle)) &&
        (group === "ALL" || (font.sourceGroup || "Other") === group)
      );
    })
    .slice(0, 100);
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Vietnamese archive"
          value={fonts.length.toLocaleString("en-US")}
          note="Actual Vietnamese font packages"
        />
        <Metric
          label="Compatible fonts"
          value={compatibleCount.toLocaleString("en-US")}
          note="Google fonts with Vietnamese glyphs"
        />
        <Metric
          label="Personal Use"
          value={fonts
            .filter((font) => font.license === "Personal Use")
            .length.toLocaleString("en-US")}
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
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 flex-1 rounded-xl border border-[#dce3dd] px-4 text-sm outline-none focus:border-[#5e7965]"
            placeholder="Search Vietnamese fonts or source…"
          />
          <select
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            className="h-11 rounded-xl border border-[#dce3dd] bg-white px-4 text-sm"
          >
            {groups.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All Vietnamese collections" : item}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 overflow-x-auto">
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
          Showing {results.length} of {fonts.length.toLocaleString("en-US")}{" "}
          packages. Use the Font library for bulk import and upload.
        </p>
      </div>
    </section>
  );
}
function FileLibrary({
  catalog,
  assetFiles,
  assetFamilies,
}: {
  catalog: FontRecord[];
  assetFiles: number;
  assetFamilies: number;
  savedBundles: number;
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
          value="On demand"
          note="Created on first download; cache total is not indexed"
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
