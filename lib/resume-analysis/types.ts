// Analysis Types for Resume Intelligence

export interface QuickAnalysis {
  overview: {
    strengths: Array<{
      category: 'Content' | 'Language' | 'Formatting' | 'Impact';
      text: string;
      section: string;
    }>;
    weaknesses: Array<{
      category: 'Content' | 'Language' | 'Formatting' | 'Impact';
      text: string;
      section: string;
    }>;
    metrics: {
      overallScore: number;
      atsScore: number;
      clarityScore: number;
      impactScore: number;
      atsSubScores: {
        keywordScore: number;
        formattingScore: number;
        structureScore: number;
        quantificationScore: number;
      };
      change: number;
      strengths: number;
      improve: number;
    };
    atsDetails: {
      score: number;
      feedback: {
        keyword_optimization: string;
        formatting: string;
        structure: string;
        quantification: string;
      };
      suggestions: Array<{
        category: string;
        text: string;
      }>;
      keyword_frequency: number;
      missing_keywords: string[];
      ats_confidence_score: number;
      section_count: number;
      quantified_items: number;
    };
    previousScore: number | null;
    quickWins: Array<{
      text: string;
      section: string;
      impact_level: number;
      job_target: string;
    }>;
    inferredJobTarget: string;
  };
  skills: Array<{
    name: string;
    category: 'Technical' | 'Soft' | 'Tools' | 'Languages';
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    evidence: string;
  }>;
  achievements: Array<{
    description: string;
    section: string;
    impact: string;
    metrics: string | null;
  }>;
  projects: Array<{
    name: string;
    description: string;
    role: string;
    technologies: string[];
    outcome: string;
  }> | null;
  papers: Array<{
    title: string;
    venue: string;
    year: number;
    summary: string;
  }> | null;
  additional_sections: Array<{
    name: string;
    content: string;
    insights: string;
  }>;
}

export interface SectionAnalysis {
  sectionAnalysis: Array<{
    name: string;
    feedback: {
      content_relevance: string;
      structure_clarity: string;
      impact_assessment: string;
      branding_potential: string;
    };
    suggestions: Array<{
      type: string;
      text: string;
      priority: 'High' | 'Medium' | 'Low';
      impact_level: number;
      example: string;
    }>;
    metrics: {
      word_count: number;
      avg_sentence_length: number;
      keyword_density: number;
      keyword_context_relevance: number;
      readability_score: number;
      sentiment_score: number;
      quantification_ratio: number;
      sentence_complexity: number;
      passive_voice_ratio: number;
      skill_categories: {
        'Technical Skills': number;
        'Soft Skills': number;
        Tools: number;
        Languages: number;
      };
    };
    tone: string;
    jobTargetRelevance: string;
  }>;
  formattingAnalysis: {
    metrics: {
      font_consistency_score: number;
      whitespace_usage_score: number;
      visual_hierarchy_score: number;
      readability_formatting_score: number;
    };
    feedback: string;
    suggestions: string[];
    atsCompatibility: string;
  };
  quantificationAnalysis: {
    metrics: {
      quantification_impact_score: number;
      quantification_clarity_score: number;
    };
    feedback: string;
    suggestions: string[];
    examples: string[];
  };
}

export interface LanguageBrandingAnalysis {
  languageAnalysis: {
    grammar_issues: {
      total: number;
      by_type: {
        'Subject-Verb': number;
        Tense: number;
        Punctuation: number;
      };
    };
    word_count: number;
    avg_sentence_length: number;
    unique_word_count: number;
    vocabulary_richness: {
      score: number;
      max: 100;
      reason: string;
    };
    vocabulary_level_appropriateness: {
      score: number;
      max: 100;
      reason: string;
    };
    action_verb_usage: {
      total_percentage: number;
      by_strength: {
        weak: number;
        medium: number;
        strong: number;
      };
      examples: Array<{
        verb: string;
        strength: 'weak' | 'medium' | 'strong';
        context: string;
      }>;
    };
    tone: {
      primary_tone: string;
      score: number;
      max: 100;
      reason: string;
    };
    suggestions: string[];
  };
  personalBrandingAnalysis: {
    metrics: {
      brand_clarity_score: {
        score: number;
        max: 100;
        reason: string;
      };
      brand_consistency_score: {
        score: number;
        max: 100;
        reason: string;
      };
      brand_uniqueness_score: {
        score: number;
        max: 100;
        reason: string;
      };
      visual_branding: {
        score: number;
        max: 100;
        reason: string;
      };
    };
    feedback: string;
    suggestions: string[];
  };
}

export interface CareerTailoringAnalysis {
  careerRoadmap: {
    target_roles: Array<{
      role_name: string;
      timeframe: string;
      description: string;
      justification: string;
      priority: number;
      career_path: string[];
      metrics: {
        skill_match_percentage: number;
        experience_relevance_score: number;
        growth_potential_score: number;
      };
      gaps: {
        missing_skills: string[];
        missing_experience: string[];
        suggested_certifications: string[];
      };
      goals: Array<{
        title: string;
        status: 'not_started' | 'in_progress' | 'completed';
        category: string;
        completed: boolean;
        impact_score: number;
        deadline: string;
        priority: string;
      }>;
    }>;
    life_integration: string;
  };
  tailoringAnalysis: {
    job_target: string;
    metrics: {
      keyword_match_score: {
        score: number;
        max: 100;
        reason: string;
      };
      skill_alignment_score: {
        score: number;
        max: 100;
        reason: string;
      };
      experience_relevance_score: {
        score: number;
        max: 100;
        reason: string;
      };
    };
    feedback: string;
    suggestions: string[];
  };
}

export interface DeepInsightsAnalysis {
  psychologicalInsights: {
    workStylePreferences: {
      team_orientation: number;
      structure_preference: number;
      risk_tolerance: number;
      work_pace: number;
      feedback_style: string;
      decision_making: string;
    };
    communicationStyle: {
      primary_style: string;
      formality_level: number;
      detail_orientation: number;
      assertiveness: number;
    };
    motivationalDrivers: Array<{
      driver: string;
      evidence: string;
      strength: number;
    }>;
    learningStyle: {
      primary_style: string;
      learning_velocity: number;
      adaptability: number;
      knowledge_depth_vs_breadth: number;
    };
  };
  industryAnalysis: {
    industryAlignment: {
      primary_industry: string;
      secondary_industries: string[];
      industry_trajectory: string;
      industry_trends_alignment: {
        score: number;
        trends: string[];
        reason: string;
      };
    };
    competitivePosition: {
      industry_specific_skills_score: number;
      unique_selling_points: string[];
      experience_depth_score: number;
      industry_terminology_usage: number;
    };
    industrySpecificSuggestions: Array<{
      suggestion: string;
      impact: number;
      timeframe: string;
    }>;
  };
  culturalFitAssessment: {
    workValues: Array<{
      value: string;
      evidence: string;
      strength: number;
    }>;
    organizationTypeAlignment: {
      startup: number;
      mid_size: number;
      enterprise: number;
      non_profit: number;
      government: number;
    };
    leadershipStylePreference: string;
    culturalAdaptability: {
      score: number;
      reason: string;
    };
  };
  learningAndDevelopmentProfile: {
    formalEducationPattern: string;
    skillAcquisitionSpeed: number;
    continuousLearningIndicators: number;
    knowledgeGaps: Array<{
      area: string;
      criticality: number;
      suggested_resources: string[];
    }>;
    mentorshipPotential: {
      as_mentor: number;
      as_mentee: number;
    };
  };
  networkAnalysis: {
    collaborationPatterns: {
      cross_functional: number;
      leadership: number;
      individual_contribution: number;
      primary_mode: string;
    };
    industryConnectivity: number;
    networkDiversity: number;
    networkStrengths: string[];
    networkGrowthStrategies: Array<{
      strategy: string;
      impact: number;
      timeframe: string;
    }>;
  };
}
