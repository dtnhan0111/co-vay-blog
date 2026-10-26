import Link from "next/link";
import { Stone } from "@/components/go/stone";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="space-y-5">
        <div className="flex justify-center gap-2">
          <Stone color="black" size={56} />
          <Stone color="white" size={56} />
        </div>
        <h1 className="text-4xl font-semibold">Nước cờ này chưa có trên bàn</h1>
        <p className="mx-auto max-w-sm text-muted-foreground">Trang bạn tìm không tồn tại, hoặc ván này vẫn đang chờ đối thủ xác nhận.</p>
        <Button asChild>
          <Link href="/">Về kỳ quán</Link>
        </Button>
      </div>
    </div>
  );
}
