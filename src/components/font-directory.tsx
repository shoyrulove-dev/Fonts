import Link from "next/link";
import type { CatalogFont } from "@/lib/catalog";

export const DIRECTORY_PAGE_SIZE = 48;

export function FontDirectoryGrid({ fonts }: { fonts: CatalogFont[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {fonts.map((font) => (
        <Link
          prefetch={false}
          href={`/font/${font.slug}`}
          key={font.id}
          className="group rounded-3xl bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d241f]/5"
        >
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wider text-[#697169]">
            <span>{font.category?.replace("_", " ") ?? "Typeface"}</span>
            <span aria-hidden="true" className="text-[#78907c]">↗</span>
          </div>
          <p className="mt-10 truncate text-3xl font-medium tracking-[-0.05em]">{font.name}</p>
          <p className="mt-4 truncate text-sm text-[#5e7965]">{font.designer || "Independent typeface"}</p>
          <div className="mt-7 flex items-center justify-between border-t border-[#ecebe4] pt-4 text-xs text-[#697169]">
            <span>{font.license}</span>
            <span>{font.supportsVietnamese ? "Vietnamese ready" : "Preview"}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function pageHref(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}/page/${page}`;
}

export function DirectoryPagination({ basePath, currentPage, totalPages }: { basePath: string; currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Catalog pages" className="mt-10 rounded-3xl border border-[#d8d7cc] bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        {currentPage > 1 ? (
          <Link rel="prev" href={pageHref(basePath, currentPage - 1)} className="rounded-full border border-[#c9ccc1] px-4 py-2 text-sm font-medium hover:bg-[#dce8dc]">← Previous</Link>
        ) : <span />}
        <span className="text-sm text-[#697169]">Page {currentPage} of {totalPages}</span>
        {currentPage < totalPages ? (
          <Link rel="next" href={pageHref(basePath, currentPage + 1)} className="rounded-full border border-[#c9ccc1] px-4 py-2 text-sm font-medium hover:bg-[#dce8dc]">Next →</Link>
        ) : <span />}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-[#ecebe4] pt-5">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <Link
            key={page}
            href={pageHref(basePath, page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm ${page === currentPage ? "bg-[#1d241f] text-white" : "bg-[#f6f4ee] text-[#697169] hover:bg-[#dce8dc] hover:text-[#1d241f]"}`}
          >
            {page}
          </Link>
        ))}
      </div>
    </nav>
  );
}
