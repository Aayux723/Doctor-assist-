import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between">
      {/* Left */}
      <h1 className="text-lg font-semibold">Doctor Assist</h1>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Dr. John Doe
        </span>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
