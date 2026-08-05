export function CardSkeleton() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line/70 bg-panel p-3">
      <div className="skeleton mb-2.5 h-16 w-16 rounded-2xl" />
      <div className="skeleton mb-1.5 h-2.5 w-14 rounded" />
      <div className="skeleton h-2 w-10 rounded" />
    </div>
  );
}

export function RowSkeleton({ title }: { title?: boolean }) {
  return (
    <div className="mb-6 px-4">
      {title && <div className="skeleton mb-3 h-4 w-36 rounded" />}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-line/70 bg-panel p-3"
        >
          <div className="skeleton h-7 w-7 rounded" />
          <div className="skeleton h-14 w-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-2/3 rounded" />
            <div className="skeleton h-2.5 w-1/3 rounded" />
          </div>
          <div className="skeleton h-9 w-16 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
