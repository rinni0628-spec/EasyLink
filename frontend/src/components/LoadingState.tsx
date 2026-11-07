export function LoadingState() {
  return (
    <p
      role="status"
      aria-live="polite"
      className="card-sticker flex items-center gap-3 rounded-2xl p-5 text-lg font-bold text-primary"
    >
      <span
        aria-hidden="true"
        className="inline-block h-6 w-6 flex-shrink-0 animate-spin rounded-full border-4 border-primary border-t-transparent"
      />
      잠시만 기다려 주세요...
    </p>
  );
}
