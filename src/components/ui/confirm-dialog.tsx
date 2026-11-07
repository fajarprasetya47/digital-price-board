"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ErrorMessage } from "@/components/ui/feedback";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Hapus",
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button variant="danger" type="button" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-zinc-600">{message}</p>
        {error && <ErrorMessage message={error} />}
      </div>
    </Modal>
  );
}
