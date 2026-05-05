export default function LoadingSpinner({ size = 24, text }: { size?: number, text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        style={{ width: size, height: size }}
        className="border-3 border-slate-200 border-t-primary-600 rounded-full animate-spin"
      />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  )
}
