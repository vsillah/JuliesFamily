import { ArrowRight, CheckCircle2, CircleDashed, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type OrderLifecycleNavigationItem = {
  key: string;
  label: string;
  detail: string;
  href: string;
  availability: "available" | "account_required";
};

type OrderLifecycleNavigationProps = {
  activeKey: string;
  eyebrow: string;
  items: OrderLifecycleNavigationItem[];
};

export default function OrderLifecycleNavigation({ activeKey, eyebrow, items }: OrderLifecycleNavigationProps) {
  return (
    <nav aria-label="Order lifecycle" className="border-b border-slate-200 bg-slate-950 text-white dark:border-slate-800" data-testid="order-lifecycle-navigation">
      <div className="mx-auto max-w-[1500px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">{eyebrow}</div>
          <Badge variant="outline" className="border-white/20 bg-white/5 text-slate-200">Request to delivery</Badge>
        </div>
        <ol className="flex gap-2 overflow-x-auto pb-1" data-testid="order-lifecycle-navigation-items">
          {items.map((item, index) => {
            const isActive = item.key === activeKey;
            return (
              <li key={item.key} className="flex min-w-[220px] flex-1 items-center gap-2">
                <a
                  href={item.href}
                  aria-current={isActive ? "step" : undefined}
                  className={`group flex min-h-[74px] w-full items-start gap-3 rounded-xl border px-3 py-3 transition ${isActive ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]"}`}
                  data-testid={`order-lifecycle-${item.key}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isActive ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-300"}`}>
                    {isActive ? <CircleDashed className="h-4 w-4" /> : item.availability === "available" ? <CheckCircle2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{item.label}</span>
                    <span className="mt-1 block text-xs leading-4 text-slate-300">{item.detail}</span>
                  </span>
                </a>
                {index < items.length - 1 ? <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-600 xl:block" /> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
