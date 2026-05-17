# RIE UI/UX Spec — Make the $0 MVP Feel Premium

## UX goal

Even though the app costs $0 to run, it should not feel cheap.

The user should feel:

- “This understands my listing.”
- “This gives me a business decision.”
- “This shows evidence, not vague AI text.”
- “I can trust this because it explains confidence and limitations.”

## Visual direction

Style:

- Clean SaaS dashboard
- Dark text on light background
- Strong whitespace
- Minimal color
- Premium report-card feel

Recommended colors:

- Background: `#F8FAFC`
- Card: `#FFFFFF`
- Text: `#0F172A`
- Muted text: `#64748B`
- Green: `#15803D`
- Amber: `#B45309`
- Red: `#B91C1C`
- Blue accent: `#2563EB`

Use color only for status/risk, not decoration.

## Page map

```text
/
/analyze
/dashboard
/reports/[id]
/methodology
/settings
```

## 1. Landing page

### Hero

Headline:

> Know if your reviews signal a product problem, trust risk, or anomaly — before you scale.

Subheadline:

> Paste or upload Amazon reviews and get an evidence-backed decision brief: scale, fix, investigate, or wait for better data.

CTA:

- Primary: Analyze Reviews
- Secondary: View Methodology

### Sections

1. Problem
   - Sellers waste money scaling listings with hidden review risk.
   - Bad reviews are hard to interpret manually.
   - Suspicious patterns are easy to overreact to.

2. How it works
   - Upload reviews
   - Detect patterns
   - Get decision brief

3. What you get
   - Scale readiness score
   - Product experience risk
   - Review integrity risk
   - Listing anomaly risk
   - Evidence-backed action plan

4. Privacy/free message
   - Works locally.
   - No paid AI API required.
   - No scraping required.

## 2. Analyze page

### Layout

Left side:

- Product fields
- Text area
- CSV upload
- Submit button

Right side:

- Live input quality preview
- Review count
- Metadata detected
- Warnings

### Input fields

- Product name
- Product URL
- Product category
- Review text area
- CSV upload

### Premium touches

- Sample CSV download
- “Paste example” button
- Real-time quality meter
- Clear warnings
- No scary error messages

### Empty state copy

> Paste one review per line, or upload a CSV with text, rating, date, and verified columns.

## 3. Report page

This is the most important page.

### Section 1 — Decision banner

Large card at top.

Shows:

- Verdict
- Confidence
- One-sentence reason
- Scale readiness score

Example:

> Fix Product First  
> Confidence: Medium  
> 42% of negative reviews mention durability, and the issue appears consistently across the dataset.

### Section 2 — Score cards

Cards:

1. Product Experience Risk
2. Review Integrity Risk
3. Listing Anomaly Risk
4. Scale Readiness

Each card includes:

- Score
- Label
- One reason
- “View evidence” anchor

### Section 3 — Top product issues

Card per issue:

- Theme name
- Frequency
- Average rating
- Severity
- Example quotes

Example:

> Durability — High frequency  
> Found in 34% of reviews. Common language: “broke,” “cracked,” “stopped working.”

### Section 4 — Evidence cards

Each evidence card should answer:

- What was detected?
- Why does it matter?
- How confident is the system?
- What examples support it?

### Section 5 — Pattern insights

Use callout style:

- “38% of complaints focus on durability.”
- “Repeated phrasing detected across 7 reviews.”
- “No timestamps provided, so anomaly detection is limited.”
- “12% of rated reviews show rating/text mismatch.”

### Section 6 — Timeline

Only if dates exist.

Charts:

- Review count over time
- Average rating over time
- Negative review count over time

If no dates:

Show a useful empty state:

> Add review dates to unlock burst detection and trend analysis.

### Section 7 — Action plan

Split into:

1. Do now
2. Do next
3. Monitor
4. Ignore for now

Actions should be concrete.

Bad:

- “Improve product quality.”

Good:

- “Audit supplier batch for durability complaints before increasing PPC spend.”

### Section 8 — Methodology and limitations

Include:

- What data was available
- What signals were used
- What confidence means
- What the system cannot prove

This increases trust.

## 4. Dashboard page

Purpose:

- Make the app feel reusable.
- Let user compare reports.

Table columns:

- Product
- Date
- Review count
- Input quality
- Verdict
- Scale readiness
- Actions

Actions:

- View
- Print
- Delete

Premium future placeholder:

- “Trend tracking coming soon”

## 5. Methodology page

Sections:

1. What RIE analyzes
2. What RIE does not claim
3. How scores work
4. How confidence works
5. Why input quality matters
6. Privacy and local-first design

Important copy:

> RIE identifies review risk signals. It does not prove fraud, competitor attacks, or policy violations. Use the evidence cards to support manual investigation.

## 6. Component list

### Shared UI

- `Button`
- `Card`
- `Badge`
- `ScoreGauge`
- `RiskLabel`
- `Alert`
- `Tabs`
- `EmptyState`
- `LoadingState`

### Analyze

- `ReviewPasteBox`
- `CsvUploader`
- `ProductMetadataForm`
- `InputQualityPreview`
- `SampleDataButton`

### Report

- `DecisionBanner`
- `RiskScoreCard`
- `ScaleReadinessCard`
- `ProductIssueCard`
- `EvidenceCard`
- `PatternInsightList`
- `TimelineChart`
- `ActionPlan`
- `MethodologyNotes`
- `PrintReportButton`

### Dashboard

- `ReportTable`
- `VerdictBadge`
- `DeleteReportButton`

## 7. Copywriting rules

Avoid:

- “Fake reviews detected”
- “Competitor attack confirmed”
- “Guaranteed accuracy”
- “AI knows”

Use:

- “Risk signal”
- “Pattern detected”
- “Confidence”
- “Evidence suggests”
- “Manual investigation recommended”

## 8. Premium details checklist

- [ ] Report has a clear executive summary
- [ ] Scores have explanations
- [ ] Every claim has evidence
- [ ] Warnings are helpful, not scary
- [ ] Empty states teach the user what to do
- [ ] Print view looks professional
- [ ] UI does not expose raw JSON
- [ ] Methodology is transparent
- [ ] Mobile layout is usable
- [ ] No overclaiming
