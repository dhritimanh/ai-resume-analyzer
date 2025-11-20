# Rate Limit Handling - Implementation Guide

## Problem
Kimi API has a concurrency limit of 3 simultaneous requests per organization. When multiple analyses run at once or multiple users hit the API, you get:
```
rate_limit_reached_error: request reached max organization concurrency: 3
```

## Solution Implemented

### 1. Automatic Retry with Exponential Backoff
Created `lib/kimi-retry.ts` that wraps all API calls with intelligent retry logic:

- **Max retries**: 5 attempts
- **Initial delay**: 2 seconds
- **Backoff strategy**: Exponential (2s → 3s → 4.5s → 6.75s → 10s)
- **Total max wait**: ~26 seconds across all retries

### 2. User-Friendly Messaging

#### In QuickAnalysis (Sidebar)
- Shows yellow banner: "High demand detected. Retrying in X seconds..."
- Auto-retries up to 3 times with increasing delays (3s, 6s, 9s)
- If all retries fail: "Service is experiencing high demand. Please try again in a moment."
- User can manually retry with "Retry Analysis" button

#### In FullAnalysisDashboard (Full Analysis)
- Shows yellow banner at top: "High demand detected. The analysis will automatically retry in a few seconds..."
- Auto-retries after 3 seconds
- Seamless experience - user doesn't need to do anything

### 3. Server-Side Retry Logic
All analysis modules now use `retryWithBackoff()`:
- `quick-analysis.ts`
- `section-analysis.ts`
- `language-branding.ts`
- `career-tailoring.ts`
- `deep-insights.ts`

Each module logs retry attempts to console for debugging.

## How It Works

### Flow Diagram
```
User triggers analysis
    ↓
API call to Kimi
    ↓
Rate limit error? ──No──> Success! ✓
    ↓ Yes
Wait 2 seconds
    ↓
Retry (attempt 2)
    ↓
Rate limit error? ──No──> Success! ✓
    ↓ Yes
Wait 3 seconds
    ↓
Retry (attempt 3)
    ↓
... continues up to 5 attempts
    ↓
Final failure → Show error message
```

### Code Example
```typescript
// Before (would fail immediately)
const response = await axios.post(KIMI_API_URL, { ... });

// After (retries automatically)
const response = await retryWithBackoff(
  () => axios.post(KIMI_API_URL, { ... }),
  5,      // max retries
  2000,   // initial delay
  (attempt, delay) => {
    console.log(`Retrying in ${delay}ms (attempt ${attempt}/5)`);
  }
);
```

## Alternative Solutions (Not Implemented)

### Option 1: Multiple API Keys
**Pros:**
- Increases concurrency limit (3 per key × N keys = 3N concurrent requests)
- Simple to implement

**Cons:**
- Costs more money (need multiple Kimi accounts)
- Key rotation logic needed
- Still hits limits if you have many users

**Implementation:**
```typescript
const API_KEYS = [
  process.env.KIMI_API_KEY_1,
  process.env.KIMI_API_KEY_2,
  process.env.KIMI_API_KEY_3,
];

let currentKeyIndex = 0;

function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}
```

### Option 2: Request Queue
**Pros:**
- Guarantees no rate limit errors
- Fair ordering (FIFO)

**Cons:**
- More complex implementation
- Slower for users (must wait in queue)
- Requires state management (Redis/database)

**Implementation:**
```typescript
// Would need a queue system like Bull or BullMQ
import Queue from 'bull';

const analysisQueue = new Queue('resume-analysis', {
  redis: { host: 'localhost', port: 6379 }
});

// Limit to 3 concurrent jobs
analysisQueue.process(3, async (job) => {
  return await runAnalysis(job.data.resumeContent);
});
```

### Option 3: Upgrade Kimi Plan
**Pros:**
- Simplest solution
- Higher concurrency limits

**Cons:**
- Costs more money
- May still hit limits with growth

## Current Implementation Benefits

✅ **No additional cost** - Uses existing API key
✅ **Transparent to users** - Auto-retries in background
✅ **Graceful degradation** - Shows friendly messages if retries fail
✅ **Simple to maintain** - Single retry utility function
✅ **Works immediately** - No infrastructure changes needed

## Monitoring & Debugging

### Check Logs
All retry attempts are logged to console:
```
Quick Analysis: Rate limit hit, retrying in 2000ms (attempt 1/5)
Section Analysis: Rate limit hit, retrying in 3000ms (attempt 2/5)
```

### User Experience
- Users see loading spinner during retries
- Yellow banner shows retry status
- Total wait time: Usually 2-6 seconds for success
- Max wait time: ~26 seconds before giving up

## When to Consider Alternatives

Consider multiple API keys or queue system if:
- You have >10 concurrent users regularly
- Retry delays are too long for user experience
- You're hitting rate limits even with retries
- You need guaranteed response times

For now, the retry approach should handle most cases gracefully without additional infrastructure.

## Testing

To test rate limit handling:
1. Upload 3+ resumes simultaneously in different tabs
2. Click "Analyze" on all of them at once
3. You should see:
   - Some analyses complete immediately
   - Others show "High demand detected" message
   - All eventually complete successfully (within ~10 seconds)

## Future Enhancements

- [ ] Add analytics to track retry frequency
- [ ] Implement request queue if retry approach becomes insufficient
- [ ] Add user notification: "X people ahead of you in queue"
- [ ] Cache analysis results to avoid re-running for same resume
- [ ] Implement progressive analysis (show partial results while waiting)
