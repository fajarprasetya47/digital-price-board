export default async function DisplayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">DAFTAR HARGA JUAL</h1>
      <p className="text-xl text-zinc-400">
        Display #{token.slice(0, 8)}
      </p>
      <p className="text-sm text-zinc-500">
        Konten display akan dibangun pada fase Frontend & Backend.
      </p>
    </div>
  );
}