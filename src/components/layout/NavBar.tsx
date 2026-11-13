"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/components/StoreProvider";

const LINKS = [
  { href: "/fitting-room", label: "試着室", icon: SparkIcon },
  { href: "/closet", label: "クローゼット", icon: HangerIcon },
  { href: "/profile", label: "プロフィール", icon: UserIcon },
];

export function NavBar() {
  const pathname = usePathname();
  const { mode, profile } = useStore();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
          <Link href="/fitting-room" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-sm font-bold text-gold">AI</span>
            <span className="text-[15px] font-bold tracking-[.2em]">STYLIST</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-navy text-white" : "text-ink/60 hover:bg-mist"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {mode === "demo" && (
              <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gold">DEMO</span>
            )}
            <Link href="/profile" className="h-9 w-9 overflow-hidden rounded-full border border-black/10 bg-mist">
              {profile?.avatar_full_body_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_full_body_url} alt="" className="h-[220%] w-full object-cover object-top" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* スマホ：下部タブバー */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-3">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active ? "text-navy" : "text-ink/40"}`}>
                <l.icon className="h-6 w-6" />
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

type IconProps = { className?: string };
function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" strokeLinejoin="round" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" strokeLinejoin="round" />
    </svg>
  );
}
function HangerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 7.5a2 2 0 1 1 2-2" strokeLinecap="round" />
      <path d="M12 7.5v1.2L3.2 15.4A1.5 1.5 0 0 0 4.1 18h15.8a1.5 1.5 0 0 0 .9-2.6L12 8.7" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" strokeLinecap="round" />
    </svg>
  );
}
