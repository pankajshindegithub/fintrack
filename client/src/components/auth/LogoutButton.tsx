import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary" | "link" | "gradient" | null | undefined;
}

export function LogoutButton({ className, variant = "ghost" }: LogoutButtonProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Force a full page reload to ensure clean state
    window.location.href = '/';
  };

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
}
