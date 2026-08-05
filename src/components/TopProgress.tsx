/**
 * Slim indeterminate progress bar shown at the very top of the viewport while
 * a page is fetching data. Purely visual; toggle with the `active` prop.
 */
export default function TopProgress({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent">
      <div className="topbar-pulse h-full w-1/4 rounded-full bg-accent shadow-[0_0_12px_2px] shadow-accent/60" />
    </div>
  );
}
