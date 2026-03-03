import { useLocation, Link } from "wouter";
import { Home, ClipboardList, Megaphone, AlertTriangle, User } from "lucide-react";

const tabs = [
  { href: "/", label: "หน้าหลัก", icon: Home },
  { href: "/activities", label: "กิจกรรม", icon: ClipboardList },
  { href: "/announcements", label: "ประกาศ", icon: Megaphone },
  { href: "/report", label: "แจ้งปัญหา", icon: AlertTriangle },
  { href: "/profile", label: "โปรไฟล์", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-bottom"
      style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}
              data-testid={`nav-${label}`}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors ${
                active ? "text-primary" : "text-gray-400"
              }`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
