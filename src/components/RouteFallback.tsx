export default function RouteFallback() {
  return (
    <div className="px-4 py-6">
      <div className="skeleton mb-4 h-10 w-2/3 rounded-xl" />
      <div className="skeleton mb-3 h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
