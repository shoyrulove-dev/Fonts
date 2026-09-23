import type { Metadata } from "next";
import fonts from "@/data/google-fonts.json";
import AdminDashboard from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard — Bliss Fonts",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard fonts={fonts} username={process.env.ADMIN_USER || "admin"} />;
}
