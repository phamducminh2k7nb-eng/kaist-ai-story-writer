# KAIST Story Autopilot

KAIST is an AI-first story and manga creation workspace focused on automation:

**Author Chat → Story Bible → Chapter Writing → Manga Storyboard → Image Generation → Schedule → Publishing Queue**

## Main workspaces

- **AI Author Room** — brainstorm, critique, outline and write with an AI co-author.
- **Story Studio** — manage stories, characters, worldbuilding, outlines and manuscripts.
- **Manga Studio** — turn scenes into manga pages/panels and generate visual prompts/images.
- **Autopilot** — generate the next chapter on a schedule and optionally prepare manga storyboards.
- **Publishing** — queue approved chapters and optionally send them to your own CMS through a webhook.

## Run locally

Requirements: Node.js 20+

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then configure at minimum:

```env
GEMINI_API_KEY=your_server_side_key
```

Optional providers/integrations are documented in `.env.example`.

## Security

Do not commit `.env`, API keys, OAuth secrets or publisher tokens. The repository intentionally tracks only `.env.example` placeholders.

## Publishing automation

For a website/CMS you control, configure:

```env
PUBLISH_WEBHOOK_URL=https://your-site.example/api/kaist/publish
PUBLISH_WEBHOOK_TOKEN=your_private_token
```

KAIST can prepare and queue chapters automatically. External publishing platforms require their supported API/OAuth/authorized integration; the app should not fake successful publishing when no integration exists.