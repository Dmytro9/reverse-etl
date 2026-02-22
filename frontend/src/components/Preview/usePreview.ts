import { useState, useCallback } from "react";
import { previewData } from "../../api/client";
import type { MappingEntry } from "../../types";
import type { SendStatus } from "../../config/constants";
import {
  DEFAULT_PREVIEW_LIMIT,
  SEND_SUCCESS_TIMEOUT,
  COPY_SUCCESS_TIMEOUT,
  FAKE_SEND_DELAY,
} from "../../config/constants";

type UsePreviewParams = {
  connectionId: string;
  table: string;
  mapping: MappingEntry[];
  onWebhookSent?: () => void;
};

export function usePreview({ connectionId, table, mapping, onWebhookSent }: UsePreviewParams) {
  const [limit, setLimit] = useState(DEFAULT_PREVIEW_LIMIT);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");

  const handlePreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRows(null);
    setSendStatus("idle");
    try {
      const data = await previewData(connectionId, table, limit, mapping);
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }, [connectionId, table, limit, mapping]);

  const handleSend = useCallback(async () => {
    setSending(true);
    setSendStatus("idle");
    // Fake send with delay
    await new Promise((resolve) => setTimeout(resolve, FAKE_SEND_DELAY));
    setSending(false);
    setSendStatus("success");
    onWebhookSent?.();
    setTimeout(() => setSendStatus("idle"), SEND_SUCCESS_TIMEOUT);
  }, [onWebhookSent]);

  const jsonOutput = rows ? JSON.stringify(rows, null, 2) : null;

  const handleCopy = useCallback(async () => {
    if (!jsonOutput) return;
    await navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_SUCCESS_TIMEOUT);
  }, [jsonOutput]);

  return {
    limit,
    setLimit,
    rows,
    loading,
    error,
    copied,
    sending,
    sendStatus,
    jsonOutput,
    handlePreview,
    handleSend,
    handleCopy,
  };
}
