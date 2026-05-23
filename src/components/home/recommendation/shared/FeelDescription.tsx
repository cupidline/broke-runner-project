export default function FeelDescription({ text }: { text: string }) {
  return (
    <div className="mt-2 pt-2 border-t border-muted/20">
      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">How it should feel</p>
      <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
    </div>
  )
}
