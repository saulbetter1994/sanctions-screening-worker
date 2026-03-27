# Agent Flow Cost Estimation

Estimated costs per screening case across different scenarios, including Claude API, OpenSanctions API, and Brave Search API.

## Pricing Reference (as of March 2026)

| Service | Pricing |
|---------|---------|
| **Claude Sonnet 4** | $3.00 / 1M input tokens, $15.00 / 1M output tokens |
| **Claude Haiku 3.5** | $0.80 / 1M input tokens, $4.00 / 1M output tokens |
| **OpenSanctions API** | EUR 0.10 per API call (~$0.11 USD) |
| **Brave Search API** | $0.005 per search request |

---

## Token Estimates by Agent

System prompt sizes (estimated from instruction file sizes, ~1 token per 4 chars):

| Agent | System Prompt | Case Data (Input) | Tool Results (Input) | Agent Output |
|-------|-------------:|-------------------:|---------------------:|-------------:|
| **L1 Screening** | ~1,700 | ~500 | ~1,500 | ~600 |
| **L2 OSINT** | ~2,300 | ~800 | ~6,000 | ~2,500 |
| **Report Writer** | ~1,700 | ~2,000 | ~0 | ~2,500 |
| **Deputy MLRO** | ~2,300 | ~3,000 | ~0 | ~2,000 |

---

## Scenario Breakdown

### Scenario 1: No Match (L1 Closed)
**Path:** L1 Screening → Report Writer → Completed

| Component | Detail | Cost (Sonnet 4) | Cost (Haiku 3.5) |
|-----------|--------|----------------:|------------------:|
| **L1 Agent** | ~3,700 in / ~600 out | $0.0201 | $0.0054 |
| **Report Writer** | ~3,700 in / ~800 out | $0.0231 | $0.0062 |
| **OpenSanctions** | 1 matchEntity call | $0.11 | $0.11 |
| **Brave Search** | 0 calls | $0.00 | $0.00 |
| **Total** | | **$0.153** | **$0.116** |

### Scenario 2: L1 False Positive (L1 Closed)
**Path:** L1 Screening → Report Writer → Completed

| Component | Detail | Cost (Sonnet 4) | Cost (Haiku 3.5) |
|-----------|--------|----------------:|------------------:|
| **L1 Agent** | ~3,700 in / ~800 out | $0.0231 | $0.0062 |
| **Report Writer** | ~3,700 in / ~1,000 out | $0.0261 | $0.0070 |
| **OpenSanctions** | 1 matchEntity call | $0.11 | $0.11 |
| **Brave Search** | 0 calls | $0.00 | $0.00 |
| **Total** | | **$0.159** | **$0.123** |

### Scenario 3: L2 False Positive (No MLRO)
**Path:** L1 Screening → L2 OSINT → Report Writer → Completed

| Component | Detail | Cost (Sonnet 4) | Cost (Haiku 3.5) |
|-----------|--------|----------------:|------------------:|
| **L1 Agent** | ~3,700 in / ~600 out | $0.0201 | $0.0054 |
| **L2 OSINT Agent** | ~9,100 in / ~2,500 out | $0.0648 | $0.0173 |
| **Report Writer** | ~5,700 in / ~2,000 out | $0.0471 | $0.0126 |
| **OpenSanctions** | 1 match + 3 getEntity = 4 calls | $0.44 | $0.44 |
| **Brave Search** | ~7 searches | $0.035 | $0.035 |
| **Total** | | **$0.607** | **$0.510** |

### Scenario 4: True Match → Full EDD (with MLRO)
**Path:** L1 Screening → L2 OSINT → Report Writer → Deputy MLRO → Completed

| Component | Detail | Cost (Sonnet 4) | Cost (Haiku 3.5) |
|-----------|--------|----------------:|------------------:|
| **L1 Agent** | ~3,700 in / ~600 out | $0.0201 | $0.0054 |
| **L2 OSINT Agent** | ~9,100 in / ~2,500 out | $0.0648 | $0.0173 |
| **Report Writer** | ~5,700 in / ~2,500 out | $0.0546 | $0.0146 |
| **Deputy MLRO** | ~5,300 in / ~2,000 out | $0.0459 | $0.0122 |
| **OpenSanctions** | 1 match + 5 getEntity = 6 calls | $0.66 | $0.66 |
| **Brave Search** | ~8 searches | $0.040 | $0.040 |
| **Total** | | **$0.885** | **$0.749** |

### Scenario 5: Escalation (with MLRO + SAR)
**Path:** L1 Screening → L2 OSINT → Report Writer → Deputy MLRO (SAR) → Completed

| Component | Detail | Cost (Sonnet 4) | Cost (Haiku 3.5) |
|-----------|--------|----------------:|------------------:|
| **L1 Agent** | ~3,700 in / ~600 out | $0.0201 | $0.0054 |
| **L2 OSINT Agent** | ~11,000 in / ~3,000 out | $0.0780 | $0.0208 |
| **Report Writer** | ~7,000 in / ~3,000 out | $0.0660 | $0.0176 |
| **Deputy MLRO** | ~7,300 in / ~3,000 out | $0.0669 | $0.0178 |
| **OpenSanctions** | 1 match + 8 getEntity = 9 calls | $0.99 | $0.99 |
| **Brave Search** | ~10 searches | $0.050 | $0.050 |
| **Total** | | **$1.270** | **$1.101** |

---

## Summary: Cost per Case by Scenario

| Scenario | Stages | Sonnet 4 | Haiku 3.5 |
|----------|--------|----------:|----------:|
| No Match | L1 → Report | **$0.15** | **$0.12** |
| L1 False Positive | L1 → Report | **$0.16** | **$0.12** |
| L2 False Positive | L1 → L2 → Report | **$0.61** | **$0.51** |
| True Match (Full EDD) | L1 → L2 → Report → MLRO | **$0.89** | **$0.75** |
| Escalation + SAR | L1 → L2 → Report → MLRO | **$1.27** | **$1.10** |

---

## Cost Breakdown by Service (% of Total)

For a **True Match (Full EDD)** case using Sonnet 4:

| Service | Cost | % of Total |
|---------|-----:|----------:|
| OpenSanctions API | $0.66 | 75% |
| Claude API (Sonnet 4) | $0.19 | 21% |
| Brave Search API | $0.04 | 4% |

**Key insight:** OpenSanctions API calls dominate the cost (~75%). Claude API tokens are relatively cheap per case. Brave Search is negligible.

---

## Volume Projections

| Monthly Volume | Scenario Mix | Sonnet 4 Est. | Haiku 3.5 Est. |
|---------------:|-------------|---------------:|----------------:|
| 100 cases | 60% No Match, 25% L2 FP, 15% Full EDD | ~$28 | ~$23 |
| 500 cases | 60% No Match, 25% L2 FP, 15% Full EDD | ~$140 | ~$114 |
| 1,000 cases | 60% No Match, 25% L2 FP, 15% Full EDD | ~$281 | ~$228 |
| 5,000 cases | 60% No Match, 25% L2 FP, 15% Full EDD | ~$1,404 | ~$1,140 |
| 10,000 cases | 60% No Match, 25% L2 FP, 15% Full EDD | ~$2,808 | ~$2,280 |

> At 10,000+ cases/month, consider OpenSanctions self-hosted license for significant savings on the largest cost component.

---

## Cost Optimisation Opportunities

1. **OpenSanctions self-hosted**: Flat-rate license eliminates per-call costs (biggest savings at scale)
2. **Claude Batch API**: 50% discount on token costs for non-real-time screening
3. **Prompt caching**: Cache system prompts for 90% reduction on repeated input tokens
4. **Model selection**: Use Haiku 3.5 for L1 screening (simpler task), Sonnet 4 for L2/Report/MLRO
5. **Brave Search free tier**: $5/month free credit covers ~1,000 searches (~140 L2 cases)

### Optimised Cost Example (True Match case)

| Optimisation | Savings |
|-------------|--------:|
| Self-hosted OpenSanctions | -$0.66 |
| Haiku for L1, Sonnet for rest | -$0.01 |
| Prompt caching (system prompts) | -$0.02 |
| Brave free credit (if < 1K/mo) | -$0.04 |
| **Optimised Total** | **~$0.16** (vs $0.89 baseline) |

---

## Notes

- Token estimates are approximate; actual usage varies by entity complexity and match count
- OpenSanctions pricing in EUR converted at ~1.10 USD/EUR
- Brave Search free credit ($5/mo) not deducted from per-case estimates
- Multi-turn agent conversations (retries, clarifications) would increase token counts
- These estimates assume single-pass agent execution with no errors
