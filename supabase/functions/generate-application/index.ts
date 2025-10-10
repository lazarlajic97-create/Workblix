import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

// ===== BUILD RESUME TEXT FROM PROFILE =====
function buildResumeText(profile: any, userEmail: string): string {
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
    resumeText += '=== BERUFSERFAHRUNG ===\n';
    profile.experience.forEach((exp: any) => {
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
    resumeText += '=== FACHKENNTNISSE ===\n';
    profile.skills.forEach((skill: any) => {
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
    
    // Continue with existing logic...
    {
      console.log('Found job:', jobData.jobtitel);
      
      // Step 3: Add back profile data integration
      let profile = null;
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
      const resumeText = resumeTextProvided || buildResumeText(profile, userEmail);
      
      console.log('Resume text length:', resumeText.length);
      
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
        return `<LEBENSLAUF>
${resumeText}
</LEBENSLAUF>

<STELLENANZEIGE>
Titel: ${jobData.jobtitel}
Unternehmen: ${jobData.arbeitgeber}
Ort: ${jobData.ort || ''}

Beschreibung:
${jobData.beschreibung}

Anforderungen:
${(jobData.anforderungen || []).join('\n')}
</STELLENANZEIGE>

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
            model: 'gpt-3.5-turbo',
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
        usedModel: 'gpt-3.5-turbo',
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