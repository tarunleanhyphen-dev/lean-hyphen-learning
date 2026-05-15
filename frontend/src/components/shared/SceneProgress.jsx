export default function SceneProgress({ current, total, label }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/50">
        <span>Act 1 · {label}</span>
        <span>{current + 1} / {total}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= current ? 'bg-saffron-500' : 'bg-white/15'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
