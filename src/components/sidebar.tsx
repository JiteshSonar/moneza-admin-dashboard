"use client"
import {
  ArrowLeftRight,
  Layers3,
  Gift,
  Home,
  Settings,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarWidth } from "./constants";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Courses", href: "/courses", icon: Video },
  { name: "Bundles", href: "/bundles", icon: Layers3 },
  { name: "Users", href: "/users", icon: Users },
  { name: "Referrals", href: "/referrals", icon: Gift },
  { name: "Payouts", href: "/transactionreward", icon: ArrowLeftRight },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-full bg-white shadow-sm z-50"
      style={{ width: sidebarWidth }}
    >
      <div className="p-6 text-xl font-bold">Moneza Admin</div>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
