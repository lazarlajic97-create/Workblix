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
      
      const prompt = `Erstelle ein professionelles deutsches Bewerbungsschreiben für folgende Stelle:
${personalInfo}${companyInfo}
STELLENINFORMATIONEN:
Stellentitel: ${jobData.jobtitel}
Unternehmen: ${jobData.arbeitgeber}
${formattedDate ? `DATUM UND ORT (WICHTIG - GENAU SO VERWENDEN): ${formattedDate}` : ''}

Stellenbeschreibung:
${jobData.beschreibung}

Anforderungen:
${jobData.anforderungen?.join('\n') || 'Keine Anforderungen angegeben'}

DEUTSCHES BEWERBUNGSSCHREIBEN - PFLICHTSTRUKTUR:

1. Absender-Adresse (oben links)
2. Empfänger-Adresse (rechts, unter dem Absender)
3. ${formattedDate ? `ORT UND DATUM (PFLICHT): Verwende EXAKT: "${formattedDate}"` : 'Ort und Datum: [Stadt], [aktuelles Datum]'}
4. Betreff: Bewerbung um die Stelle als ${jobData.jobtitel}
5. Anrede: Sehr geehrte Damen und Herren,
6. Einleitungssatz
7. Hauptteil (200-300 Wörter)
8. Schlussteil mit Grußformel
9. Unterschrift

KRITISCHE FORMATIERUNGSREGELN:
- ${formattedDate ? `Das Datum MUSS als "${formattedDate}" erscheinen - KEINE anderen Datumsformate verwenden!` : 'Verwende das Format "Stadt, TT.MM.JJJJ"'}
- Der Ort und das Datum stehen rechtsbündig über dem Betreff
- Zwischen Ort und Datum steht ein Komma und ein Leerzeichen
- Verwende KEINE Platzhalter wie [Name], [Adresse] etc.
- Verwende NUR tatsächlich verfügbare Bewerberdaten
- Deutsche Geschäftsbrief-Norm DIN 5008 beachten

BEISPIEL FÜR KORREKTES DATUM:
${formattedDate || 'Dortmund, 26.09.2025'}

Das Anschreiben muss sofort versandfertig sein ohne weitere Bearbeitung.`;

      console.log('Formatted date for application:', formattedDate);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'Du bist ein Experte für deutsche Bewerbungsschreiben. Erstelle professionelle, überzeugende Anschreiben.' 
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 600,
          temperature: 0.7
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