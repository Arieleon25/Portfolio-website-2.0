# Rollback: return arieeskinazi.com to GoDaddy

If the Cloudflare site ever needs to be reverted, recreate these DNS records
in the Cloudflare dashboard (DNS → Records) exactly as below. This is how the
domain was configured while GoDaddy served the site.

| Type  | Name | Content          | Proxy    |
|-------|------|------------------|----------|
| A     | @    | 173.201.184.246  | DNS only |
| CNAME | www  | arieeskinazi.com | DNS only |

Then remove the custom domains from the Worker
(Workers & Pages → portfolio-website-2-0 → Domains).

GoDaddy hosting must still be active for this to work. Do not cancel it until
the Cloudflare setup has been stable for a while.

Captured 2026-08-27, before cutover.
