# Rate Limit Monitoring & Detection

## Overview

Kimi API provides rate limit information in response headers. We now extract and log this information for monitoring and debugging.

## Rate Limit Headers

Kimi API returns these headers (standard format):

```
x-ratelimit-limit: 1000          # Total requests allowed per period
x-ratelimit-remaining: 847       # Requests remaining in current period
x-ratelimit-reset: 1699564800    # Unix timestamp when limit resets
```

Alternative header names (also supported):
```
ratelimit-limit
ratelimit-remaining
ratelimit-reset
```

## Implementation

### Functions Added

**1. `extractRateLimitInfo(error)`**
- Extracts rate limit data from error response
- Returns `RateLimitInfo` object with limit, remaining, reset

**2. `getRateLimitDetails(error)`**
- Returns human-readable rate limit message
- Example: "Rate limit reached. Remaining: 0/1000. Resets in 45s"

**3. `isApproachingRateLimit(response)`**
- Checks if we're close to hitting limit (< 10% remaining)
- Useful for proactive warnings

**4. `logRateLimitInfo(response, context)`**
- Logs rate limit info to console
- Called on successful API responses
- Helps monitor usage patterns

### Console Output

**Successful Call:**
```
[Kimi Vision] Rate Limit: 847/1000 remaining
[Kimi Vision] Resets at: 3:45:00 PM
```

**Rate Limit Error:**
```
Rate limit error: Rate limit reached. Remaining: 0/1000. Resets in 45s
Kimi Vision: Rate limit or error, retrying in 2000ms (attempt 1/5)
```

**After Retry:**
```
[Success] Rate Limit: 999/1000 remaining
```

## Usage in Code

### Automatic Logging

Rate limit info is automatically logged:
- On successful API calls (Kimi Vision, Analysis)
- On rate limit errors (with details)
- During retry attempts

### Manual Checking

```typescript
import { extractRateLimitInfo, isApproachingRateLimit } from '@/lib/kimi-retry';

// After API call
const rateLimitInfo = extractRateLimitInfo(error);
console.log(`Remaining: ${rateLimitInfo.remaining}`);

// Check if approaching limit
if (isApproachingRateLimit(response)) {
  console.warn('Approaching rate limit!');
}
```

## Rate Limit Types

### 1. Request Rate Limit
- **Limit**: Requests per minute/hour
- **Error**: `rate_limit_reached_error`
- **Status**: 429
- **Solution**: Wait and retry

### 2. Concurrency Limit
- **Limit**: Simultaneous requests (usually 3)
- **Error**: `max organization concurrency: 3`
- **Status**: 429
- **Solution**: Wait for other requests to complete

### 3. Token Rate Limit
- **Limit**: Tokens per minute
- **Error**: `token_rate_limit_reached`
- **Status**: 429
- **Solution**: Wait or reduce token usage

## Monitoring Strategy

### Development
- Console logs show rate limit info
- Monitor remaining requests
- Adjust usage patterns if needed

### Production
- Log rate limit info to monitoring service
- Set up alerts for approaching limits
- Track usage patterns over time

### Metrics to Track
- Requests per hour
- Average remaining requests
- Rate limit errors per day
- Retry success rate

## Optimization Tips

### 1. Batch Requests
- Combine multiple operations when possible
- Example: Multi-page PDF in one request (already implemented)

### 2. Cache Results
- Store analysis results
- Don't re-analyze same resume
- Use client-side caching

### 3. Lazy Loading
- Only run analysis when user clicks tab (already implemented)
- Don't run all analyses upfront

### 4. Multiple API Keys
- Rotate between keys if needed
- Increases effective rate limit
- More complex to manage

## Current Limits (Estimated)

Based on typical Kimi API limits:
- **Requests**: ~1000 per hour
- **Concurrency**: 3 simultaneous requests
- **Tokens**: ~100k per minute

**Our Usage:**
- Resume extraction: ~1 request, ~2k tokens
- Quick analysis: ~1 request, ~2k tokens
- Full analysis (5 buckets): ~5 requests, ~15k tokens

**Capacity:**
- ~1000 resume uploads per hour
- ~200 full analyses per hour
- More than enough for current scale

## Error Messages

### User-Facing
```
High demand detected. Retrying automatically...
(Usually succeeds within 2-6 seconds)
```

### Developer Console
```
Rate limit error: Rate limit reached. Remaining: 0/1000. Resets in 45s
[Kimi Vision] Rate limit or error, retrying in 2000ms (attempt 1/5)
```

## Future Enhancements

### Proactive Warnings
- [ ] Show warning when approaching limit
- [ ] Suggest waiting before next upload
- [ ] Display "X requests remaining" to user

### Advanced Monitoring
- [ ] Send rate limit data to analytics
- [ ] Track usage patterns by time of day
- [ ] Alert when consistently hitting limits

### Load Balancing
- [ ] Implement request queue
- [ ] Distribute load across multiple keys
- [ ] Prioritize paid users

## Testing

### Simulate Rate Limit
```typescript
// Make many requests quickly
for (let i = 0; i < 100; i++) {
  await analyzeResume(content);
}
// Should see rate limit errors and automatic retries
```

### Check Logs
```
[Kimi Vision] Rate Limit: 900/1000 remaining
[Kimi Vision] Rate Limit: 850/1000 remaining
[Kimi Vision] Rate Limit: 800/1000 remaining
...
Rate limit error: Rate limit reached. Remaining: 0/1000. Resets in 60s
```

## Documentation

- `RATE_LIMIT_MONITORING.md` - This file
- `RATE_LIMIT_HANDLING.md` - Retry logic documentation
- `lib/kimi-retry.ts` - Implementation

---

**Status**: ✅ Implemented and logging
**Visibility**: Console logs (development)
**Next**: Add production monitoring
