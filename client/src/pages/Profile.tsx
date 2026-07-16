import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

// ── tiny icon helpers (inline SVGs) ──────────────────────────────────────────
const Icon = {
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

// ── Avatar with initials ──────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="relative">
      <div
        className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold text-white select-none"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
      >
        {initials}
      </div>
      {/* online badge */}
      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background" />
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay?: number;
}) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-muted/60 group animate-fade-in"
      style={{ animationDelay: `${delay}ms`, opacity: 0, animationFillMode: "forwards" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary transition-transform duration-200 group-hover:scale-110"
        style={{ background: "hsl(217 91% 60% / 0.12)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm md:text-base font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, loading } = useAuth();
  const memberDays = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000)
    : 0;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-64 rounded-2xl bg-muted" />
          <div className="h-40 rounded-2xl bg-muted" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Icon.User />
          </div>
          <p className="text-muted-foreground">No user session found. Please log in.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 pb-8">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your account details and preferences</p>
        </div>

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div
          className="finance-card relative overflow-hidden animate-slide-up"
          style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "60ms" }}
        >
          {/* background gradient blob */}
          <div
            className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-10 pointer-events-none"
            style={{ background: "var(--gradient-primary)" }}
          />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar name={user.name} />

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "hsl(152 69% 40% / 0.12)", color: "hsl(152 69% 35%)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-primary"
                  style={{ background: "hsl(217 91% 60% / 0.1)" }}
                >
                  Free Plan
                </span>
              </div>
            </div>
          </div>

          {/* stat strip */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-border">
            {[
              { label: "Member days", value: memberDays.toString() },
              { label: "Joined", value: format(new Date(user.createdAt), "MMM yyyy") },
              { label: "Status", value: "Verified" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-lg md:text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Account details card ───────────────────────────────────────── */}
        <div
          className="finance-card animate-slide-up"
          style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "120ms" }}
        >
          <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-primary" style={{ background: "hsl(217 91% 60% / 0.12)" }}>
              <Icon.User />
            </span>
            Account Details
          </h3>

          <div className="space-y-1">
            <InfoRow icon={<Icon.User />} label="Full Name" value={user.name} delay={160} />
            <InfoRow icon={<Icon.Mail />} label="Email Address" value={user.email} delay={200} />
            <InfoRow
              icon={<Icon.Calendar />}
              label="Member Since"
              value={format(new Date(user.createdAt), "MMMM d, yyyy")}
              delay={240}
            />
            <InfoRow icon={<Icon.Globe />} label="Timezone" value="Asia/Kolkata (IST)" delay={280} />
          </div>


        </div>


      </div>
    </DashboardLayout>
  );
}
