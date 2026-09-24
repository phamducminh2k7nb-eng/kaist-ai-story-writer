# KAIST v2.5 — Image + Story AI Fix

Date: 2026-09-24

## Fixed image generation

1. Replaced the old `image.pollinations.ai` generation path with a provider router.
2. Primary image provider: `gemini-3.1-flash-image` (Gemini native image / Nano Banana 2).
3. Current Pollinations fallback endpoint: `https://gen.pollinations.ai/image/...` using `black-forest-labs/flux.1-schnell`.
4. Added optional server-side `POLLINATIONS_API_KEY` support.
5. Reference-guided mode now actually sends the reference image bytes to Gemini Image. The previous code only changed the text prompt while claiming the reference image had been dispatched.
6. Image responses can now be saved and served as JPEG, PNG, or WebP instead of assuming every image is JPEG.
7. Added 4:5 image ratio for social/product visuals.
8. Improved user-facing provider/quota/key errors.

## Improved writing AI

1. Default text model: `gemini-3.8-flash`.
2. Fallback sequence: Gemini 3.8 Flash → 3.7 Flash → 3.5 Flash → 3.5 Flash-Lite → 3.1 Pro Preview.
3. Added `Truyện dài` chat mode for serial fiction.
4. Project context now includes target audience, recent outline beats, recent chapter summaries, character goals/conflicts, world rules, and approved memories.
5. Added long-form fiction guidance for retention, pacing, chapter progression, natural cliffhangers, originality, and continuity.
6. Fixed a project-context isolation issue so AI does not scan another user's project as a fallback.

## AI Studio Secrets

Required:

- `GEMINI_API_KEY`

Optional but recommended image fallback:

- `POLLINATIONS_API_KEY`

Do not put secret keys in frontend code.

## Important billing/quota note

Gemini text chat and Gemini image generation can have different quota/billing requirements. If `gemini-3.1-flash-image` is unavailable for the configured Gemini project, KAIST will try Pollinations for normal text-to-image generation when `POLLINATIONS_API_KEY` is configured.

Reference-guided editing intentionally requires Gemini Image in this build so KAIST never falsely claims an uploaded reference was used when it was not actually sent to the model.

## Validation performed

- TypeScript syntax transpilation: passed for all 31 `.ts` / `.tsx` source files.
- Full dependency install/build could not be executed in the repair sandbox because outbound npm dependency installation timed out.
- Live Gemini/Pollinations generation requires the user's API secrets/quota and should be tested after importing into AI Studio.