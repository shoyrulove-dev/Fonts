import fonts from "@/data/google-fonts.json";
import Link from "next/link";

type FontRecord = (typeof fonts)[number];
const categories = ["SANS_SERIF", "SERIF", "DISPLAY", "HANDWRITING", "MONOSPACE"];
const vietnameseFonts = fonts.filter((font: FontRecord) => font.supportsVietnamese);

function labelCategory(category: string | null) {
  return category?.replace("_", " ") ?? "Khác";
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#1d241f]">
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:px-10 lg:pt-16">
        <nav className="flex items-center justify-between border-b border-[#d8d7cc] pb-6"><span className="text-lg font-semibold tracking-tight">Fonts</span><span className="text-sm text-[#697169]">Kho font tiếng Việt</span></nav>
        <div className="grid gap-10 py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div><p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-[#5e7965]">Open font catalog</p><h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-7xl">Tìm đúng kiểu chữ cho ý tưởng của bạn.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#697169]">Catalog font mã nguồn mở, có hỗ trợ tiếng Việt, license rõ ràng và preview trực tiếp.</p><div className="mt-8 flex max-w-xl gap-3"><input className="h-12 min-w-0 flex-1 rounded-full border border-[#cfd2c7] bg-white px-5 outline-none placeholder:text-[#9aa19a] focus:border-[#5e7965]" placeholder="Tìm tên font..." aria-label="Tìm tên font" /><button className="rounded-full bg-[#1d241f] px-6 text-sm font-medium text-white">Tìm kiếm</button></div></div>
          <div className="rounded-3xl bg-[#dce8dc] p-8 sm:p-10"><p className="text-sm text-[#5e7965]">Dữ liệu hiện có</p><p className="mt-4 text-6xl font-semibold tracking-[-0.06em]">{fonts.length.toLocaleString("vi-VN")}</p><p className="mt-2 text-[#506154]">font family từ Google Fonts</p><div className="mt-10 grid grid-cols-2 gap-4 border-t border-[#b9cdbb] pt-5"><div><p className="text-2xl font-semibold">{vietnameseFonts.length}</p><p className="text-sm text-[#607263]">hỗ trợ tiếng Việt</p></div><div><p className="text-2xl font-semibold">5</p><p className="text-sm text-[#607263]">nhóm phong cách</p></div></div></div>
        </div>
        <section><div className="mb-5 flex items-end justify-between"><div><p className="text-sm uppercase tracking-[0.16em] text-[#78907c]">Browse</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Khám phá theo phong cách</h2></div><span className="text-sm text-[#697169]">{vietnameseFonts.length} font tiếng Việt</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{categories.map((category) => { const count = fonts.filter((font: FontRecord) => font.category === category).length; return <div key={category} className="rounded-2xl border border-[#d8d7cc] bg-white p-5"><p className="text-lg font-medium">{labelCategory(category)}</p><p className="mt-8 text-sm text-[#697169]">{count} font family</p></div>; })}</div></section>
        <section className="mt-20"><div className="mb-5 flex items-end justify-between"><div><p className="text-sm uppercase tracking-[0.16em] text-[#78907c]">Vietnamese ready</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Font nổi bật</h2></div><span className="text-sm text-[#697169]">License mở</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{vietnameseFonts.slice(0, 12).map((font: FontRecord) => <Link href={`/font/${font.slug}`} key={font.id} className="rounded-2xl bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,.04)] hover:ring-2 hover:ring-[#78907c]"><p className="text-xl font-medium">{font.name}</p><p className="mt-3 text-sm text-[#697169]">{labelCategory(font.category)} · {font.license}</p><p className="mt-8 truncate text-2xl text-[#5e7965]">Ăn ở ấm áp, ước mơ</p></Link>)}</div></section>
      </section>
    </main>
  );
}
