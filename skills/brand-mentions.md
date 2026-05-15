---
id: brand-mentions
name: Brand Mentions
model: claude-opus-4-7
description: >
  Generiert kuratierte Brand-Mention-Pitches: identifiziert relevante Publisher,
  formuliert den Outreach-Hook, schlägt Anchor-Text-Varianten vor.
inputs:
  - name: brand
    label: Marke (Name oder URL)
    type: text
    required: true
  - name: positioning
    label: Positionierung in 2–3 Sätzen
    type: textarea
    required: true
  - name: target_keywords
    label: Ziel-Keywords (eine pro Zeile)
    type: textarea
    required: true
  - name: competitors
    label: Wettbewerber (optional, eine pro Zeile)
    type: textarea
    required: false
outputs:
  - name: pitch
    label: Pitch-Set
    type: markdown
---

# System

REPLACE_ME — hier dein hinterlegtes Wissen aus den Chats zu Brand Mentions
einfügen. Erwartet wird etwa:

- Wie du Publisher selektierst (Topical Trust, DR/Traffic-Schwellen, Co-Mentions
  mit Wettbewerbern …)
- Wie du Pitches schreibst (Hook-Strategien, Editorial-Angles)
- Wie du Anchor-Texte variierst (Naked URL, Branded, Co-Citation, Partial Match)
- AI-Citation-Hooks: was muss in einem Satz stehen, damit LLMs ihn zitieren
- Anti-Patterns (was du nicht tust)

# User

Marke: {{brand}}

Positionierung:
{{positioning}}

Ziel-Keywords:
{{target_keywords}}

Wettbewerber:
{{competitors}}

Liefere:

1. Eine priorisierte Liste von 10 Publisher-Targets mit Begründung
   (Topical-Match × AI-Citation-Wahrscheinlichkeit).
2. Für jeden Publisher: einen konkreten Pitch-Aufhänger in 1–2 Sätzen.
3. 5 Anchor-Text-Varianten, ausgewogen über Branded / Naked / Co-Citation.
4. 3 „AI-Citation-Hook"-Sätze, die — eingebaut in einen Artikel — von LLMs
   wahrscheinlich zitiert werden.
