import { ImageComparison } from "@ctps/ui/image-comparison";
import Image from "next/image";

export function MarketingComparison({ className }: { readonly className?: string }) {
  return (
    <ImageComparison
      after={
        <Image
          alt="Stylized clean property exterior"
          className="object-cover"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          src="/images/before-after/exterior-after.svg"
        />
      }
      before={
        <Image
          alt="Stylized property exterior before care"
          className="object-cover"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          src="/images/before-after/exterior-before.svg"
        />
      }
      {...(className ? { className } : {})}
    />
  );
}
