export const homePageHTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>API Home Page</title>
    <style>
      body {
        margin: 0;
        font-family: system-ui, sans-serif;
        background: #0d0d0d;
        color: #f5f5f5;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .container {
        text-align: center;
        background: #1a1a1a;
        padding: 40px;
        border-radius: 12px;
        border: 1px solid #333;
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
      }

      .title {
        font-size: 1.4rem;
        margin-bottom: 24px;
        font-weight: 600;
        letter-spacing: 0.6px;
      }

      .button {
        display: block;
        margin: 15px auto;
        padding: 12px 22px;
        border-radius: 5px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #fff;
        font-size: 1rem;
        text-decoration: none;
        transition: 0.2s ease-in-out;
        width: 400px;
      }

      .button:hover {
        background: #3a3a3a;
        border-color: #666;
      }

      .link-note {
        margin-top: 20px;
        font-size: 0.85rem;
        color: #b4b4b4;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <h3 class="title">Habit Tracker API Using Node.js/Express.js</h3>

      <a href="https://medo7id.com" target="_blank" class="button">
        Visit My Personal Website
      </a>

      <a href="/docs" class="button">
        API Documentation
      </a>

      <code class="link-note">
        (This links to the rendered version of <code>API_DOCS.md</code>)
      </code>
    </div>
  </body>
</html>
`
