# Security Documentation

This document outlines the security considerations, threat model, and mitigations implemented in this Reverse ETL application.

## Security Overview

This application handles database connectivity and data transformation. Given the nature of the application, security is paramount to prevent unauthorized access, data leakage, and system abuse.

## Threat Model

### Attack Vectors

1. **SSRF (Server-Side Request Forgery)**
   - Attacker provides malicious connection strings to access internal resources
   - Risk: Access to internal databases, cloud metadata services, network scanning

2. **SQL Injection**
   - Attacker manipulates table/column names to execute arbitrary SQL
   - Risk: Data exfiltration, database modification, DoS

3. **Denial of Service (DoS)**
   - Resource exhaustion through unlimited connection attempts
   - Risk: Service unavailability, memory exhaustion, cost increase

4. **Information Disclosure**
   - Error messages leak sensitive information about infrastructure
   - Risk: Reconnaissance for further attacks

5. **Data Exfiltration**
   - Unauthorized access to database contents through preview functionality
   - Risk: Privacy violations, compliance issues

## Security Mitigations Implemented

### ✅ SSRF Protection

**Location:** [`backend/src/services/securityService.ts`](backend/src/services/securityService.ts)

**Implementation:**
- Validates connection strings against blocked hosts (localhost, 127.0.0.1, ::1)
- Blocks private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Blocks cloud metadata endpoints (169.254.169.254, metadata.google.internal)
- Only allows PostgreSQL protocol
- Validates port ranges (1-65535)

**Bypass for Development:**
- Set `ALLOW_LOCALHOST=true` in development mode to connect to Docker containers

**Limitations:**
- DNS rebinding attacks not fully mitigated
- No validation of connection after DNS resolution
- Consider adding: DNS resolution validation, domain allowlisting

### ✅ SQL Injection Prevention

**Location:** [`backend/src/services/tableService.ts`](backend/src/services/tableService.ts)

**Implementation:**
- All dynamic values use parameterized queries ($1, $2, etc.)
- Table and column names validated against regex pattern
- Identifiers quoted to prevent injection
- PostgreSQL reserved keywords detected and handled
- Maximum identifier length enforced (63 characters)

**Example:**
```typescript
// Safe: Uses parameterized query
pool.query("SELECT * FROM users WHERE id = $1", [userId]);

// Safe: Identifier validation and quoting
const quotedTable = tableService.sanitizeIdentifier(tableName);
pool.query(`SELECT * FROM ${quotedTable}`);
```

**Limitations:**
- Does not prevent second-order SQL injection
- No WAF or query analysis
- Consider adding: Query complexity limits, pattern detection

### ✅ Rate Limiting

**Location:** [`backend/src/middleware/rateLimiter.ts`](backend/src/middleware/rateLimiter.ts)

**Implementation:**
- General API: 100 requests per minute per IP
- Connection endpoints: 10 connections per minute per IP
- In-memory store with automatic cleanup
- Returns 429 with Retry-After header

**Limitations:**
- In-memory store doesn't work across multiple instances
- IP-based limiting can be bypassed with proxies
- No distributed rate limiting
- Consider adding: Redis-backed rate limiting, API key-based limits

### ✅ Resource Limits

**Location:** [`backend/src/services/connectionService.ts`](backend/src/services/connectionService.ts)

**Implementation:**
- Maximum 100 concurrent connection pools
- Each pool limited to 5 clients
- Connection timeout: 10 seconds
- Query timeout: 30 seconds
- Statement timeout: 30 seconds
- Idle client timeout: 30 seconds
- Connection TTL: 30 minutes with automatic cleanup

**Protection Against:**
- Memory exhaustion
- Connection pool leaks
- Slow query attacks
- Resource hogging

### ✅ Error Handling

**Location:** [`backend/src/middleware/errorHandler.ts`](backend/src/middleware/errorHandler.ts)

**Implementation:**
- Generic error messages in production
- Detailed errors only in development mode
- Correlation IDs for request tracing
- Structured logging without credential leakage
- Stack traces only in development

**Example:**
```typescript
// Production: "Failed to connect to database"
// Development: "Failed to connect: connection timeout"
```

### ✅ Graceful Shutdown

**Location:** [`backend/src/index.ts`](backend/src/index.ts)

**Implementation:**
- SIGTERM/SIGINT signal handlers
- Closes HTTP server first (stops accepting new requests)
- Closes all database connection pools
- Handles uncaught exceptions and unhandled rejections
- Ensures in-flight requests complete before shutdown

**Benefits:**
- Zero-downtime deployments
- No connection leaks
- Proper resource cleanup

### ✅ Input Validation

**Location:** [`backend/src/validation/schemas.ts`](backend/src/validation/schemas.ts), [`backend/src/services/mappingService.ts`](backend/src/services/mappingService.ts)

**Implementation:**
- Zod schema validation for all requests
- Preview limit capped at 100 rows
- Mapping path validation (alphanumeric, underscore only)
- Duplicate path detection
- Path collision detection (nested vs scalar conflicts)
- Column existence validation

**Example:**
```json
// Blocked: Path collision
[
  { "sourceColumn": "id", "targetPath": "user" },
  { "sourceColumn": "name", "targetPath": "user.name" }
]
```

### ✅ Structured Logging

**Location:** [`backend/src/services/logger.ts`](backend/src/services/logger.ts)

**Implementation:**
- Correlation IDs for request tracing
- JSON output in production (for log aggregation)
- Pretty printing in development
- No credential logging
- Stack traces only in development
- Request/response logging with context

**Benefits:**
- Incident investigation
- Performance monitoring
- Security audit trails

## Known Gaps & Future Improvements

### Authentication & Authorization
**Status:** ❌ Not Implemented

**Risk:** Anyone with access to the API can connect to any allowed database

**Mitigation Priority:** HIGH

**Recommend:**
- Add API key authentication
- Implement user sessions
- Role-based access control (RBAC)
- Database connection allowlisting per user

### Encryption in Transit
**Status:** ⚠️ Partial

**Current State:** HTTPS enforced by deployment platform

**Gaps:**
- No forced TLS for PostgreSQL connections
- No certificate validation

**Recommend:**
- Require `sslmode=require` in connection strings
- Validate database server certificates

### Data at Rest
**Status:** ❌ Not Implemented

**Risk:** Connection strings stored in memory unencrypted

**Recommend:**
- Encrypt connection strings in memory
- Use secrets management (HashiCorp Vault, AWS Secrets Manager)
- Automatic secret rotation

### Audit Logging
**Status:** ⚠️ Partial

**Current State:** Request logging exists but no audit trail

**Recommend:**
- Log all database queries with user context
- Immutable audit logs
- Compliance reporting (GDPR, SOC2)

### Network Security
**Status:** ⚠️ Partial

**Current State:** SSRF protection exists but incomplete

**Gaps:**
- No DNS rebinding protection
- No domain allowlisting
- No egress filtering

**Recommend:**
- Resolve DNS before validation
- Implement domain allowlist
- Use network policies/firewall rules

### Monitoring & Alerting
**Status:** ⚠️ Partial

**Current State:** Health checks exist but no alerting

**Recommend:**
- Set up Prometheus metrics
- Alert on anomalous patterns (spike in failed connections)
- SLO/SLA monitoring

### Data Validation
**Status:** ⚠️ Partial

**Current State:** Input validation exists but no output validation

**Recommend:**
- Validate data types from database
- Sanitize output before sending to webhooks
- Schema enforcement for target systems

## Security Best Practices for Users

### Connection Strings
- ✅ Use read-only database users
- ✅ Restrict network access to specific IPs
- ✅ Use strong passwords (20+ characters)
- ✅ Enable SSL/TLS for database connections
- ✅ Rotate credentials regularly

### Production Deployment
- ✅ Set `NODE_ENV=production`
- ✅ Configure `ALLOWED_ORIGINS` for CORS
- ✅ Use HTTPS for all traffic
- ✅ Deploy behind API gateway with additional rate limiting
- ✅ Use Web Application Firewall (WAF)
- ✅ Regular security updates and patches

### Monitoring
- ✅ Monitor rate limit violations
- ✅ Alert on failed connection attempts
- ✅ Track unusual query patterns
- ✅ Set up log aggregation and analysis

## Incident Response

### Suspected SSRF Attack
1. Check logs for connection attempts to blocked ranges
2. Review `x-correlation-id` to trace full request
3. Block attacking IP at network level
4. Review and update blocked host list

### Suspected SQL Injection
1. Review query logs for unusual patterns
2. Check for validation bypass attempts
3. Update identifier validation rules if needed
4. Conduct database audit

### DoS Attack
1. Review rate limiter effectiveness
2. Implement IP blocking at WAF level
3. Scale resources if legitimate traffic spike
4. Consider CAPTCHA for connection test endpoint

## Compliance Considerations

### GDPR
- ⚠️ No data minimization controls
- ⚠️ No right to be forgotten mechanism
- ⚠️ No consent management
- ✅ Data encryption in transit

### SOC 2
- ⚠️ No audit trail immutability
- ✅ Access logging
- ⚠️ No user access reviews
- ✅ Secure development practices

### HIPAA
- ❌ Not suitable for HIPAA workloads without additional controls
- Missing: Encryption at rest, BAA, audit controls, access controls

## Security Contact

For security vulnerabilities, please report to: security@example.com

**Do not** create public GitHub issues for security vulnerabilities.

## Changelog

- **2026-02-27**: Initial security documentation
  - SSRF protection
  - SQL injection prevention
  - Rate limiting
  - Resource limits
  - Error handling
  - Graceful shutdown
  - Input validation
  - Structured logging
