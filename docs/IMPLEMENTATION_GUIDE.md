# Implementation Guide - Complete Database Integration

## Overview

This guide walks through implementing the complete database schema with:
- ✅ Resume storage (PDFs + extracted text)
- ✅ Per-tab analysis storage
- ✅ Payment tracking (Stripe integration)
- ✅ Session-based user tracking (no accounts yet)

---

## Phase 1: Database Setup (Day 1)

### 1.1 Create Tables in Supabase

```sql
-- Run these in Supabase SQL Editor

-- 1. Resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) NOT NULL,
  resume_hash VARCHAR(64) NOT NULL UNIQUE,
  pdf_url TEXT,
  pdf_size_bytes INT,
  file_name VARCHAR(255),
  extracted_text TEXT NOT NULL,
  extracted_json JSONB,
  inferred_job_target VARCHAR(200),
  inferred_industry VARCHAR(100),
  inferred_seniority VARCHAR(50),
  inferred_years_experience INT,
  processing_status VARCHAR(50) DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_analyzed_at TIMESTAMP
);

CREATE INDEX idx_resumes_session_id ON resumes(session_id);
CREATE INDEX idx_resumes_resume_hash ON resumes(resume_hash);
CREATE INDEX idx_resumes_created_at ON resumes(created_at);

-- 2. Analyses table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL,
  payment_id UUID,
  analysis_type VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  result JSONB NOT NULL,
  overall_score INT,
  ats_score INT,
  clarity_score INT,
  impact_score INT,
  processing_time_ms INT,
  token_count INT,
  api_cost_cents DECIMAL(10,4),
  status VARCHAR(50) DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analyses_resume_id ON analyses(resume_id);
CREATE INDEX idx_analyses_session_id ON analyses(session_id);
CREATE INDEX idx_analyses_payment_id ON analyses(payment_id);
CREATE INDEX idx_analyses_analysis_type ON analyses(analysis_type);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);

-- 3. Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) NOT NULL,
  resume_id UUID REFERENCES resumes(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  product_type VARCHAR(50) NOT NULL,
  product_description TEXT,
  analyses_included JSONB,
  metadata JSONB,
  refunded_at TIMESTAMP,
  refund_reason TEXT,
  refund_amount_cents INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_session_id ON payments(session_id);
CREATE INDEX idx_payments_resume_id ON payments(resume_id);
CREATE INDEX idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- 4. Sessions table
CREATE TABLE sessions (
  id VARCHAR(64) PRIMARY KEY,
  ip_hash VARCHAR(64),
  user_agent TEXT,
  free_analyses_count INT DEFAULT 0,
  paid_analyses_count INT DEFAULT 0,
  total_spent_cents INT DEFAULT 0,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_ip_hash ON sessions(ip_hash);
CREATE INDEX idx_sessions_first_seen ON sessions(first_seen_at);

-- 5. Analysis errors table
CREATE TABLE analysis_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64),
  resume_id UUID REFERENCES resumes(id),
  analysis_type VARCHAR(50),
  error_type VARCHAR(100),
  error_message TEXT,
  error_stack TEXT,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_errors_session_id ON analysis_errors(session_id);
CREATE INDEX idx_errors_resume_id ON analysis_errors(resume_id);
CREATE INDEX idx_errors_error_type ON analysis_errors(error_type);
CREATE INDEX idx_errors_created_at ON analysis_errors(created_at);
```

### 1.2 Set Up Supabase Storage

```typescript
// In Supabase Dashboard:
// 1. Go to Storage
// 2. Create bucket: "resumes"
// 3. Set policies:
//    - Allow authenticated uploads
//    - Allow public reads (or authenticated only)

// Storage path structure:
// resumes/{session_id}/{resume_hash}.pdf
```

### 1.3 Install Dependencies

```bash
npm install @supabase/supabase-js stripe
```

---

## Phase 2: Upload Flow (Day 2-3)

### 2.1 Create Upload Endpoint

```typescript
// /app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractTextFromPDF } from '@/lib/kimi-vision';
import { hashResume, generateSessionId, inferMetadata } from '@/lib/db/analytics';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Get or create session ID
    let sessionId = request.cookies.get('session_id')?.value;
    if (!sessionId) {
      sessionId = generateSessionId();
    }
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(file);
    const resumeHash = hashResume(extractedText);
    
    // Upload PDF to Supabase Storage
    const fileName = `${sessionId}/${resumeHash}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload PDF');
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);
    
    // Infer metadata
    const metadata = inferMetadata({ inferredJobTarget: 'Unknown' }); // Will be updated after analysis
    
    // Store resume in database
    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .insert({
        session_id: sessionId,
        resume_hash: resumeHash,
        pdf_url: publicUrl,
        pdf_size_bytes: file.size,
        file_name: file.name,
        extracted_text: extractedText,
        processing_status: 'completed',
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store resume');
    }
    
    // Set session cookie
    const response = NextResponse.json({
      resumeId: resume.id,
      resumeHash: resume.resume_hash,
      fileName: resume.file_name,
    });
    
    if (!request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }
    
    return response;
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload resume' },
      { status: 500 }
    );
  }
}
```

### 2.2 Update Frontend Upload Component

```typescript
// /components/ResumeUpload.tsx
'use client';

import { useState } from 'react';

export default function ResumeUpload() {
  const [uploading, setUploading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  
  async function handleUpload(file: File) {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setResumeId(data.resumeId);
      
      // Redirect to payment page
      window.location.href = `/payment?resumeId=${data.resumeId}`;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  }
  
  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

---

## Phase 3: Payment Flow (Day 4-5)

### 3.1 Create Payment Intent Endpoint

```typescript
// /app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { resumeId, productType } = await request.json();
    const sessionId = request.cookies.get('session_id')?.value;
    
    if (!sessionId || !resumeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Determine amount based on product type
    const amounts = {
      full_analysis: 500, // $5.00
      quick_analysis: 200, // $2.00
      jd_comparison: 150, // $1.50
    };
    
    const amount = amounts[productType as keyof typeof amounts] || 500;
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        resumeId,
        sessionId,
        productType,
      },
    });
    
    // Store payment in database
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        session_id: sessionId,
        resume_id: resumeId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: amount,
        currency: 'usd',
        status: 'pending',
        product_type: productType,
        analyses_included: productType === 'full_analysis' 
          ? ['quick_paid', 'section', 'language', 'career', 'insights']
          : ['quick_paid'],
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create payment record');
    }
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
```

### 3.2 Create Stripe Webhook Handler

```typescript
// /app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Handle payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Update payment status
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        stripe_charge_id: paymentIntent.latest_charge as string,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);
    
    if (error) {
      console.error('Failed to update payment:', error);
    }
    
    // TODO: Trigger analysis (can be done here or in separate endpoint)
    // await triggerAnalysis(paymentIntent.metadata.resumeId, paymentIntent.metadata.paymentId);
  }
  
  // Handle payment failure
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);
  }
  
  return NextResponse.json({ received: true });
}
```

---

## Phase 4: Analysis Flow (Day 6-7)

### 4.1 Update Analysis Endpoints

```typescript
// /app/api/analysis/quick/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runQuickAnalysis } from '@/lib/resume-analysis/quick-analysis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { resumeId, paymentId } = await request.json();
    const sessionId = request.cookies.get('session_id')?.value;
    
    // Get resume from database
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    
    // Run analysis
    const result = await runQuickAnalysis(resume.extracted_text);
    
    // Store analysis in database
    const { error: analysisError } = await supabase
      .from('analyses')
      .insert({
        resume_id: resumeId,
        session_id: sessionId,
        payment_id: paymentId,
        analysis_type: 'quick_paid',
        tier: 'paid',
        result: result,
        overall_score: result.scores.overall,
        ats_score: result.scores.ats,
        clarity_score: result.scores.clarity,
        impact_score: result.scores.impact,
        processing_time_ms: Date.now() - startTime,
        status: 'completed',
      });
    
    if (analysisError) {
      console.error('Failed to store analysis:', analysisError);
    }
    
    // Update resume with inferred job target
    if (result.inferredJobTarget) {
      await supabase
        .from('resumes')
        .update({
          inferred_job_target: result.inferredJobTarget,
          last_analyzed_at: new Date().toISOString(),
        })
        .eq('id', resumeId);
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    
    // Store error
    await supabase
      .from('analysis_errors')
      .insert({
        session_id: request.cookies.get('session_id')?.value,
        analysis_type: 'quick_paid',
        error_type: error.name || 'UnknownError',
        error_message: error.message,
      });
    
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

### 4.2 Repeat for All Analysis Types

Copy the pattern above for:
- `/api/analysis/section/route.ts`
- `/api/analysis/language/route.ts`
- `/api/analysis/career/route.ts`
- `/api/analysis/insights/route.ts`

Just change:
- `analysis_type` field
- Import the correct analysis function
- Extract the correct scores

---

## Phase 5: Retrieval (Day 8)

### 5.1 Get Resume with All Analyses

```typescript
// /app/api/resume/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;
    
    // Get resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    
    // Get all analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('analyses')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (analysesError) {
      console.error('Failed to get analyses:', analysesError);
    }
    
    // Group by type (latest for each)
    const latestAnalyses: any = {};
    analyses?.forEach((analysis) => {
      const type = analysis.analysis_type.replace('_paid', '').replace('_free', '');
      if (!latestAnalyses[type]) {
        latestAnalyses[type] = analysis.result;
      }
    });
    
    return NextResponse.json({
      resume: {
        id: resume.id,
        fileName: resume.file_name,
        jobTarget: resume.inferred_job_target,
        industry: resume.inferred_industry,
        createdAt: resume.created_at,
        pdfUrl: resume.pdf_url,
      },
      analyses: latestAnalyses,
    });
  } catch (error: any) {
    console.error('Retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get resume' },
      { status: 500 }
    );
  }
}
```

---

## Summary

### ✅ What You've Built
- Resume upload with PDF storage
- Payment processing with Stripe
- Per-tab analysis storage
- Session-based tracking
- Error logging

### ✅ API Endpoints
- `POST /api/upload` - Upload resume
- `POST /api/payment/create` - Create payment
- `POST /api/webhooks/stripe` - Handle payment events
- `POST /api/analysis/quick` - Run quick analysis
- `POST /api/analysis/section` - Run section analysis
- `POST /api/analysis/language` - Run language analysis
- `POST /api/analysis/career` - Run career analysis
- `POST /api/analysis/insights` - Run insights analysis
- `GET /api/resume/[id]` - Get resume with all analyses

### ✅ Database Tables
- `resumes` - Resume storage
- `analyses` - Per-tab analysis results
- `payments` - Payment tracking
- `sessions` - User tracking
- `analysis_errors` - Error logging

**Total implementation time: ~8 days** 🚀
