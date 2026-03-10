# Cloudflare Setup Reference — vibedrips.com

> **Date configured:** March 10, 2026  
> **Domain:** vibedrips.com  
> **Cloudflare plan:** Free  
> **Origin:** Cloudflare Pages (`vibedrips.pages.dev`)

---

## 1. DNS Records

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|-------------|-----|
| CNAME | `vibedrips.com` | `vibedrips.pages.dev` | 🟠 Proxied | Auto |
| CNAME | `www` | `vibedrips.pages.dev` | 🟠 Proxied | Auto |

Both records must remain **Proxied** (orange cloud) for Cloudflare rules and redirect rules to apply.

---

## 2. Redirect Rules

### www → Root Redirect
| Setting | Value |
|---------|-------|
| Rule name | `Redirect from WWW to root` |
| Match type | Wildcard pattern |
| Request URL | `https://www.*` |
| Target URL | `https://${1}` |
| Status code | `301` |
| Preserve query string | ✅ |

### Bulk Redirect: pages.dev → Custom Domain
| Setting | Value |
|---------|-------|
| List name | `vibedrips` |
| Source URL | `vibedrips.pages.dev` |
| Target URL | `https://vibedrips.com` |
| Status | 301 |
| Subpath matching | ✅ |
| Preserve path suffix | ✅ |
| Preserve query string | ✅ |
| Rule name | `vibedrips pages.dev redirect` |
| Rule status | **Active** |

---

## 3. SSL/TLS

| Setting | Value |
|---------|-------|
| SSL Mode | Full |
| Always Use HTTPS | ✅ On |
| TLS 1.3 | ✅ On |
| Minimum TLS Version | TLS 1.2 |
| Automatic HTTPS Rewrites | ✅ On |
| Opportunistic Encryption | ✅ On |
| Certificate Transparency Monitoring | ✅ On |
| Universal Certificate | Active (auto-renewed) |
| HSTS | Not enabled (optional — enable when fully stable) |

---

## 4. Security / Bot Protection

| Feature | Status | Config |
|---------|--------|--------|
| **AI Labyrinth** | ✅ On | Traps AI crawlers in generated content |
| **Block AI Bots** | ✅ On | Block on all pages |
| **Bot Fight Mode** | ✅ On | JS Detections: On |
| **Cloudflare managed ruleset** | ✅ Always active | Web exploits, DDoS, Bot traffic, API abuse |
| **robots.txt** | Custom file | ⚠️ Cloudflare management DISABLED — custom file in repo root |
| **Page Shield** | Off | Not needed for affiliate PWA |
| **Leaked credentials mitigation** | Off | No login/passwords on site |

---

## 5. robots.txt

Cloudflare management is **disabled**. Custom `robots.txt` file is served from the repo root.

Key rules:
- ✅ **AmazonBot** — explicitly `Allow: /` (Amazon affiliate compliance)
- ✅ **Googlebot, Bingbot, DuckDuckBot** — `Allow: /`
- 🚫 **GPTBot, ClaudeBot, CCBot, Google-Extended, Bytespider, Applebot-Extended, meta-externalagent, PerplexityBot, cohere-ai, ChatGPT-User, anthropic-ai** — `Disallow: /`
- ✅ **Default (`User-agent: *`)** — `Allow: /` (Cloudflare handles actual enforcement)

> Real bot blocking is enforced at Cloudflare edge (Bot Fight Mode + Block AI Bots), not just via robots.txt signals.

---

## 6. Performance (Speed Settings)

### Protocol Optimization
| Feature | Status |
|---------|--------|
| HTTP/2 | ✅ On |
| HTTP/2 to Origin | ✅ On |
| HTTP/3 (QUIC) | ✅ On |
| 0-RTT Connection Resumption | ✅ On |
| Enhanced HTTP/2 Prioritization | 🔒 Upgrade required |

### Content Optimization
| Feature | Status | Notes |
|---------|--------|-------|
| Speed Brain | ✅ On | Speculative prefetch |
| Early Hints | ✅ On | Preload linked assets before 200 OK |
| Cloudflare Fonts | ❌ Off | Beta — may conflict with Font Awesome CDN |
| Rocket Loader | ❌ Off | Breaks JS-heavy PWAs |

---

## 7. Cache Rules

### Rule: Cache VibeDrips Static Assets
| Setting | Value |
|---------|-------|
| Rule name | `Cache VibeDrips Static Assets` |
| Match | `https://vibedrips.com/assets/*` OR `https://vibedrips.com/data/*.json` |
| Cache eligibility | Eligible for cache |
| Edge TTL | Ignore cache-control header → **7 days** |
| Browser TTL | Override origin → **1–2 hours** |

> **Note:** `data/*.json` files are auto-regenerated daily by GitHub Actions. The 7-day edge TTL is overridden by the DATA_VERSION cache-busting parameter in the app. Browser TTL is short enough to pick up same-day data refreshes.

---

## 8. Managed Transforms

| Transform | Status |
|-----------|--------|
| Remove "X-Powered-By" headers | ✅ On |
| Add security headers (XSS protection) | ✅ On |
| Add visitor location headers | Off |
| Add TLS client auth headers | Off |
| Add leaked credentials header | Off |
| Remove visitor IP headers | Off |

---

## 9. URL Normalization

| Setting | Value |
|---------|-------|
| Normalization type | Cloudflare |
| Normalize incoming URLs | ✅ On |
| Normalize URLs to origin | Off |

---

## 10. Web Analytics

| Setting | Value |
|---------|-------|
| Hostname | `vibedrips.com` |
| Setup | Automatic (Cloudflare auto-injects beacon) |
| RUM mode | **Enable** (all visitors including EU — GDPR-safe, no cookies) |
| Beacon script | Auto-injected via Cloudflare Pages integration |

> Cloudflare Web Analytics is privacy-first (no cookies, no fingerprinting) — no GDPR consent banner required.

---

## 11. Notifications

All notifications deliver to account email via Email method.

| Notification Name | Event | Filter |
|-------------------|-------|--------|
| VibeDrips — DDoS | HTTP DDoS Attack Alert | — |
| VibeDrips — SSL Expiry | Universal SSL Alert | — |
| VibeDrips — Pages Deploy | Project updates | Production env, Deployment failed |
| VibeDrips — Site Down | Passive Origin Monitoring | — |
| VibeDrips — Cloudflare Incident | Incident Alert | Major impact |
| VibeDrips — Weekly Analytics | Web Analytics Metrics Update | — |
| VibeDrips — Abuse | Cloudflare Abuse Report Alert | — |
| VibeDrips — Trust & Safety | Notifications for New Blocks | — |
| VibeDrips — New Insight | New Insight detected | 51 insight classes |

---

## 12. Synthetic Monitoring

Recurring browser tests configured from multiple regions for global coverage:

| Region | Covers |
|--------|--------|
| Iowa, USA | Amazon.com (US) |
| London, UK | Amazon.co.uk + Europe |
| Singapore | Amazon.in + Amazon.com.au |
| São Paulo, Brazil | Amazon.com.br |

Frequency: Every 1 hour per region. URL: `https://vibedrips.com/`

---

## 13. Observatory Results (Baseline — March 10, 2026)

**Synthetic test from Iowa, USA (Desktop):** Score **84/100**

| Metric | Value | Status |
|--------|-------|--------|
| TTFB | 32ms | 🟢 Good |
| FCP | 548ms | 🟢 Good |
| LCP | 2,775ms | 🟡 Borderline |
| Total Blocking Time | 61ms | 🟢 Good |
| CLS | 0 | 🟢 Perfect |
| Speed Index | 1,057ms | 🟢 Good |

**Real User Measurements:**
- India: 🟢 Good
- USA: 🟡 Needs improvement (LCP ~3,728ms — expected to improve as cache warms)

---

## 14. Things to Revisit Later

| Item | When |
|------|------|
| **HSTS** | After 30 days of stable production traffic |
| **Cloudflare Pro** ($20/mo) | If LCP needs improvement — unlocks Polish (image compression) + Argo (smart routing) |
| **Polish / Image compression** | Requires Pro plan |
| **Zaraz** (3rd party tag manager) | If you add more analytics/tracking tools |
| **Prefetch URLs** | Requires Enterprise plan |
| **Cache Rules for data/ files** | Separate shorter TTL rule if data freshness becomes an issue |
