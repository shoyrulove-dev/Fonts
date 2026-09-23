import Image from "next/image";
import Link from "next/link";

export function SiteHeader({ backLabel = "Explore collection" }: { backLabel?: string }) {
  return <header className="flex items-center justify-between border-b border-[#d8d7cc] pb-4">
    <Link href="/" className="flex items-center gap-2.5" aria-label="Bliss Fonts home"><Image src="/icon.svg" alt="Bliss Fonts" width={34} height={34} priority /><span className="font-semibold tracking-[-0.03em]">Bliss Fonts</span></Link>
    <nav className="flex items-center gap-4 text-sm"><Link href="/vietnamese" className="hidden text-[#697169] transition-colors hover:text-[#1d241f] sm:block">Vietnamese</Link><Link href="/" className="font-medium text-[#1d241f]">{backLabel} <span aria-hidden="true">→</span></Link></nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="mt-16 flex flex-col justify-between gap-4 border-t border-[#d8d7cc] py-6 text-sm text-[#697169] sm:flex-row sm:items-center"><Link href="/" className="flex items-center gap-2 font-medium text-[#1d241f]"><Image src="/icon.svg" alt="" width={22} height={22} />Bliss Fonts</Link><span className="flex flex-wrap gap-x-4 gap-y-2"><Link href="/legal/licenses" className="hover:text-[#1d241f]">Licenses</Link><Link href="/legal/terms" className="hover:text-[#1d241f]">Terms</Link><Link href="/legal/privacy" className="hover:text-[#1d241f]">Privacy</Link></span></footer>;
}
