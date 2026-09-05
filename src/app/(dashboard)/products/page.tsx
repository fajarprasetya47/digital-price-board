import { requireUser } from "@/lib/auth/dal";
import { ProductList } from "@/components/products/product-list";

export default async function ProductsPage() {
  await requireUser();
  return <ProductList />;
}