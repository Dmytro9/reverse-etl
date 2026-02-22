import type { FC } from "react";
import cn from "classnames";
import type { MappingEntry } from "../../types";
import { usePreview } from "./usePreview";
import { PREVIEW_LIMITS } from "../../config/constants";

type Props = {
  connectionId: string;
  table: string;
  mapping: MappingEntry[];
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
  onWebhookSent?: () => void;
};

export const Preview: FC<Props> = ({
  connectionId,
  table,
  mapping,
  webhookUrl,
  onWebhookUrlChange,
  onWebhookSent,
}) => {
  const {
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
  } = usePreview({ connectionId, table, mapping, onWebhookSent });

  return (
    <div className="step-content">
      <h2>Preview & Send</h2>
      <p className="step-description">
        Preview the transformed JSON payload, then send it to your webhook
        destination.
      </p>

      <div className="form-group">
        <label htmlFor="webhook-url">Webhook URL</label>
        <input
          id="webhook-url"
          type="url"
          placeholder="https://hooks.example.com/webhook/abc123"
          value={webhookUrl}
          onChange={(e) => onWebhookUrlChange(e.target.value)}
        />
      </div>

      <div className="preview-controls">
        <div className="form-group">
          <label>Rows to preview</label>
          <div className="limit-options">
            {PREVIEW_LIMITS.map((n) => (
              <button
                key={n}
                className={cn(
                  "btn",
                  "btn-sm",
                  n === limit ? "btn-primary" : "btn-secondary",
                )}
                onClick={() => setLimit(n)}
                type="button"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handlePreview}
          disabled={loading}
        >
          {loading && <span className="spinner" />}
          {loading ? "Generating…" : "Generate Preview"}
        </button>
      </div>

      {error && <div className="status status-error">{error}</div>}

      {rows && (
        <div className="preview-output">
          {webhookUrl.trim() && (
            <div className="webhook-info">
              <span className="method-badge">POST</span>
              <code>{webhookUrl}</code>
            </div>
          )}
          <div className="json-header">
            <span>
              {rows.length} row{rows.length !== 1 ? "s" : ""} transformed
            </span>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleCopy}
              type="button"
            >
              {copied ? "✓ Copied" : "Copy JSON"}
            </button>
          </div>
          <pre className="json-output">{jsonOutput}</pre>

          <div className="send-section">
            <button
              className="btn btn-success"
              onClick={handleSend}
              disabled={sending || !webhookUrl.trim()}
              type="button"
            >
              {sending && <span className="spinner" />}
              {sending ? "Sending…" : "Send to Webhook"}
            </button>

            {sendStatus === "success" && (
              <div className="send-success">
                ✓ Payload sent successfully to webhook
              </div>
            )}

            {!webhookUrl.trim() && (
              <span className="helper-text">
                Enter a webhook URL above to send
              </span>
            )}
          </div>
        </div>
      )}

      {rows && rows.length === 0 && (
        <p className="empty-state">Table is empty — no rows to preview.</p>
      )}
    </div>
  );
};
