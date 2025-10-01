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

  // Validate essential data
  if (!jobtitel || jobtitel.length < 3) {
    throw new Error('INCOMPLETE_SOURCE: Job title not found or too short');
  }
  
  if (!arbeitgeber || arbeitgeber.length < 2) {
    throw new Error('INCOMPLETE_SOURCE: Company name not found');
  }
  
  if (!beschreibung || beschreibung.length < 50) {
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
      console.log('Processing raw job text (length:', rawText.length, ')');
      
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
        console.error('Error extracting job data from text:', extractError);
        
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

    console.log('Scraping job URL:', url);

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

    // Enhanced job page fetching with multiple strategies
    let html = '';
    let lastError: Error | null = null;
    
    const baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };

    // Try multiple fetch strategies
    const strategies = [
      // Strategy 1: Standard fetch
      () => fetch(url, { 
        headers: baseHeaders,
        method: 'GET'
      }),
      
      // Strategy 2: With referrer
      () => fetch(url, { 
        headers: { 
          ...baseHeaders, 
          'Referer': new URL(url).origin 
        },
        method: 'GET'
      }),
      
      // Strategy 3: Simplified headers
      () => fetch(url, { 
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobFlow/1.0; +https://jobflow.app)',
          'Accept': 'text/html'
        },
        method: 'GET'
      })
    ];

    for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
      try {
        console.log(`Trying fetch strategy ${strategyIndex + 1} for URL:`, url);
        
        // Add delay between strategies
        if (strategyIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000 * strategyIndex));
        }
        
        const response = await strategies[strategyIndex]();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        html = await response.text();
        
        if (html.length < 500) {
          throw new Error(`Response too short (${html.length} chars), likely blocked or empty`);
        }
        
        console.log(`Strategy ${strategyIndex + 1} successful: fetched ${html.length} characters`);
        break; // Success, exit strategy loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Strategy ${strategyIndex + 1} failed:`, lastError.message);
        
        // Don't retry for certain errors
        if (lastError.message.includes('404') || lastError.message.includes('403')) {
          console.log('Stopping retries due to client error');
          break;
        }
      }
    }

    // If all strategies failed
    if (!html || html.length < 500) {
      console.error('All fetch strategies failed. Last error:', lastError);
      
      let errorMessage = 'Die Job-Seite konnte nicht geladen werden. ';
      
      if (lastError?.message?.includes('http2 error') || lastError?.message?.includes('stream error')) {
        errorMessage += 'Diese Website blockiert automatisierte Zugriffe. Bitte versuchen Sie einen anderen Job-Link oder warten Sie einige Minuten bevor Sie es erneut versuchen.';
      } else if (lastError?.message?.includes('404')) {
        errorMessage += 'Die Stellenausschreibung wurde nicht gefunden. Bitte überprüfen Sie den Link.';
      } else if (lastError?.message?.includes('403')) {
        errorMessage += 'Der Zugriff auf diese Seite wurde verweigert. Diese Website erlaubt keine automatisierten Zugriffe.';
      } else if (lastError?.message?.includes('timeout')) {
        errorMessage += 'Die Seite antwortet nicht. Bitte versuchen Sie es später erneut.';
      } else {
        errorMessage += 'Möglicherweise verwendet diese Website erweiterte Bot-Erkennung. Bitte versuchen Sie einen direkteren Job-Link.';
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: 'FETCH_ERROR',
          message: errorMessage,
          details: lastError?.message || 'Unknown error',
          suggestion: 'Versuchen Sie einen direkten Link zur Stellenausschreibung anstatt eines Links über Suchfilter oder Listen.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract job data
    let jobData;
    try {
      jobData = extractJobData(html, url);
      console.log('Extracted job data:', {
        jobtitel: jobData.jobtitel,
        arbeitgeber: jobData.arbeitgeber,
        ort: jobData.ort,
        anforderungen: jobData.anforderungen,
        beschreibung: jobData.beschreibung ? jobData.beschreibung.substring(0, 200) + '...' : 'N/A',
        bewerbungsprozess: jobData.bewerbungsprozess || 'N/A'
      });
    } catch (extractError) {
      console.error('Error extracting job data:', extractError);
      
      if (extractError instanceof Error && extractError.message.includes('INCOMPLETE_SOURCE')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            code: 'INCOMPLETE_SOURCE',
            message: 'Could not extract sufficient job information from this page. Please try a different job listing URL.'
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error processing job page content.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    console.error('Error in scrape-job function:', error);
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