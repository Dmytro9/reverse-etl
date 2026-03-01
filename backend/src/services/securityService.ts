import { ValidationError } from "../middleware/errorHandler";
import { URL } from "url";

/**
 * SecurityService - Handles security validations
 * 
 * Prevents SSRF attacks and validates connection string safety
 */
class SecurityService {
  // Blocked hosts to prevent SSRF attacks
  private readonly BLOCKED_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
    "169.254.169.254", // AWS metadata service
    "metadata.google.internal", // GCP metadata
  ]);

  // Blocked IP ranges (private networks)
  private readonly BLOCKED_IP_RANGES = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^127\./,                   // 127.0.0.0/8 (loopback)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^(fc|fd)[0-9a-f]{2}:/i,    // IPv6 private
    /^fe80:/i,                  // IPv6 link-local
  ];

  /**
   * Validates a PostgreSQL connection string for SSRF vulnerabilities
   * @throws ValidationError if the connection string targets blocked resources
   */
  validateConnectionString(connectionString: string): void {
    if (!connectionString || typeof connectionString !== "string") {
      throw new ValidationError("Connection string is required");
    }

    let parsedUrl: URL;
    try {
      // Parse the connection string
      parsedUrl = new URL(connectionString);
    } catch (error) {
      throw new ValidationError(
        "Invalid connection string format. Expected: postgresql://user:pass@host:port/db"
      );
    }

    // Only allow PostgreSQL protocol
    if (parsedUrl.protocol !== "postgresql:" && parsedUrl.protocol !== "postgres:") {
      throw new ValidationError(
        "Only PostgreSQL connections are allowed"
      );
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Check against blocked hosts
    if (this.BLOCKED_HOSTS.has(hostname)) {
      throw new ValidationError(
        `Connection to ${hostname} is not allowed for security reasons. Please use a remote database.`,
        ["SSRF protection: localhost and internal hosts are blocked"]
      );
    }

    // Check against blocked IP ranges
    for (const pattern of this.BLOCKED_IP_RANGES) {
      if (pattern.test(hostname)) {
        throw new ValidationError(
          `Connection to private IP range is not allowed for security reasons`,
          ["SSRF protection: private network ranges are blocked"]
        );
      }
    }

    // Validate port is reasonable
    const port = parsedUrl.port;
    if (port) {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        throw new ValidationError("Invalid port number");
      }
    }
  }

  /**
   * Check if an environment allows bypassing SSRF checks
   * Useful for local development with Docker
   */
  shouldBypassSSRFCheck(): boolean {
    return process.env.NODE_ENV === "development" && 
           process.env.ALLOW_LOCALHOST === "true";
  }
}

export const securityService = new SecurityService();
