import Image from "next/image";
import Link from "next/link";

export function SiteHeader({ backLabel = "Explore collection" }: { backLabel?: string }) {
  return <header className="flex items-center justify-between border-b border-[#d8d7cc] pb-5"><Link href="/" className="flex items-center gap-3" aria-label="Bliss Fonts home"><Image src="/icon.svg" alt="Bliss Fonts" width={38} height={38} priority /><span className="text-lg font-semibold tracking-[-0.03em]">Bliss Fonts</span></Link><div className="flex items-center gap-4"><Link href="/vietnamese" className="hidden text-sm text-[#697169] transition-colors hover:text-[#1d241f] sm:block">Vietnamese</Link><Link href="/" className="text-sm text-[#697169] transition-colors hover:text-[#1d241f]">{backLabel} <span aria-hidden="true">→</span></Link></div></header>;
}

export function SiteFooter() {
  return <footer className="mt-20 flex flex-col justify-between gap-4 border-t border-[#d8d7cc] pt-7 text-sm text-[#697169] sm:flex-row"><Link href="/" className="flex items-center gap-2 font-medium text-[#1d241f]"><Image src="/icon.svg" alt="" width={24} height={24} />Bliss Fonts</Link><span className="flex flex-wrap gap-x-4 gap-y-2"><Link href="/legal/licenses" className="hover:text-[#1d241f]">Licenses</Link><Link href="/legal/terms" className="hover:text-[#1d241f]">Terms</Link><Link href="/legal/privacy" className="hover:text-[#1d241f]">Privacy</Link></span></footer>;
}
