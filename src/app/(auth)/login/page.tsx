import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/icon-dpb.svg" alt="" width={28} height={28} />
          <h1 className="text-lg font-bold text-zinc-900">Digital Price Board</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-600">Masuk dengan akun owner.</p>
        <LoginForm />
      </div>
    </div>
  );
}