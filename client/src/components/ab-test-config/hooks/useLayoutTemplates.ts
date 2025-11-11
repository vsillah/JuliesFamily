/**
 * Hook to fetch available layout templates
 * Returns predefined layout options for LayoutEditor
 */
export function useLayoutTemplates() {
  // For now, return static data
  // In the future, this could fetch from an API if layouts become dynamic
  return {
    data: [
      {
        id: 'grid-2col',
        name: '2-Column Grid',
        description: 'Two equal columns with cards arranged side-by-side',
        preview: '□ □',
      },
      {
        id: 'grid-3col',
        name: '3-Column Grid',
        description: 'Three equal columns for maximum content density',
        preview: '□ □ □',
      },
      {
        id: 'grid-4col',
        name: '4-Column Grid',
        description: 'Four columns for wide screens (responsive on mobile)',
        preview: '□ □ □ □',
      },
      {
        id: 'sidebar-left',
        name: 'Sidebar Left',
        description: 'Content on right with sidebar navigation on left',
        preview: '▌ □□',
      },
      {
        id: 'sidebar-right',
        name: 'Sidebar Right',
        description: 'Content on left with sidebar navigation on right',
        preview: '□□ ▌',
      },
      {
        id: 'single-column',
        name: 'Single Column',
        description: 'Centered single column for focused content',
        preview: '□',
      },
      {
        id: 'masonry',
        name: 'Masonry Layout',
        description: 'Pinterest-style irregular grid with varied heights',
        preview: '□ □\n□□□',
      },
    ],
    isLoading: false,
    error: null,
  };
}
