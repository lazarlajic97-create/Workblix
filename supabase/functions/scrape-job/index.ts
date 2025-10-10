import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobData {
  jobtitel: string;
  arbeitgeber: string;
  adresse: string;
  ort: string;
  datum: string;
  plz?: string;
  vertrag?: string;
  beschreibung: string;
  anforderungen: string[];
  bewerbungsprozess?: string;
}

const cleanText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]+/g, ' ')
    .trim();
};

const stripHtmlTags = (text: string): string => {
  if (!text) return '';
  
  let cleaned = text;
  
  // Apply HTML cleaning patterns
  htmlCleanPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' ');
  });
  
  // Filter out UI/navigation patterns
  uiFilterPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' ');
  });
  
  // Clean up whitespace and normalize
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .trim();
    
  return cleaned;
};

// Enhanced content validation
const isJobRelevantContent = (text: string): boolean => {
  if (!text || text.length < 10) return false;
  
  const lowerText = text.toLowerCase();
  
  // Check against UI filter patterns
  for (const pattern of uiFilterPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }
  
  // Check for stop keywords
  if (stopKeywords.some(keyword => lowerText.includes(keyword))) {
    return false;
  }
  
  // Check for job-relevant indicators
  const jobIndicators = [
    'erfahrung', 'experience', 'ausbildung', 'education', 'degree',
    'kenntnisse', 'skills', 'fähigkeiten', 'abilities', 'qualifikation',
    'aufgaben', 'responsibilities', 'tätigkeiten', 'duties',
    'anforderungen', 'requirements', 'voraussetzungen',
    'benefits', 'vorteile', 'leistungen', 'angebot',
    'gehalt', 'salary', 'vergütung', 'compensation',
    'vollzeit', 'teilzeit', 'fulltime', 'parttime', 'contract',
    'befristet', 'unbefristet', 'permanent', 'temporary'
  ];
  
  const hasJobIndicators = jobIndicators.some(indicator => 
    lowerText.includes(indicator)
  );
  
  // Content should be meaningful length and either have job indicators or be descriptive
  return text.length >= 15 && text.length <= 1000 && 
         (hasJobIndicators || text.split(' ').length >= 5);
};

// Comprehensive German requirement synonyms for better mapping
const requirementsSynonyms = [
  'anforderungen', 'requirements', 'qualifications', 'qualifikationen',
  'was du mitbringst', 'was sie mitbringen', 'was wir erwarten', 
  'dein profil', 'ihr profil', 'das profil', 'ihr werdegang',
  'voraussetzungen', 'was erforderlich ist', 'erwartungen',
  'das solltest du mitbringen', 'das sollten sie mitbringen',
  'das bringst du mit', 'das bringen sie mit',
  'must-have', 'must haves', 'nice-to-have', 'nice to haves',
  'hard skills', 'soft skills', 'fachliche anforderungen',
  'personliche anforderungen', 'fachkenntnisse', 'kenntnisse',
  'fahigkeiten', 'kompetenzen', 'skills', 'experience', 'erfahrung',
  'ausbildung', 'education', 'studium', 'abschluss', 'zertifikate',
  'what we expect', 'you have', 'you bring', 'we are looking for',
  'ideal candidate', 'profile', 'background', 'qualifikation'
];

const responsibilitiesSynonyms = [
  'aufgaben', 'tätigkeiten', 'stellenbeschreibung', 'responsibilities',
  'what you will do', 'your role', 'job duties', 'ihre aufgaben',
  'was sie erwartet', 'tätigkeitsprofil', 'ihre rolle', 'deine aufgaben',
  'das erwartet dich', 'das erwartet sie', 'arbeitsbereich', 
  'verantwortlichkeiten', 'tatigkeitsfeld', 'arbeitsplatz'
];

const benefitsSynonyms = [
  'wir bieten', 'vorteile', 'benefits', 'perks', 'what we offer',
  'our offer', 'unser angebot', 'zusatzleistungen', 'package',
  'das bieten wir', 'leistungen', 'vergutung', 'sozialleistungen'
];

const contractSynonyms = [
  'vertrag', 'anstellung', 'befristung', 'unbefristet', 'befristet',
  'vollzeit', 'teilzeit', 'freelance', 'contract', 'employment type',
  'arbeitszeit', 'vertragsart', 'festanstellung'
];

const applicationSynonyms = [
  'bewerbung', 'bewerbungsprozess', 'so bewerben sie sich', 
  'application process', 'how to apply', 'bewerbungsverfahren',
  'kontakt', 'ansprechpartner', 'bewerbungsunterlagen'
];

const stopKeywords = [
  'cookie', 'datenschutz', 'impressum', 'newsletter', 'ähnliche jobs',
  'similar jobs', 'privacy', 'imprint', 'contact', 'kontakt',
  'einloggen', 'anmelden', 'passwort vergessen', 'nutzervereinbarung',
  'datenschutzrichtlinie', 'mitglied werden', 'zurück', 'weiter',
  'vor', 'monat', 'woche', 'tag', 'linkedin', 'xing', 'facebook',
  'twitter', 'instagram', 'share', 'teilen', 'folgen', 'follow',
  'recommended', 'empfohlen', 'ähnliche stellen', 'weitere jobs',
  'job alert', 'job-alarm', 'newsletter', 'benachrichtigung',
  'schön dass sie wieder da sind', 'adresse telefon einblenden',
  'willkommen zurück', 'profil erstellen', 'konto erstellen'
];

// Enhanced filtering for UI/navigation elements - more comprehensive patterns
const uiFilterPatterns = [
  /einloggen|anmelden|passwort|login|sign in|log in/gi,
  /vor \d+ (monat|woche|tag|hour|stunde|minute)/gi,
  /nutzervereinbarung|datenschutz|cookie|privacy|agb|terms/gi,
  /zurück|weiter|next|previous|back|continue/gi,
  /mitglied werden|join|become a member|register|registrieren/gi,
  /linkedin|xing|facebook|twitter|instagram|whatsapp/gi,
  /teilen|share|folgen|follow|like|gefällt mir/gi,
  /ähnliche jobs|similar jobs|recommended|empfohlen|weitere stellen/gi,
  /job alert|job-alarm|benachrichtigung|notification|alerts/gi,
  /schön dass sie wieder da sind|willkommen zurück|welcome back/gi,
  /adresse|telefon einblenden|show contact|kontakt anzeigen/gi,
  /profil erstellen|konto erstellen|create account|create profile/gi,
  /bewertung|rating|stern|star|feedback/gi,
  /speichern|save|bookmark|merken|favorit/gi,
  /^(renk group|metropolregion|vor \d+|back|next|\d+ (monat|woche|tag))$/gi,
  /^\d+$|^(mehr|less|weniger)$/gi, // Just numbers or generic words
  /suchfilter|filter|sortieren|sort by/gi,
  /seite \d+|page \d+|^\d+ von \d+$/gi // Pagination
];

// Comprehensive HTML cleaning patterns
const htmlCleanPatterns = [
  /<[^>]*>/g, // All HTML tags
  /&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&hellip;|&trade;|&copy;|&reg;/g, // HTML entities
  /&[a-zA-Z0-9#]+;/g, // Other HTML entities
  /\s*\n\s*/g, // Line breaks with whitespace
  /\s+/g // Multiple spaces
];

const normalizeHeading = (text: string): string => {
  return text.toLowerCase()
    .replace(/[äöüß]/g, match => ({ 'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss' }[match] || match))
    .replace(/[^\w\s]/g, ' ')
    .trim();
};

const matchesSynonyms = (text: string, synonyms: string[]): boolean => {
  const normalized = normalizeHeading(text);
  
  // Skip if it matches UI filter patterns
  for (const pattern of uiFilterPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }
  
  return synonyms.some(synonym => normalized.includes(synonym));
};

const parseJsonLD = (html: string): Partial<JobData> => {
  const jsonLDMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  
  if (!jsonLDMatch) return {};
  
  try {
    for (const match of jsonLDMatch) {
      const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      const data = JSON.parse(jsonContent);
      
      // Handle array of objects or single object
      const jobPosting = Array.isArray(data) ? 
        data.find(item => item['@type'] === 'JobPosting') : 
        (data['@type'] === 'JobPosting' ? data : null);
      
      if (jobPosting) {
        const result: Partial<JobData> = {};
        
        if (jobPosting.title) result.jobtitel = stripHtmlTags(jobPosting.title);
        if (jobPosting.hiringOrganization?.name) result.arbeitgeber = stripHtmlTags(jobPosting.hiringOrganization.name);
        if (jobPosting.jobLocation?.address) {
          const address = jobPosting.jobLocation.address;
          result.ort = stripHtmlTags(typeof address === 'string' ? address : 
            `${address.addressLocality || ''} ${address.addressCountry || ''}`.trim());
        }
        if (jobPosting.description) result.beschreibung = stripHtmlTags(jobPosting.description).substring(0, 1000);
        if (jobPosting.employmentType) result.vertrag = stripHtmlTags(jobPosting.employmentType);
        
        // Extract structured requirements
        const requirements: string[] = [];
        if (jobPosting.qualifications) {
          const quals = Array.isArray(jobPosting.qualifications) ? 
            jobPosting.qualifications : [jobPosting.qualifications];
          quals.forEach((qual: any) => {
            if (typeof qual === 'string') requirements.push(stripHtmlTags(qual));
            else if (qual.name) requirements.push(stripHtmlTags(qual.name));
          });
        }
        if (jobPosting.experienceRequirements) {
          requirements.push(cleanText(jobPosting.experienceRequirements));
        }
        if (jobPosting.skills) {
          const skills = Array.isArray(jobPosting.skills) ? jobPosting.skills : [jobPosting.skills];
          skills.forEach((skill: any) => {
            if (typeof skill === 'string') requirements.push(cleanText(skill));
            else if (skill.name) requirements.push(cleanText(skill.name));
          });
        }
        if (requirements.length > 0) result.anforderungen = requirements;
        
        return result;
      }
    }
  } catch (e) {
    console.log('JSON-LD parsing failed:', e);
  }
  
  return {};
};

const extractSectionContent = (heading: any, doc: any): string[] => {
  const content: string[] = [];
  let currentElement = heading.nextElementSibling;
  let attempts = 0;
  
  while (currentElement && content.length < 15 && attempts < 8) {
    attempts++;
    
    // Stop if we hit another heading
    if (currentElement.tagName && currentElement.tagName.match(/^H[1-6]$/)) {
      const headingText = normalizeHeading(currentElement.textContent || '');
      if (stopKeywords.some((keyword: string) => headingText.includes(keyword))) break;
      if (matchesSynonyms(headingText, [...requirementsSynonyms, ...responsibilitiesSynonyms, ...benefitsSynonyms, ...contractSynonyms, ...applicationSynonyms])) break;
    }
    
    // Extract from structured lists
    if (currentElement.tagName === 'UL' || currentElement.tagName === 'OL') {
      const items = currentElement.querySelectorAll('li');
      items.forEach((item: any) => {
        const text = stripHtmlTags(item.textContent || '');
        if (isJobRelevantContent(text)) {
          content.push(text);
        }
      });
      break;
    }
    
    // Extract from paragraphs with bullet points or structured content
    if (currentElement.tagName === 'P' || currentElement.tagName === 'DIV') {
      const text = currentElement.textContent || '';
      
      // Handle bullet points
      if (text.includes('•') || text.includes('·') || text.includes('●') || 
          text.includes('-') || text.includes('–') || text.includes('—')) {
        const bulletPoints = text.split(/[•·●\-–—]/).filter((point: string) => {
          const cleaned = stripHtmlTags(point);
          return isJobRelevantContent(cleaned);
        });
        
        bulletPoints.forEach((point: string) => {
          const cleaned = stripHtmlTags(point);
          if (isJobRelevantContent(cleaned)) {
            content.push(cleaned);
          }
        });
        
        if (bulletPoints.length > 0) break;
      } 
      // Handle regular paragraph content
      else if (isJobRelevantContent(text)) {
        const cleaned = stripHtmlTags(text);
        if (isJobRelevantContent(cleaned)) {
          content.push(cleaned);
          break;
        }
      }
    }
    
    currentElement = currentElement.nextElementSibling;
  }
  
  return content;
};

// Enhanced UI element detection
const isUIElement = (text: string): boolean => {
  if (!text || text.length < 3) return true;
  
  const lowerText = text.toLowerCase().trim();
  
  // Check against UI filter patterns
  for (const pattern of uiFilterPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // Additional checks for common UI elements
  const uiKeywords = [
    'einloggen', 'anmelden', 'zurück', 'weiter', 'vor', 'monat', 'woche',
    'linkedin', 'xing', 'teilen', 'folgen', 'ähnliche jobs', 'empfehlung',
    'cookie', 'datenschutz', 'nutzung', 'agb', 'impressum', 'bewertung',
    'speichern', 'merken', 'favorit', 'bookmark', 'share', 'like',
    'schön dass sie wieder da sind', 'willkommen zurück', 'profil erstellen'
  ];
  
  // Check for UI keywords
  if (uiKeywords.some(keyword => lowerText.includes(keyword))) return true;
  
  // Check for generic patterns
  if (/^(vor \d+|back|next|\d+ (monat|woche|tag)|mehr|weniger|less)$/i.test(lowerText)) return true;
  if (/^\d+$/.test(lowerText)) return true; // Just numbers
  if (/^(share|like|follow|teilen|folgen)$/i.test(lowerText)) return true;
  
  return false;
};

const extractJobData = (html: string, url: string): JobData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  if (!doc) {
    throw new Error('Failed to parse HTML document');
  }

  // Remove problematic elements that contain UI/navigation content
  const elementsToRemove = [
    'script', 'style', 'nav', 'header', 'footer',
    '[class*="cookie"]', '[id*="cookie"]', '[class*="banner"]',
    '[class*="consent"]', '[id*="consent"]', '[class*="onetrust"]',
    '[class*="usercentrics"]', '[class*="didomi"]',
    '[class*="login"]', '[class*="signin"]', '[class*="auth"]',
    '[class*="navigation"]', '[class*="navbar"]', '[class*="menu"]',
    '[class*="breadcrumb"]', '[class*="sidebar"]', '[class*="aside"]',
    '[class*="recommendation"]', '[class*="similar"]', '[class*="related"]',
    '[aria-label*="navigation"]', '[aria-label*="menu"]'
  ];

  elementsToRemove.forEach(selector => {
    const elements = doc.querySelectorAll(selector);
    elements.forEach(el => {
      if (el && '_remove' in el && typeof el._remove === 'function') {
        (el as any)._remove();
      }
    });
  });

  // First try JSON-LD parsing
  const jsonLDData = parseJsonLD(html);
  console.log('JSON-LD extracted data:', jsonLDData);

  // Extract job title (Jobtitel)
  let jobtitel = jsonLDData.jobtitel || '';
  if (!jobtitel) {
    const titleSelectors = [
      'h1[class*="job"]', 'h1[class*="title"]', 'h1[class*="position"]',
      '[class*="job-title"]', '[class*="position-title"]', '[data-testid*="title"]',
      'h1', '.title', '.job-header h1'
    ];
    
    for (const selector of titleSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        jobtitel = stripHtmlTags(element.textContent);
        if (jobtitel.length > 5) break;
      }
    }
  }

  // Extract company name (Arbeitgeber) - enhanced filtering
  let arbeitgeber = jsonLDData.arbeitgeber || '';
  if (!arbeitgeber) {
    const companySelectors = [
      '[class*="company"]', '[class*="employer"]', '[data-testid*="company"]',
      '.company-name', '.employer-name', 'h2'
    ];
    
    for (const selector of companySelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        const companyText = stripHtmlTags(element.textContent);
        // Filter out LinkedIn UI elements and ensure it's a real company name
        if (companyText.length > 1 && companyText.length < 100 && 
            !isUIElement(companyText) && !companyText.toLowerCase().includes('linkedin')) {
          arbeitgeber = companyText;
          break;
        }
      }
    }

    // Fallback: extract company from URL
    if (!arbeitgeber) {
      try {
        const urlParts = new URL(url).hostname.split('.');
        if (urlParts.length > 1) {
          arbeitgeber = urlParts[urlParts.length - 2];
          arbeitgeber = arbeitgeber.charAt(0).toUpperCase() + arbeitgeber.slice(1);
        }
      } catch (e) {
        console.error('Error parsing URL for company:', e);
      }
    }
  }

  // Enhanced location extraction with postal code and address parsing
  let ort = jsonLDData.ort || '';
  let plz = '';
  let adresse = '';
  
  if (!ort) {
    const locationSelectors = [
      '[class*="location"]', '[class*="address"]', '[class*="city"]',
      '[data-testid*="location"]', '.job-location', '[class*="workplace"]',
      '[class*="standort"]', '.location', '.address', '.workplace-location',
      '[class*="office"]', '[class*="region"]', '[itemprop="addressLocality"]',
      '[itemprop="addressRegion"]', '[itemprop="postalCode"]', '[itemprop="streetAddress"]'
    ];
    
    let locationText = '';
    for (const selector of locationSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        const text = stripHtmlTags(element.textContent);
        if (text.length > 2 && !text.toLowerCase().includes('remote') && !text.toLowerCase().includes('hybrid')) {
          locationText = text;
          break;
        }
      }
    }
    
    // Parse location text for German format (PLZ Stadt)
    if (locationText) {
      // German postal code pattern: 5 digits followed by city name
      const plzCityMatch = locationText.match(/(\d{5})\s+([^,\n]+)/);
      if (plzCityMatch) {
        plz = plzCityMatch[1];
        ort = plzCityMatch[2].trim();
      } else {
        // Try to extract city name from other patterns
        const cityMatch = locationText.match(/(?:in\s+)?([A-ZÄÖÜ][a-zäöü\s-]+)/);
        if (cityMatch) {
          ort = cityMatch[1].trim();
        } else {
          ort = locationText.trim();
        }
      }
      
      // Try to find postal code separately if not found above
      if (!plz) {
        const plzMatch = locationText.match(/\b(\d{5})\b/);
        if (plzMatch) {
          plz = plzMatch[1];
        }
      }
      
      // Extract full address if available
      const addressPatterns = [
        /([A-ZÄÖÜ][a-zäöü\s-]+\s+\d+[a-z]?)/i, // Street and number
        /([A-ZÄÖÜ][a-zäöü\s-]+straße\s+\d+)/i, // German street pattern
        /([A-ZÄÖÜ][a-zäöü\s-]+weg\s+\d+)/i,    // German street pattern
        /([A-ZÄÖÜ][a-zäöü\s-]+platz\s+\d+)/i   // German square pattern
      ];
      
      for (const pattern of addressPatterns) {
        const addressMatch = locationText.match(pattern);
        if (addressMatch) {
          adresse = addressMatch[1].trim();
          break;
        }
      }
    }
  } else {
    // Parse existing ort field for PLZ and address
    const plzCityMatch = ort.match(/(\d{5})\s+([^,\n]+)/);
    if (plzCityMatch) {
      plz = plzCityMatch[1];
      ort = plzCityMatch[2].trim();
    }
  }
  
  // Enhanced search for company address - prioritize contact/footer sections
  if (!adresse) {
    const companyAddressSelectors = [
      // Structured data selectors
      '[itemprop="streetAddress"]', '[itemprop="address"]', 
      // Contact section selectors
      '.contact-address', '.company-address', '.office-address', 
      '.address', '.location-address', '.branch-address',
      // Footer selectors
      'footer .address', 'footer .contact', 'footer [class*="address"]',
      // Metadata and schema selectors
      '[class*="street"]', '[class*="address"]', 
      '[data-testid*="address"]', '[class*="kontakt"]', 
      '[class*="standort"]', '[class*="filiale"]',
      // General location selectors
      '.job-details .location', '.workplace-location'
    ];
    
    for (const selector of companyAddressSelectors) {
      const elements = doc.querySelectorAll(selector);
      
      for (const element of elements) {
        if (element?.textContent?.trim()) {
          const text = stripHtmlTags(element.textContent);
          
          // Skip if it's UI text or too short
          if (isUIElement(text) || text.length < 10) continue;
          
          // Look for German address patterns specifically
          const germanAddressPatterns = [
            // Standard German address: Street + Number
            /([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.?|weg|platz|allee|ring|gasse|damm|berg|hof|avenue)\s*\d+[a-z]?(?:\s*[-–]\s*\d+[a-z]?)?)/i,
            // Number first format
            /(\d+[a-z]?\s+[A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.?|weg|platz|allee|ring|gasse|damm|berg|hof))/i,
            // With house number range
            /([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.?|weg|platz|allee|ring|gasse|damm|berg|hof)\s*\d+[a-z]?(?:\s*[-–]\s*\d+[a-z]?)?)/i
          ];
          
          for (const pattern of germanAddressPatterns) {
            const addressMatch = text.match(pattern);
            if (addressMatch) {
              const potentialAddress = addressMatch[1].trim();
           // Enhanced validation to ensure it's a real address
           if (potentialAddress.length >= 10 && potentialAddress.length <= 100 &&
               /\d+/.test(potentialAddress) && // Must contain numbers
               /(straße|str|weg|platz|allee|ring|gasse|damm|berg|hof)/.test(potentialAddress.toLowerCase())) {
             adresse = potentialAddress;
             console.log('Found company address:', adresse);
             break;
           }
            }
          }
          
          if (adresse) break;
        }
      }
      
      if (adresse) break;
    }
    
    // Fallback: Search in contact or imprint pages content
    if (!adresse) {
      const allTextElements = doc.querySelectorAll('p, div, span, address');
      
      for (const element of allTextElements) {
        const text = stripHtmlTags(element.textContent || '');
        if (text.length < 15 || text.length > 300) continue;
        if (isUIElement(text)) continue;
        
        // Look specifically for address in contact contexts
        const lowerText = text.toLowerCase();
        if (lowerText.includes('kontakt') || lowerText.includes('anschrift') || 
            lowerText.includes('adresse') || lowerText.includes('standort') ||
            lowerText.includes('filiale') || lowerText.includes('büro')) {
          
          const addressPatterns = [
            /([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.?|weg|platz|allee|ring|gasse|damm|berg|hof)\s*\d+[a-z]?)/i,
            /(\d+[a-z]?\s+[A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.?|weg|platz|allee|ring|gasse|damm|berg|hof))/i
          ];
          
          for (const pattern of addressPatterns) {
            const match = text.match(pattern);
            if (match) {
              const potentialAddress = match[1].trim();
              if (potentialAddress.length > 10 && potentialAddress.length < 100) {
                adresse = potentialAddress;
                console.log('Found company address in context:', adresse);
                break;
              }
            }
          }
          
          if (adresse) break;
        }
      }
    }
  }

  // Extract requirements and other sections using comprehensive synonym matching
  let anforderungen: string[] = jsonLDData.anforderungen || [];
  const responsibilities: string[] = [];
  const benefits: string[] = [];
  let vertrag = jsonLDData.vertrag || '';
  let bewerbungsprozess = jsonLDData.bewerbungsprozess || '';
  
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"], .section-title, .heading');
  
  headings.forEach(heading => {
    const headingText = heading.textContent || '';
    const normalizedHeading = normalizeHeading(headingText);
    
    // Map ALL requirement variations to "Anforderungen"
    if (matchesSynonyms(normalizedHeading, requirementsSynonyms)) {
      const sectionContent = extractSectionContent(heading, doc);
      anforderungen.push(...sectionContent);
    } else if (matchesSynonyms(normalizedHeading, responsibilitiesSynonyms)) {
      const sectionContent = extractSectionContent(heading, doc);
      responsibilities.push(...sectionContent);
    } else if (matchesSynonyms(normalizedHeading, benefitsSynonyms)) {
      const sectionContent = extractSectionContent(heading, doc);
      benefits.push(...sectionContent);
    } else if (matchesSynonyms(normalizedHeading, contractSynonyms)) {
      const sectionContent = extractSectionContent(heading, doc);
      if (sectionContent.length > 0) {
        vertrag = sectionContent.join(', ');
      }
    } else if (matchesSynonyms(normalizedHeading, applicationSynonyms)) {
      const sectionContent = extractSectionContent(heading, doc);
      if (sectionContent.length > 0) {
        bewerbungsprozess = sectionContent.join(' ');
      }
    }
  });

  // Fallback: scan for requirement-like content if we didn't find enough
  if (anforderungen.length < 3) {
    const allLists = doc.querySelectorAll('ul, ol');
    allLists.forEach((list: any) => {
      const items = list.querySelectorAll('li');
      if (items.length > 0 && items.length < 15) {
        items.forEach((item: any) => {
          const text = stripHtmlTags(item.textContent || '');
          if (isJobRelevantContent(text)) {
            // Check if it looks like a requirement with enhanced validation
            const lowerText = text.toLowerCase();
            if (lowerText.includes('erfahrung') || lowerText.includes('experience') || 
                lowerText.includes('ausbildung') || lowerText.includes('degree') || 
                lowerText.includes('kenntniss') || lowerText.includes('skill') ||
                lowerText.includes('fähigkeit') || lowerText.includes('ability') ||
                lowerText.includes('bachelor') || lowerText.includes('master') ||
                lowerText.includes('jahr') || lowerText.includes('year') ||
                lowerText.includes('sprach') || lowerText.includes('language') ||
                lowerText.includes('studium') || lowerText.includes('certification') ||
                lowerText.includes('zertifikat') || lowerText.includes('qualifikation')) {
              anforderungen.push(text);
            }
          }
        });
      }
    });
  }

  // Extract description (Beschreibung) with enhanced filtering
  let beschreibung = jsonLDData.beschreibung || '';
  if (!beschreibung) {
    const descriptionSelectors = [
      '[class*="description"]:not([class*="meta"])', 
      '[class*="summary"]:not([class*="company"])', 
      '[class*="about"]:not([class*="company"])',
      '.job-description', '.job-content', 'main p:not([class*="nav"])'
    ];
    
    for (const selector of descriptionSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        const descText = stripHtmlTags(element.textContent);
        if (isJobRelevantContent(descText) && descText.length > 100) {
          beschreibung = descText.substring(0, 1500); // Increased limit for better descriptions
          break;
        }
      }
    }

    // Fallback: get main content but with stricter filtering
    if (!beschreibung) {
      const mainContent = doc.querySelector('main') || doc.querySelector('body');
      if (mainContent?.textContent) {
        const mainText = stripHtmlTags(mainContent.textContent);
        if (isJobRelevantContent(mainText)) {
          beschreibung = mainText.substring(0, 1500);
        }
      }
    }
  }

  // Deduplicate and clean results - preserve original content exactly
  const uniqueAnforderungen = [...new Set(anforderungen)]
    .filter(req => isJobRelevantContent(req))
    .slice(0, 12); // Reasonable limit

  console.log('Extracted data before validation:', {
    jobtitel: jobtitel ? jobtitel.substring(0, 50) + '...' : 'NOT FOUND',
    arbeitgeber: arbeitgeber ? arbeitgeber.substring(0, 30) + '...' : 'NOT FOUND',
    beschreibung: beschreibung ? beschreibung.substring(0, 100) + '...' : 'NOT FOUND',
    anforderungen: uniqueAnforderungen.length,
    ort: ort || 'NOT FOUND',
    plz: plz || 'NOT FOUND',
    adresse: adresse || 'NOT FOUND',
    vertrag: vertrag || 'NOT FOUND',
    bewerbungsprozess: bewerbungsprozess ? 'FOUND' : 'NOT FOUND'
  });

  // Debug: Check extracted fields
  console.log('[Debug] Extracted fields check:');
  console.log('  - Jobtitel:', jobtitel || 'MISSING');
  console.log('  - Arbeitgeber:', arbeitgeber || 'MISSING');
  console.log('  - Beschreibung length:', beschreibung ? beschreibung.length : 0);

  // Validate essential data
  if (!jobtitel || jobtitel.length < 3) {
    throw new Error('INCOMPLETE_SOURCE: Job title not found or too short');
  }
  
  if (!arbeitgeber || arbeitgeber.length < 2) {
    throw new Error('INCOMPLETE_SOURCE: Company name not found');
  }
  
  if (!beschreibung || beschreibung.length < 20) {
    throw new Error('INCOMPLETE_SOURCE: Job description too short or missing');
  }

  // Get current date in German format
  const currentDate = new Date();
  const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;

  return {
    jobtitel,
    arbeitgeber,
    ort: ort || '', // This will be overridden by user's city
    adresse: adresse || '', // Empty string if no address found
    datum: formattedDate,
    plz: plz || undefined,
    vertrag: vertrag || undefined,
    beschreibung,
    anforderungen: uniqueAnforderungen,
    bewerbungsprozess: bewerbungsprozess || undefined
  };
};

// Function to extract job data from raw text using AI-like parsing
const extractJobDataFromText = async (rawText: string): Promise<JobData> => {
  console.log('Extracting job data from raw text');
  
  const text = rawText.toLowerCase();
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let jobtitel = '';
  let arbeitgeber = '';
  let ort = '';
  let plz = '';
  let adresse = '';
  let vertrag = '';
  let beschreibung = '';
  let anforderungen: string[] = [];
  let bewerbungsprozess = '';
  
  // Extract job title (usually the first substantial line or contains job-related terms)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 10 && line.length < 100 && 
        (line.includes('engineer') || line.includes('developer') || line.includes('manager') || 
         line.includes('analyst') || line.includes('specialist') || line.includes('consultant') ||
         line.includes('(m/w/d)') || line.includes('(w/m/d)') || line.includes('(m/w)') ||
         /\b(ing|tech|soft|web|data|product|project|sales|marketing|hr|finance)\b/i.test(line))) {
      jobtitel = line;
      break;
    }
  }
  
  // If no job title found, use the first meaningful line
  if (!jobtitel && lines.length > 0) {
    jobtitel = lines[0];
  }
  
  // Extract company name (often follows job title or is mentioned early)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    if (line !== jobtitel && line.length > 2 && line.length < 80 &&
        (line.includes('gmbh') || line.includes('ag') || line.includes('inc') || 
         line.includes('corp') || line.includes('ltd') || line.includes('company') ||
         /^[A-Z][a-zA-Z\s&-]+(?:GmbH|AG|Inc|Corp|Ltd|Company)?\s*$/i.test(line))) {
      arbeitgeber = line;
      break;
    }
  }
  
  // Extract location, PLZ, and address from text
  for (const line of lines) {
    // Look for German city patterns
    const cityMatch = line.match(/\b(münchen|berlin|hamburg|köln|frankfurt|stuttgart|düsseldorf|dortmund|essen|leipzig|dresden|hannover|nürnberg|wien|zürich|london|paris|amsterdam|remote|homeoffice)\b/i);
    if (cityMatch) {
      ort = cityMatch[1];
    }
    
    // Look for PLZ (German postal code patterns)
    const plzMatch = line.match(/\b(\d{5})\b/);
    if (plzMatch && !plz) {
      plz = plzMatch[1];
    }
    
    // Look for street addresses
    const addressPatterns = [
      /([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.?|weg|platz|allee|ring|gasse|damm|berg|hof)\s*\d+[a-z]?)/i,
      /(\d+[a-z]?\s+[A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.?|weg|platz|allee|ring|gasse|damm|berg|hof))/i
    ];
    
    if (!adresse) {
      for (const pattern of addressPatterns) {
        const addressMatch = line.match(pattern);
        if (addressMatch) {
          adresse = addressMatch[1].trim();
          break;
        }
      }
    }
    
    // Combined PLZ + City pattern
    const plzCityMatch = line.match(/(\d{5})\s+([A-ZÄÖÜ][a-zäöüß\s-]+)/);
    if (plzCityMatch) {
      plz = plzCityMatch[1];
      ort = plzCityMatch[2].trim();
    }
  }
  
  // Extract contract type
  for (const line of lines) {
    if (/\b(vollzeit|teilzeit|freelance|contract|festanstellung|befristet|unbefristet|full.?time|part.?time|remote|hybrid)\b/i.test(line)) {
      vertrag = line;
      break;
    }
  }
  
  // Extract description (combine multiple paragraphs, excluding requirements sections)
  let descriptionLines: string[] = [];
  let inRequirements = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip if we're in requirements section
    if (lowerLine.includes('anforderung') || lowerLine.includes('qualifikation') || 
        lowerLine.includes('requirement') || lowerLine.includes('skills') ||
        lowerLine.includes('was du mitbringst') || lowerLine.includes('what you bring')) {
      inRequirements = true;
      continue;
    }
    
    // Reset if we hit a new section
    if (lowerLine.includes('aufgaben') || lowerLine.includes('responsibilities') ||
        lowerLine.includes('was wir bieten') || lowerLine.includes('benefits')) {
      inRequirements = false;
    }
    
    if (!inRequirements && line.length > 20 && 
        !line.includes(jobtitel) && !line.includes(arbeitgeber)) {
      descriptionLines.push(line);
    }
  }
  
  beschreibung = descriptionLines.slice(0, 5).join(' '); // Limit description length
  
  // Extract requirements
  let inReqSection = false;
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('anforderung') || lowerLine.includes('qualifikation') || 
        lowerLine.includes('requirement') || lowerLine.includes('skills') ||
        lowerLine.includes('was du mitbringst') || lowerLine.includes('what you bring') ||
        lowerLine.includes('dein profil') || lowerLine.includes('your profile')) {
      inReqSection = true;
      continue;
    }
    
    if (inReqSection) {
      if (lowerLine.includes('wir bieten') || lowerLine.includes('benefits') ||
          lowerLine.includes('aufgaben') || lowerLine.includes('responsibilities')) {
        break;
      }
      
      if (line.length > 5 && line.length < 200) {
        anforderungen.push(line);
      }
    }
  }
  
  // Extract application process
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('bewerbung') || lowerLine.includes('application') ||
        lowerLine.includes('bewerben') || lowerLine.includes('apply') ||
        lowerLine.includes('kontakt') || lowerLine.includes('contact')) {
      bewerbungsprozess = line;
      break;
    }
  }
  
  // Debug: Check extracted fields (text extraction)
  console.log('[Debug] Text extraction fields check:');
  console.log('  - Jobtitel:', jobtitel || 'MISSING');
  console.log('  - Arbeitgeber:', arbeitgeber || 'MISSING');
  console.log('  - Beschreibung length:', beschreibung ? beschreibung.length : 0);
  
  // Validate essential data
  if (!jobtitel || jobtitel.length < 3) {
    throw new Error('INCOMPLETE_SOURCE: Job title not found or too short');
  }
  
  if (!arbeitgeber || arbeitgeber.length < 2) {
    throw new Error('INCOMPLETE_SOURCE: Company name not found');
  }
  
  if (!beschreibung || beschreibung.length < 20) {
    throw new Error('INCOMPLETE_SOURCE: Job description too short or missing');
  }

  // Get current date in German format
  const currentDate = new Date();
  const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;

  return {
    jobtitel: jobtitel.trim(),
    arbeitgeber: arbeitgeber.trim(),
    ort: ort.trim(),
    adresse: adresse.trim() || '', // Empty string if no address found
    datum: formattedDate,
    plz: plz.trim() || undefined,
    vertrag: vertrag.trim() || undefined,
    beschreibung: beschreibung.trim(),
    anforderungen: anforderungen.slice(0, 10), // Limit to 10 requirements
    bewerbungsprozess: bewerbungsprozess.trim() || undefined
  };
};

/**
 * GPT-powered semantic extraction fallback for unstructured job listings
 * @param rawContent - Raw HTML or text content
 * @param userCity - Optional user city to override location
 * @returns Promise<JobData> - Extracted job data
 * @throws Error if GPT extraction fails or returns incomplete data
 */
async function extractJobDataViaGPT(rawContent: string, userCity?: string): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  console.log(`[ScrapeJob] ${new Date().toISOString()} — Local extraction failed — using GPT semantic parser`);
  
  // Truncate content to prevent excessive costs
  const MAX_GPT_CHARS = 15000;
  let plainText = stripHtmlTags(rawContent);
  
  if (plainText.length > MAX_GPT_CHARS) {
    console.log(`[ScrapeJob] ${new Date().toISOString()} — Truncating text for GPT (${plainText.length} → ${MAX_GPT_CHARS} chars)`);
    plainText = plainText.substring(0, MAX_GPT_CHARS);
  }
  
  const gptPrompt = `You are a precise information extractor. 
Extract the following fields from this raw job listing text or HTML:
- jobtitel (position title)
- arbeitgeber (employer/company name)
- beschreibung (main job description, short but detailed)
- ort (location city, if visible)
- adresse (full address if available)
- plz (postal code if available)
- anforderungen (requirements as array of strings, summarized)
- bewerbungsprozess (application process instructions if mentioned)
- vertrag (contract type: vollzeit, teilzeit, freelance, etc.)

Rules:
- Respond ONLY in valid JSON format.
- Omit fields that are missing rather than guessing.
- Do not invent any data.
- For anforderungen, return an array of strings.
- Keep beschreibung concise but informative (2-3 sentences).

Example output:
{
  "jobtitel": "Senior Software Engineer",
  "arbeitgeber": "TechCorp GmbH",
  "beschreibung": "We seek an experienced engineer to lead our backend team...",
  "ort": "Berlin",
  "anforderungen": ["5+ years experience", "Python expertise", "Team leadership"]
}`;

  try {
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are a structured data extractor. Always respond with valid JSON only.' },
          { role: 'user', content: gptPrompt + '\n\nRAW CONTENT:\n' + plainText }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!gptResponse.ok) {
      throw new Error(`OpenAI API returned ${gptResponse.status}: ${gptResponse.statusText}`);
    }

    const gptData = await gptResponse.json();
    let content = gptData?.choices?.[0]?.message?.content?.trim() || '';
    
    if (!content) {
      throw new Error('GPT returned empty response');
    }

    // Sanitize markdown code blocks (GPT sometimes wraps JSON in ```json ... ```)
    content = content.replace(/^```(json)?|```$/g, '').trim();

    let gptJson;
    try {
      gptJson = JSON.parse(content);
    } catch (err) {
      console.log(`[ScrapeJob] ${new Date().toISOString()} — GPT output not valid JSON:`, content.substring(0, 200));
      throw new Error('GPT output parsing failed');
    }

    // Validate essential fields
    if (!gptJson?.jobtitel || !gptJson?.arbeitgeber) {
      console.log(`[ScrapeJob] ${new Date().toISOString()} — GPT extraction incomplete (missing title or employer)`);
      throw new Error('GPT extraction incomplete');
    }

    console.log(`[ScrapeJob] ${new Date().toISOString()} — ✅ GPT extraction fallback triggered successfully`);

    // Format and normalize data
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;

    return {
      jobtitel: gptJson.jobtitel.trim(),
      arbeitgeber: gptJson.arbeitgeber.trim(),
      ort: userCity?.trim() || gptJson.ort?.trim() || '',
      adresse: gptJson.adresse?.trim() || '',
      datum: userCity ? `${userCity.trim()}, ${formattedDate}` : formattedDate,
      plz: gptJson.plz?.trim() || undefined,
      vertrag: gptJson.vertrag?.trim() || undefined,
      beschreibung: gptJson.beschreibung?.trim() || '',
      anforderungen: Array.isArray(gptJson.anforderungen) ? gptJson.anforderungen.slice(0, 10) : [],
      bewerbungsprozess: gptJson.bewerbungsprozess?.trim() || undefined
    };

  } catch (error) {
    console.error(`[ScrapeJob] ${new Date().toISOString()} — GPT extraction failed:`, error);
    throw error;
  }
}

/**
 * Fetches HTML content from a URL with intelligent fallback mechanisms
 * @param url - The URL to fetch
 * @param supabaseClient - Optional Supabase client for caching
 * @returns Promise<string> - The HTML content
 * @throws Error with code prefix (FETCH_ERROR, BLOCKED, TIMEOUT)
 */
async function fetchHTML(url: string, supabaseClient?: any): Promise<string> {
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB limit
  const TIMEOUT = 15000; // 15 seconds
  const CACHE_BUCKET = 'scraper_cache';
  const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  
  // Generate cache key from URL
  async function getCacheKey(url: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(url);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Try to fetch from cache
  async function fetchFromCache(): Promise<string | null> {
    if (!supabaseClient) return null;
    
    try {
      const cacheKey = await getCacheKey(url);
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Checking cache for ${cacheKey}`);
      
      const { data, error } = await supabaseClient.storage
        .from(CACHE_BUCKET)
        .download(cacheKey);
      
      if (error || !data) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Cache miss`);
        return null;
      }
      
      const text = await data.text();
      const cached = JSON.parse(text);
      
      // Check if cache is still valid (< 24h old)
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge < CACHE_DURATION_MS) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Cache hit (age: ${Math.round(cacheAge / 1000 / 60)}m)`);
        return cached.html;
      }
      
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Cache expired (age: ${Math.round(cacheAge / 1000 / 60 / 60)}h)`);
      return null;
    } catch (error) {
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Cache check failed:`, error);
      return null;
    }
  }
  
  // Save to cache
  async function saveToCache(html: string): Promise<void> {
    if (!supabaseClient) return;
    
    try {
      const cacheKey = await getCacheKey(url);
      const cacheData = {
        url,
        html,
        timestamp: Date.now()
      };
      
      const blob = new Blob([JSON.stringify(cacheData)], { type: 'application/json' });
      
      await supabaseClient.storage
        .from(CACHE_BUCKET)
        .upload(cacheKey, blob, { upsert: true });
      
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Cached HTML (${html.length} chars)`);
    } catch (error) {
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Cache save failed:`, error);
    }
  }
  
  // Check cache first
  const cachedHtml = await fetchFromCache();
  if (cachedHtml) {
    return cachedHtml;
  }
  
  // Modern browser headers with Sec-Ch-Ua
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-Ch-Ua': '"Chromium";v="125"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"'
  };
  
  // Add referer based on URL origin
  try {
    const urlObj = new URL(url);
    browserHeaders['Referer'] = urlObj.origin;
  } catch (e) {
    console.log('Could not parse URL for referer:', e);
  }
  
  /**
   * Detects if HTML is blocked by Cloudflare, CAPTCHA, or anti-bot systems
   * Returns the detected pattern for debugging
   */
  function isBlocked(html: string): { blocked: boolean; pattern?: string } {
    const blockIndicators = [
      { pattern: /cloudflare/i, name: 'Cloudflare' },
      { pattern: /captcha/i, name: 'CAPTCHA' },
      { pattern: /enable\s+javascript/i, name: 'JavaScript required' },
      { pattern: /access\s+denied/i, name: 'Access denied' },
      { pattern: /bot\s+detection/i, name: 'Bot detection' },
      { pattern: /please\s+verify\s+you\s+are\s+human/i, name: 'Human verification' },
      { pattern: /security\s+check/i, name: 'Security check' },
      { pattern: /ray\s+id:/i, name: 'Cloudflare Ray ID' },
      { pattern: /cf-browser-verification/i, name: 'Cloudflare verification' },
      { pattern: /just\s+a\s+moment/i, name: 'Cloudflare challenge' },
      { pattern: /checking\s+your\s+browser/i, name: 'Browser check' }
    ];
    
    for (const indicator of blockIndicators) {
      if (indicator.pattern.test(html)) {
        return { blocked: true, pattern: indicator.name };
      }
    }
    
    return { blocked: false };
  }
  
  /**
   * Validates HTML content quality
   */
  function isValidHTML(html: string): { valid: boolean; reason?: string } {
    if (!html || html.length < 500) {
      return { valid: false, reason: `Too short (${html.length} chars)` };
    }
    
    if (!/<html/i.test(html)) {
      return { valid: false, reason: 'No <html> tag found' };
    }
    
    // Check for malformed HTML by counting tags
    const tagCount = html.split('<').length - 1;
    if (tagCount < 50) {
      return { valid: false, reason: `Malformed HTML (only ${tagCount} tags)` };
    }
    
    const blockCheck = isBlocked(html);
    if (blockCheck.blocked) {
      return { valid: false, reason: `Blocked: ${blockCheck.pattern}` };
    }
    
    return { valid: true };
  }
  
  /**
   * Attempt direct fetch with timeout
   */
  async function directFetch(): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    try {
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Attempting direct fetch`);
      
      const response = await fetch(url, {
        headers: browserHeaders,
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let html = await response.text();
      
      // Truncate if too large
      if (html.length > MAX_SIZE) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Truncating HTML from ${html.length} to ${MAX_SIZE} bytes`);
        html = html.substring(0, MAX_SIZE);
      }
      
      return html;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`TIMEOUT: Request timed out after ${TIMEOUT / 1000} seconds`);
      }
      
      throw error;
    }
  }
  
  /**
   * Fallback: Use Jina.ai Reader proxy with retry logic
   */
  async function proxyFetch(retryCount = 0): Promise<string> {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000; // 1 second
    
    const proxyUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    try {
      if (retryCount === 0) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Attempting fallback via Jina.ai reader proxy`);
      } else {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Proxy retry #${retryCount}`);
      }
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (compatible; JobFlow/1.0)'
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      // Retry on rate limit or server error
      if ((response.status === 429 || response.status >= 500) && retryCount < MAX_RETRIES) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Proxy returned ${response.status}, retrying after ${RETRY_DELAY}ms`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return proxyFetch(retryCount + 1);
      }
      
      if (!response.ok) {
        throw new Error(`Proxy returned HTTP ${response.status}`);
      }
      
      let html = await response.text();
      
      // Retry if response is too short
      if (html.length < 500 && retryCount < MAX_RETRIES) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Proxy returned too-short HTML (${html.length} chars), retrying`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return proxyFetch(retryCount + 1);
      }
      
      // Truncate if too large
      if (html.length > MAX_SIZE) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Truncating proxy HTML from ${html.length} to ${MAX_SIZE} bytes`);
        html = html.substring(0, MAX_SIZE);
      }
      
      return html;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT: Proxy request timed out');
      }
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES && !error.message.includes('HTTP')) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Proxy error: ${error.message}, retrying`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return proxyFetch(retryCount + 1);
      }
      
      throw error;
    }
  }
  
  // Main fetch logic with fallback and caching
  try {
    let html = await directFetch();
    
    const validation = isValidHTML(html);
    
    if (validation.valid) {
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Direct fetch successful: ${html.length} chars`);
      await saveToCache(html);
      return html;
    }
    
    // If blocked or invalid, try proxy fallback
    console.log(`[ScrapeJob] ${new Date().toISOString()} — Direct fetch invalid: ${validation.reason}, trying proxy`);
    html = await proxyFetch();
    
    const proxyValidation = isValidHTML(html);
    if (proxyValidation.valid) {
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Proxy fetch successful: ${html.length} chars`);
      await saveToCache(html);
      return html;
    }
    
    throw new Error(`BLOCKED: Both direct and proxy fetch returned invalid content (${proxyValidation.reason})`);
    
  } catch (error) {
    // Try proxy as last resort if direct fetch failed completely
    if (error.message && !error.message.startsWith('BLOCKED') && !error.message.includes('Proxy returned')) {
      try {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Direct fetch failed, attempting proxy fallback`);
        const html = await proxyFetch();
        
        const validation = isValidHTML(html);
        if (validation.valid) {
          console.log(`[ScrapeJob] ${new Date().toISOString()} — Proxy fallback successful: ${html.length} chars`);
          await saveToCache(html);
          return html;
        }
        
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Proxy fallback invalid: ${validation.reason}`);
      } catch (proxyError) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Proxy fallback failed:`, proxyError);
      }
    }
    
    // Format error message
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`FETCH_ERROR: ${errorMsg}`);
  }
}

// Optional: Placeholder for future Puppeteer rendering service
// Uncomment and configure when deploying a separate rendering service
/*
async function renderServiceFetch(url: string): Promise<string> {
  const RENDER_SERVICE_URL = Deno.env.get('RENDER_SERVICE_URL');
  
  if (!RENDER_SERVICE_URL) {
    throw new Error('Render service not configured');
  }
  
  const response = await fetch(`${RENDER_SERVICE_URL}?url=${encodeURIComponent(url)}`, {
    headers: { 'Authorization': `Bearer ${Deno.env.get('RENDER_SERVICE_KEY')}` }
  });
  
  if (!response.ok) {
    throw new Error(`Render service returned ${response.status}`);
  }
  
  return await response.text();
}
*/

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { url, rawText, userCity } = await req.json();
    
    // Handle raw text processing
    if (rawText && rawText.trim()) {
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Processing raw job text (${rawText.length} chars)`);
      
      try {
        const jobData = await extractJobDataFromText(rawText);
        
        // Override location with user's city if provided
        if (userCity && userCity.trim()) {
          jobData.ort = userCity.trim();
          // Update datum to include user's city
          const currentDate = new Date();
          const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;
          jobData.datum = `${userCity.trim()}, ${formattedDate}`;
        }
        
        // Return both formats
        const structuredResponse = {
          jobtitel: jobData.jobtitel,
          arbeitgeber: jobData.arbeitgeber,
          adresse: jobData.adresse,
          ort: jobData.ort,
          datum: jobData.datum
        };
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            jobData: jobData, // Full job data for app functionality
            structuredData: structuredResponse, // Structured format as requested
            message: 'Job data extracted successfully from text'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (extractError) {
        console.error(`[ScrapeJob] ${new Date().toISOString()} — Error extracting job data from text:`, extractError);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            code: 'TEXT_PROCESSING_ERROR',
            message: 'Der Text konnte nicht verarbeitet werden. Bitte überprüfe, ob es sich um eine vollständige Stellenausschreibung handelt.'
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, message: 'URL oder Text ist erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ScrapeJob] ${new Date().toISOString()} — Scraping job URL: ${url}`);

    // Check if URL is from LinkedIn - LinkedIn blocks automated scraping
    if (url.includes('linkedin.com')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: 'LINKEDIN_BLOCKED',
          message: 'LinkedIn blockiert automatisierte Zugriffe. Bitte kopieren Sie den Stelleninhalt manuell oder verwenden Sie einen anderen Job-Portal Link (z.B. StepStone, Xing, Indeed).'
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch HTML using new robust fetchHTML utility with caching
    let html = '';
    try {
      html = await fetchHTML(url, supabaseClient);
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Fetched ${html.length} chars from ${url}`);
      
      // Auto-fallback: if HTML is too short (<8000 chars), try text extraction
      if (html.length < 8000) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — HTML too short (${html.length} chars) — forcing text extraction fallback`);
        try {
          const plainText = stripHtmlTags(html);
          const textJobData = await extractJobDataFromText(plainText);
          
          // Validate that we got essential data
          if (textJobData && textJobData.jobtitel && textJobData.arbeitgeber) {
            console.log(`[ScrapeJob] ${new Date().toISOString()} — Text-based fallback successful`);
            
            // Override location with user's city if provided
            if (userCity && userCity.trim()) {
              textJobData.ort = userCity.trim();
              const currentDate = new Date();
              const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;
              textJobData.datum = `${userCity.trim()}, ${formattedDate}`;
            }
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                jobData: textJobData,
                structuredData: {
                  jobtitel: textJobData.jobtitel,
                  arbeitgeber: textJobData.arbeitgeber,
                  adresse: textJobData.adresse,
                  ort: textJobData.ort,
                  datum: textJobData.datum
                },
                message: 'Job data extracted via text fallback'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            console.log(`[ScrapeJob] ${new Date().toISOString()} — Text fallback incomplete (missing title or employer), trying HTML extraction`);
          }
        } catch (e) {
          console.log(`[ScrapeJob] ${new Date().toISOString()} — Fallback extraction failed:`, e);
        }
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[ScrapeJob] ${new Date().toISOString()} — fetchHTML failed:`, errorMsg);
      
      // Build user-friendly error message
      let userMessage = 'Die Job-Seite konnte nicht geladen werden. ';
      let errorCode = 'FETCH_ERROR';
      
      if (errorMsg.includes('BLOCKED')) {
        errorCode = 'BLOCKED';
        userMessage += 'Diese Website blockiert automatisierte Zugriffe. Bitte kopieren Sie den Stelleninhalt manuell oder versuchen Sie einen direkteren Link.';
      } else if (errorMsg.includes('TIMEOUT')) {
        errorCode = 'TIMEOUT';
        userMessage += 'Die Seite antwortet nicht. Bitte versuchen Sie es später erneut.';
      } else if (errorMsg.includes('404')) {
        errorCode = 'NOT_FOUND';
        userMessage += 'Die Stellenausschreibung wurde nicht gefunden. Bitte überprüfen Sie den Link.';
      } else if (errorMsg.includes('403')) {
        errorCode = 'FORBIDDEN';
        userMessage += 'Der Zugriff auf diese Seite wurde verweigert.';
      } else {
        userMessage += 'Möglicherweise verwendet diese Website erweiterte Bot-Erkennung.';
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: errorCode,
          message: userMessage,
          details: errorMsg,
          suggestion: 'Versuchen Sie einen direkten Link zur Stellenausschreibung oder kopieren Sie den Text manuell.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract job data with multi-layer fallback
    console.log(`[ScrapeJob] ${new Date().toISOString()} — Extraction pipeline: HTML → Text → GPT`);
    
    let jobData;
    try {
      jobData = await extractJobData(html, url);
      console.log(`[ScrapeJob] ${new Date().toISOString()} — Extracted job data:`, {
        jobtitel: jobData.jobtitel,
        arbeitgeber: jobData.arbeitgeber,
        ort: jobData.ort,
        anforderungen: jobData.anforderungen.length,
        beschreibung: jobData.beschreibung ? jobData.beschreibung.substring(0, 100) + '...' : 'N/A',
        bewerbungsprozess: jobData.bewerbungsprozess ? 'Present' : 'N/A'
      });
      
      // Validate extracted fields - trigger GPT fallback if empty
      if (!jobData?.jobtitel || !jobData?.arbeitgeber || jobData.jobtitel.length < 3) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — HTML extraction returned empty fields — invoking GPT fallback`);
        try {
          jobData = await extractJobDataViaGPT(html, userCity);
          console.log(`[ScrapeJob] ${new Date().toISOString()} — ✅ GPT fallback successful after empty HTML extraction`);
        } catch (gptError) {
          console.error(`[ScrapeJob] ${new Date().toISOString()} — GPT fallback failed:`, gptError);
          throw new Error('INCOMPLETE_SOURCE: GPT fallback failed');
        }
      }
    } catch (extractError) {
      console.error(`[ScrapeJob] ${new Date().toISOString()} — HTML extraction failed:`, extractError);
      
      // Step 1: Try text-based extraction
      if (extractError instanceof Error && extractError.message.includes('INCOMPLETE_SOURCE')) {
        console.log(`[ScrapeJob] ${new Date().toISOString()} — Attempting text-based extraction fallback`);
        
        try {
          const plainText = stripHtmlTags(html);
          jobData = await extractJobDataFromText(plainText);
          
          console.log(`[ScrapeJob] ${new Date().toISOString()} — Text extraction successful`);
          
          // Validate text extraction results - trigger GPT if empty
          if (!jobData?.jobtitel || !jobData?.arbeitgeber || jobData.jobtitel.length < 3) {
            console.log(`[ScrapeJob] ${new Date().toISOString()} — Text extraction incomplete — invoking GPT fallback`);
            try {
              jobData = await extractJobDataViaGPT(html, userCity);
              console.log(`[ScrapeJob] ${new Date().toISOString()} — ✅ GPT fallback successful (after incomplete text extraction)`);
            } catch (gptError) {
              console.error(`[ScrapeJob] ${new Date().toISOString()} — ❌ GPT fallback failed:`, gptError);
              throw new Error('INCOMPLETE_SOURCE: GPT fallback failed');
            }
          } else {
            // Override location with user's city if provided
            if (userCity && userCity.trim()) {
              jobData.ort = userCity.trim();
              const currentDate = new Date();
              const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;
              jobData.datum = `${userCity.trim()}, ${formattedDate}`;
            }
          }
        } catch (textError) {
          console.log(`[ScrapeJob] ${new Date().toISOString()} — Text extraction also failed:`, textError);
          
          // Step 2: Try GPT semantic extraction as final fallback
          try {
            jobData = await extractJobDataViaGPT(html, userCity);
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                jobData: jobData,
                structuredData: {
                  jobtitel: jobData.jobtitel,
                  arbeitgeber: jobData.arbeitgeber,
                  adresse: jobData.adresse,
                  ort: jobData.ort,
                  datum: jobData.datum
                },
                message: 'Job data extracted via GPT semantic parser'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (gptError) {
            console.error(`[ScrapeJob] ${new Date().toISOString()} — ❌ GPT extraction also failed:`, gptError);
            
            // All extraction methods failed - return error
            return new Response(
              JSON.stringify({ 
                success: false, 
                code: 'INCOMPLETE_SOURCE',
                message: 'Die Seite lieferte unvollständige Daten (z. B. kein Titel, Arbeitgeber oder Text). Bitte versuchen Sie es mit einem anderen Link oder kopieren Sie den Text manuell.'
              }),
              { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } else {
        // Non-INCOMPLETE_SOURCE error - still try GPT as final attempt
        console.log(`[ScrapeJob] ${new Date().toISOString()} — HTML extraction error (non-INCOMPLETE) — final GPT attempt`);
        try {
          jobData = await extractJobDataViaGPT(html, userCity);
          console.log(`[ScrapeJob] ${new Date().toISOString()} — ✅ Final GPT fallback successful`);
          
          return new Response(
            JSON.stringify({
              success: true,
              jobData,
              structuredData: {
                jobtitel: jobData.jobtitel,
                arbeitgeber: jobData.arbeitgeber,
                adresse: jobData.adresse,
                ort: jobData.ort,
                datum: jobData.datum
              },
              message: 'Job data extracted via GPT fallback'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (gptFinalError) {
          console.error(`[ScrapeJob] ${new Date().toISOString()} — ❌ Final GPT fallback failed:`, gptFinalError);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Error processing job page content.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Usage tracking removed - function is now public

    // Override location with user's city if provided
    if (userCity && userCity.trim()) {
      jobData.ort = userCity.trim();
      // Update datum to include user's city
      const currentDate = new Date();
      const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;
      jobData.datum = `${userCity.trim()}, ${formattedDate}`;
    }

    // Return both the structured format requested by user AND the full job data needed by the app
    const structuredResponse = {
      jobtitel: jobData.jobtitel,
      arbeitgeber: jobData.arbeitgeber,
      adresse: jobData.adresse,
      ort: jobData.ort,
      datum: jobData.datum
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobData: jobData, // Full job data for app functionality
        structuredData: structuredResponse, // Structured format as requested
        message: 'Job data extracted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[ScrapeJob] ${new Date().toISOString()} — Error in scrape-job function:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});