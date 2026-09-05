import { requireUser } from "@/lib/auth/dal";
import { DisplayDeviceManager } from "@/components/display/device-manager";

export default async function DisplayDevicesPage() {
  await requireUser();
  return <DisplayDeviceManager />;
}