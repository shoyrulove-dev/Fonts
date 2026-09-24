import Link from "next/link";
import { fontCategories, useCases } from "@/data/collections";

export function CatalogSiloNav({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`${compact ? "mt-8" : "mt-10"} rounded-3xl bg-[#dce8dc] p-6 sm:p-8`} aria-label="Explore font collections">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5e7965]">Browse by style</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {fontCategories.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium hover:bg-[#1d241f] hover:text-white">
                {category.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5e7965]">Browse by project</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {useCases.map((useCase) => (
              <Link key={useCase.slug} href={`/use/${useCase.slug}`} className="rounded-full border border-[#b9c8ba] px-4 py-2 text-sm font-medium hover:bg-white">
                {useCase.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
