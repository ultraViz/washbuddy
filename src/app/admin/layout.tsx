import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Car, LogOut, LayoutDashboard, Store } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/login");

  const name = session.user?.name ?? "Admin";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-[--background]">
      <header className="sticky top-0 z-30 bg-white border-b border-[--border] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">Admin Console</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground min-h-[44px]">
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>

            {/* User + sign out */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[--border]">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                {initials}
              </div>
              <span className="hidden md:block text-sm text-muted-foreground">{name}</span>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}>
                <Button variant="ghost" size="icon" type="submit" className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]">
                  <LogOut size={16} />
                </Button>
              </form>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
