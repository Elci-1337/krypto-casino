# Skills

Dieser Ordner enthält die Wissensbasis, die das Admin-Backend von leventelci.de
über die Claude API ausführt. Jede `*.md`-Datei ist ein eigenständiger Skill mit
folgendem Aufbau:

```
---
id: <eindeutige-id>             # z.B. brand-mentions
name: <menschenlesbarer-name>   # z.B. "Brand Mentions"
model: claude-opus-4-7          # Modell, das den Skill ausführt
inputs:                         # Pflicht-Inputs aus dem Admin-Panel
  - name: brand
    label: Marke / URL
    type: text
  - name: target_keywords
    label: Ziel-Keywords (eine pro Zeile)
    type: textarea
outputs:                        # Was der Skill zurückgibt
  - name: pitch_markdown
    label: Pitch-Markdown
    type: markdown
---

# System-Prompt

(Hier kommt dein hinterlegtes Wissen rein. Wird beim Claude-API-Aufruf als
system-prompt verwendet — wird via prompt-caching gecacht.)

# User-Prompt-Template

(Wird beim Ausführen mit den oben definierten Inputs interpoliert. Variablen
in `{{double_curly}}`-Syntax.)
```

Die drei Skills, die du erwähnt hast, liegen als Stubs vor:

- `brand-mentions.md`
- `listicles.md`
- `local-push.md`

Füll sie mit deinem Wissen, und das Admin-Panel zeigt sie automatisch als
ausführbare Karten.
