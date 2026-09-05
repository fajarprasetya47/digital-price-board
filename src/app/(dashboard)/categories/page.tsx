import { requireUser } from "@/lib/auth/dal";

export default async function CategoriesPage() {
  await requireUser();

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h1 className="text-xl font-bold text-zinc-900">Kategori</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Pengelolaan kategori akan dibangun pada fase Frontend & Backend.
      </p>
    </div>
  );
}