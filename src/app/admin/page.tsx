import type { Metadata } from "next";
import { allFonts } from "@/lib/catalog";
import assetManifest from "@/data/woff2-manifest.json";
import AdminDashboard, { type FontCollectionsData } from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard — Bliss Fonts",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const archive = allFonts.filter((font) => font.id.startsWith("vietnamese/") || Boolean(font.sourceGroup));
  const compatible = allFonts.filter((font) => font.supportsVietnamese && !archive.some((item) => item.id === font.id)).length;
  const catalogAssets = allFonts.map((font) => assetManifest[font.sourcePath as keyof typeof assetManifest] ?? []);
  const collectionMap = new Map<string, FontCollectionsData["collections"][number]>();
  for (const font of allFonts) {
    const name = font.sourceGroup || (font.sourcePath.startsWith("sources/google-fonts/") ? "Google Fonts" : "Other sources");
    const current = collectionMap.get(name) || { name, families: 0, previewFamilies: 0, files: 0, packages: 0, published: 0, hidden: 0, personalUse: 0 };
    const files = assetManifest[font.sourcePath as keyof typeof assetManifest]?.length || 0;
    current.families += 1;
    current.previewFamilies += files > 0 ? 1 : 0;
    current.files += files;
    current.published += ["draft", "archived"].includes(font.status || "published") ? 0 : 1;
    current.hidden += ["draft", "archived"].includes(font.status || "published") ? 1 : 0;
    current.personalUse += font.license === "Personal Use" ? 1 : 0;
    collectionMap.set(name, current);
  }
  const collectionOrder = ["Google Fonts", "iCIEL", "SVN", "SFU", "UTM", "UVF", "UVN", "Other sources"];
  const collections = [...collectionMap.values()].sort((a, b) => collectionOrder.indexOf(a.name) - collectionOrder.indexOf(b.name));
  return <AdminDashboard
    fonts={allFonts.slice(0, 30)}
    username={process.env.ADMIN_USER || "admin"}
    initialSummary={{ total: allFonts.length, published: allFonts.length, hidden: 0, archive: archive.length, international: allFonts.length - archive.length, compatible, personalUse: archive.filter((font) => font.license === "Personal Use").length }}
    assetFiles={catalogAssets.flat().length}
    assetFamilies={catalogAssets.filter((files) => files.length > 0).length}
    initialCollections={{ collections, totals: { collections: collections.length, families: allFonts.length, files: catalogAssets.flat().length } }}
    initialVietnameseFonts={archive.slice(0, 40)}
  />;
}
