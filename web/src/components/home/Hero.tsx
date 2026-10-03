import Image from "next/image";
import Link from "next/link";
import { products } from "@/src/data/products";

const latestProduct = products.filter((item) => item.kind === "product").at(-1);

export default function Hero() {
  if (!latestProduct) return null;

  return (
    <section className="w-full">
      <Link href={`/products/${latestProduct.slug}`} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <Image
            src={latestProduct.image}
            alt={latestProduct.title}
            fill
            priority
            sizes="800px"
            style={latestProduct.objectPosition ? { objectPosition: latestProduct.objectPosition } : undefined}
            className="object-cover"
          />
        </div>
        <div className="px-3 pt-3">
          <p className="text-nav font-medium text-ink-strong">{latestProduct.category}</p>
          <h1 className="text-heading font-medium text-ink-strong">{latestProduct.title}</h1>
          {latestProduct.priceLabel && <p className="mt-1 text-body text-muted">{latestProduct.priceLabel}</p>}
          <p className="mt-2 text-nav text-ink-strong">Read More →</p>
        </div>
      </Link>
    </section>
  );
}
