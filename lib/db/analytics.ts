// Database Helper Functions - Complete Schema
// Functions for resume storage, analysis tracking, and payment processing

import { createHash } from 'crypto';

// Types
export interface ResumeRecord {
  session_id: string;
  resume_hash: string;
  pdf_url?: string;
  pdf_size_bytes?: number;
  file_name?: string;
  extracted_text: string;
  extracted_json?: any;
  inferred_job_target?: string;
  inferred_industry?: string;
  inferred_seniority?: string;
  processing_status: 'processing' | 'completed' | 'failed';
}

export interface AnalysisRecord {
  resume_id: string;
  session_id: string;
  payment_id?: string;
  analysis_type: 'quick_free' | 'quick_paid' | 'section' | 'language' | 'career' | 'insights';
  tier: 'free' | 'paid';
  result: any; // Full JSON result
  overall_score?: number;
  ats_score?: number;
  clarity_score?: number;
  impact_score?: number;
  processing_time_ms: number;
  token_count?: number;
  api_cost_cents?: number;
  status: 'processing' | 'completed' | 'failed';
}

export interface PaymentRecord {
  session_id: string;
  resume_id: string;
  stripe_payment_intent_id: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  product_type: 'full_analysis' | 'quick_analysis' | 'jd_comparison' | 'section_analysis';
  product_description?: string;
  analyses_included?: string[];
}

export interface ErrorRecord {
  session_id: string;
  analysis_type: string;
  error_type: string;
  error_message: string;
  resume_hash: string;
}

// Utility functions
export function hashResume(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function hashIP(ip: string | undefined): string {
  if (!ip) return 'unknown';
  return createHash('sha256').update(ip + process.env.IP_SALT).digest('hex');
}

export function generateSessionId(): string {
  return createHash('sha256')
    .update(Date.now().toString() + Math.random().toString())
    .digest('hex')
    .slice(0, 32);
}

// Infer metadata from analysis results
export function inferMetadata(result: any): {
  job_target?: string;
  industry?: string;
  seniority?: string;
  years_experience?: number;
} {
  const jobTarget = result.inferredJobTarget || result.overview?.inferredJobTarget;
  
  // Extract seniority from job target
  let seniority: string | undefined;
  if (jobTarget) {
    if (jobTarget.toLowerCase().includes('senior') || jobTarget.toLowerCase().includes('lead')) {
      seniority = 'Senior';
    } else if (jobTarget.toLowerCase().includes('junior') || jobTarget.toLowerCase().includes('entry')) {
      seniority = 'Entry';
    } else if (jobTarget.toLowerCase().includes('director') || jobTarget.toLowerCase().includes('vp')) {
      seniority = 'Executive';
    } else {
      seniority = 'Mid';
    }
  }
  
  // Extract industry from job target (simple heuristics)
  let industry: string | undefined;
  if (jobTarget) {
    const lower = jobTarget.toLowerCase();
    if (lower.includes('software') || lower.includes('engineer') || lower.includes('developer')) {
      industry = 'Technology';
    } else if (lower.includes('product') || lower.includes('pm')) {
      industry = 'Product Management';
    } else if (lower.includes('data') || lower.includes('analyst')) {
      industry = 'Data & Analytics';
    } else if (lower.includes('marketing')) {
      industry = 'Marketing';
    } else if (lower.includes('sales')) {
      industry = 'Sales';
    } else if (lower.includes('design')) {
      industry = 'Design';
    }
  }
  
  return {
    job_target: jobTarget,
    industry,
    seniority,
    years_experience: undefined, // TODO: Extract from resume content
  };
}

// Store resume (implement with your DB client)
export async function storeResume(record: ResumeRecord) {
  // TODO: Implement with Supabase/PostgreSQL
  // Example:
  // const { data, error } = await supabase
  //   .from('resumes')
  //   .insert(record)
  //   .select()
  //   .single();
  
  console.log('[DB] Storing resume:', {
    session_id: record.session_id,
    resume_hash: record.resume_hash,
    file_name: record.file_name,
    status: record.processing_status,
  });
  
  // For now, return mock ID (implement DB later)
  return { id: 'mock-resume-id', success: true };
}

// Store analysis result (implement with your DB client)
export async function storeAnalysis(record: AnalysisRecord) {
  // TODO: Implement with Supabase/PostgreSQL
  // Example:
  // const { data, error } = await supabase
  //   .from('analyses')
  //   .insert(record)
  //   .select()
  //   .single();
  
  console.log('[DB] Storing analysis:', {
    resume_id: record.resume_id,
    type: record.analysis_type,
    tier: record.tier,
    payment_id: record.payment_id,
    scores: {
      overall: record.overall_score,
      ats: record.ats_score,
    },
  });
  
  // For now, return mock ID (implement DB later)
  return { id: 'mock-analysis-id', success: true };
}

// Store payment (implement with your DB client)
export async function storePayment(record: PaymentRecord) {
  // TODO: Implement with Supabase/PostgreSQL
  // Example:
  // const { data, error } = await supabase
  //   .from('payments')
  //   .insert(record)
  //   .select()
  //   .single();
  
  console.log('[DB] Storing payment:', {
    session_id: record.session_id,
    resume_id: record.resume_id,
    amount: record.amount_cents / 100,
    status: record.status,
    product_type: record.product_type,
  });
  
  // For now, return mock ID (implement DB later)
  return { id: 'mock-payment-id', success: true };
}

// Get resume by ID
export async function getResume(resumeId: string) {
  // TODO: Implement with Supabase/PostgreSQL
  // Example:
  // const { data, error } = await supabase
  //   .from('resumes')
  //   .select('*')
  //   .eq('id', resumeId)
  //   .single();
  
  console.log('[DB] Getting resume:', resumeId);
  return null;
}

// Get all analyses for a resume
export async function getAnalyses(resumeId: string) {
  // TODO: Implement with Supabase/PostgreSQL
  // Example:
  // const { data, error } = await supabase
  //   .from('analyses')
  //   .select('*')
  //   .eq('resume_id', resumeId)
  //   .eq('status', 'completed')
  //   .order('created_at', { ascending: false });
  
  console.log('[DB] Getting analyses for resume:', resumeId);
  return [];
}

// Store error (implement with your DB client)
export async function storeError(record: ErrorRecord) {
  // TODO: Implement with Supabase/PostgreSQL
  
  console.error('[Analytics] Storing error:', {
    type: record.analysis_type,
    error: record.error_type,
    message: record.error_message,
  });
  
  return { success: true };
}

// Example usage in API routes:

/*
// ============================================================================
// 1. UPLOAD RESUME
// ============================================================================
import { storeResume, hashResume, generateSessionId, inferMetadata } from '@/lib/db/analytics';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Get or create session ID
  const sessionId = request.cookies.get('session_id')?.value || generateSessionId();
  
  // Extract text with vision API
  const extractedText = await extractTextFromPDF(file);
  const resumeHash = hashResume(extractedText);
  
  // Upload PDF to storage
  const pdfUrl = await uploadToStorage(file, sessionId, resumeHash);
  
  // Store resume in database
  const resume = await storeResume({
    session_id: sessionId,
    resume_hash: resumeHash,
    pdf_url: pdfUrl,
    pdf_size_bytes: file.size,
    file_name: file.name,
    extracted_text: extractedText,
    processing_status: 'completed',
  });
  
  return NextResponse.json({ resumeId: resume.id, resumeHash });
}

// ============================================================================
// 2. CREATE PAYMENT
// ============================================================================
import { storePayment } from '@/lib/db/analytics';

export async function POST(request: NextRequest) {
  const { resumeId, productType } = await request.json();
  const sessionId = request.cookies.get('session_id')?.value;
  
  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 500, // $5.00
    currency: 'usd',
    metadata: { resumeId, sessionId, productType },
  });
  
  // Store payment in database
  const payment = await storePayment({
    session_id: sessionId,
    resume_id: resumeId,
    stripe_payment_intent_id: paymentIntent.id,
    amount_cents: 500,
    currency: 'usd',
    status: 'pending',
    product_type: productType,
    analyses_included: ['quick_paid', 'section', 'language', 'career', 'insights'],
  });
  
  return NextResponse.json({ 
    clientSecret: paymentIntent.client_secret, 
    paymentId: payment.id 
  });
}

// ============================================================================
// 3. RUN ANALYSIS (After Payment Success)
// ============================================================================
import { storeAnalysis, getResume, inferMetadata } from '@/lib/db/analytics';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const { resumeId, paymentId } = await request.json();
  const sessionId = request.cookies.get('session_id')?.value;
  
  // Get resume from database
  const resume = await getResume(resumeId);
  
  try {
    // Run analysis
    const result = await runQuickAnalysis(resume.extracted_text);
    
    // Store analysis in database
    await storeAnalysis({
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
    
    return NextResponse.json(result);
  } catch (error: any) {
    await storeError({
      session_id: sessionId,
      analysis_type: 'quick_paid',
      error_type: error.name || 'UnknownError',
      error_message: error.message,
      resume_hash: resume.resume_hash,
    });
    
    throw error;
  }
}

// ============================================================================
// 4. GET RESUME WITH ALL ANALYSES
// ============================================================================
import { getResume, getAnalyses } from '@/lib/db/analytics';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const resumeId = params.id;
  
  // Get resume and all analyses
  const resume = await getResume(resumeId);
  const analyses = await getAnalyses(resumeId);
  
  // Group analyses by type (latest for each)
  const latestAnalyses = {
    quick: analyses.find(a => a.analysis_type === 'quick_paid')?.result,
    section: analyses.find(a => a.analysis_type === 'section')?.result,
    language: analyses.find(a => a.analysis_type === 'language')?.result,
    career: analyses.find(a => a.analysis_type === 'career')?.result,
    insights: analyses.find(a => a.analysis_type === 'insights')?.result,
  };
  
  return NextResponse.json({
    resume: {
      id: resume.id,
      fileName: resume.file_name,
      jobTarget: resume.inferred_job_target,
      createdAt: resume.created_at,
    },
    analyses: latestAnalyses,
  });
}
*/
