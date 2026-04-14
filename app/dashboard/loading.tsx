export default function DashboardLoading() {
  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="glass-card p-10 text-center animate-pulse-glow">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400 mx-auto mb-4" />
        <p className="text-[var(--text-muted)] text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}
