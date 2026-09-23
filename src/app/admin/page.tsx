import type { Metadata } from "next";
import { allFonts } from "@/lib/catalog";
import AdminDashboard from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard — Bliss Fonts",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard fonts={allFonts} username={process.env.ADMIN_USER || "admin"} />;
}
