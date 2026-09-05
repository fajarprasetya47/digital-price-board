import { DisplayScreen } from "@/components/display/display-screen";

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <DisplayScreen token={token} />;
}