export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-semibold text-red-700 underline underline-offset-2 hover:text-red-800"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-12">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-amber-500" />
    </div>
  );
}