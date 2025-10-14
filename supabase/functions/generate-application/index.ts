import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== VALIDATOR FUNCTION =====
interface ValidationResult {
  ok: boolean;
  violations: string[];
  words: number;
  dateOk: boolean;
}

function validateLetter(letter: string, formattedDate?: string, jobTitle?: string): ValidationResult {
  // Forbidden phrases regex patterns
  const bannedPatterns = [
    /in meiner bisherigen (tätigkeit|position|rolle)/i,
    /in meiner (damaligen|früheren|vorherigen) (tätigkeit|position|rolle)/i,
    /in meinem letzten job/i,
    /während meiner zeit/i,
    /(umfangreiche|vielfältige|langjährige) erfahrungen?/i,
    /(gute|ausgeprägte|fundierte|solide) kenntnisse/i,
    /kommunikative fähigkeiten/i,
    /soziale kompetenzen/i,
    /konnte ich (sammeln|lernen|entwickeln|erwerben)/i,
    /habe ich (gelernt|entwickelt|erworben|gesammelt)/i,
    /(edv|it|computer)-kenntnisse/i,
  ];

  const violations: string[] = [];
  for (const pattern of bannedPatterns) {
    const match = letter.match(pattern);
    if (match) {
      violations.push(match[0]);
    }
  }
  
  // Check for irrelevant technical skills in non-technical jobs
  if (jobTitle) {
    const isNonTechnicalJob = /sales|vertrieb|verkauf|kundenservice|kundenbetreuer|berater|beratung|hr|personal|marketing|office|verwaltung|management/i.test(jobTitle);
    
    if (isNonTechnicalJob) {
      const technicalKeywords = [
        /\bJavaScript\b/gi,
        /\bTypeScript\b/gi,
        /\bNode\.js\b/gi,
        /\bReact\b/gi,
        /\bVue\.js\b/gi,
        /\bAngular\b/gi,
        /\bPython\b/gi,
        /\bJava\b/gi,
        /\bC\+\+\b/gi,
        /\bPHP\b/gi,
        /\bHTML\b/gi,
        /\bCSS\b/gi,
        /\bSQL\b/gi,
        /\bMongoDB\b/gi,
        /\bDocker\b/gi,
        /\bKubernetes\b/gi,
        /\bGit\b/gi,
        /\bAPI[s]?\b/gi,
        /\bFullstack[- ]?Entwickler/gi,
        /\bApp[- ]?Entwickler/gi,
        /\bWebentwicklung/gi,
        /\bSoftwareentwicklung/gi,
      ];
      
      for (const keyword of technicalKeywords) {
        const match = letter.match(keyword);
        if (match) {
          violations.push(`IRRELEVANT: ${match[0]} (nicht relevant für ${jobTitle})`);
        }
      }
    }
  }

  const words = letter.trim().split(/\s+/).length;
  const lengthOk = words >= 350 && words <= 450;
  const dateOk = formattedDate ? letter.includes(formattedDate) : true;
  const hasContent = letter.trim().length > 0;

  return {
    ok: hasContent && violations.length === 0 && lengthOk && dateOk,
    violations,
    words,
    dateOk
  };
}

const GERMAN_STOP_WORDS = new Set([
  'und','oder','aber','auch','sowie','der','die','das','den','dem','ein','eine','einer','eines','einem','mit','auf','für','von','im','in','am','an','des','durch','unter','über','ohne','gegen','aus','bis','sind','ist','sowie','zu','zur','zum','bei','als','nach','vor','sich','werden','wird','etc','etc.'
]);

const SKILL_LEVEL_PRIORITY: Record<string, number> = {
  expert: 3,
  experte: 3,
  advanced: 2,
  fortgeschritten: 2,
  intermediate: 2,
  professional: 2,
  basic: 1,
  beginner: 1,
  anfänger: 1
};

function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9äöüß+]+/gi, '')
    .trim();
}

/// <reference lib="deno.ns" />

const CATEGORY_HINTS = {
  technical: {
    keywords: [
      'informatik','software','entwickl','developer','engineer','programmier','frontend','backend','fullstack','devops','cloud','ki','ai','ml','data','it','tech','technologie','applikation','applikations','app','code','coding','programmiersprache','react','node','typescript','javascript','python','c++','c#','java','golang','rust','docker','kubernetes','sql','datenbank','microservice','api','scrum','agil','agile'
    ],
    prompt: 'Dies ist eine TECHNISCHE Stelle. Betone Software-/IT-Kompetenzen, Informatikkenntnisse, Programmiererfahrung und relevante Projekte. Vermeide betriebswirtschaftliche oder reine Vertriebsinhalte.'
  },
  sales: {
    keywords: [
      'verkauf','sales','vertrieb','kunden','akquise','kaltakquise','kundenservice','kundenbetreuung','bestandskunden','neukund','crm','vertragsabschluss','vertriebsexperte','umsatz','absatz','lead','verkaufsgespräch'
    ],
    prompt: 'Dies ist eine SALES/VERTRIEBS Stelle. Betone Kundenbetreuung, Akquise, Verhandlungserfolge, CRM-Tools und Umsatzzahlen. Vermeide technische Details zu Software- oder Entwicklungs-Stacks.'
  },
  marketing: {
    keywords: [
      'marketing','kampagne','campaign','seo','sem','content','social media','branding','kommunikation','kommunikations','werbung','performance','analytics','marke','marktforschung','copywriting'
    ],
    prompt: 'Dies ist eine MARKETING Stelle. Betone Kampagnen, Content-Erstellung, Kommunikationsstrategien, KPIs, Reichweiten- und Performance-Steigerung. Vermeide tiefe technische oder sales-spezifische Details.'
  },
  hr: {
    keywords: [
      'hr','personal','human resources','recruiting','talent','bewerber','arbeitnehmer','onboarding','mitarbeiterentwicklung','personalentwicklung','arbeitsrecht','personalverwaltung','schulung','weiterbildung'
    ],
    prompt: 'Dies ist eine HR/PERSONAL Stelle. Betone Recruiting, Onboarding, Personalentwicklung, Arbeitsrecht, Bewerbermanagement und Mitarbeiterbetreuung. Vermeide technische Stack-Beschreibungen sowie vertriebsorientierte Inhalte.'
  },
  finance: {
    keywords: [
      'finance','finanz','controlling','buchhaltung','steuer','accounting','bilanz','kreditor','debitor','kostenrechnung','budget','financial','audit','steuerung','ergebnis','cashflow'
    ],
    prompt: 'Dies ist eine FINANZ-/CONTROLLING Stelle. Betone Zahlen, Budgetkontrolle, Bilanzierung, Reporting, Forecasting und finanzielle Analysen. Vermeide kreative Marketing- oder technische Entwicklerdetails.'
  },
  operations: {
    keywords: [
      'operations','betrieb','logistik','supply chain','prozess','prozesse','produktion','fertigung','qualität','qualitätssicherung','wartung','disposition','planung','dienstleistung','service','facility'
    ],
    prompt: 'Dies ist eine OPERATIONS/LOGISTIK/PRODUKTIONS Stelle. Betone Prozessoptimierung, Effizienz, Qualitätssicherung, Planung und operative Steuerung. Vermeide irrelevante Software-Stacks oder reine Vertriebskennzahlen.'
  }
} as const;

type JobCategory = keyof typeof CATEGORY_HINTS;

function detectJobCategories(jobData: any): JobCategory[] {
  const textSources = [jobData?.jobtitel, jobData?.beschreibung, ...(Array.isArray(jobData?.anforderungen) ? jobData.anforderungen : [])]
    .filter(Boolean)
    .join(' ') || '';
  const normalized = textSources.toLowerCase();

  const categories: JobCategory[] = [];
  (Object.keys(CATEGORY_HINTS) as JobCategory[]).forEach((category) => {
    const { keywords } = CATEGORY_HINTS[category];
    if (keywords.some((hint) => normalized.includes(hint))) {
      categories.push(category);
    }
  });

  if (categories.length === 0) {
    // Fallback heuristic: technical if job title contains "developer" or similar
    const fallbackTechnical = /developer|entwickler|engineer/i.test(textSources);
    const fallbackSales = /sales|vertrieb|verkauf/i.test(textSources);
    if (fallbackTechnical) categories.push('technical');
    if (fallbackSales) categories.push('sales');
  }

  return categories;
}

function extractJobKeywords(jobData: any): Set<string> {
  const sources: string[] = [];
  if (jobData?.jobtitel) sources.push(jobData.jobtitel);
  if (jobData?.beschreibung) sources.push(jobData.beschreibung);
  if (Array.isArray(jobData?.anforderungen)) {
    sources.push(...jobData.anforderungen);
  }
  if (Array.isArray(jobData?.tags)) {
    sources.push(...jobData.tags);
  }

  const tokens = new Set<string>();
  for (const source of sources) {
    const words = String(source)
      .toLowerCase()
      .split(/[^a-z0-9äöüß+]+/i)
      .filter(Boolean);
    for (const word of words) {
      const normalized = normalizeToken(word);
      if (normalized.length >= 3 && !GERMAN_STOP_WORDS.has(normalized)) {
        tokens.add(normalized);
      }
    }
  }

  return tokens;
}

function hasAnyHint(text: string, hints: string[]): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return hints.some((hint) => normalized.includes(hint));
}

function filterSkillsByJob(
  skills: any[],
  jobKeywords: Set<string>,
  options: { limit?: number; categories?: JobCategory[] } = {}
): any[] {
  if (!Array.isArray(skills) || skills.length === 0) return [];

  const { limit = 12, categories = [] } = options;
  const categoryHints = categories.flatMap((category) => CATEGORY_HINTS[category]?.keywords || []);
  const keywordArray = Array.from(jobKeywords);

  const scoredSkills = skills
    .map((skill) => {
      const rawName = typeof skill?.name === 'string' ? skill.name.trim() : '';
      if (!rawName) {
        return null;
      }

      const nameTokens = rawName
        .toLowerCase()
        .replace(/[/(),]/g, ' ')
        .split(/\s+/)
        .map(normalizeToken)
        .filter(Boolean);

      let score = 0;
      for (const token of nameTokens) {
        if (!token) continue;
        if (jobKeywords.has(token)) {
          score += 2;
          continue;
        }
        if (keywordArray.some((keyword) => keyword.includes(token) || token.includes(keyword))) {
          score += 1;
        }
      }

      if (score === 0) {
        return null;
      }

      const level = typeof skill?.level === 'string' ? skill.level.toLowerCase() : '';
      const levelScore = SKILL_LEVEL_PRIORITY[level] || 0;

      return {
        skill,
        score,
        levelScore
      };
    })
    .filter((entry): entry is { skill: any; score: number; levelScore: number } => entry !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.levelScore !== a.levelScore) return b.levelScore - a.levelScore;
      return (a.skill.name || '').localeCompare(b.skill.name || '');
    });

  let filteredSkills = scoredSkills;

  if (categoryHints.length > 0) {
    const categoryFiltered = filteredSkills.filter((entry) => hasAnyHint(entry.skill?.name || '', categoryHints));
    if (categoryFiltered.length > 0) {
      filteredSkills = categoryFiltered;
    }
  }

  return filteredSkills.slice(0, limit).map((entry) => entry.skill);
}

function scoreTextAgainstKeywords(text: string, jobKeywords: Set<string>, keywordArray: string[]): number {
  const tokens = String(text)
    .toLowerCase()
    .replace(/[/(),]/g, ' ')
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    if (jobKeywords.has(token)) {
      score += 2;
      continue;
    }
    if (keywordArray.some((keyword) => keyword.includes(token) || token.includes(keyword))) {
      score += 1;
    }
  }
  return score;
}

function filterExperiencesByJob(
  experiences: any[],
  jobKeywords: Set<string>,
  options: { limit?: number; categories?: JobCategory[] } = {}
): any[] {
  if (!Array.isArray(experiences) || experiences.length === 0) return [];

  const { limit = 4, categories = [] } = options;
  const categoryHints = categories.flatMap((category) => CATEGORY_HINTS[category]?.keywords || []);
  const keywordArray = Array.from(jobKeywords);

  const scoredExperiences = experiences
    .map((experience) => {
      if (!experience) return null;
      const positionScore = scoreTextAgainstKeywords(experience.position || '', jobKeywords, keywordArray);
      const descriptionScore = scoreTextAgainstKeywords(experience.description || '', jobKeywords, keywordArray);
      const companyScore = scoreTextAgainstKeywords(experience.company || '', jobKeywords, keywordArray);

      const totalScore = positionScore * 2 + descriptionScore + companyScore;

      if (totalScore === 0) {
        return null;
      }

      const startDate = experience.startDate ? new Date(experience.startDate) : null;

      return {
        experience,
        score: totalScore,
        startTime: startDate?.getTime() ?? 0
      };
    })
    .filter((entry): entry is { experience: any; score: number; startTime: number } => entry !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.startTime || 0) - (a.startTime || 0);
    });

  let filteredEntries = scoredExperiences;

  if (categoryHints.length > 0) {
    const categoryEntries = filteredEntries.filter((entry) => {
      const { experience } = entry;
      const text = [experience.position, experience.description, experience.company]
        .filter(Boolean)
        .join(' ');
      return hasAnyHint(text, categoryHints);
    });
    if (categoryEntries.length > 0) {
      filteredEntries = categoryEntries;
    }
  }

  return filteredEntries.slice(0, limit).map((entry) => entry.experience);
}

// ===== BUILD RESUME TEXT FROM PROFILE =====
function buildResumeText(profile: any, userEmail: string, relevantSkills: any[] = [], relevantExperiences: any[] = []): string {
  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';
  const address = profile?.address || '';
  const cityInfo = profile ? [profile.postal_code, profile.city].filter(Boolean).join(' ') : '';
  const email = profile?.email || userEmail;
  const phone = profile?.phone || '';
  
  let resumeText = '';
  
  // Personal information
  if (fullName || email) {
    resumeText += '=== PERSÖNLICHE DATEN ===\n';
    if (fullName) resumeText += `Name: ${fullName}\n`;
    if (address) resumeText += `Adresse: ${address}\n`;
    if (cityInfo) resumeText += `PLZ/Ort: ${cityInfo}\n`;
    if (email) resumeText += `E-Mail: ${email}\n`;
    if (phone) resumeText += `Telefon: ${phone}\n`;
    resumeText += '\n';
  }
  
  // Work experience
  if (profile?.experience && Array.isArray(profile.experience) && profile.experience.length > 0) {
    const experienceSource = relevantExperiences.length > 0 ? relevantExperiences : profile.experience;
    resumeText += '=== BERUFSERFAHRUNG ===\n';
    experienceSource.forEach((exp: any) => {
      if (exp.position && exp.company) {
        const duration = exp.startDate ? 
          `${exp.startDate} - ${exp.current ? 'Heute' : (exp.endDate || 'Heute')}` : '';
        resumeText += `${exp.position} bei ${exp.company}`;
        if (duration) resumeText += ` (${duration})`;
        resumeText += '\n';
        if (exp.description) {
          resumeText += `${exp.description}\n`;
        }
        resumeText += '\n';
      }
    });
  }
  
  // Skills
  if (profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
    const skillsSource = relevantSkills.length > 0 ? relevantSkills : profile.skills;
    resumeText += '=== FACHKENNTNISSE ===\n';
    skillsSource.forEach((skill: any) => {
      if (skill.name) {
        resumeText += `${skill.name}${skill.level ? ` (${skill.level})` : ''}\n`;
      }
    });
    resumeText += '\n';
  }
  
  // Education
  if (profile?.education && Array.isArray(profile.education) && profile.education.length > 0) {
    resumeText += '=== AUSBILDUNG ===\n';
    profile.education.forEach((edu: any) => {
      const degreeText = [edu.degree, edu.field].filter(Boolean).join(' in ');
      const duration = edu.startDate ? 
        `${edu.startDate} - ${edu.ongoing ? 'laufend' : (edu.endDate || 'laufend')}` : '';
      resumeText += `${degreeText || 'Ausbildung'} - ${edu.institution}`;
      if (duration) resumeText += ` (${duration})`;
      resumeText += '\n';
    });
    resumeText += '\n';
  }
  
  return resumeText || 'Keine Lebenslaufdaten verfügbar.';
}

serve(async (req) => {
  console.log('Function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    // Parse request body
    let body: any = null;
    if (req.method === "POST") {
      try {
        const text = await req.text();
        console.log('Raw request text length:', text.length);
        
        if (text && text.trim() !== "") {
          body = JSON.parse(text);
          console.log('Parsed body keys:', Object.keys(body));
        }
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        throw new Error('Invalid JSON in request');
      }
    }
    
    // Extract parameters (NEW: support resumeText, jobUrl, jobText)
    const resumeTextProvided = body?.resumeText;
    const jobUrl = body?.jobUrl;
    const jobTextProvided = body?.jobText;
    const userCity = body?.userCity;
    let jobData = body?.jobData; // Legacy support
    
    // Validation
    if (!resumeTextProvided && !jobData) {
      return new Response(JSON.stringify({ 
        error: 'resumeText is required (min. 500 characters)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    if (resumeTextProvided && resumeTextProvided.length < 500) {
      return new Response(JSON.stringify({ 
        error: 'resumeText must be at least 500 characters'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    if (!jobUrl && !jobTextProvided && !jobData) {
      return new Response(JSON.stringify({ 
        error: 'Either jobUrl or jobText must be provided'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Fetch job data from URL if provided
    if (jobUrl && !jobData) {
      console.log('Fetching job data from URL:', jobUrl);
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const scrapeResponse = await fetch(`${supabaseUrl}/functions/v1/scrape-job`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('authorization') || '',
          },
          body: JSON.stringify({ url: jobUrl, userCity })
        });
        
        if (!scrapeResponse.ok) {
          const errorData = await scrapeResponse.json();
          return new Response(JSON.stringify({ 
            error: 'Failed to fetch job data: ' + (errorData.message || 'Unknown error')
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
        }
        
        const scrapeResult = await scrapeResponse.json();
        if (scrapeResult.success && scrapeResult.jobData) {
          jobData = scrapeResult.jobData;
          console.log('Job data fetched:', jobData.jobtitel);
        } else {
          return new Response(JSON.stringify({ 
            error: 'Could not extract job data from URL'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
        }
      } catch (fetchError) {
        console.error('Error fetching job data:', fetchError);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch job from URL: ' + (fetchError instanceof Error ? fetchError.message : 'Unknown error')
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }
    
    // Parse job text if provided directly (no scraping)
    if (jobTextProvided && !jobData) {
      console.log('Using provided job text (length:', jobTextProvided.length, ')');
      
      // Try to extract job title from text
      const titleMatch = jobTextProvided.match(/(?:Bewerbung als|Stellenanzeige|Job(?:titel)?:?)\s*([^\n]+)/i) ||
                        jobTextProvided.match(/^([A-Z][^\n]{10,80})/m);
      const companyMatch = jobTextProvided.match(/(?:bei|Unternehmen|Firma|Company):?\s*([A-ZÄÖÜ][^\n]{2,50})/i);
      const locationMatch = jobTextProvided.match(/(?:Standort|Ort|Location):?\s*([A-ZÄÖÜ][a-zäöü]+)/i);
      
      jobData = {
        jobtitel: titleMatch?.[1]?.trim() || 'Position',
        arbeitgeber: companyMatch?.[1]?.trim() || 'Unternehmen',
        beschreibung: jobTextProvided,
        anforderungen: [],
        ort: locationMatch?.[1] || userCity || '',
        datum: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
      };
      
      console.log('Extracted job info:', { 
        jobtitel: jobData.jobtitel, 
        arbeitgeber: jobData.arbeitgeber 
      });
    }
    
    // Ensure we have job data at this point
    if (!jobData || !jobData.jobtitel) {
      return new Response(JSON.stringify({ 
        error: 'No valid job data available'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    console.log('Proceeding with job:', jobData.jobtitel);
    
    const jobKeywords = extractJobKeywords(jobData);
    const jobCategories = detectJobCategories(jobData);
    console.log('Job keywords extracted:', jobKeywords.size, 'categories:', jobCategories);
    let relevantSkills: any[] = [];
    let relevantExperiences: any[] = [];
    
    // Continue with existing logic...
    {
      console.log('Found job:', jobData.jobtitel);
      
      // Step 3: Add back profile data integration
      let profile: any = null;
      let userEmail = '';
      
      // Initialize Supabase client (outside try block for later use)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      try {
        console.log('Fetching user profile...');
        
        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);
          
          if (!userError && user) {
            console.log('User verified:', user.id);
            userEmail = user.email || '';
            
            // Check user plan and usage limit
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('plan')
              .eq('user_id', user.id)
              .maybeSingle();
              
            const userPlan = profileData?.plan || 'free';
            console.log('User plan:', userPlan);
            
            // For free users, check monthly limit
            if (userPlan === 'free') {
              const currentDate = new Date();
              const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
              
              console.log('Checking usage for month:', monthStart);
              
              const { data: usageData, error: usageError } = await supabase
                .from('usage_scans')
                .select('scans_count')
                .eq('user_id', user.id)
                .eq('month_start', monthStart)
                .maybeSingle();
                
              if (!usageError && usageData && usageData.scans_count >= 1) {
                console.log('User has reached monthly limit:', usageData.scans_count);
                return new Response(JSON.stringify({ 
                  error: 'Monatliches Limit erreicht. Upgraden Sie auf Pro für unbegrenzte Generierungen.',
                  limitReached: true
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 400
                });
              }
            }
            
            // Fetch profile (optional - won't fail if missing)
            const { data: fullProfile, error: fullProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
              
            if (!fullProfileError && fullProfile) {
              profile = fullProfile;
              console.log('Profile loaded:', profile.first_name, profile.last_name);
              relevantSkills = filterSkillsByJob(profile?.skills || [], jobKeywords, {
                categories: jobCategories,
              });
              relevantExperiences = filterExperiencesByJob(profile?.experience || [], jobKeywords, {
                categories: jobCategories,
              });
              console.log('Relevant skills matched:', relevantSkills.length);
              console.log('Relevant experiences matched:', relevantExperiences.length);
            } else {
              console.log('No profile found or error:', fullProfileError?.message);
            }
          } else {
            console.log('User verification failed:', userError?.message);
          }
        } else {
          console.log('No auth header provided');
        }
      } catch (profileFetchError) {
        console.log('Profile fetch failed, continuing without profile:', profileFetchError);
        // Continue without profile data
      }
      
      // ===== OPENAI API INTEGRATION WITH RETRY LOGIC =====
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        console.error('OpenAI API key not found');
        throw new Error('OpenAI API key not configured');
      }
      
      // Use provided resumeText or build from profile
      const resumeText = resumeTextProvided || buildResumeText(profile, userEmail, relevantSkills, relevantExperiences);
      
      const relevantSkillNames = relevantSkills
        .map((skill: any) => typeof skill?.name === 'string' ? skill.name.trim() : '')
        .filter((name: string): name is string => Boolean(name));

      const relevantExperienceSummaries = relevantExperiences
        .map((experience: any) => {
          if (!experience?.position || !experience?.company) return '';
          const duration = experience.startDate ?
            `${experience.startDate} - ${experience.current ? 'Heute' : (experience.endDate || 'Heute')}` : '';
          return `${experience.position} bei ${experience.company}${duration ? ` (${duration})` : ''}`;
        })
        .filter((summary: string): summary is string => Boolean(summary));

      const jobKeywordList = Array.from(jobKeywords).slice(0, 30).join(', ');
      
      // Extract applicant name from resume with multiple strategies
      let applicantName = '';
      
      // Try pattern 1: Name at beginning
      const nameMatch1 = resumeText.match(/^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)+)/m);
      
      // Try pattern 2: After "Name:" or similar
      const nameMatch2 = resumeText.match(/(?:Name|Bewerber|Candidate|Applicant)\s*:?\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)+)/mi);
      
      // Try pattern 3: In first 200 chars
      const firstPart = resumeText.substring(0, 200);
      const nameMatch3 = firstPart.match(/\b([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,3})\b/);
      
      applicantName = nameMatch1?.[1] || nameMatch2?.[1] || nameMatch3?.[1] || '';
      
      // Validate name
      if (applicantName && applicantName.length >= 4 && applicantName.length <= 50) {
        const words = applicantName.split(/\s+/);
        if (words.length < 2) {
          applicantName = '';
        }
      } else {
        applicantName = '';
      }
      
      console.log('=== TEXT EXTRACTION DEBUG ===');
      console.log('Applicant name extracted:', applicantName || 'NOT FOUND');
      console.log('Company name:', jobData.arbeitgeber);
      console.log('Job title:', jobData.jobtitel);
      console.log('=== END DEBUG ===');
      
      const classificationHint = jobCategories.length > 0
        ? jobCategories.map((category) => CATEGORY_HINTS[category]?.prompt).filter(Boolean).join(' ')
        : 'Fokussiere dich ausschließlich auf Erfahrungen und Fähigkeiten, die in direktem Bezug zur Stellenanzeige stehen.';

      console.log('Resume text length:', resumeText.length, 'Relevant skills:', relevantSkillNames.length, 'Relevant experiences:', relevantExperienceSummaries.length);
      
      // Extract city from job location for proper "City, Date" format
      let cityForDate = '';
      if (jobData.ort) {
        cityForDate = jobData.ort.split(' ')[0];
      }
      
      // Create proper German date format with city
      let formattedDate = jobData.datum || '';
      if (cityForDate && formattedDate && !formattedDate.includes(',')) {
        formattedDate = `${cityForDate}, ${formattedDate}`;
      }
      
      
      // ===== CLEAN SYSTEM PROMPT =====
      const systemPrompt = `Du bist ein Experte für deutsche Bewerbungsschreiben nach DIN 5008.
Halte dich strikt an folgende Regeln:

0. INFORMATIONS-EXTRAKTION (ABSOLUT KRITISCH):
   
   ⚠️ WICHTIG: Identifiziere KORREKT folgende Informationen:
   
   A) BEWERBER-NAME:
      - Lies den Lebenslauf SORGFÄLTIG
      - Der Name steht meistens am Anfang des Lebenslaufs
      - Format: "Vorname Nachname" (z.B. "Max Mustermann", "Anna Schmidt")
      - Verwende NIEMALS generische Namen wie "Bewerber/in" oder "[Dein Name]"
      - Wenn kein Name gefunden wird, verwende "Ich" statt des Namens
   
   B) UNTERNEHMENS-NAME:
      - Der Firmenname steht unter <STELLENANZEIGE> bei "Unternehmen:"
      - Verwende EXAKT diesen Namen (z.B. "Conventex GmbH", "BMW AG")
      - Verwende NIEMALS "das Unternehmen" oder "Ihre Firma"
      - Im Anschreiben: "bei [EXAKTER FIRMENNAME]"
   
   C) JOB-TITEL:
      - Der Jobtitel steht unter <STELLENANZEIGE> bei "Titel:"
      - Verwende EXAKT diesen Titel (z.B. "Sales Agent (m/w/d)", "Software Developer")
      - Im Betreff: "Bewerbung als [EXAKTER JOBTITEL]"
      - Im Text: "die Position als [EXAKTER JOBTITEL]"
   
   BEISPIEL KORREKT:
   "Während meiner Tätigkeit als Vertriebsmitarbeiter bei Invvenio..."
   "Mit großem Interesse bewerbe ich mich bei Conventex GmbH als Sales Agent..."
   
   BEISPIEL FALSCH:
   "Während meiner Tätigkeit in einem Unternehmen..."
   "Mit großem Interesse bewerbe ich mich als Vertriebsmitarbeiter..."

1. LÄNGE: 350–450 Wörter (nur Anschreiben, ohne Adressen)

2. RELEVANZ & DATENVERWENDUNG (KRITISCH - BEI VERSTOSS IST BEWERBUNG UNGÜLTIG):
   
   ⚠️ WARNUNG: Irrelevante Skills führen zur ABLEHNUNG der Bewerbung!
   
   SCHRITT 1: STELLENANALYSE
   - Lies die Stellenanzeige komplett durch
   - Identifiziere die Branche: Sales/Vertrieb, IT/Entwicklung, HR, Handwerk, etc.
   - Frage dich: "Ist das eine TECHNISCHE oder NICHT-TECHNISCHE Stelle?"
   
   SCHRITT 2: CV FILTERN - NUR RELEVANTES AUSWÄHLEN
   
   ❌ ABSOLUT VERBOTEN ZU ERWÄHNEN:
   
   BEI SALES/VERTRIEB/KUNDENSERVICE STELLEN:
   - NIEMALS: JavaScript, TypeScript, Python, Java, C++, PHP, React, Vue, Angular
   - NIEMALS: Node.js, CSS, HTML, SQL, MongoDB, APIs, Git, Docker
   - NIEMALS: "App Entwickler", "Fullstack Entwickler", "Webentwicklung"
   - NIEMALS: Technische Frameworks oder Programmiersprachen jeglicher Art
   
   BEI ENTWICKLER/IT STELLEN:
   - NIEMALS: Verkaufserfahrung, Kundenakquise, Kaltakquise (außer explizit verlangt)
   - NIEMALS: Nicht-technische Tätigkeiten ohne IT-Bezug
   
   ✅ WAS STATTDESSEN ERWÄHNEN:
   
   FÜR SALES/VERTRIEB/KUNDENSERVICE:
   - Kundenbetreuung, Neukundengewinnung, Verkaufsgespräche
   - CRM-Systeme, Salesforce, MS Dynamics
   - Verhandlungsgeschick, Kommunikation, Teamfähigkeit
   - Verkaufszahlen, Umsätze, KPIs
   - Branchenkenntnisse (Automotive, B2B, etc.)
   
   FÜR ENTWICKLER/IT:
   - Programmiersprachen, Frameworks, Tools
   - Git, CI/CD, Cloud-Technologien
   - Datenbanken, APIs, Architektur
   - Konkrete Projekte und Technologien
   
   🔴 PENALTY-REGEL:
   Wenn du JavaScript, Node.js, React, HTML, CSS oder ähnliches bei einer
   NICHT-TECHNISCHEN Stelle erwähnst → Bewerbung wird AUTOMATISCH ABGELEHNT
   
   - Verwende konkrete Firmen, Skills, Zahlen NUR wenn relevant
   - Nutze ausschließlich Skills aus dem Abschnitt <RELEVANTE_FACHKENNTNISSE> (falls vorhanden) und ignoriere alle anderen Lebenslauf-Skills
   - Nutze bevorzugt berufliche Stationen aus dem Abschnitt <RELEVANTE_ERFAHRUNGEN> und ignoriere irrelevante Abschnitte
   - Nichts erfinden, keine Platzhalteradressen

3. VERBOTENE PHRASEN (führen zu ungültiger Bewerbung):
   - "In meiner bisherigen/damaligen/früheren/vorherigen Tätigkeit/Position/Rolle"
   - "in meinem letzten Job", "während meiner Zeit"
   - "umfangreiche/vielfältige/langjährige Erfahrungen"
   - "gute/ausgeprägte/fundierte/solide Kenntnisse"
   - "kommunikative Fähigkeiten", "soziale Kompetenzen"
   - "konnte ich sammeln/lernen/entwickeln/erwerben"
   - "EDV-/IT-/Computer-Kenntnisse"

4. KORREKTE FORMULIERUNGEN:
   - Stattdessen: "Als [Position] bei [Firma] von [Datum] bis [Datum]"
   - Nenne Skills mit Namen: "Java, Python, SAP"
   - Verwende konkrete Zahlen: "50+ Kunden", "5 Projekte"

5. STRUKTUR & ABSÄTZE (KRITISCH):
   ⚠️ Das Anschreiben MUSS in SEPARATE ABSÄTZE unterteilt sein!
   
   PFLICHT-STRUKTUR:
   1. Anrede: "Sehr geehrte Damen und Herren,"
   
   2. EINLEITUNG (separater Absatz):
      - Bezug zur Stelle
      - Erste Motivation
   
   3. HAUPTTEIL 1 (separater Absatz):
      - Relevante Erfahrung 1
      - Konkrete Beispiele
   
   4. HAUPTTEIL 2 (separater Absatz):
      - Relevante Erfahrung 2
      - Weitere Qualifikationen
   
   5. SCHLUSS (separater Absatz):
      - Zukunftsorientierung
      - Gesprächsbereitschaft
   
   WICHTIG: Jeder Absatz wird mit ZWEI Zeilenumbrüchen (\\n\\n) getrennt!
   FALSCH: "...Text1. Text2..."
   RICHTIG: "...Text1.\\n\\nText2..."

6. OUTPUT FORMAT:
   - Gib das Ergebnis ausschließlich als JSON im Format:
   { "letter": "...", "violations": [], "used_facts": [] }`;

      // ===== CLEAN USER PROMPT =====
      const buildUserPrompt = (hint = '') => {
        const nameHint = applicantName ? 
          `👤 BEWERBER-NAME (aus Lebenslauf extrahiert): ${applicantName}\n   VERWENDE DIESEN NAMEN im Anschreiben!\n\n` : 
          `👤 BEWERBER-NAME: Nicht gefunden - EXTRAHIERE den Namen selbst aus dem Lebenslauf oben!\n   Suche am Anfang des Lebenslaufs nach dem vollständigen Namen (Vorname + Nachname).\n\n`;
        
        return `<LEBENSLAUF>
${resumeText}
</LEBENSLAUF>

<STELLENANZEIGE>
⚠️ VERWENDE DIESE EXAKTEN INFORMATIONEN:

${nameHint}📋 JOBTITEL (EXAKT verwenden): ${jobData.jobtitel}
🏢 UNTERNEHMENSNAME (EXAKT verwenden): ${jobData.arbeitgeber}
📍 Ort: ${jobData.ort || ''}

Beschreibung:
${jobData.beschreibung}

Anforderungen:
${(jobData.anforderungen || []).join('\n')}
</STELLENANZEIGE>

<STELLENANZEIGE_KEYWORDS>
${jobKeywordList || 'Keine Schlüsselbegriffe extrahiert.'}
</STELLENANZEIGE_KEYWORDS>

<KLASSIFIKATIONSHINWEIS>
${classificationHint}
</KLASSIFIKATIONSHINWEIS>

<RELEVANTE_FACHKENNTNISSE>
${relevantSkillNames.length ? relevantSkillNames.join('\n') : 'Keine expliziten Skills hervorgehoben. Verwende nur Kompetenzen, die eindeutig zur Stellenanzeige passen.'}
</RELEVANTE_FACHKENNTNISSE>

<RELEVANTE_ERFAHRUNGEN>
${relevantExperienceSummaries.length ? relevantExperienceSummaries.join('\n') : 'Nutze nur Erfahrungen, die klar zu den Aufgaben der Stelle passen. Erwähne keine irrelevanten Stationen.'}
</RELEVANTE_ERFAHRUNGEN>

<FORMAT>
${formattedDate ? `Datum: ${formattedDate}` : 'Kein Datum angegeben'}

Schreibe ein vollständiges Bewerbungsschreiben nach DIN 5008, 350–450 Wörter.
Verknüpfe Erfahrungen aus dem Lebenslauf mit Anforderungen der Stelle.
Verwende konkrete Firmennamen, Skills und Zahlen aus dem Lebenslauf.
Vermeide alle verbotenen Phrasen.

KRITISCH - ABSATZ-FORMAT:
Trenne JEDEN Absatz mit \\n\\n (zwei Zeilenumbrüchen)!

Beispiel für KORREKTES Format:
"Sehr geehrte Damen und Herren,\\n\\nmit großem Interesse habe ich Ihre Stellenanzeige gelesen...\\n\\nWährend meiner Tätigkeit als Sales Agent bei Invvenio konnte ich...\\n\\nIch freue mich darauf, meine Fähigkeiten..."

FALSCH wäre:
"Sehr geehrte Damen und Herren, mit großem Interesse... Während meiner Tätigkeit..."
</FORMAT>${hint ? `

<NACHBESSERUNG>
${hint}
</NACHBESSERUNG>` : ''}`;
      };
      
      // ===== RETRY MECHANISM =====
      let generatedApplication = '';
      let hint = '';
      const MAX_ATTEMPTS = 3;
      
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        console.log(`Generation attempt ${attempt}/${MAX_ATTEMPTS}`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            top_p: 0.3,
            max_tokens: 1200,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: buildUserPrompt(hint) },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error:', response.status, errorText);
          throw new Error(`OpenAI API failed: ${response.status}`);
        }

        const data = await response.json();
        const messageContent = data?.choices?.[0]?.message?.content || '{}';
        
        let parsed;
        try {
          parsed = JSON.parse(messageContent);
        } catch (e) {
          console.error('Failed to parse JSON response:', messageContent);
          parsed = { letter: messageContent, violations: [], used_facts: [] };
        }
        
        const letter = parsed.letter || '';
        
        if (!letter.trim()) {
          console.log(`Attempt ${attempt}: Empty letter received, retrying...`);
          hint = 'Generiere ein vollständiges Bewerbungsschreiben. Leere Antwort ist nicht akzeptabel.';
          continue;
        }
        
        // Validate the generated letter
        const validation = validateLetter(letter, formattedDate, jobData.jobtitel);
        
        console.log(`Attempt ${attempt} validation:`, {
          ok: validation.ok,
          violations: validation.violations.length,
          words: validation.words,
          dateOk: validation.dateOk
        });
        
        if (validation.ok) {
          generatedApplication = letter;
          break;
        }
        
        // Build feedback for next attempt
        const feedbackParts: string[] = [];
        if (validation.violations.length > 0) {
          feedbackParts.push(`Verbotene Phrasen entfernen: ${validation.violations.join(' | ')}`);
        }
        if (!validation.dateOk && formattedDate) {
          feedbackParts.push(`Fehlendes Datum: ${formattedDate}`);
        }
        if (validation.words < 350 || validation.words > 450) {
          feedbackParts.push(`Wortanzahl ${validation.words} statt 350–450`);
        }
        
        hint = feedbackParts.join('. ');
        
        // Store best attempt even if not perfect
        if (attempt === MAX_ATTEMPTS && !generatedApplication) {
          generatedApplication = letter;
        }
      }
      
      if (!generatedApplication) {
        throw new Error(`Keine gültige Bewerbung nach ${MAX_ATTEMPTS} Versuchen. Letzte Fehler: ${hint || 'Unbekannt'}`);
      }

      // Enhanced cleaning and formatting for professional output
      generatedApplication = generatedApplication
        .replace(/\*+/g, '') // Remove all asterisks
        .replace(/#+/g, '') // Remove hash symbols
        .replace(/_{2,}/g, '') // Remove multiple underscores
        .replace(/\-{3,}/g, '---') // Replace multiple dashes with just 3
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with just 2
        .replace(/\[(.*?)\]/g, '') // Remove any remaining placeholders in brackets
        .replace(/\{(.*?)\}/g, '') // Remove any placeholders in curly braces
        .replace(/\<(.*?)\>/g, '') // Remove any placeholders in angle brackets
        .replace(/PLACEHOLDER/gi, '') // Remove the word PLACEHOLDER
        .replace(/\b(Ihr Name|Ihre Adresse|Your Name|Your Address|Max Mustermann|Musterstraße|Musterstadt)\b/gi, '') // Remove common German placeholders
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple empty lines
        .trim();


      // Save application to database and increment usage count
      try {
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user) {
            // Save the application
            const { error: saveError } = await supabase
              .from('applications')
              .insert({
                user_id: user.id,
                job_title: jobData.jobtitel,
                company_name: jobData.arbeitgeber,
                job_description: jobData.beschreibung,
                job_requirements: jobData.anforderungen?.join('; ') || '',
                generated_application: generatedApplication,
                language: 'de'
              });
              
            if (saveError) {
              console.error('Error saving application:', saveError);
            } else {
              console.log('Application saved successfully');
            }
            
            // Increment usage count for free users
            const { data: profileData } = await supabase
              .from('profiles')
              .select('plan')
              .eq('user_id', user.id)
              .maybeSingle();
              
            if (profileData?.plan === 'free' || !profileData?.plan) {
              const currentDate = new Date();
              const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
              
              const { error: usageError } = await supabase.rpc('increment_scan_count', {
                p_user_id: user.id,
                p_month_start: monthStart
              });
              
              if (usageError) {
                console.error('Error incrementing usage count:', usageError);
              } else {
                console.log('Usage count incremented');
              }
            }
          }
        }
      } catch (saveError) {
        console.error('Error in save/usage tracking:', saveError);
        // Don't fail the request if saving fails
      }

      // Word count
      const wordCount = generatedApplication.trim().split(/\s+/).length;
      
      return new Response(JSON.stringify({ 
        success: true,
        letter: generatedApplication,
        wordCount,
        jobData: {
          jobtitel: jobData.jobtitel,
          arbeitgeber: jobData.arbeitgeber,
          ort: jobData.ort
        },
        usedModel: 'gpt-4o-mini',
        applicationId: "openai-" + Date.now()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    return new Response(JSON.stringify({ 
      generatedApplication: "Test Bewerbung - Keine Jobdaten erhalten",
      applicationId: "no-job-data-" + Date.now(),
      debug: {
        method: req.method,
        bodyReceived: body !== null,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Function error: ' + (error instanceof Error ? error.message : String(error)),
      generatedApplication: "Fehler - Basis Test",
      applicationId: "error-" + Date.now()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});