# Kimi Model Selection for Draftr

## Model Usage Summary

| Task | Model | Context | Speed | Why This Model |
|------|-------|---------|-------|----------------|
| **Vision Extraction** | `moonshot-v1-8k-vision-preview` | 128k | Standard | Only vision model available, handles image understanding |
| **Text Rewriting** | `kimi-k2-0711-preview` | 128k | Standard | Better at professional content generation, code/text capabilities |
| **Quick Analysis** | `kimi-k2-turbo-preview` | 256k | 60-100 tok/sec | Fast response, large context, excellent reasoning |

## Detailed Breakdown

### 1. Vision Extraction (`moonshot-v1-8k-vision-preview`)
**File**: `lib/kimi-vision.ts`

**Purpose**: Extract all data from resume images

**Why This Model**:
- Only vision model available from Kimi
- 128k context length (sufficient for resume images)
- Supports image understanding
- Latest version with stable features

**Configuration**:
```typescript
{
  model: 'moonshot-v1-8k-vision-preview',
  temperature: 0.3,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: base64Image } },
        { type: 'text', text: extractionPrompt }
      ]
    }
  ]
}
```

**Cost**: ~1024 tokens per image (fixed)

---

### 2. Text Rewriting (`kimi-k2-0711-preview`)
**File**: `lib/kimi-api.ts`

**Purpose**: Rewrite resume sections to be more professional and ATS-friendly

**Why This Model**:
- **128k context**: Can handle long resume sections
- **Enhanced capabilities**: Better at professional writing
- **Code/text understanding**: Understands technical content better
- **MoE architecture**: 1T parameters, 32B activated (powerful)

**Previous Model**: `moonshot-v1-8k` (8k context, older)

**Improvement**:
- 16x larger context (128k vs 8k)
- Better understanding of professional language
- More nuanced rewriting

**Configuration**:
```typescript
{
  model: 'kimi-k2-0711-preview',
  temperature: 0.3,
  messages: [
    { role: 'system', content: 'Expert resume writer...' },
    { role: 'user', content: rewritePrompt }
  ]
}
```

**Cost**: Variable based on content length (~200-500 tokens per rewrite)

---

### 3. Quick Analysis (`kimi-k2-turbo-preview`)
**File**: `lib/resume-analysis/quick-analysis.ts`

**Purpose**: Fast, comprehensive resume analysis with scoring

**Why This Model**:
- **256k context**: Can analyze entire resume with all sections
- **High-speed**: 60-100 tokens/second (2-3x faster than standard)
- **Better reasoning**: Excels at deep analysis and scoring
- **Cost-effective**: Fast = less waiting = better UX

**Previous Model**: `moonshot-v1-8k` (8k context, slower)

**Improvement**:
- 32x larger context (256k vs 8k)
- 2-3x faster response time
- Better at complex reasoning (scoring, analysis)
- Can handle very long resumes

**Configuration**:
```typescript
{
  model: 'kimi-k2-turbo-preview',
  temperature: 0.3,
  max_tokens: 1500,
  messages: [
    { role: 'user', content: analysisPrompt }
  ]
}
```

**Cost**: ~1000-1500 tokens per analysis

---

## Alternative Models Considered

### `kimi-k2-0905-preview`
- **Context**: 256k
- **Features**: Enhanced Agentic Coding, context understanding
- **Why Not**: Overkill for our use case, optimized for coding tasks

### `kimi-k2-thinking`
- **Context**: 256k
- **Features**: Long-term thinking, multi-step reasoning
- **Why Not**: Slower, designed for complex problem-solving (not needed for quick analysis)

### `kimi-k2-thinking-turbo`
- **Context**: 256k
- **Features**: Fast thinking model
- **Why Not**: Could work for analysis, but turbo-preview is sufficient and faster

### `kimi-latest`
- **Context**: 128k
- **Features**: Latest vision model
- **Why Not**: May include unstable features, prefer stable preview versions

---

## Performance Comparison

### Before (Old Models)
```
Vision: moonshot-v1-8k-vision-preview ✅ (no change)
Rewriting: moonshot-v1-8k (8k context)
Analysis: moonshot-v1-8k (8k context)

Total context: 8k + 8k = 16k
Speed: Standard
Quality: Good
```

### After (Optimized Models)
```
Vision: moonshot-v1-8k-vision-preview ✅ (no change)
Rewriting: kimi-k2-0711-preview (128k context) ⬆️
Analysis: kimi-k2-turbo-preview (256k context) ⬆️

Total context: 128k + 256k = 384k
Speed: 2-3x faster for analysis
Quality: Excellent
```

---

## Cost Analysis

### Per Resume (Full Flow)

| Task | Model | Tokens | Cost (est.) |
|------|-------|--------|-------------|
| Vision Extraction | moonshot-v1-8k-vision-preview | 1024 | $0.001 |
| Quick Analysis | kimi-k2-turbo-preview | 1500 | $0.002 |
| Rewrite Summary | kimi-k2-0711-preview | 300 | $0.0003 |
| Rewrite 3 Experiences | kimi-k2-0711-preview | 900 | $0.0009 |
| **Total** | | **3724** | **$0.0042** |

**Profit per user** (at $1.99 minimum): $1.99 - $0.0042 = **$1.9858** (99.8% margin)

---

## When to Use Each Model

### Use `moonshot-v1-8k-vision-preview` when:
- ✅ Processing images
- ✅ Extracting data from PDFs (as images)
- ✅ OCR tasks

### Use `kimi-k2-0711-preview` when:
- ✅ Rewriting professional content
- ✅ Generating resume text
- ✅ Improving language quality
- ✅ Need good understanding of context

### Use `kimi-k2-turbo-preview` when:
- ✅ Need fast responses
- ✅ Analyzing large documents
- ✅ Scoring and evaluation
- ✅ Complex reasoning tasks
- ✅ User is waiting (real-time)

### Use `kimi-k2-thinking` when:
- ⚠️ Multi-step reasoning required
- ⚠️ Complex problem-solving
- ⚠️ Career roadmap generation (future feature)
- ⚠️ Speed is not critical

---

## Future Optimizations

### For Full Analysis (When Implemented)
```typescript
// Bucket 1-2: Section & Language Analysis
model: 'kimi-k2-turbo-preview' // Fast, good reasoning

// Bucket 3: Career Roadmap
model: 'kimi-k2-thinking' // Complex multi-step planning

// Bucket 4: Deep Insights
model: 'kimi-k2-0711-preview' // Deep understanding needed
```

### For Batch Processing
- Use `kimi-k2-turbo-preview` for all tasks
- Prioritize speed over slight quality differences
- Process multiple resumes in parallel

---

## Model Update Strategy

### When to Update Models
1. **New Kimi release**: Test new models for quality improvements
2. **Performance issues**: Switch to faster models if users complain
3. **Cost optimization**: Monitor costs and adjust if needed
4. **Quality issues**: Upgrade to more powerful models if output quality drops

### Testing New Models
1. Run on 10 sample resumes
2. Compare output quality
3. Measure response time
4. Calculate cost difference
5. A/B test with real users

---

## Monitoring

### Key Metrics to Track
- **Response time**: Should be <3 seconds for quick analysis
- **Token usage**: Monitor for unexpected increases
- **Error rate**: Track API failures by model
- **Quality scores**: User satisfaction with outputs

### Alerts
- Response time >5 seconds
- Error rate >5%
- Cost per resume >$0.01
- User complaints about quality

---

## Summary

We've optimized our model selection to:
1. ✅ Use the best model for each specific task
2. ✅ Maximize speed (2-3x faster analysis)
3. ✅ Improve quality (better reasoning and understanding)
4. ✅ Maintain low costs (<$0.005 per resume)
5. ✅ Future-proof (using latest K2 models)

**Result**: Better user experience, faster responses, higher quality outputs, same low cost.
