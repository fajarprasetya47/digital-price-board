import { requireUser } from "@/lib/auth/dal";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export default async function SettingsPage() {
  await requireUser();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Pengaturan Akun</h1>
        <p className="text-sm text-zinc-600">Ganti password login owner.</p>
      </div>
      <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-5">
        <ChangePasswordForm />
      </div>
    </div>
  );
}