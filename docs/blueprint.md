# FaceFusion Bot — Bot specification

**Archetype:** content

**Voice:** friendly and playful — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that lets users upload a selfie, select a style category or type a custom prompt, and receive AI-generated face-swapped images. Handles generation errors gracefully with retry options and retains selfies until explicitly deleted.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- casual users
- social media creators
- AI art enthusiasts

## Success criteria

- User receives generated image in chat within 10 seconds of successful generation
- Error states show retry options without losing progress
- Selfie storage persists until user deletes it

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with style categories
- **Delete selfie** (button, actor: user, callback: selfie:delete) — Remove stored selfie from session
- **Love** (button, actor: user, callback: category:love) — Select 'Love' style category
- **Fashion** (button, actor: user, callback: category:fashion) — Select 'Fashion' style category
- **Custom prompt** (button, actor: user, callback: prompt:custom) — Enter free-form text prompt

## Flows

### Main menu flow
_Trigger:_ /start

1. Show category buttons
2. Prompt selfie upload

_Data touched:_ User profile, Preset categories

### Generation flow
_Trigger:_ category selection or custom prompt

1. Store selfie
2. Generate image
3. Show progress with cancel button
4. Deliver result or error

_Data touched:_ Active selfie, Generation job

### Error handling flow
_Trigger:_ generation failure

1. Show friendly error message
2. Offer retry button
3. Retain selfie state

_Data touched:_ Generation job

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — Telegram user identity and display name
  - fields: telegram_id, display_name
- **Active selfie** _(retention: session)_ — User-uploaded selfie stored for current session
  - fields: file_id, timestamp, telegram_id
- **Preset categories** _(retention: persistent)_ — Seed set of 8 predefined style categories
  - fields: category_name, prompt_template
- **Generation job** _(retention: persistent)_ — Status tracking for image generation requests
  - fields: job_id, status, timestamp, telegram_id

## Integrations

- **Telegram** (required) — Bot API messaging and media delivery
- **External image-generation API** (required) — Render face-swapped images
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Manage preset categories
- Configure error message templates

## Notifications

- Image generation progress updates
- Final image delivery
- Error retry prompts

## Permissions & privacy

- Store selfies until explicit deletion
- No sharing of user data beyond generation API

## Edge cases

- User uploads new selfie overwriting previous
- Generation API returns illegal content flag
- User cancels in-progress generation

## Required tests

- Verify category buttons trigger correct style prompts
- Test error retry preserves selfie state
- Validate image delivery as downloadable Telegram photo

## Assumptions

- One active selfie per user session
- Preset categories fixed to 8 examples
- No rate limiting in v1
