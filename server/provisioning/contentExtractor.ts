import * as cheerio from 'cheerio';

/**
 * Extract logo URL from a webpage
 * Checks multiple sources in priority order:
 * 1. Open Graph image (og:image)
 * 2. Favicon (link[rel="icon"] or link[rel="shortcut icon"])
 * 3. Header/navbar logo images
 * 4. Largest logo-like image
 */
export async function extractLogo(html: string, baseUrl: string): Promise<string | null> {
  const $ = cheerio.load(html);
  
  // 1. Try Open Graph image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    return makeAbsoluteUrl(ogImage, baseUrl);
  }
  
  // 2. Try favicon
  const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
  if (favicon) {
    return makeAbsoluteUrl(favicon, baseUrl);
  }
  
  // 3. Try header/navbar logo
  const headerLogo = $('header img, nav img, .logo img, .navbar img, [class*="logo"] img').first().attr('src');
  if (headerLogo) {
    return makeAbsoluteUrl(headerLogo, baseUrl);
  }
  
  // 4. Try any image with 'logo' in src or alt
  const logoImg = $('img[src*="logo"], img[alt*="logo"], img[alt*="Logo"]').first().attr('src');
  if (logoImg) {
    return makeAbsoluteUrl(logoImg, baseUrl);
  }
  
  return null;
}

/**
 * Extract theme colors from a webpage
 * Analyzes CSS variables, inline styles, and common color patterns
 */
export async function extractThemeColors(html: string): Promise<{
  primary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  success?: string;
  warning?: string;
  error?: string;
} | null> {
  const $ = cheerio.load(html);
  const colors: any = {};
  
  // Extract CSS variables from :root or html
  const styleContent = $('style').text();
  const rootVars = styleContent.match(/:root\s*{([^}]*)}/);
  
  if (rootVars) {
    const vars = rootVars[1];
    
    // Look for common color variable patterns
    const primaryMatch = vars.match(/--(?:primary|brand|main)(?:-color)?:\s*([^;]+);/);
    if (primaryMatch) colors.primary = normalizeColor(primaryMatch[1]);
    
    const accentMatch = vars.match(/--(?:accent|secondary)(?:-color)?:\s*([^;]+);/);
    if (accentMatch) colors.accent = normalizeColor(accentMatch[1]);
    
    const bgMatch = vars.match(/--(?:background|bg)(?:-color)?:\s*([^;]+);/);
    if (bgMatch) colors.background = normalizeColor(bgMatch[1]);
    
    const fgMatch = vars.match(/--(?:foreground|fg|text)(?:-color)?:\s*([^;]+);/);
    if (fgMatch) colors.foreground = normalizeColor(fgMatch[1]);
  }
  
  // If no CSS variables found, try to extract from common elements
  if (!colors.primary) {
    // Try to get primary color from buttons, links, or headers
    const buttonBg = $('button, .btn, .button').first().css('background-color');
    const linkColor = $('a').first().css('color');
    const headerBg = $('header, .header').first().css('background-color');
    
    colors.primary = normalizeColor(buttonBg || linkColor || headerBg || '#3b82f6');
  }
  
  return Object.keys(colors).length > 0 ? colors : null;
}

/**
 * Enhanced multi-URL scraping with content-type-specific extraction
 * Supports up to 5 URLs per content section (programs, events, testimonials)
 */
export async function scrapeWebsiteContent(params: {
  baseUrl: string;
  programsUrls?: string[];
  eventsUrls?: string[];
  testimonialsUrls?: string[];
}): Promise<{
  logo: string | null;
  themeColors: any | null;
  programs: Array<{ title: string; description: string; url?: string }>;
  events: Array<{ title: string; description: string; date?: string; location?: string; url?: string }>;
  testimonials: Array<{ quote: string; author: string; role?: string }>;
  personas: string[];
  errors: string[];
}> {
  const errors: string[] = [];
  let logo: string | null = null;
  let themeColors: any | null = null;
  const programs: any[] = [];
  const events: any[] = [];
  const testimonials: any[] = [];
  const detectedPersonas = new Set<string>();
  
  try {
    // Fetch the base URL (homepage)
    const baseResponse = await fetch(params.baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KinfloBot/1.0; +https://kinflo.com)'
      }
    });
    
    if (!baseResponse.ok) {
      errors.push(`Failed to fetch homepage: ${baseResponse.statusText}`);
      return { logo, themeColors, programs, events, testimonials, personas: [], errors };
    }
    
    const baseHtml = await baseResponse.text();
    
    // Extract logo and theme from homepage
    logo = await extractLogo(baseHtml, params.baseUrl);
    themeColors = await extractThemeColors(baseHtml);
    
    // Scrape programs from all provided URLs (up to 5)
    if (params.programsUrls && params.programsUrls.length > 0) {
      for (const programUrl of params.programsUrls.slice(0, 5)) {
        try {
          const programsData = await scrapeProgramsPage(programUrl);
          programs.push(...programsData.programs);
          programsData.personas.forEach(p => detectedPersonas.add(p));
        } catch (error: any) {
          errors.push(`Failed to scrape programs from ${programUrl}: ${error.message}`);
        }
      }
    }
    
    // Scrape events from all provided URLs (up to 5)
    if (params.eventsUrls && params.eventsUrls.length > 0) {
      for (const eventUrl of params.eventsUrls.slice(0, 5)) {
        try {
          const eventsData = await scrapeEventsPage(eventUrl);
          events.push(...eventsData.events);
        } catch (error: any) {
          errors.push(`Failed to scrape events from ${eventUrl}: ${error.message}`);
        }
      }
    }
    
    // Scrape testimonials from all provided URLs (up to 5)
    if (params.testimonialsUrls && params.testimonialsUrls.length > 0) {
      for (const testimonialUrl of params.testimonialsUrls.slice(0, 5)) {
        try {
          const testimonialsData = await scrapeTestimonialsPage(testimonialUrl);
          testimonials.push(...testimonialsData.testimonials);
          testimonialsData.personas.forEach(p => detectedPersonas.add(p));
        } catch (error: any) {
          errors.push(`Failed to scrape testimonials from ${testimonialUrl}: ${error.message}`);
        }
      }
    }
    
    // If no specific URLs provided, try to extract from homepage
    if ((!params.programsUrls || params.programsUrls.length === 0) && 
        (!params.eventsUrls || params.eventsUrls.length === 0) && 
        (!params.testimonialsUrls || params.testimonialsUrls.length === 0)) {
      const homepageData = await scrapeHomepage(baseHtml, params.baseUrl);
      programs.push(...homepageData.programs);
      events.push(...homepageData.events);
      testimonials.push(...homepageData.testimonials);
      homepageData.personas.forEach(p => detectedPersonas.add(p));
    }
    
  } catch (error: any) {
    errors.push(`Scraping error: ${error.message}`);
  }
  
  return {
    logo,
    themeColors,
    programs,
    events,
    testimonials,
    personas: Array.from(detectedPersonas),
    errors,
  };
}

/**
 * Scrape programs/services page
 */
async function scrapeProgramsPage(url: string): Promise<{
  programs: Array<{ title: string; description: string; url?: string }>;
  personas: string[];
}> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KinfloBot/1.0; +https://kinflo.com)'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  const programs: any[] = [];
  const personas = new Set<string>();
  
  // Look for program sections
  $('article, .program, .service, [class*="program"], [class*="service"], section').each((_, elem) => {
    const $elem = $(elem);
    
    // Extract title
    const title = $elem.find('h2, h3, .title, [class*="title"]').first().text().trim();
    
    // Extract description
    const description = $elem.find('p, .description, [class*="description"]').first().text().trim();
    
    // Extract URL if available
    const link = $elem.find('a').first().attr('href');
    
    if (title && description) {
      programs.push({
        title,
        description: description.substring(0, 500), // Limit description length
        url: link ? makeAbsoluteUrl(link, url) : undefined,
      });
      
      // Detect personas from program content
      detectPersonasFromText(title + ' ' + description, personas);
    }
  });
  
  return { programs, personas: Array.from(personas) };
}

/**
 * Scrape events page
 */
async function scrapeEventsPage(url: string): Promise<{
  events: Array<{ title: string; description: string; date?: string; location?: string; url?: string }>;
}> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KinfloBot/1.0; +https://kinflo.com)'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  const events: any[] = [];
  
  // Look for event sections
  $('article, .event, [class*="event"], section').each((_, elem) => {
    const $elem = $(elem);
    
    // Extract title
    const title = $elem.find('h2, h3, .title, [class*="title"]').first().text().trim();
    
    // Extract description
    const description = $elem.find('p, .description, [class*="description"]').first().text().trim();
    
    // Extract date
    const date = $elem.find('time, .date, [class*="date"]').first().text().trim();
    
    // Extract location
    const location = $elem.find('.location, [class*="location"]').first().text().trim();
    
    // Extract URL
    const link = $elem.find('a').first().attr('href');
    
    if (title && description) {
      events.push({
        title,
        description: description.substring(0, 500),
        date: date || undefined,
        location: location || undefined,
        url: link ? makeAbsoluteUrl(link, url) : undefined,
      });
    }
  });
  
  return { events };
}

/**
 * Scrape testimonials/success stories page
 */
async function scrapeTestimonialsPage(url: string): Promise<{
  testimonials: Array<{ quote: string; author: string; role?: string }>;
  personas: string[];
}> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KinfloBot/1.0; +https://kinflo.com)'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  const testimonials: any[] = [];
  const personas = new Set<string>();
  
  // Look for testimonial sections
  $('blockquote, .testimonial, .quote, [class*="testimonial"], [class*="review"]').each((_, elem) => {
    const $elem = $(elem);
    
    // Extract quote
    const quote = $elem.find('p, .quote, [class*="quote"]').first().text().trim() || $elem.text().trim();
    
    // Extract author
    const author = $elem.find('.author, .name, [class*="author"], cite').first().text().trim();
    
    // Extract role/title
    const role = $elem.find('.role, .title, [class*="role"]').first().text().trim();
    
    if (quote && author) {
      testimonials.push({
        quote: quote.substring(0, 500),
        author,
        role: role || undefined,
      });
      
      // Detect personas from testimonial content
      detectPersonasFromText(quote + ' ' + (role || ''), personas);
    }
  });
  
  return { testimonials, personas: Array.from(personas) };
}

/**
 * Scrape homepage for general content when specific URLs not provided
 */
async function scrapeHomepage(html: string, baseUrl: string): Promise<{
  programs: any[];
  events: any[];
  testimonials: any[];
  personas: string[];
}> {
  const $ = cheerio.load(html);
  const programs: any[] = [];
  const events: any[] = [];
  const testimonials: any[] = [];
  const personas = new Set<string>();
  
  // Extract testimonials from homepage
  $('blockquote, .testimonial').each((_, elem) => {
    const $elem = $(elem);
    const quote = $elem.text().trim();
    const author = $elem.find('cite, .author').text().trim() || 'Anonymous';
    
    if (quote && quote.length > 20) {
      testimonials.push({ quote: quote.substring(0, 500), author });
      detectPersonasFromText(quote, personas);
    }
  });
  
  return { programs, events, testimonials, personas: Array.from(personas) };
}

/**
 * Detect personas from text content
 */
function detectPersonasFromText(text: string, personas: Set<string>): void {
  const lowercaseText = text.toLowerCase();
  
  // Persona detection keywords
  const personaKeywords: Record<string, string[]> = {
    'donor': ['donate', 'donation', 'donor', 'give', 'support', 'contribute', 'philanthropy'],
    'volunteer': ['volunteer', 'help', 'serve', 'participate'],
    'parent': ['parent', 'family', 'child', 'children', 'kid', 'son', 'daughter'],
    'student': ['student', 'learn', 'education', 'school', 'class', 'study'],
    'educator': ['teacher', 'educator', 'instructor', 'faculty'],
    'partner': ['partner', 'collaborate', 'organization', 'corporate'],
  };
  
  for (const [persona, keywords] of Object.entries(personaKeywords)) {
    if (keywords.some(keyword => lowercaseText.includes(keyword))) {
      personas.add(persona);
    }
  }
}

/**
 * Helper: Make URL absolute
 */
function makeAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  try {
    const base = new URL(baseUrl);
    if (url.startsWith('//')) {
      return `${base.protocol}${url}`;
    }
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    }
    return `${base.protocol}//${base.host}/${url}`;
  } catch {
    return url;
  }
}

/**
 * Helper: Normalize color value
 */
function normalizeColor(color: string): string {
  const trimmed = color.trim();
  
  // If it's already a hex color, return it
  if (trimmed.startsWith('#')) {
    return trimmed;
  }
  
  // If it's an RGB/RGBA, convert to hex (simplified)
  if (trimmed.startsWith('rgb')) {
    // For now, just return the original value
    // A full implementation would parse and convert to hex
    return trimmed;
  }
  
  // If it's a CSS variable, return as-is
  if (trimmed.startsWith('var(')) {
    return trimmed;
  }
  
  return trimmed;
}
