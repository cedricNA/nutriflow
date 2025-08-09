import { NavLink } from "react-router-dom";
import {
  Home,
  UtensilsCrossed,
  Activity,
  History,
  Settings,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navigation = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Repas", url: "/meals", icon: UtensilsCrossed },
  { title: "Activités", url: "/activities", icon: Activity },
  { title: "Historique", url: "/history", icon: History },
  { title: "Statistiques", url: "/stats", icon: TrendingUp },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 p-4 flex-col gap-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
          <UtensilsCrossed
            className="h-4 w-4 text-primary-foreground"
            aria-hidden="true"
          />
        </div>
        <span className="font-bold text-xl text-gray-800">NutriFlow</span>
      </div>
      <nav className="flex flex-col gap-2">
        {navigation.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-2 py-1 rounded-md text-gray-800 hover:text-black font-medium",
                isActive && "bg-gradient-primary text-white shadow-soft"
              )
            }
            aria-label={item.title}
          >
            <item.icon className="w-5 h-5" aria-hidden="true" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
