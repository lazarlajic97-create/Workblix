import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CVData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    responsibilities: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description?: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level: string;
  }>;
}

async function loadTemplate(templateId: string): Promise<string> {
  try {
    const response = await fetch(`https://rrwquzbcqrqxwutwijxc.supabase.co/storage/v1/object/public/templates/cv/${templateId}.html`);
    if (!response.ok) {
      // Fallback to local template
      const fallbackResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/templates/cv/${templateId}.html`);
      if (!fallbackResponse.ok) {
        throw new Error(`Template ${templateId} not found`);
      }
      return await fallbackResponse.text();
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error);
    
    // Return a basic fallback template
    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lebenslauf</title>
<style>
body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
.header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
.name { font-size: 2em; font-weight: bold; }
.section { margin-bottom: 20px; }
.section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
</style>
</head>
<body>
<div class="header">
<div class="name">{{firstName}} {{lastName}}</div>
<div>{{email}} | {{phone}} | {{city}}, {{country}}</div>
</div>
{{sections}}
</body>
</html>`;
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function populateTemplate(template: string, data: CVData): string {
  let populatedTemplate = template;

  // Replace personal information
  populatedTemplate = populatedTemplate.replace(/{{firstName}}/g, data.personalInfo.firstName || '');
  populatedTemplate = populatedTemplate.replace(/{{lastName}}/g, data.personalInfo.lastName || '');
  populatedTemplate = populatedTemplate.replace(/{{email}}/g, data.personalInfo.email || '');
  populatedTemplate = populatedTemplate.replace(/{{phone}}/g, data.personalInfo.phone || '');
  populatedTemplate = populatedTemplate.replace(/{{address}}/g, data.personalInfo.address || '');
  populatedTemplate = populatedTemplate.replace(/{{city}}/g, data.personalInfo.city || '');
  populatedTemplate = populatedTemplate.replace(/{{postalCode}}/g, data.personalInfo.postalCode || '');
  populatedTemplate = populatedTemplate.replace(/{{country}}/g, data.personalInfo.country || '');

  // Replace summary/profile
  populatedTemplate = populatedTemplate.replace(/{{summary}}/g, data.summary || '');

  // Generate experience section
  let experienceHTML = '';
  if (data.experience && data.experience.length > 0) {
    experienceHTML = data.experience.map(exp => `
      <div class="job">
        <div class="job-title">${exp.position}</div>
        <div class="job-company">${exp.company}</div>
        <div class="job-dates">${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Heute'}</div>
        ${exp.description ? `<p>${exp.description}</p>` : ''}
        ${exp.responsibilities && exp.responsibilities.length > 0 ? 
          `<ul>${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}</ul>` : ''}
      </div>
    `).join('');
  }
  populatedTemplate = populatedTemplate.replace(/{{experience}}/g, experienceHTML);

  // Generate education section
  let educationHTML = '';
  if (data.education && data.education.length > 0) {
    educationHTML = data.education.map(edu => `
      <div class="education-item">
        <div class="degree">${edu.degree} ${edu.field ? `in ${edu.field}` : ''}</div>
        <div class="institution">${edu.institution}</div>
        <div class="dates">${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}</div>
        ${edu.description ? `<p>${edu.description}</p>` : ''}
      </div>
    `).join('');
  }
  populatedTemplate = populatedTemplate.replace(/{{education}}/g, educationHTML);

  // Generate skills section
  const skillsHTML = data.skills && data.skills.length > 0 ? 
    `<ul>${data.skills.map(skill => `<li>${skill}</li>`).join('')}</ul>` : '';
  populatedTemplate = populatedTemplate.replace(/{{skills}}/g, skillsHTML);

  // Generate languages section
  let languagesHTML = '';
  if (data.languages && data.languages.length > 0) {
    languagesHTML = data.languages.map(lang => `<li>${lang.language} – ${lang.level}</li>`).join('');
    languagesHTML = `<ul>${languagesHTML}</ul>`;
  }
  populatedTemplate = populatedTemplate.replace(/{{languages}}/g, languagesHTML);

  return populatedTemplate;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, cvData } = await req.json();

    console.log('Generating CV with template:', templateId);

    if (!templateId || !cvData) {
      return new Response(
        JSON.stringify({ error: 'Template ID and CV data are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Load the template
    const template = await loadTemplate(templateId);
    
    // Populate the template with data
    const populatedHTML = populateTemplate(template, cvData);

    console.log('CV generated successfully for template:', templateId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        html: populatedHTML 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error generating CV:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate CV',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});