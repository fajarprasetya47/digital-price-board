import { requireUser } from "@/lib/auth/dal";
import { getPositiveId } from "@/lib/utils/params";
import { ProductDetail } from "@/components/products/product-detail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const id = await getPositiveId(params);
  return <ProductDetail productId={id} />;
}