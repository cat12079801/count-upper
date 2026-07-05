export default function AppLoading() {
  return (
    <div className="flex justify-center py-24">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-accent"
        role="status"
        aria-label="読み込み中"
      />
    </div>
  );
}
