import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Users, BookOpen, Scroll, Settings } from "lucide-react";

const bottomNavItems = [
  { name: "Chronicle", href: "/", icon: Home },
  { name: "Characters", href: "/characters", icon: Users },
  { name: "Stories", href: "/stories", icon: BookOpen },
  { name: "Sessions", href: "/sessions", icon: Scroll },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
