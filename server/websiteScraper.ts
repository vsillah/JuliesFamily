import axios from 'axios';
import * as cheerio from 'cheerio';
import { nanoid } from 'nanoid';

// Persona keyword mappings
const PERSONA_KEYWORDS = {
  student: ['student', 'mentee', 'youth', 'child', 'kid', 'learner', 'participant'],
  provider: ['mentor', 'teacher', 'tutor', 'coach', 'instructor', 'educator', 'affiliate', 'partner organization'],
  parent: ['parent', 'guardian', 'family', 'caregiver'],
  donor: ['donor', 'supporter', 'contribute', 'donate', 'sponsor', 'funder', 'philanthrop'],
  volunteer: ['volunteer', 'helper', 'community member'],
};

export interface ScrapedProgram {
  title: string;
  description: string;
  eligibility?: string;
  url?: string;
}

export interface ScrapedEvent {
  title: string;
  description: string;
  date?: string;
  location?: string;
  url?: string;
}

export interface ScrapedTestimonial {
  quote: string;
  author: string;
  role?: string;
}

export interface ScrapedWebsiteData {
  personas: string[];
  programs: ScrapedProgram[];
  events: ScrapedEvent[];
  testimonials: ScrapedTestimonial[];
  errors: string[];
}

/**
 * Detect personas from website content
 */
function detectPersonas(html: string): string[] {
  const detectedPersonas = new Set<string>();
  const textContent = html.toLowerCase();
  
  for (const [persona, keywords] of Object.entries(PERSONA_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textContent.includes(keyword)) {
        detectedPersonas.add(persona);
        break; // Found one keyword for this persona, move to next
      }
    }
  }
  
  // Always include 'default' as a fallback
  if (detectedPersonas.size === 0) {
    detectedPersonas.add('default');
  }
  
  return Array.from(detectedPersonas);
}

/**
 * Try common selectors to extract programs
 */
function extractPrograms($: cheerio.CheerioAPI): ScrapedProgram[] {
  const programs: ScrapedProgram[] = [];
  const commonSelectors = [
    '.program-card',
    '.program-item',
    '.program',
    '[class*="program"]',
    'article.service',
    '.service-card'
  ];
  
  for (const selector of commonSelectors) {
    const elements = $(selector);
    
    if (elements.length > 0 && elements.length < 50) { // Sanity check: not too many
      elements.each((i, elem) => {
        const $elem = $(elem);
        
        // Try to find title
        const title = 
          $elem.find('h1, h2, h3, h4').first().text().trim() ||
          $elem.find('.title, .name, .heading').first().text().trim() ||
          $elem.find('[class*="title"], [class*="name"]').first().text().trim();
        
        // Try to find description
        const description = 
          $elem.find('p, .description, .summary').first().text().trim() ||
          $elem.find('[class*="description"], [class*="summary"]').first().text().trim();
        
        // Try to find link
        const url = 
          $elem.find('a').first().attr('href') ||
          $elem.attr('href');
        
        if (title && title.length > 3 && title.length < 200) {
          programs.push({
            title,
            description: description.substring(0, 500), // Limit description length
            url
          });
        }
      });
      
      if (programs.length > 0) {
        break; // Found programs, stop trying other selectors
      }
    }
  }
  
  return programs.slice(0, 10); // Limit to 10 programs
}

/**
 * Try common selectors to extract events
 */
function extractEvents($: cheerio.CheerioAPI): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const commonSelectors = [
    '.event-card',
    '.event-item',
    '.event',
    '[class*="event"]',
    'article.event',
    '.calendar-event'
  ];
  
  for (const selector of commonSelectors) {
    const elements = $(selector);
    
    if (elements.length > 0 && elements.length < 100) {
      elements.each((i, elem) => {
        const $elem = $(elem);
        
        const title = 
          $elem.find('h1, h2, h3, h4').first().text().trim() ||
          $elem.find('.title, .name').first().text().trim() ||
          $elem.find('[class*="title"]').first().text().trim();
        
        const description = 
          $elem.find('p, .description, .summary').first().text().trim() ||
          $elem.find('[class*="description"]').first().text().trim();
        
        const date = 
          $elem.find('.date, time, .event-date').first().text().trim() ||
          $elem.find('[class*="date"]').first().text().trim();
        
        const location = 
          $elem.find('.location, .venue, .place').first().text().trim() ||
          $elem.find('[class*="location"], [class*="venue"]').first().text().trim();
        
        const url = 
          $elem.find('a').first().attr('href') ||
          $elem.attr('href');
        
        if (title && title.length > 3 && title.length < 200) {
          events.push({
            title,
            description: description.substring(0, 500),
            date,
            location,
            url
          });
        }
      });
      
      if (events.length > 0) {
        break;
      }
    }
  }
  
  return events.slice(0, 10); // Limit to 10 events
}

/**
 * Try common selectors to extract testimonials
 */
function extractTestimonials($: cheerio.CheerioAPI): ScrapedTestimonial[] {
  const testimonials: ScrapedTestimonial[] = [];
  const commonSelectors = [
    '.testimonial',
    '.testimonial-card',
    '.review',
    'blockquote',
    '[class*="testimonial"]',
    '.quote'
  ];
  
  for (const selector of commonSelectors) {
    const elements = $(selector);
    
    if (elements.length > 0 && elements.length < 50) {
      elements.each((i, elem) => {
        const $elem = $(elem);
        
        const quote = 
          $elem.find('blockquote, .quote, p').first().text().trim() ||
          $elem.text().trim();
        
        const author = 
          $elem.find('.author, cite, .name').first().text().trim() ||
          $elem.find('[class*="author"], [class*="name"]').first().text().trim();
        
        const role = 
          $elem.find('.role, .title, .position').first().text().trim() ||
          $elem.find('[class*="role"], [class*="title"]').first().text().trim();
        
        if (quote && quote.length > 10 && quote.length < 1000) {
          testimonials.push({
            quote: quote.substring(0, 500),
            author: author || 'Anonymous',
            role
          });
        }
      });
      
      if (testimonials.length > 0) {
        break;
      }
    }
  }
  
  return testimonials.slice(0, 5); // Limit to 5 testimonials
}

/**
 * Main scraping function
 */
export async function scrapeWebsite(url: string): Promise<ScrapedWebsiteData> {
  const errors: string[] = [];
  
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol. Must be http or https.');
    }
    
    // Fetch the website
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'KinFlo Content Importer Bot/1.0',
      },
      maxRedirects: 5,
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Detect personas
    const personas = detectPersonas(html);
    
    // Extract content
    const programs = extractPrograms($);
    const events = extractEvents($);
    const testimonials = extractTestimonials($);
    
    // Add warnings if we didn't find content
    if (programs.length === 0) {
      errors.push('No programs found. Try adding them manually.');
    }
    if (events.length === 0) {
      errors.push('No events found. You can add them later.');
    }
    if (testimonials.length === 0) {
      errors.push('No testimonials found. You can add them later.');
    }
    
    return {
      personas,
      programs,
      events,
      testimonials,
      errors
    };
    
  } catch (error: any) {
    if (error.code === 'ENOTFOUND') {
      errors.push('Website not found. Please check the URL.');
    } else if (error.code === 'ETIMEDOUT') {
      errors.push('Request timed out. The website may be slow or unreachable.');
    } else if (error.response?.status === 403) {
      errors.push('Access denied. The website may block automated scraping.');
    } else if (error.response?.status === 404) {
      errors.push('Page not found (404). Please check the URL.');
    } else {
      errors.push(`Failed to scrape website: ${error.message}`);
    }
    
    return {
      personas: ['default'],
      programs: [],
      events: [],
      testimonials: [],
      errors
    };
  }
}
