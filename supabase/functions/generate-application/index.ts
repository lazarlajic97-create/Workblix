import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    // Step 1: Add back job data processing
    let body: any = null;
    if (req.method === "POST") {
      try {
        const text = await req.text();
        console.log('Raw request text length:', text.length);
        
        if (text && text.trim() !== "") {
          body = JSON.parse(text);
          console.log('Successfully parsed body, has jobData:', !!body?.jobData);
        }
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        throw new Error('Invalid JSON in request');
      }
    }
    
    const jobData = body?.jobData;
    if (jobData && jobData.jobtitel) {
      console.log('Found job:', jobData.jobtitel);
      
      // Step 3: Add back profile data integration
      let profile = null;
      let userEmail = '';
      
      try {
        console.log('Fetching user profile...');
        
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
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
      
      // Step 4: Enhanced OpenAI integration with profile data
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        console.error('OpenAI API key not found');
        throw new Error('OpenAI API key not configured');
      }
      
      console.log('Creating personalized prompt...');
      
      // Create personalized prompt with profile data if available
      const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';
      const address = profile?.address || '';
      const cityInfo = profile ? [profile.postal_code, profile.city].filter(Boolean).join(' ') : '';
      const email = profile?.email || userEmail;
      const phone = profile?.phone || '';
      
      // ===== EXTRACT SKILLS FROM PROFILE =====
      const userSkills: string[] = [];
      if (profile?.skills && Array.isArray(profile.skills)) {
        profile.skills.forEach((skill: any) => {
          if (skill.name) {
            userSkills.push(`${skill.name}${skill.level ? ` (${skill.level})` : ''}`);
          }
        });
      }
      
      // ===== EXTRACT WORK EXPERIENCE FROM PROFILE =====
      const userExperience: any[] = [];
      if (profile?.experience && Array.isArray(profile.experience)) {
        profile.experience.forEach((exp: any) => {
          if (exp.position && exp.company) {
            userExperience.push({
              position: exp.position,
              company: exp.company,
              description: exp.description || '',
              duration: exp.startDate ? 
                `${exp.startDate} - ${exp.current ? 'Heute' : (exp.endDate || 'Heute')}` : ''
            });
          }
        });
      }
      
      // ===== EXTRACT EDUCATION FROM PROFILE =====
      const userEducation: any[] = [];
      if (profile?.education && Array.isArray(profile.education)) {
        profile.education.forEach((edu: any) => {
          if (edu.degree || edu.institution) {
            userEducation.push({
              degree: edu.degree || '',
              field: edu.field || '',
              institution: edu.institution || '',
              duration: edu.startDate ? 
                `${edu.startDate} - ${edu.ongoing ? 'laufend' : (edu.endDate || 'laufend')}` : ''
            });
          }
        });
      }
      
      // ===== BUILD PERSONAL INFO SECTION =====
      let personalInfo = '';
      if (fullName || email) {
        personalInfo = `
BEWERBERDATEN (verwende nur vorhandene Daten):
${fullName ? `Name: ${fullName}` : ''}
${address ? `Adresse: ${address}` : ''}
${cityInfo ? `Ort: ${cityInfo}` : ''}
${email ? `E-Mail: ${email}` : ''}
${phone ? `Telefon: ${phone}` : ''}
`;
      }
      
      // ===== BUILD COMPREHENSIVE PROFILE SUMMARY =====
      let profileSummary = '';
      if (userSkills.length > 0 || userExperience.length > 0 || userEducation.length > 0) {
        profileSummary = '\n=== BEWERBER QUALIFIKATIONEN (NUTZE DIESE FÜR PERSONALISIERUNG) ===\n';
        
        if (userSkills.length > 0) {
          profileSummary += `\nFACHKENNTNISSE UND SKILLS:\n${userSkills.map(s => `- ${s}`).join('\n')}\n`;
        }
        
        if (userExperience.length > 0) {
          profileSummary += `\nBERUFSERFAHRUNG:\n`;
          userExperience.slice(0, 3).forEach(exp => {
            profileSummary += `- ${exp.position} bei ${exp.company}${exp.duration ? ` (${exp.duration})` : ''}\n`;
            if (exp.description && exp.description.trim()) {
              const desc = exp.description.substring(0, 150).trim();
              profileSummary += `  Aufgaben: ${desc}${exp.description.length > 150 ? '...' : ''}\n`;
            }
          });
        }
        
        if (userEducation.length > 0) {
          profileSummary += `\nAUSBILDUNG:\n`;
          userEducation.forEach(edu => {
            const degreeText = [edu.degree, edu.field].filter(Boolean).join(' in ');
            profileSummary += `- ${degreeText || 'Ausbildung'} - ${edu.institution}${edu.duration ? ` (${edu.duration})` : ''}\n`;
          });
        }
        
        profileSummary += '\n';
      }
      
      console.log('Profile summary built:', {
        skillsCount: userSkills.length,
        experienceCount: userExperience.length,
        educationCount: userEducation.length,
        skills: userSkills,
        experience: userExperience.map(e => `${e.position} at ${e.company}`)
      });
      
      // Log if profile data is missing
      if (userSkills.length === 0 && userExperience.length === 0 && userEducation.length === 0) {
        console.warn('WARNING: No profile data available - application will be generic');
      }

      // Extract city from job location for proper "City, Date" format
      let cityForDate = '';
      if (jobData.ort) {
        // Extract city name from location (e.g., "Dortmund DE" -> "Dortmund")
        cityForDate = jobData.ort.split(' ')[0];
      }
      
      // Create proper German date format with city
      let formattedDate = jobData.datum || '';
      if (cityForDate && formattedDate && !formattedDate.includes(',')) {
        formattedDate = `${cityForDate}, ${formattedDate}`;
      }

      // Company address information
      let companyInfo = '';
      if (jobData.adresse || jobData.plz) {
        companyInfo = `
UNTERNEHMENSADRESSE (falls verfügbar):
${jobData.adresse ? `Adresse: ${jobData.adresse}` : ''}
${jobData.plz && jobData.ort ? `PLZ/Ort: ${jobData.plz} ${jobData.ort}` : jobData.ort ? `Ort: ${jobData.ort}` : ''}
`;
      }
      
      const prompt = `🔴 WICHTIG: Erstelle ein HOCHGRADIG PERSONALISIERTES deutsches Bewerbungsschreiben für folgende Stelle.

⚠️ Du hast PROFILDATEN erhalten - du MUSST diese verwenden! Keine generischen Phrasen erlaubt!

${personalInfo}${companyInfo}${profileSummary}
STELLENINFORMATIONEN:
Stellentitel: ${jobData.jobtitel}
Unternehmen: ${jobData.arbeitgeber}
${formattedDate ? `DATUM UND ORT (WICHTIG - GENAU SO VERWENDEN): ${formattedDate}` : ''}

Stellenbeschreibung:
${jobData.beschreibung}

Anforderungen:
${jobData.anforderungen?.join('\n') || 'Keine Anforderungen angegeben'}

=== ⛔ PERSONALISIERUNGS-ANWEISUNGEN (ABSOLUT KRITISCH) ⛔ ===
${profileSummary ? `
🔴 DER BEWERBER HAT KONKRETE QUALIFIKATIONEN - DU MUSST SIE VERWENDEN! 🔴

❌❌❌ DIESE PHRASEN SIND ABSOLUT VERBOTEN ❌❌❌
Wenn du eine dieser Phrasen verwendest, ist die Bewerbung UNGÜLTIG:

🚫 ABSOLUT VERBOTEN - Diese Phrasen führen zu UNGÜLTIGER Bewerbung:
❌ "In meiner bisherigen Tätigkeit" / "In früheren Positionen" / "In meiner damaligen Position"
❌ "In meiner vorherigen Rolle" / "In meinem letzten Job" / "Während meiner Zeit"
❌ "umfangreiche Erfahrungen" / "vielfältige Erfahrungen" / "langjährige Erfahrung"
❌ "kommunikative Fähigkeiten" / "ausgeprägte Fähigkeiten" / "soziale Kompetenzen"
❌ "gute Kenntnisse" / "ausgeprägte Kenntnisse" / "fundierte Kenntnisse" / "solide Kenntnisse"
❌ "EDV-Kenntnisse" / "IT-Kenntnisse" / "Computer-Kenntnisse"
❌ "Kundenkontakt sammeln" / "Erfahrungen sammeln können" / "konnte ich sammeln"
❌ "habe ich gelernt" / "konnte ich entwickeln" / "habe ich erworben"

✅ VERWENDE STATTDESSEN IMMER:
"Als [EXAKTE Position] bei [EXAKTER Firmenname]" + [WAS GENAU getan]

BEISPIEL RICHTIG:
"Als Kundenberater bei Telekom AG betreute ich täglich 40+ Geschäftskunden und war verantwortlich für die Vertragsberatung."

BEISPIEL FALSCH:
"In meiner damaligen Position konnte ich Erfahrungen im Kundenservice sammeln."

✅ PFLICHT - So MUSS personalisiert werden:

1. KONKRETE FIRMEN & POSITIONEN nennen:
   ❌ Falsch: "In meiner bisherigen Tätigkeit im Kundenservice..."
   ✅ Richtig: "Als Kundenberater bei [KONKRETE FIRMA] von [ZEITRAUM]..."

2. SPEZIFISCHE SKILLS mit Namen nennen:
   ❌ Falsch: "Ich verfüge über IT-Kenntnisse"
   ✅ Richtig: "Meine Kenntnisse in Java, Python und SQL..."

3. KONKRETE AUFGABEN/PROJEKTE beschreiben:
   ❌ Falsch: "Ich habe Projekte geleitet"
   ✅ Richtig: "Bei [Firma] leitete ich die Implementierung von [konkretes Projekt]"

4. ZAHLEN & FAKTEN wenn verfügbar:
   ❌ Falsch: "Viele Kunden betreut"
   ✅ Richtig: "Täglich 50+ Kundenanfragen bearbeitet" (wenn aus Beschreibung ersichtlich)

5. DIREKTE VERBINDUNG Job-Anforderung ↔ Bewerber-Qualifikation:
   - Analyse: Was verlangt die Stelle? → Welche passenden Qualifikationen hat der Bewerber?
   - Verknüpfe IMMER Anforderung mit konkreter Erfahrung/Skill

BEISPIELE FÜR KORREKTE PERSONALISIERUNG (Verschiedene Branchen):

BEISPIEL 1 - IT/Software:
Stelle: Software Engineer mit Java
Bewerber: Java (Experte), Backend Developer bei TechCorp 2020-2023
✅ "In meiner Tätigkeit als Backend Developer bei TechCorp von 2020 bis 2023 entwickelte ich skalierbare Java-Anwendungen mit Spring Boot. Meine Expertise in Microservices-Architekturen und API-Entwicklung passt ideal zu den Anforderungen dieser Position."

BEISPIEL 2 - Kundenservice/Vertrieb:
Stelle: Kundenberater
Bewerber: Kundenbetreuer bei ServicePlus GmbH, Kommunikation (Fortgeschritten)
✅ "Als Kundenbetreuer bei ServicePlus GmbH betreute ich von 2021 bis 2024 eigenständig einen Kundenstamm von über 200 B2B-Kunden. Meine Erfahrung in der lösungsorientierten Beratung und dem Beschwerdemanagement macht mich zur idealen Besetzung für diese Position."

BEISPIEL 3 - Projektmanagement:
Stelle: Projektmanager
Bewerber: Junior PM bei BuildTech AG, Projektmanagement (Fortgeschritten), Scrum
✅ "Bei BuildTech AG leitete ich als Junior Projektmanager von 2022 bis 2024 erfolgreich 8 Bauprojekte mit Budgets bis 2 Mio. Euro. Meine Zertifizierung als Scrum Master und praktische Erfahrung in agiler Projektsteuerung erfüllen exakt Ihre Anforderungen."

BEISPIEL 4 - Marketing:
Stelle: Marketing Manager
Bewerber: Marketing Specialist bei CreativeHub, SEO, Social Media (Experte)
✅ "Als Marketing Specialist bei CreativeHub entwickelte ich von 2020 bis 2023 SEO-Strategien, die den organischen Traffic um 150% steigerten. Meine Expertise in Google Ads, Social Media Marketing und Content-Strategie bringt genau die Kompetenzen mit, die Sie suchen."

BEISPIEL 5 - Handwerk/Technisch:
Stelle: Elektriker
Bewerber: Elektrotechniker bei IndustrieElektrik, Schaltanlagen (Experte)
✅ "In meiner 5-jährigen Tätigkeit als Elektrotechniker bei IndustrieElektrik spezialisierte ich mich auf die Installation und Wartung von Industrieschaltanlagen. Meine Zertifizierung für Mittelspannungsanlagen und Erfahrung in der Fehleranalyse qualifizieren mich optimal für diese Stelle."

BEISPIEL 6 - Verwaltung/Büro:
Stelle: Sachbearbeiter
Bewerber: Bürokauffrau bei AdminServices, SAP (Fortgeschritten), MS Office (Experte)
✅ "Bei AdminServices verantwortete ich als Bürokauffrau von 2019 bis 2024 die Rechnungsbearbeitung für über 300 Lieferanten. Meine fundierten SAP-Kenntnisse und Erfahrung in der Prozessoptimierung passen perfekt zu Ihren Anforderungen."

WICHTIG: 
- Jeder Satz MUSS konkrete Details enthalten (Firma, Zeitraum, Skills, Zahlen)
- Passe den Schreibstil an die Branche an (IT: technisch, Handwerk: praktisch, Verwaltung: prozessorientiert)
- Nutze die TATSÄCHLICHEN Daten aus dem Profil - keine Erfindungen!
` : `
KEINE PROFILDATEN VERFÜGBAR - Erstelle eine professionelle aber allgemeine Bewerbung.
`}

DEUTSCHES BEWERBUNGSSCHREIBEN - PFLICHTSTRUKTUR:

1. Absender-Adresse (oben links)
2. Empfänger-Adresse (rechts, unter dem Absender)
3. ${formattedDate ? `ORT UND DATUM (PFLICHT): Verwende EXAKT: "${formattedDate}"` : 'Ort und Datum: [Stadt], [aktuelles Datum]'}
4. Betreff: Bewerbung um die Stelle als ${jobData.jobtitel}
5. Anrede: Sehr geehrte Damen und Herren,
6. Einleitungssatz mit Bezug zur Stelle
7. Hauptteil (KOMPAKT & PRÄZISE) - HOCHGRADIG PERSONALISIERT:
   • Absatz 1: Konkrete relevante Berufserfahrung (Firma, Position, Zeitraum, spezifische Aufgaben)
   • Absatz 2: Spezifische Skills die zur Stelle passen (mit Namen der Skills/Technologien)
   • Absatz 3: Ausbildung/Zusatzqualifikationen die relevant sind (konkrete Abschlüsse/Zertifikate)
8. Schlussteil mit Grußformel
9. Unterschrift

⚠️ LÄNGEN-BESCHRÄNKUNG (KRITISCH):
- GESAMTER TEXT (nur Anschreiben, ohne Adressen): MAX 350-450 Wörter
- MUSS auf EINE SEITE passen
- Einleitung: 2-3 Sätze max
- Hauptteil: 3 kompakte Absätze (je 3-4 Sätze)
- Schluss: 2 Sätze max
- KEINE langen Ausschweifungen - jeder Satz muss relevant sein
- QUALITÄT über Quantität - lieber kürzer und prägnant als lang und schwammig

KRITISCHE FORMATIERUNGSREGELN:
- ${formattedDate ? `Das Datum MUSS als "${formattedDate}" erscheinen - KEINE anderen Datumsformate verwenden!` : 'Verwende das Format "Stadt, TT.MM.JJJJ"'}
- Der Ort und das Datum stehen rechtsbündig über dem Betreff
- Zwischen Ort und Datum steht ein Komma und ein Leerzeichen
- Verwende KEINE Platzhalter wie [Name], [Adresse] etc.
- Verwende NUR tatsächlich verfügbare Bewerberdaten und Qualifikationen
- Deutsche Geschäftsbrief-Norm DIN 5008 beachten
- PERSONALISIERUNG ist Pflicht wenn Profildaten vorhanden sind!
- KEINE vagen Aussagen - NUR konkrete Fakten aus dem Profil
- JEDER Absatz muss spezifische Firmennamen, Skills oder Qualifikationen enthalten

BEISPIEL FÜR KORREKTES DATUM:
${formattedDate || 'Dortmund, 26.09.2025'}

Das Anschreiben muss sofort versandfertig, HOCHGRADIG PERSONALISIERT und KOMPAKT (350-450 Wörter) sein.

🔴🔴🔴 FINALE ÜBERPRÜFUNG BEVOR DU ANTWORTEST: 🔴🔴🔴
Wenn Profildaten vorhanden sind:
✓ Hast du KONKRETE Firmennamen verwendet? (nicht "in meiner bisherigen Tätigkeit")
✓ Hast du KONKRETE Skills mit Namen genannt? (nicht "gute IT-Kenntnisse")
✓ Hast du KONKRETE Zeiträume angegeben? (z.B. "2020-2023")
✓ Hast du KEINE der verbotenen generischen Phrasen verwendet?

Wenn NEIN bei einer Frage → Schreibe die Bewerbung NEU mit mehr Konkretheit!`;

      console.log('Formatted date for application:', formattedDate);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            { 
              role: 'system', 
              content: `Du bist ein Experte für deutsche Bewerbungsschreiben.

🚨🚨🚨 KRITISCHE ABSOLUTE REGELN - KEINE AUSNAHMEN 🚨🚨🚨

1. KOMPAKT: Max 350-450 Wörter

2. ❌ STRENG VERBOTEN - Diese Phrasen führen zu UNGÜLTIGER Bewerbung:
   - "In meiner bisherigen/damaligen/früheren/vorherigen Tätigkeit/Position/Rolle"
   - "In meinem letzten Job" / "Während meiner Zeit"
   - "umfangreiche/vielfältige/langjährige Erfahrungen"
   - "gute/ausgeprägte/fundierte/solide Kenntnisse"
   - "kommunikative Fähigkeiten" / "soziale Kompetenzen"
   - "konnte ich sammeln/lernen/entwickeln/erwerben"
   - "EDV-Kenntnisse" / "IT-Kenntnisse"

3. ✅ PFLICHT wenn Profildaten vorhanden:
   - Schreibe: "Als [Position] bei [Firma] von [Datum] bis [Datum]"
   - Nenne Skills MIT NAMEN: "Java, Python, SAP" (nicht "IT-Kenntnisse")
   - Gib KONKRETE Zahlen: "50+ Kunden", "5 Projekte", "3 Jahre"
   - JEDER Absatz braucht: Firmenname ODER Skill-Name ODER Zahlen

4. Wenn du keine konkreten Daten aus dem Profil verwenden kannst, schreibe eine allgemeine Bewerbung - aber OHNE die verbotenen Phrasen!

5. Qualität über Quantität - lieber kurz und konkret als lang und vage

WICHTIG: Lies die Profildaten genau und verwende sie WÖRTLICH!` 
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 750,
          temperature: 0.5
        }),
      });

      console.log('OpenAI response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API failed: ${response.status}`);
      }

      const data = await response.json();
      let generatedApplication = data.choices[0].message.content;

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

      console.log('Application generated and cleaned successfully');

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

      return new Response(JSON.stringify({ 
        generatedApplication,
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