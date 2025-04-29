import { useState } from "react";
import { Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface MobileHeaderProps {
  title?: string;
}

export function MobileHeader({ title = "FreelanceHub" }: MobileHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  // Determinar a página inicial baseada no tipo de usuário
  const getHomePath = () => {
    if (!user) return "/";
    return user.userType === "freelancer" ? "/" : "/";
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between p-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-dark-medium p-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <Link href={getHomePath()}>
          <h1 className="text-xl font-bold text-primary cursor-pointer hover:text-primary/90 transition-colors">{title}</h1>
        </Link>
        
        <div className="flex items-center gap-1">
          <NotificationDropdown />
          
          <Button variant="ghost" size="icon" className="text-dark-medium p-2">
            <User className="h-6 w-6" />
            <span className="sr-only">User menu</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
