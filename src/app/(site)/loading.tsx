import { StoneLoader } from "@/components/go/stone-loader";

export default function Loading() {
  return (
    <div className="grid min-h-[50dvh] place-items-center">
      <StoneLoader />
    </div>
  );
}
