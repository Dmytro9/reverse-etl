import { useState, type FC } from "react";
import { testConnection } from "../api/client";

type Props = {
  connectionString: string;
  onConnectionStringChange: (value: string) => void;
  onConnected: (connectionId: string) => void;
};

export const ConnectSource: FC<Props> = ({
  connectionString,
  onConnectionStringChange,
  onConnected,
}) => {
  const [status, setStatus] = useState<
    "idle" | "testing" | "connected" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!connectionString.trim()) return;
    setStatus("testing");
    setError(null);
    try {
      const { connectionId } = await testConnection(connectionString.trim());
      setStatus("connected");
      onConnected(connectionId);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  return (
    <div className="step-content">
      <h2>Connect to Postgres</h2>
      <p className="step-description">
        Enter your Postgres connection string to get started.
      </p>

      <div className="form-group">
        <label htmlFor="conn-string">Connection string</label>
        <input
          id="conn-string"
          type="text"
          placeholder="postgresql://user:password@localhost:5432/dbname"
          value={connectionString}
          onChange={(e) => {
            onConnectionStringChange(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          disabled={status === "testing"}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleTest}
        disabled={!connectionString.trim() || status === "testing"}
      >
        {status === "testing" && <span className="spinner" />}
        {status === "testing" ? "Testing…" : "Test Connection"}
      </button>

      {status === "connected" && (
        <div className="status status-success">✓ Connected successfully</div>
      )}
      {status === "error" && (
        <div className="status status-error">✗ {error}</div>
      )}
    </div>
  );
};
