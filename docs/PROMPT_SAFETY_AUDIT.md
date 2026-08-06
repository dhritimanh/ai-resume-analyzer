# Prompt Safety Audit - Completed

## Summary
Removed all dangerous external claims from resume analysis prompts to ensure 99%+ accuracy margin.

---

## ✅ Changes Made

### 1. **Removed Industry Benchmarks** (3 files)
**Files:** `deep-insights.ts`, `language-branding.ts`, `career-tailoring.ts`

**Before:**
```
Industry Benchmarks:
- Reference typical scores for job target when available
- Example: "Average PM team_orientation is 75"
```

**After:**
```
CRITICAL: Base all analysis ONLY on resume content. Never reference:
- Industry averages, benchmarks, or "typical" scores
- Salary figures or compensation ranges
- Job market trends or growth percentages
- External data not present in the resume
```

---

### 2. **Strengthened Resume-Only Language**
Added explicit instructions to avoid:
- ❌ "You prefer X" → ✅ "Your resume shows 5 instances of X"
- ❌ "You're a great fit for Y" → ✅ "Your documented experience includes Y"
- ❌ "Industry average is 55%" → ✅ "Your rate is 68% (19 of 28 bullets)"
- ❌ "Typical salary $120K-$150K" → ✅ "Your scope grew from $200K to $2M budget"

---

### 3. **Conditional Gap Analysis** (`career-tailoring.ts`)
**Before:**
```
Gaps Analysis:
- missing_skills: Technical/soft skills needed but not present
```

**After:**
```
Gaps Analysis (ONLY if job description provided):
- missing_skills: Skills in job description but not in resume
- If NO job description: leave gaps arrays EMPTY or focus on natural progression gaps
```

**Note:** Currently, the UI does NOT pass job descriptions to the career tab. The `jobDescription` parameter exists but is never populated from the frontend.

---

### 4. **Changed "Industry-relevant" to "Job-relevant"** (`quick-analysis.ts`)
More accurate since we're analyzing against the inferred job target, not external industry data.

---

## ❌ Dangerous Patterns Eliminated

| Pattern | Status | Notes |
|---------|--------|-------|
| Industry averages/benchmarks | ✅ Removed | All 3 instances deleted |
| Salary figures | ✅ Not found | Never present |
| Job market predictions | ✅ Not found | Never present |
| "You prefer X" personality claims | ✅ Added guards | Explicit instructions to avoid |
| "Great fit for startups" absolutes | ✅ Added guards | Explicit instructions to avoid |
| Missing skills without JD | ✅ Fixed | Now conditional on JD presence |
| "Add these 8 ATS keywords" | ✅ Not found | Never present |

---

## 🟡 Remaining Considerations

### Job Description Input
**Current State:** The career tab API accepts `jobDescription` but the frontend never sends it.

**Options:**
1. Add a JD input field to the career tab UI
2. Remove the `jobDescription` parameter entirely
3. Leave as-is for future feature

**Recommendation:** Add JD input to career tab to enable proper gap analysis.

---

## ✅ Safe Patterns Now Enforced

All prompts now emphasize:
- **Observable patterns only:** "5 instances of cross-functional collaboration"
- **Resume arithmetic:** "68% quantification rate (19 of 28 bullets)"
- **Documented growth:** "Scope grew from $200K to $2M budget"
- **Trajectory-based suggestions:** "Based on your progression (Associate → Lead every 2.1 yrs)"
- **No external claims:** Never reference data not in the resume

---

## ✅ Final Verification Checklist

### 1. Industry Standards/Benchmarks
- ✅ Removed all "industry average", "typical scores", "benchmark" references
- ✅ Added explicit "CRITICAL: Never reference" instructions in 3 files
- ✅ Changed "industry-relevant" to "job-relevant" in quick-analysis

### 2. Salary Estimates
- ✅ No salary figures found in any prompts
- ✅ Added explicit prohibition in CRITICAL sections
- ✅ Example given: "scope grew from $200K to $2M budget" (factual) ✓

### 3. Job Market Predictions
- ✅ No "high demand", "growth %", "competitive for X%" found
- ✅ Added explicit prohibition: "Never claim roles are 'in high demand'"
- ✅ Instructions emphasize resume-only observations

### 4. Specific Target Roles
- ✅ Changed from prescriptive to descriptive
- ✅ Added: "Frame as 'based on your progression' not 'you should be'"
- ✅ Instructions: "Let THEM decide next role - provide options based on trajectory, not prescriptions"
- ✅ Example in prompt: "Based on your progression (Associate → PM → Senior → Lead every 2.1 yrs), you have demonstrated upward mobility. Your scope has grown from 0 to 12 team members and $200K to $2M budget, suggesting readiness for expanded responsibility."
- ✅ Explicit instruction: "In justification field, cite THEIR progression pattern"

### 5. Skill Gap Analysis
- ✅ Made conditional: "ONLY if job description provided"
- ✅ Added: "If NO job description: leave gaps arrays EMPTY"
- ✅ Focus on internal gaps (Experience vs Skills section)
- ⚠️ **Note:** Frontend doesn't send JD yet - gaps will be minimal/empty

### 6. Cultural Fit / Work Style
- ✅ Added explicit prohibition: "Never claim 'you prefer X' or 'you're a great fit for Y'"
- ✅ Changed to observable patterns: "5 instances of cross-functional collaboration"
- ✅ Removed personality inferences, kept factual observations
- ✅ Added concrete example in prompt: "NEVER say 'You are a great fit for startups' - INSTEAD say: 'Your resume shows 5 cross-functional collaborations and 0 direct-reports, which may align with environments that value broad influence over head-count management'"
- ✅ Clarified organization type scores: "reflect EXPERIENCE at those types, not predictions of fit"
- ✅ Updated culturalAdaptability reason field with example of observable pattern framing

---

## Testing Recommendations

1. **Test career tab without JD** - Ensure gaps arrays are empty or minimal
2. **Test with JD** - Verify gaps are specific to JD requirements (after frontend update)
3. **Check all outputs** - Confirm no "industry average" or "typical" language appears
4. **Verify tone** - Ensure no "you prefer" or "you're a great fit" claims
5. **Validate examples** - All suggestions should reference actual resume content

---

## Files Modified

1. ✅ `draftr/lib/resume-analysis/deep-insights.ts`
2. ✅ `draftr/lib/resume-analysis/language-branding.ts`
3. ✅ `draftr/lib/resume-analysis/career-tailoring.ts`
4. ✅ `draftr/lib/resume-analysis/quick-analysis.ts`

**Files already safe:**
- ✅ `section-analysis.ts` (no dangerous patterns found)
- ✅ `quick-analysis-free.ts` (no dangerous patterns found)

---

## Next Steps for JD Comparison Tool

When you add the JD comparison feature:
1. Add JD input field to career tab UI
2. Pass `jobDescription` from frontend to `/api/analysis/career`
3. Gap analysis will automatically populate with JD-specific insights
4. Consider pricing: $1-2 for JD comparison (cheap, high value)

---

## ✅ Prompt Optimization (Completed)

### Removed Redundant Instructions
**Problem:** Safety warnings were duplicated in both `systemMessage` (cached) and `prompt` (sent every time)

**Solution:** Removed redundant instructions from INSTRUCTIONS sections in 3 files:
- `career-tailoring.ts`: Removed 4 redundant safety warnings
- `language-branding.ts`: Removed 2 redundant safety warnings  
- `deep-insights.ts`: Removed 3 redundant safety warnings

**Benefits:**
- ✅ Token savings: ~50-80 tokens per call
- ✅ Cleaner prompts: More focused on actionable instructions
- ✅ Single source of truth: Safety rules only in systemMessage (cached)
- ✅ Faster processing: Shorter user messages

**Files checked (no redundancy found):**
- ✅ `quick-analysis.ts` - Clean
- ✅ `quick-analysis-free.ts` - Clean
- ✅ `section-analysis.ts` - Clean

See `PROMPT_OPTIMIZATION_DATABASE.md` for database impact analysis.
