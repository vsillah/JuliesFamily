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
    <nav aria-label="Order lifecycle" className="kinflo-order-lifecycle border-b" data-testid="order-lifecycle-navigation">
      <div className="mx-auto max-w-[1500px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">{eyebrow}</div>
          <Badge variant="outline" className="kinflo-order-lifecycle-badge">Request to delivery</Badge>
        </div>
        <ol className="flex gap-2 overflow-x-auto pb-1" data-testid="order-lifecycle-navigation-items">
          {items.map((item, index) => {
            const isActive = item.key === activeKey;
            return (
              <li key={item.key} className="flex min-w-[220px] flex-1 items-center gap-2">
                <a
                  href={item.href}
                  aria-current={isActive ? "step" : undefined}
                  className={`kinflo-order-lifecycle-item group flex min-h-[74px] w-full items-start gap-3 rounded-xl border px-3 py-3 transition ${isActive ? "kinflo-order-lifecycle-item-active" : ""}`}
                  data-testid={`order-lifecycle-${item.key}`}
                >
                  <span className={`kinflo-order-lifecycle-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isActive ? "kinflo-order-lifecycle-icon-active" : ""}`}>
                    {isActive ? <CircleDashed className="h-4 w-4" /> : item.availability === "available" ? <CheckCircle2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="kinflo-order-lifecycle-title block text-sm font-semibold">{item.label}</span>
                    <span className="kinflo-order-lifecycle-detail mt-1 block text-xs leading-4">{item.detail}</span>
                  </span>
                </a>
                {index < items.length - 1 ? <ArrowRight className="kinflo-order-lifecycle-arrow hidden h-4 w-4 shrink-0 xl:block" /> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
