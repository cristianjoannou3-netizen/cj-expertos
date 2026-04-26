export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--surface)]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    </div>
  )
}
