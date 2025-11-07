import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Users, 
  BookOpen, 
  Scroll, 
  Sparkles, 
  Menu, 
  X,
  Skull,
  LogOut,
  UsersRound,
  Network
} from "lucide-react";

const navigationItems = [
  { name: "Chronicle", href: "/", icon: Home },
  { name: "Characters", href: "/characters", icon: Users },
  { name: "Coteries", href: "/coteries", icon: UsersRound },
  { name: "Relationships", href: "/relationships", icon: Network },
  { name: "Stories", href: "/stories", icon: BookOpen },
  { name: "Sessions", href: "/sessions", icon: Scroll },
  { name: "Generator", href: "/generator", icon: Sparkles },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card border-border shadow-gothic"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <nav className={cn(
        "fixed left-0 top-0 z-40 h-full w-64 bg-gradient-shadow border-r border-border transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-blood rounded-lg flex items-center justify-center">
                <Skull className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Chronicle</h1>
                <p className="text-sm text-muted-foreground">Keeper</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-crimson" 
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              <p>Vampire: The Masquerade</p>
              <p className="text-primary">5th Edition Assistant</p>
              {user?.email && (
                <p className="mt-1 truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}