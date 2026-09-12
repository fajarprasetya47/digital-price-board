import { DisplayScreen } from "@/components/display/display-screen";

export type DisplayMode = "pages" | "scroller";

const DEFAULT_ROTATE_SECONDS = 10;
const MAX_ROTATE_SECONDS = 3600;

function parseRotateSeconds(raw: string | undefined): number {
  const value = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(value)) return DEFAULT_ROTATE_SECONDS;
  return Math.min(Math.max(value, 1), MAX_ROTATE_SECONDS);
}

function parseDisplayMode(raw: string | undefined): DisplayMode {
  // V2 hanya mengimplementasikan "pages"; nilai lain jatuh ke default
  // agar display tetap berfungsi (§29, §48 untuk future "scroller").
  return raw === "scroller" ? "scroller" : "pages";
}

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <DisplayScreen
      token={token}
      mode={parseDisplayMode(process.env.DISPLAY_MODE)}
      rotateSeconds={parseRotateSeconds(process.env.DISPLAY_ROTATE_SECONDS)}
    />
  );
}
