# Deploying GitHub Profile Lookup to AWS | **Walkthrough Guide**

`#AWSDeployment` &nbsp;|&nbsp; `S3` &nbsp;|&nbsp; `CloudFront` &nbsp;|&nbsp; `OAC` &nbsp;|&nbsp; `Route53` &nbsp;|&nbsp; `Static Site Hosting` &nbsp;|&nbsp; `Portfolio`

---

## Overview

This guide deploys the GitHub Profile Lookup project as a subdomain of an existing Route 53 domain — sitting alongside an already-running static profile site. The end result is a live URL like `github-lookup.yourdomain.com` backed by a dedicated S3 bucket and CloudFront distribution, with OAC (Origin Access Control) enforcing that the bucket is never publicly accessible directly.

The second half of the guide covers adding a project card to your existing profile site that links to the live deployment and the GitHub README.

---

## Architecture

```
Browser
  │
  └──▶ Route 53
         │  github-lookup.yourdomain.com → A alias record
         ▼
       CloudFront Distribution
         │  - OAC attached (signs requests to S3)
         │  - HTTPS only (ACM cert — us-east-1)
         │  - Default root object: index.html
         │  - Custom error: 403/404 → /index.html
         ▼
       S3 Bucket  (github-lookup.yourdomain.com)
         │  - Block all public access: ON
         │  - Bucket policy: allow CloudFront OAC only
         │  - Static files: index.html, style.css, script.js
```

> **Why this pattern?**
> The bucket has zero public access. CloudFront is the only entity that can read from it, authenticated via OAC (the modern replacement for OAI). All traffic is HTTPS. S3 + CloudFront costs are minimal — typically under $1/month for a low-traffic portfolio project.

---

## Prerequisites

- AWS CLI configured with a named profile
- Existing Route 53 hosted zone with a registered domain
- Existing ACM certificate **in `us-east-1`** (CloudFront requirement) — if your profile site already uses HTTPS, this cert likely already covers `*.yourdomain.com`
- Project files ready: `index.html`, `style.css`, `script.js`

---

## Phase 1 — S3 Bucket

### 1.1 — Create the bucket

The bucket name should match your intended subdomain exactly. This is a convention (not a requirement for CloudFront), but it keeps things readable.

```bash
aws s3api create-bucket \
  --bucket github-lookup.yourdomain.com \
  --region us-east-1 \
  --profile YOUR_PROFILE
```

> **Region note:** `us-east-1` does not use `--create-bucket-configuration`. All other regions require:
> `--create-bucket-configuration LocationConstraint=REGION`

✅ Pass: bucket created, no error.

---

### 1.2 — Block all public access

```bash
aws s3api put-public-access-block \
  --bucket github-lookup.yourdomain.com \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
  --profile YOUR_PROFILE
```

> `BlockPublicPolicy=false` is intentional here — we still need to **attach** a bucket policy (in step 1.4) that grants CloudFront OAC access. Once the policy is in place you can optionally lock this down further, but it is not required since the policy itself is scoped to the OAC principal.

✅ Pass: `get-public-access-block` confirms all four flags set correctly.

---

### 1.3 — Upload project files

```bash
aws s3 sync ./02-github-profile-lookup-api-ajax/ \
  s3://github-lookup.yourdomain.com/ \
  --profile YOUR_PROFILE
```

Verify:

```bash
aws s3 ls s3://github-lookup.yourdomain.com/ --profile YOUR_PROFILE
# Should show: index.html  style.css  script.js  README.md
```

✅ Pass: all three files present in bucket root.

---

## Phase 2 — CloudFront OAC + Distribution

### 2.1 — Create the Origin Access Control

OAC is the modern replacement for OAI (Origin Access Identity). It signs requests to S3 using SigV4, meaning S3 can verify the request came from your specific CloudFront distribution.

```bash
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
    "Name=github-lookup-oac,
     Description=OAC for github-lookup.yourdomain.com,
     SigningProtocol=sigv4,
     SigningBehavior=always,
     OriginAccessControlOriginType=s3" \
  --profile YOUR_PROFILE
```

**Save the `Id` value from the response** — you need it when creating the distribution.

```bash
# Verify and capture the OAC ID
aws cloudfront list-origin-access-controls --profile YOUR_PROFILE
```

✅ Pass: OAC listed with `SigningBehavior: always`.

---

### 2.2 — Create the CloudFront Distribution

Create a config file `cf-distribution.json` — this keeps the CLI command readable:

```json
{
  "CallerReference": "github-lookup-2024",
  "Comment": "github-lookup.yourdomain.com",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "s3-github-lookup",
        "DomainName": "github-lookup.yourdomain.com.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "YOUR_OAC_ID"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-github-lookup",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      }
    ]
  },
  "Aliases": {
    "Quantity": 1,
    "Items": ["github-lookup.yourdomain.com"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERT_ID",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Enabled": true,
  "HttpVersion": "http2",
  "PriceClass": "PriceClass_100"
}
```

> **Config notes:**
>
> - `CachePolicyId: 658327ea...` is the AWS-managed **CachingOptimized** policy — best default for static sites
> - `PriceClass_100` = US + Europe edge locations only → lowest cost
> - `CustomErrorResponses` — maps 403/404 back to `index.html` with a 200. Critical for single-page apps; less critical here but good practice
> - Replace `YOUR_OAC_ID`, `YOUR_ACCOUNT_ID`, and `YOUR_CERT_ID` before running

```bash
aws cloudfront create-distribution \
  --distribution-config file://cf-distribution.json \
  --profile YOUR_PROFILE
```

**Save the `DomainName` value from the response** (looks like `d1abc2defg3hij.cloudfront.net`) — needed for Route 53.

✅ Pass: distribution created with `Status: InProgress`. Deployment takes 5–10 minutes.

---

### 2.3 — Attach the Bucket Policy (OAC authorization)

This policy tells S3 to accept `GetObject` requests **only** from your specific CloudFront distribution. Replace `YOUR_DISTRIBUTION_ARN` and bucket name before running.

Create `s3-bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::github-lookup.yourdomain.com/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

```bash
aws s3api put-bucket-policy \
  --bucket github-lookup.yourdomain.com \
  --policy file://s3-bucket-policy.json \
  --profile YOUR_PROFILE
```

Verify:

```bash
aws s3api get-bucket-policy \
  --bucket github-lookup.yourdomain.com \
  --profile YOUR_PROFILE | jq .
```

✅ Pass: policy shows `cloudfront.amazonaws.com` as Principal with correct distribution ARN in Condition.

---

## Phase 3 — Route 53 DNS

### 3.1 — Get your Hosted Zone ID

```bash
aws route53 list-hosted-zones --profile YOUR_PROFILE | jq '.HostedZones[] | {Name, Id}'
# Find your domain and note its /hostedzone/XXXXX ID
```

---

### 3.2 — Create the A alias record

Create `dns-record.json`:

```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "github-lookup.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "YOUR_CLOUDFRONT_DOMAIN.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
```

> `Z2FDTNDATAQYW2` is the **fixed** CloudFront hosted zone ID — it is the same for every CloudFront distribution in every AWS account. Do not change it.

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_HOSTED_ZONE_ID \
  --change-batch file://dns-record.json \
  --profile YOUR_PROFILE
```

✅ Pass: `Status: PENDING` → transitions to `INSYNC` within 60 seconds.

---

### 3.3 — Verify DNS propagation

```bash
# Check the record was created
aws route53 list-resource-record-sets \
  --hosted-zone-id YOUR_HOSTED_ZONE_ID \
  --profile YOUR_PROFILE \
  | jq '.ResourceRecordSets[] | select(.Name == "github-lookup.yourdomain.com.")'

# Confirm DNS resolves
dig github-lookup.yourdomain.com
# Should return the CloudFront IPs
```

---

## Phase 4 — Smoke Test

Wait for CloudFront distribution `Status` to show `Deployed`:

```bash
aws cloudfront get-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --profile YOUR_PROFILE \
  | jq '.Distribution.Status'
# "Deployed"
```

Then open `https://github-lookup.yourdomain.com` in a browser.

**Checklist:**

- [ ] Page loads over HTTPS (padlock in browser)
- [ ] No mixed content warnings in DevTools console
- [ ] Entering a GitHub username (`torvalds`) returns a populated card
- [ ] Direct S3 URL (`https://github-lookup.yourdomain.com.s3.amazonaws.com/index.html`) returns **403 Access Denied** — proving OAC is enforcing private access

---

## Phase 5 — Profile Site Integration

Add a project card to your existing static profile site for this deployment. Drop this card component into your profile site's HTML wherever your projects section lives:

```html
<!--
  Project Card: GitHub Profile Lookup
  - Links to live deployment and GitHub README
  - Update href values with your real URLs
-->
<div class="project-card">
  <div class="project-card__header">
    <span class="project-card__tag">API / AJAX</span>
    <span class="project-card__tag">Vanilla JS</span>
  </div>

  <h3 class="project-card__title">GitHub Profile Lookup</h3>

  <p class="project-card__description">
    A client-side app that queries the GitHub Users REST API and renders profile
    data — repos, followers, bio — into a glass-morphism card. Built as a
    deliberate refresher on <code>fetch()</code>, async/await, JSON parsing, and
    DOM injection. Zero dependencies, zero build tools.
  </p>

  <div class="project-card__links">
    <a
      href="https://github-lookup.yourdomain.com"
      target="_blank"
      rel="noopener noreferrer"
      class="project-card__link project-card__link--live"
    >
      ↗ Live Demo
    </a>
    <a
      href="https://github.com/JasonWeimar/web-fundamentals-projects/tree/main/02-github-profile-lookup-api-ajax"
      target="_blank"
      rel="noopener noreferrer"
      class="project-card__link project-card__link--repo"
    >
      README / Repo →
    </a>
  </div>
</div>
```

Style the card to match your existing profile site's design system — the class names above are intentionally generic so you can wire them into whatever CSS architecture you already have.

---

## Future Updates — Redeployment Workflow

When you update `script.js`, `style.css`, or `index.html`, the deploy is two commands:

```bash
# 1. Sync changed files to S3
aws s3 sync ./02-github-profile-lookup-api-ajax/ \
  s3://github-lookup.yourdomain.com/ \
  --profile YOUR_PROFILE

# 2. Invalidate the CloudFront cache so the new files are served immediately
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*" \
  --profile YOUR_PROFILE
```

> Without the invalidation, CloudFront may serve the old cached version for up to 24 hours (the default TTL of the CachingOptimized policy).

---

## Estimated Monthly Cost

| Service         | Usage                         | Estimated cost   |
| --------------- | ----------------------------- | ---------------- |
| S3 storage      | < 1 MB of files               | < $0.01          |
| S3 requests     | Low portfolio traffic         | < $0.01          |
| CloudFront      | First 1 TB transfer free tier | $0.00            |
| Route 53        | 1 hosted zone + queries       | ~$0.51           |
| ACM certificate | Free                          | $0.00            |
| **Total**       |                               | **~$0.52/month** |

> Route 53 is the dominant cost: $0.50/month per hosted zone + $0.40 per million queries. If your profile site already has a hosted zone, this project adds no additional hosted zone cost — it's just another record in the same zone.

---

## Teardown

```bash
# 1. Remove DNS record
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_HOSTED_ZONE_ID \
  --change-batch '{"Changes":[{"Action":"DELETE","ResourceRecordSet":{"Name":"github-lookup.yourdomain.com","Type":"A","AliasTarget":{"HostedZoneId":"Z2FDTNDATAQYW2","DNSName":"YOUR_CF_DOMAIN.cloudfront.net","EvaluateTargetHealth":false}}}]}' \
  --profile YOUR_PROFILE

# 2. Disable and delete CloudFront distribution
#    (must disable first and wait for Deployed status before deleting)
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --if-match $(aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID --profile YOUR_PROFILE | jq -r '.ETag') \
  --distribution-config file://cf-distribution-disabled.json \
  --profile YOUR_PROFILE

aws cloudfront delete-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --if-match YOUR_ETAG \
  --profile YOUR_PROFILE

# 3. Delete OAC
aws cloudfront delete-origin-access-control \
  --id YOUR_OAC_ID \
  --if-match YOUR_OAC_ETAG \
  --profile YOUR_PROFILE

# 4. Empty and delete the S3 bucket
aws s3 rm s3://github-lookup.yourdomain.com/ --recursive --profile YOUR_PROFILE
aws s3api delete-bucket \
  --bucket github-lookup.yourdomain.com \
  --profile YOUR_PROFILE
```

> **CloudFront note:** Distributions cannot be deleted while `Enabled: true`. You must disable, wait for `Status: Deployed`, then delete. Grab the current `ETag` from `get-distribution` immediately before each update/delete — it changes on every modification.

---

## Key Concepts Reference

### OAC vs OAI — Why OAC

|                    | OAI (legacy) | OAC (current)                    |
| ------------------ | ------------ | -------------------------------- |
| Request signing    | Unsigned     | SigV4 — cryptographically signed |
| SSE-KMS support    | ❌           | ✅                               |
| All S3 regions     | Limited      | ✅                               |
| AWS recommendation | Deprecated   | ✅ Preferred                     |

OAC signs every CloudFront → S3 request with SigV4, so S3 can verify the request came from your specific distribution. The bucket policy `Condition` on `AWS:SourceArn` pins it to your distribution ID — no other CloudFront distribution can read your bucket even if someone guessed the S3 URL.

### Why ACM Certificate Must Be in `us-east-1`

CloudFront is a global service fronted by AWS's global edge network. It reads SSL/TLS certificates from `us-east-1` only — regardless of where your S3 bucket or other resources live. A cert in `ap-southeast-1` will not appear in the CloudFront console or CLI.

### Why `Z2FDTNDATAQYW2` is Always the Same

Route 53 alias records require the hosted zone ID of the **target service**, not your own hosted zone. CloudFront has a single global hosted zone (`Z2FDTNDATAQYW2`) across all distributions and all accounts. It is hardcoded in the AWS docs and never changes.

---

_Part of the web-fundamentals-projects portfolio series — deployed on AWS with S3 + CloudFront OAC + Route 53._
