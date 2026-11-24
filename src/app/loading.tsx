export default function Loading() {
  return (
    <main role="status" aria-label="Loading" className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8 h-10 w-52 max-w-full rounded-2xl bg-[#dce8dc] motion-safe:animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(item => <div key={item} className="h-40 rounded-3xl bg-white motion-safe:animate-pulse" />)}
      </div>
    </main>
  );
}
