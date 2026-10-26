import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 md:pb-10">{children}</main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
