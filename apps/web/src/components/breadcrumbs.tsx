import Link from "next/link";
import { Container } from "@ctps/ui/layout";

export function Breadcrumbs({
  items,
}: {
  readonly items: readonly { readonly name: string; readonly path: string }[];
}) {
  return (
    <Container>
      <nav aria-label="Breadcrumb" className="py-4 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => (
            <li className="flex items-center gap-2" key={item.path}>
              {index ? <span aria-hidden="true">/</span> : null}
              {index === items.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link className="hover:text-foreground" href={item.path}>
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </Container>
  );
}
