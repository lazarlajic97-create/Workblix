import { Profile, Education, Experience, Skill, Language } from '@/pages/Profile';

export interface CVData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary?: string;
  };
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
}

export class CVTemplatePopulator {
  
  /**
   * Convert profile data to CV data format
   */
  static profileToCVData(profile: Profile): CVData {
    return {
      personalInfo: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        country: profile.country,
        linkedin: profile.linkedin,
        github: profile.github,
        website: profile.website,
        summary: profile.summary
      },
      experience: profile.experience || [],
      education: profile.education || [],
      skills: profile.skills || [],
      languages: profile.languages || []
    };
  }

  /**
   * Populate a CV template with user data
   */
  static async populateTemplate(templateId: string, cvData: CVData): Promise<string> {
    try {
      // Fetch the template HTML
      const response = await fetch(`/templates/cv/${templateId}.html`);
      if (!response.ok) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      let templateHtml = await response.text();

      // Replace placeholder data with real user data
      templateHtml = this.replacePlaceholders(templateHtml, cvData);

      return templateHtml;
    } catch (error) {
      console.error('Error populating template:', error);
      throw error;
    }
  }

  /**
   * Replace placeholders in template with actual data
   */
  private static replacePlaceholders(html: string, cvData: CVData): string {
    const { personalInfo, experience, education, skills, languages } = cvData;

    // Add PDF-specific optimizations
    html = this.addPdfOptimizations(html);

    // Replace personal information
    html = html.replace(/Anna Müller/g, `${personalInfo.firstName} ${personalInfo.lastName}`);
    html = html.replace(/anna\.mueller@example\.com/g, personalInfo.email);
    html = html.replace(/\+41 44 123 45 67/g, personalInfo.phone || '+49 XXX XXX XXXX');
    
    // Replace location
    const location = personalInfo.city && personalInfo.country 
      ? `${personalInfo.city}, ${personalInfo.country}`
      : personalInfo.city || personalInfo.country || 'Deutschland';
    html = html.replace(/Zürich, CH/g, location);
    html = html.replace(/Berlin, Deutschland/g, location);

    // Replace profile/summary
    if (personalInfo.summary) {
      const defaultSummary = /Marketing Managerin mit über 5 Jahren Erfahrung in der Entwicklung und Umsetzung kreativer Kampagnen\. Starke analytische Fähigkeiten und Leidenschaft für Storytelling\./g;
      html = html.replace(defaultSummary, personalInfo.summary);
    }

    // Replace work experience
    html = this.replaceExperience(html, experience);

    // Replace education
    html = this.replaceEducation(html, education);

    // Replace skills
    html = this.replaceSkills(html, skills);

    // Replace languages
    html = this.replaceLanguages(html, languages);

    return html;
  }

  /**
   * Add PDF-specific optimizations to the HTML
   */
  private static addPdfOptimizations(html: string): string {
    // Add print-friendly styles
    const pdfStyles = `
      <style>
        @media print {
          .page { 
            height: auto !important; 
            min-height: auto !important;
            page-break-inside: avoid;
          }
          body { 
            margin: 0 !important; 
            padding: 0 !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          .sidebar { 
            width: 30% !important; 
            padding: 15px !important;
          }
          .content { 
            width: 70% !important; 
            padding: 15px !important;
          }
          .name { 
            font-size: 24px !important; 
          }
          .title { 
            font-size: 14px !important; 
          }
          h2 { 
            font-size: 16px !important; 
            margin-bottom: 8px !important;
          }
          h3 { 
            font-size: 14px !important; 
            margin-bottom: 6px !important;
          }
          p, li { 
            font-size: 11px !important; 
            line-height: 1.3 !important;
            margin: 2px 0 !important;
          }
        }
      </style>
    `;
    
    // Insert the PDF styles before the closing </head> tag
    html = html.replace('</head>', pdfStyles + '</head>');
    
    return html;
  }

  /**
   * Replace work experience section
   */
  private static replaceExperience(html: string, experience: Experience[]): string {
    if (!experience || experience.length === 0) return html;

    // Find the experience section
    const experienceRegex = /<div class="section"[^>]*>\s*<h2[^>]*>Berufserfahrung<\/h2>(.*?)<\/div>\s*<div class="section"/s;
    const match = html.match(experienceRegex);
    
    if (!match) return html;

    // Generate experience HTML
    const experienceHtml = experience.map(exp => {
      const endDate = exp.current ? 'heute' : exp.endDate;
      return `
        <div class="experience">
          <div class="job">
            <div class="job-title">${exp.position}</div>
            <div class="job-company">${exp.company}</div>
            <div class="job-dates">${exp.startDate} - ${endDate}</div>
          </div>
          <p>${exp.description}</p>
        </div>
      `;
    }).join('');

    const newExperienceSection = `<div class="section">
      <h2>Berufserfahrung</h2>
      ${experienceHtml}
    </div>
    <div class="section"`;

    return html.replace(experienceRegex, newExperienceSection);
  }

  /**
   * Replace education section
   */
  private static replaceEducation(html: string, education: Education[]): string {
    if (!education || education.length === 0) return html;

    const educationRegex = /<div class="section"[^>]*>\s*<h2[^>]*>Ausbildung<\/h2>(.*?)<\/div>\s*<div class="section"/s;
    const match = html.match(educationRegex);
    
    if (!match) return html;

    const educationHtml = education.map(edu => {
      const endDate = edu.ongoing ? 'laufend' : edu.endDate;
      return `
        <div class="education">
          <div class="job">
            <div class="job-title">${edu.degree} - ${edu.field}</div>
            <div class="job-company">${edu.institution}</div>
            <div class="job-dates">${edu.startDate} - ${endDate}</div>
          </div>
          ${edu.description ? `<p>${edu.description}</p>` : ''}
        </div>
      `;
    }).join('');

    const newEducationSection = `<div class="section">
      <h2>Ausbildung</h2>
      ${educationHtml}
    </div>
    <div class="section"`;

    return html.replace(educationRegex, newEducationSection);
  }

  /**
   * Replace skills section
   */
  private static replaceSkills(html: string, skills: Skill[]): string {
    if (!skills || skills.length === 0) return html;

    // Find skills section (usually in sidebar)
    const skillsRegex = /<h3[^>]*>Fähigkeiten<\/h3>\s*<ul[^>]*>(.*?)<\/ul>/s;
    const match = html.match(skillsRegex);
    
    if (!match) return html;

    const skillsHtml = skills.map(skill => `<li>${skill.name}</li>`).join('');
    const newSkillsSection = `<h3>Fähigkeiten</h3>
      <ul>
        ${skillsHtml}
      </ul>`;

    return html.replace(skillsRegex, newSkillsSection);
  }

  /**
   * Replace languages section
   */
  private static replaceLanguages(html: string, languages: Language[]): string {
    if (!languages || languages.length === 0) return html;

    const languagesRegex = /<h3[^>]*>Sprachen<\/h3>\s*<ul[^>]*>(.*?)<\/ul>/s;
    const match = html.match(languagesRegex);
    
    if (!match) return html;

    const languagesHtml = languages.map(lang => {
      const level = lang.native ? 'Muttersprache' : lang.level;
      return `<li>${lang.name} - ${level}</li>`;
    }).join('');

    const newLanguagesSection = `<h3>Sprachen</h3>
      <ul>
        ${languagesHtml}
      </ul>`;

    return html.replace(languagesRegex, newLanguagesSection);
  }

  /**
   * Generate a downloadable CV file
   */
  static generateDownloadableCV(templateId: string, populatedHtml: string, firstName: string, lastName: string) {
    const blob = new Blob([populatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `CV_${firstName}_${lastName}_${templateId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
