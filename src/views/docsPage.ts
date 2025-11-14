import { readFile } from 'fs/promises'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

export async function renderDocsPage() {
  const filePath = new URL('../../API_DOCS.md', import.meta.url).pathname
  const markdown = await readFile(filePath, 'utf-8')

  const htmlContent = md.render(markdown)

  return `
  <html>
  <head>
    <title>API Docs</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #111;
        color: #eee;
        padding: 40px;
        line-height: 1.6;
      }

      .container {
        max-width: 900px;
        margin: 0 auto;
        border-radius: 12px;
        background: #1a1a1a;
        padding: 40px;
        border-radius: 12px;
        border: 1px solid #333;
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
      }

      h1, h2, h3, h4 {
        color: #fff;
      }

      a {
        color: #61dafb;
      }

      pre {
        background: #222;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
      }

      code {
        color: #f8f8f2;
      }

      .top-nav {
        margin-bottom: 25px;
      }

      .home-link {
        background: #383838;
        color: #fff;
        padding: 10px 20px;
        border-radius: 10px;
        border: 1px solid #555;
        text-decoration: none;
        transition: 0.2s;
      }

      .home-link:hover {
        background: #555;
      }
    </style>
  </head>

  <body>
    <div class="top-nav">
      <a class="home-link" href="/">← Back to Home</a>
    </div>

    <div class="container">
      ${htmlContent}
    </div>
  </body>
  </html>
  `
}
