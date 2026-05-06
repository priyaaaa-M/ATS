export function LoadingSkeleton({ className = 'h-24 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[12px] bg-[var(--bg-hover)] ${className}`} />
}
