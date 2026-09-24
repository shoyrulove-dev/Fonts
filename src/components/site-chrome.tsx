import Image from "next/image";
import Link from "next/link";
import { fontCategories, useCases } from "@/data/collections";

export function SiteHeader({ backLabel = "Home" }: { backLabel?: string }) {
  return <header className="flex items-center justify-between gap-5 border-b border-[#d8d7cc] pb-4">
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Bliss Fonts home"><Image src="/icon.svg" alt="Bliss Fonts" width={34} height={34} priority /><span className="font-semibold tracking-[-0.03em]">Bliss Fonts</span></Link>
    <nav aria-label="Primary navigation" className="flex items-center gap-3 text-sm sm:gap-5">
      <Link href="/fonts" className="font-medium text-[#1d241f]">All fonts</Link>
      <Link href="/vietnamese" className="hidden text-[#697169] transition-colors hover:text-[#1d241f] sm:block">Vietnamese</Link>
      <Link href="/#collections" className="hidden text-[#697169] transition-colors hover:text-[#1d241f] md:block">Collections</Link>
      <Link href="/" className="hidden text-[#697169] transition-colors hover:text-[#1d241f] lg:block">{backLabel}</Link>
    </nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="mt-16 border-t border-[#d8d7cc] py-8 text-sm text-[#697169]">
    <div className="grid gap-8 md:grid-cols-[1fr_1fr_1fr]">
      <div><Link href="/" className="flex items-center gap-2 font-medium text-[#1d241f]"><Image src="/icon.svg" alt="" width={22} height={22} />Bliss Fonts</Link><p className="mt-3 max-w-xs leading-6">Preview and explore typefaces through a clearly organized catalog.</p><Link href="/fonts" className="mt-4 inline-block font-medium text-[#1d241f]">Browse all fonts →</Link></div>
      <div><p className="font-medium text-[#1d241f]">Styles</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{fontCategories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} className="hover:text-[#1d241f]">{category.label}</Link>)}</div></div>
      <div><p className="font-medium text-[#1d241f]">Collections</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2"><Link href="/vietnamese" className="hover:text-[#1d241f]">Vietnamese fonts</Link>{useCases.slice(0, 3).map((useCase) => <Link key={useCase.slug} href={`/use/${useCase.slug}`} className="hover:text-[#1d241f]">{useCase.title}</Link>)}</div></div>
    </div>
    <div className="mt-8 flex flex-wrap justify-between gap-4 border-t border-[#d8d7cc] pt-5"><span>© 2026 Bliss Fonts</span><span className="flex flex-wrap gap-x-4 gap-y-2"><Link href="/legal/licenses" className="hover:text-[#1d241f]">Licenses</Link><Link href="/legal/terms" className="hover:text-[#1d241f]">Terms</Link><Link href="/legal/privacy" className="hover:text-[#1d241f]">Privacy</Link></span></div>
  </footer>;
}
