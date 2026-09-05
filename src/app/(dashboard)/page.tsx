import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";

const sections = [
  {
    href: "/products",
    title: "Produk",
    description: "Kelola produk & ubah harga jual",
  },
  {
    href: "/categories",
    title: "Kategori",
    description: "Kelola pengelompokan produk",
  },
  {
    href: "/display-devices",
    title: "Perangkat Display",
    description: "Kelola perangkat & token display",
  },
  {
    href: "/settings",
    title: "Pengaturan",
    description: "Ganti password akun",
  },
];

export default async function DashboardHomePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Halo, {user.name}
        </h1>
        <p className="text-sm text-zinc-600">
          Kelola harga jual toko dari satu tempat.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}