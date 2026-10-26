import Link from "next/link";
import { Stone } from "@/components/go/stone";

export function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Go Đà Nẵng — trang chủ">
      <span className="relative block h-8 w-11" aria-hidden>
        <Stone color="black" size={26} className="absolute top-0 left-0 transition-transform group-hover:-translate-x-0.5" />
        <Stone color="white" size={26} className="absolute top-[5px] left-[14px] transition-transform group-hover:translate-x-0.5" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.35rem] font-bold tracking-tight">Go Đà Nẵng</span>
      </span>
    </Link>
  );
}
