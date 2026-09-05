import { requireUser } from "@/lib/auth/dal";
import { CategoryManager } from "@/components/categories/category-manager";

export default async function CategoriesPage() {
  await requireUser();
  return <CategoryManager />;
}