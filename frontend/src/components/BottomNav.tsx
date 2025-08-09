import { NavLink } from "react-router-dom";
import { navigation } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full h-16 flex md:hidden bg-white border-t border-gray-200 justify-around items-center z-50">
      {navigation.map((item) => (
        <NavLink
          key={item.title}
          to={item.url}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center text-sm text-gray-600",
              isActive && "text-primary"
            )
          }
          aria-label={item.title}
        >
          <item.icon className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}
