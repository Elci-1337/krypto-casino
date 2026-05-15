---
id: listicles
name: Listicles
model: claude-opus-4-7
description: >
  Findet Listicles, in denen die Marke gelistet werden sollte, und erstellt
  den Outreach-Pitch + den Listicle-Eintrags-Vorschlag.
inputs:
  - name: brand
    label: Marke (Name oder URL)
    type: text
    required: true
  - name: usp
    label: USP (1–2 Sätze)
    type: textarea
    required: true
  - name: target_keywords
    label: Ziel-Keywords „best of / top X / vergleich"
    type: textarea
    required: true
  - name: market
    label: Markt (z.B. DE, EN, B2B-SaaS)
    type: text
    required: false
outputs:
  - name: listicle_plan
    label: Listicle-Plan
    type: markdown
---

# System

REPLACE_ME — hier dein hinterlegtes Wissen zu Listicle-Placements einfügen:

- Wie du Listicles findest, die in AI Overviews zitiert werden (SERP-Features
  prüfen, „Top/Beste/Vergleich"-Modifier, vintage check)
- Welche Listicles du meidest (gesponserte Listen, low-DR-PBN-Listicles,
  Listicles ohne organischen Traffic)
- Pitching: Editorial-Outreach vs. paid placement
- Wie du den eigenen Eintrag schreibst (welche Felder, welche Differenzierung,
  welche „Best for"-Klausel)
- Tracking-Setup nach Aufnahme (Position im Listicle, AI-Citation-SOV)

# User

Marke: {{brand}}

USP:
{{usp}}

Ziel-Keywords:
{{target_keywords}}

Markt: {{market}}

Liefere:

1. 15 Listicle-URLs (oder Such-Anfragen, falls Echtzeit-Recherche nötig),
   priorisiert nach Impact.
2. Für die Top 5: Editorial-Pitch in 3–4 Sätzen pro Listicle.
3. Vorgeschlagener Listicle-Eintrag der Marke (Name, Tagline, „Best for", 3
   Bullet-Vorteile, 1 Differenzierungs-Hook).
4. Tracking-Plan: was wird wie gemessen, ab wann.
