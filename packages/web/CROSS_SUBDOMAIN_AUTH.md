# Cross-Subdomain Authentication Setup

This document explains how to configure cross-subdomain authentication for the ACME web application using Better Auth.

## Overview

Cross-subdomain authentication allows users to remain authenticated across different subdomains of your application. For example, if a user logs in at `auth.example.com`, they will also be authenticated on `app.example.com` and `dashboard.example.com`.

## Configuration

The application has been configured with the following Better Auth settings:

### 1. Cookie Configuration
- **Cookie Prefix**: `acme-auth` (instead of the default `better-auth`)
- **Secure Cookies**: Automatically enabled in production mode
- **Cross-subdomain Support**: Configurable via environment variables

### 2. Environment Variables

Add these optional environment variables to enable cross-subdomain authentication:

```bash
# Set to your root domain to enable cross-subdomain cookies
AUTH_DOMAIN="example.com"

# Comma-separated list of trusted origins
AUTH_TRUSTED_ORIGINS="https://app.example.com,https://dashboard.example.com,https://api.example.com"
```

### 3. Better Auth Configuration

The auth configuration in `src/lib/auth.ts` includes:

```typescript
advanced: {
  cookiePrefix: "acme-auth",
  crossSubDomainCookies: {
    enabled: !!env.AUTH_DOMAIN,
    domain: env.AUTH_DOMAIN,
  },
  useSecureCookies: env.NODE_ENV === "production",
},

trustedOrigins: env.AUTH_TRUSTED_ORIGINS
  ? env.AUTH_TRUSTED_ORIGINS.split(",").map((origin) => origin.trim())
  : undefined,
```

## Security Considerations

When enabling cross-subdomain cookies, follow these security best practices:

1. **Minimal Domain Scope**: Set `AUTH_DOMAIN` to the most specific domain needed
   - ✅ Good: `app.example.com` (if you only need app.example.com and its subdomains)
   - ❌ Avoid: `.example.com` (too broad, includes all subdomains)

2. **Trusted Origins**: Only include origins you control and trust
   - ✅ Good: `https://app.example.com,https://dashboard.example.com`
   - ❌ Avoid: Including third-party or untrusted subdomains

3. **Separate Untrusted Services**: Use separate domains for untrusted services
   - ✅ Good: `status.company.com` (separate domain)
   - ❌ Avoid: `status.app.example.com` (same subdomain tree)

## Usage Examples

### Example 1: Simple Cross-subdomain Setup
For a setup with `app.example.com` and `dashboard.example.com`:

```bash
AUTH_DOMAIN="example.com"
AUTH_TRUSTED_ORIGINS="https://app.example.com,https://dashboard.example.com"
```

### Example 2: Development Setup
For local development with different ports:

```bash
# No cross-subdomain setup needed for localhost
# AUTH_DOMAIN and AUTH_TRUSTED_ORIGINS can be left unset
```

### Example 3: Production Multi-app Setup
For a complex setup with multiple applications:

```bash
AUTH_DOMAIN="example.com"
AUTH_TRUSTED_ORIGINS="https://app.example.com,https://dashboard.example.com,https://api.example.com,https://admin.example.com"
```

## Testing Cross-subdomain Authentication

1. Set up your environment variables
2. Deploy to subdomains or configure local DNS
3. Log in on one subdomain
4. Navigate to another subdomain
5. Verify the user remains authenticated

## Troubleshooting

### Cookies Not Shared Between Subdomains
- Verify `AUTH_DOMAIN` is set correctly
- Check that the domain doesn't start with a dot (`.`)
- Ensure HTTPS is used in production

### Authentication Errors on Subdomains
- Verify all subdomains are included in `AUTH_TRUSTED_ORIGINS`
- Check that URLs in `AUTH_TRUSTED_ORIGINS` match exactly (including protocol)
- Ensure the Better Auth URL configuration is correct

### Local Development Issues
- Cross-subdomain cookies don't work with `localhost`
- Consider using a local domain like `app.local` with DNS configuration
- Or test cross-subdomain functionality in a staging environment

## Cookie Details

The following cookies will be set with cross-subdomain support:

- `acme-auth.session_token`: Stores the session token
- `acme-auth.session_data`: Stores session data (if cookie cache is enabled)
- `acme-auth.dont_remember`: Stores the remember me preference

All cookies are:
- HttpOnly (cannot be accessed via JavaScript)
- Secure (in production)
- SameSite=Lax (for cross-site compatibility)
- Domain-scoped (when `AUTH_DOMAIN` is set)
