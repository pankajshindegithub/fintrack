import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function Profile() {
  const { user, loading } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Your account details</p>
        </div>

        <div className="finance-card">
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : user ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="text-lg font-semibold text-foreground">{user.name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="text-lg font-semibold text-foreground">{user.email}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Member since</div>
                <div className="text-lg font-semibold text-foreground">
                  {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "-"}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No user found.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
