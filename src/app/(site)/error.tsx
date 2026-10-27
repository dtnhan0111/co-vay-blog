"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Stone } from "@/components/go/stone";
import { Button } from "@/components/ui/button";

/** Lỗi khi dựng một trang: nói rõ chuyện gì xảy ra và cho thử lại, không để trắng màn hình. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center" role="alert">
      <div className="flex gap-2" aria-hidden>
        <Stone color="black" size={44} />
        <Stone color="white" size={44} />
      </div>
      <h1 className="text-3xl font-semibold">Không tải được trang này</h1>
      <p className="text-[15px] text-muted-foreground">Có trục trặc khi lấy dữ liệu từ kỳ quán. Bạn thử lại sau vài giây nhé; dữ liệu của bạn vẫn an toàn.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Thử lại</Button>
        <Button asChild variant="outline">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
