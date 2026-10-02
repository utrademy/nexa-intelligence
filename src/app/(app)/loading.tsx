export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="space-y-2">
        <div className="shimmer h-7 w-64 rounded-lg" />
        <div className="shimmer h-4 w-96 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="shimmer h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="shimmer h-80 rounded-2xl xl:col-span-2" />
        <div className="shimmer h-80 rounded-2xl" />
      </div>
    </div>
  );
}
