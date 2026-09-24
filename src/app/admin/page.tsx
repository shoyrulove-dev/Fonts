import type { Metadata } from "next";
import { allFonts } from "@/lib/catalog";
import assetManifest from "@/data/woff2-manifest.json";
import AdminDashboard from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard — Bliss Fonts",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const archive = allFonts.filter((font) => font.id.startsWith("vietnamese/") || Boolean(font.sourceGroup));
  const compatible = allFonts.filter((font) => font.supportsVietnamese && !archive.some((item) => item.id === font.id)).length;
  const catalogAssets = allFonts.map((font) => assetManifest[font.sourcePath as keyof typeof assetManifest] ?? []);
  return <AdminDashboard
    fonts={allFonts.slice(0, 30)}
    username={process.env.ADMIN_USER || "admin"}
    initialSummary={{ total: allFonts.length, published: allFonts.length, hidden: 0, archive: archive.length, international: allFonts.length - archive.length, compatible, personalUse: archive.filter((font) => font.license === "Personal Use").length }}
    assetFiles={catalogAssets.flat().length}
    assetFamilies={catalogAssets.filter((files) => files.length > 0).length}
  />;
}
