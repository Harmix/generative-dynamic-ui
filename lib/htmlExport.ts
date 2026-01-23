/**
 * HTML Export Utility
 * Generates standalone HTML files from rendered dashboards
 */

/**
 * Generates a complete, self-contained HTML document from a rendered dashboard
 * @param containerRef - The HTML element containing the rendered dashboard
 * @param title - Optional title for the HTML document
 * @returns Complete HTML document as a string
 */
export const generateHTMLExport = (
  containerRef: HTMLElement,
  title: string = 'Dashboard'
): string => {
  // Extract the rendered HTML content
  const dashboardHTML = containerRef.innerHTML

  // Get current date for metadata
  const generatedDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Build the complete HTML document
  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="Dynamic UI Builder">
  <meta name="description" content="Dashboard generated on ${generatedDate}">
  <title>${title}</title>
  
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Custom Theme Styles -->
  <style>
    /* Neon Dark Theme - CSS Custom Properties */
    :root {
      --radius: 0.625rem;
      
      /* Neon Dark Theme - Dark-first approach */
      --background: oklch(0.13 0.01 260);
      --foreground: oklch(0.95 0.02 260);
      --card: oklch(0.18 0.015 260);
      --card-foreground: oklch(0.95 0.02 260);
      --popover: oklch(0.18 0.015 260);
      --popover-foreground: oklch(0.95 0.02 260);
      
      /* Neon Cyan Primary */
      --primary: oklch(0.75 0.18 195);
      --primary-foreground: oklch(0.13 0.01 260);
      
      /* Deep surface for secondary */
      --secondary: oklch(0.22 0.015 260);
      --secondary-foreground: oklch(0.95 0.02 260);
      
      /* Muted with slight blue tint */
      --muted: oklch(0.25 0.015 260);
      --muted-foreground: oklch(0.65 0.02 260);
      
      /* Neon Pink Accent */
      --accent: oklch(0.70 0.20 330);
      --accent-foreground: oklch(0.13 0.01 260);
      
      /* Keep destructive red */
      --destructive: oklch(0.65 0.22 25);
      --destructive-foreground: oklch(0.13 0.01 260);
      
      /* Semantic Colors for Metrics */
      --success: oklch(0.72 0.19 145);
      --success-foreground: oklch(0.13 0.01 260);
      --danger: oklch(0.65 0.22 25);
      --danger-foreground: oklch(0.13 0.01 260);
      --info: oklch(0.70 0.15 250);
      --info-foreground: oklch(0.13 0.01 260);
      
      /* Borders with neon glow */
      --border: oklch(0.30 0.02 260);
      --input: oklch(0.25 0.015 260);
      --ring: oklch(0.75 0.18 195);
      
      /* Enhanced Neon Chart Palette */
      --chart-1: oklch(0.75 0.18 195);  /* Neon Cyan */
      --chart-2: oklch(0.70 0.20 330);  /* Neon Pink */
      --chart-3: oklch(0.72 0.19 145);  /* Neon Lime */
      --chart-4: oklch(0.70 0.15 250);  /* Neon Purple */
      --chart-5: oklch(0.78 0.18 80);   /* Neon Amber */
      
      /* Sidebar */
      --sidebar: oklch(0.16 0.015 260);
      --sidebar-foreground: oklch(0.95 0.02 260);
      --sidebar-primary: oklch(0.75 0.18 195);
      --sidebar-primary-foreground: oklch(0.13 0.01 260);
      --sidebar-accent: oklch(0.22 0.015 260);
      --sidebar-accent-foreground: oklch(0.95 0.02 260);
      --sidebar-border: oklch(0.30 0.02 260);
      --sidebar-ring: oklch(0.75 0.18 195);
    }

    /* Base Styles */
    * {
      border-color: var(--border);
    }
    
    body {
      background-color: var(--background);
      color: var(--foreground);
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Tailwind Config for Custom Colors */
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            background: 'var(--background)',
            foreground: 'var(--foreground)',
            card: {
              DEFAULT: 'var(--card)',
              foreground: 'var(--card-foreground)'
            },
            popover: {
              DEFAULT: 'var(--popover)',
              foreground: 'var(--popover-foreground)'
            },
            primary: {
              DEFAULT: 'var(--primary)',
              foreground: 'var(--primary-foreground)'
            },
            secondary: {
              DEFAULT: 'var(--secondary)',
              foreground: 'var(--secondary-foreground)'
            },
            muted: {
              DEFAULT: 'var(--muted)',
              foreground: 'var(--muted-foreground)'
            },
            accent: {
              DEFAULT: 'var(--accent)',
              foreground: 'var(--accent-foreground)'
            },
            destructive: {
              DEFAULT: 'var(--destructive)',
              foreground: 'var(--destructive-foreground)'
            },
            success: {
              DEFAULT: 'var(--success)',
              foreground: 'var(--success-foreground)'
            },
            danger: {
              DEFAULT: 'var(--danger)',
              foreground: 'var(--danger-foreground)'
            },
            info: {
              DEFAULT: 'var(--info)',
              foreground: 'var(--info-foreground)'
            },
            border: 'var(--border)',
            input: 'var(--input)',
            ring: 'var(--ring)'
          },
          borderRadius: {
            sm: 'calc(var(--radius) - 4px)',
            md: 'calc(var(--radius) - 2px)',
            lg: 'var(--radius)',
            xl: 'calc(var(--radius) + 4px)'
          }
        }
      }
    }

    /* Container Padding */
    .dashboard-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Watermark */
    .watermark {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      font-size: 0.75rem;
      color: var(--muted-foreground);
      opacity: 0.6;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="dashboard-container">
    ${dashboardHTML}
  </div>
  
  <!-- Watermark -->
  <div class="watermark">
    Generated by Dynamic UI Builder on ${generatedDate}
  </div>
</body>
</html>`

  return htmlDocument
}

/**
 * Downloads an HTML string as a file
 * @param html - The HTML content to download
 * @param filename - The name of the file to download
 */
export const downloadHTML = (html: string, filename: string): void => {
  // Create a Blob from the HTML string
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob)
  
  // Create a temporary anchor element
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  // Append to body, click, and cleanup
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generates a filename with timestamp
 * @param prefix - Prefix for the filename
 * @returns Filename string with timestamp
 */
export const generateFilename = (prefix: string = 'dashboard'): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${prefix}-${year}-${month}-${day}-${hours}${minutes}.html`
}

