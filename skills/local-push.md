---
id: local-push
name: Local Push
model: claude-opus-4-7
description: >
  Erstellt einen Local-SEO-Offpage-Plan: Citations, GBP-Signale, lokale
  Brand Mentions zur Map-Pack-Optimierung.
inputs:
  - name: business_name
    label: Unternehmensname (NAP)
    type: text
    required: true
  - name: address
    label: Adresse (Straße, PLZ, Ort)
    type: text
    required: true
  - name: phone
    label: Telefon
    type: text
    required: true
  - name: category
    label: Hauptkategorie (z.B. „Steuerberater", „Zahnarzt")
    type: text
    required: true
  - name: service_areas
    label: Einzugsgebiet (Städte/Stadtteile, eine pro Zeile)
    type: textarea
    required: false
  - name: current_rank
    label: Aktueller Map-Pack-Rank (falls bekannt)
    type: text
    required: false
outputs:
  - name: local_plan
    label: Local-Push-Plan
    type: markdown
---

# System

REPLACE_ME — hier dein hinterlegtes Wissen zu Local SEO Offpage / Local Push
einfügen:

- NAP-Konsistenz-Audit-Vorgehen (welche Verzeichnisse, welche Reihenfolge)
- Priorisierte Local-Citation-Liste pro Markt (DE / regional)
- GBP-Signale (Reviews-Cadence, Q&A-Strategie, Posts, Service-Areas, Produkte)
- Lokale Brand Mentions (Regionalpresse, Branchenverbände, lokale Blogs)
- Anti-Patterns (gekaufte Reviews, Keyword-Stuffing im GBP-Namen, NAP-Drift)
- Geo-Grid-Tracking-Setup

# User

Unternehmen: {{business_name}}
Adresse: {{address}}
Telefon: {{phone}}
Kategorie: {{category}}
Einzugsgebiet:
{{service_areas}}
Aktueller Rank: {{current_rank}}

Liefere:

1. NAP-Audit-Checkliste (Top-20-Verzeichnisse für DE + Kategorie).
2. Priorisierte Local-Citation-Liste mit Reihenfolge & geschätztem Aufwand.
3. GBP-Optimierungsplan (Reviews, Posts, Q&A, Service-Areas) für 90 Tage.
4. 10 lokale Mention-Targets (Regionalpresse, lokale Blogs, Branchenverbände).
5. Tracking-Plan: Geo-Grid-Tool, KPIs, Frequenz.
