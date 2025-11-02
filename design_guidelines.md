# Design Guidelines for Julie's Family Learning Program Website

## Design Approach

**Reference-Based Design**: Drawing inspiration from the Yuna Nature template with its elegant, warm, and purposeful non-profit aesthetic. The design combines sophisticated serif typography with generous whitespace, soft organic shapes, and photography-forward layouts that emphasize human connection and educational impact.

**Core Design Principles**:
- Warmth and approachability through soft, rounded elements and natural imagery
- Trust and credibility via elegant typography and professional spacing
- Empowerment through bold headlines and inspiring calls-to-action
- Clarity through clean sectional divisions and intuitive information hierarchy

## Typography System

**Headline Font**: Serif font (Playfair Display or Cormorant Garamond from Google Fonts)
- Hero Headlines: 3.5rem-4.5rem (56-72px), font-weight 600-700, line-height 1.1
- Section Headlines: 2.5rem-3rem (40-48px), font-weight 600, line-height 1.2
- Subheadings: 1.5rem-2rem (24-32px), font-weight 500, line-height 1.3

**Body Font**: Sans-serif (Inter or DM Sans from Google Fonts)
- Body Text: 1rem-1.125rem (16-18px), font-weight 400, line-height 1.7
- Small Text: 0.875rem (14px), font-weight 400, line-height 1.6
- Button Text: 1rem, font-weight 500-600, letter-spacing 0.025em

**Typographic Treatment**:
- Use italic serif for emphasis words within headlines (e.g., "**Empowering** _Families_ Through **Education**")
- Maintain consistent spacing between headline groups (0.5rem gap between label and headline)
- Use uppercase labels at 0.75rem with letter-spacing 0.1em above major headlines

## Layout System

**Spacing Units**: Use Tailwind spacing scale with primary units of 4, 6, 8, 12, 16, 20, 24, and 32
- Section padding: py-20 to py-32 on desktop, py-12 to py-16 on mobile
- Card padding: p-8 to p-12
- Component gaps: gap-8 to gap-12 for grid layouts
- Content margins: mb-4 to mb-8 between elements

**Container Widths**:
- Full-width sections: w-full with max-w-7xl inner containers
- Content sections: max-w-6xl mx-auto px-4
- Text-focused content: max-w-4xl
- Narrow content (testimonials, CTAs): max-w-3xl

**Grid Layouts**:
- Services cards: 3-column grid on desktop (lg:grid-cols-3), 2-column on tablet (md:grid-cols-2), single column mobile
- Impact statistics: 4-column grid on desktop (lg:grid-cols-4), 2-column on tablet
- Testimonials: 3-column grid
- Blog/News: 3-column card grid

## Component Library

### Navigation
- Clean horizontal navigation with logo left, menu center/right
- Transparent navigation over hero, becoming solid on scroll
- Sticky navigation with smooth transition
- Prominent "Donate" button in navigation with accent treatment
- Hamburger menu on mobile with full-screen overlay

### Hero Section
- Full viewport height (min-h-screen) with large background image
- Overlay gradient for text readability
- Centered content with hero headline, subheadline, and dual CTAs
- Primary CTA: "Learn More" / Secondary CTA: "Donate Now"
- Buttons with backdrop-blur-md and semi-transparent backgrounds
- Decorative wave SVG element at bottom of hero transitioning to next section

### Service Cards
- Rounded-3xl containers with overflow-hidden for images
- Aspect ratio 4:3 for service images
- Image fills top portion, content in bottom with p-8
- Small numbered badge (1., 2., 3.) in top-left of each card
- Hover effect: subtle scale transform and shadow increase
- "Learn More" link with arrow icon at bottom

### Impact Statistics Section
- Large numbers (3rem-4rem) in serif font
- Supporting labels below in sans-serif
- Icon above each statistic (custom or placeholder)
- Grid layout with dividers between stats
- Soft background treatment (subtle beige/cream tint)

### Testimonials
- Decorative opening quotation mark (large serif character)
- 5-star rating display above quote
- Quote text in larger body size (1.125rem-1.25rem)
- Small circular headshot image (80-100px diameter)
- Name and optional title below quote
- Card-based layout with soft shadow and rounded corners

### Call-to-Action Sections
- Full-width sections with soft background
- Bold serif headline paired with supporting body text
- Dual-button layout when appropriate
- Background imagery with overlay treatment
- Centered content with max-width constraint

### Events/News Cards
- Featured image with aspect ratio 16:9 or 3:2
- Rounded corners (rounded-2xl)
- Content overlay on image or separate content area below
- Date badge positioned on image
- Excerpt text limited to 2-3 lines
- "Read More" link

### Footer
- Multi-column layout (4 columns on desktop, stacking on mobile)
- Logo and mission statement in first column
- Quick links, programs, and contact in subsequent columns
- Sponsor recognition section with logos
- Social media icons
- Bottom bar with copyright and legal links
- Newsletter signup integration

## Images

**Hero Image**: 
Large, inspiring photograph showing Julie's students/families in learning environment or graduation ceremony. Should feature diverse families, bright expressions, educational setting. Image should be high-resolution (1920x1080 minimum) with focal point centered. Apply subtle darkening overlay (opacity 40-50%) for text legibility.

**Service Section Images**:
- Children's Services: Classroom with young children engaged in activities, bright and colorful
- Family Development: Adult learners in classroom or one-on-one mentoring session
- Adult Basic Education: Students working on computers or studying together
All service images should be warm, authentic, showing real program activities. Rounded corners (rounded-3xl) with 4:3 aspect ratio.

**Impact Section**: 
Background image of students graduating or celebrating achievement, subtle opacity (20-30%) behind statistics.

**Testimonials**:
Circular headshot photos of actual program participants (with permission). Should be cropped to faces, well-lit, friendly expressions.

**Gallery Section**:
Masonry or grid layout showcasing diverse moments: classroom activities, graduations, children's programs, volunteer interactions. Mix of portrait and landscape orientations. All images should have consistent rounded corner treatment.

**Event/News Cards**:
Featured images for announcements and events. Should be 16:9 ratio, high quality, relevant to content.

## Animations and Interactions

**Minimize animations** - use sparingly and purposefully:
- Smooth scroll behavior for anchor links
- Fade-in on scroll for section reveals (subtle, 0.3s duration)
- Navigation background transition on scroll
- Hover states for cards: transform scale-105 with 0.3s transition
- Button hover: slight brightness increase
- No parallax, no complex scroll-triggered animations

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (base Tailwind)
- Tablet: 768px - 1024px (md:)
- Desktop: > 1024px (lg:)
- Large Desktop: > 1280px (xl:)

**Mobile Adaptations**:
- Single column layouts for all grids
- Reduced font sizes (hero: 2.5rem, sections: 2rem)
- Reduced section padding (py-12 instead of py-24)
- Hamburger navigation
- Stacked CTAs instead of side-by-side
- Images full-width with reduced border radius

## Page Structure

**Homepage Sections** (in order):
1. Hero - Full viewport with background image and dual CTAs
2. Mission Statement - Centered text block with decorative wave transition
3. Services Overview - 3-column grid of service cards
4. Impact Statistics - 4-column stats with icons
5. Participant Testimonials - 3-column testimonial cards
6. Image Gallery - Masonry or grid layout
7. Events & News - Featured upcoming events and recent news
8. Donation CTA - Full-width section with background image
9. Sponsors Recognition - Logo grid with badges
10. Footer - Multi-column with newsletter signup

Each section should have generous vertical spacing (py-20 minimum) and clear visual separation using background alternation or decorative elements.