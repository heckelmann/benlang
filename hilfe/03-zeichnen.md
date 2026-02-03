---
layout: default
title: Zeichnen
nav_order: 3
---

# Zeichnen - Male auf dem Bildschirm

In BenLang kannst du Formen, Text und Bilder auf den Bildschirm malen!

## Der Bildschirm

Der Bildschirm ist 800 Pixel breit und 600 Pixel hoch.

```
(0,0) -----------------> (800,0)
  |                         |
  |     DEIN SPIELFELD      |
  |                         |
  v                         v
(0,600) ---------------> (800,600)
```

- **X** geht von links (0) nach rechts (800)
- **Y** geht von oben (0) nach unten (600)

## Rechteck zeichnen

```benlang
ZEICHNE_RECHTECK(x, y, breite, hoehe, farbe)
```

### Beispiele:

```benlang
// Roter Kasten oben links
ZEICHNE_RECHTECK(0, 0, 100, 100, "#ff0000")

// Grüner Kasten in der Mitte
ZEICHNE_RECHTECK(350, 250, 100, 100, "#00ff00")

// Langer blauer Balken unten
ZEICHNE_RECHTECK(0, 550, 800, 50, "#0000ff")
```

## Kreis zeichnen

```benlang
ZEICHNE_KREIS(x, y, radius, farbe)
```

**x und y** sind die Mitte des Kreises!

### Beispiele:

```benlang
// Weißer Kreis in der Mitte
ZEICHNE_KREIS(400, 300, 50, "#ffffff")

// Kleiner gelber Kreis
ZEICHNE_KREIS(100, 100, 20, "#ffff00")
```

## Linie zeichnen

```benlang
ZEICHNE_LINIE(x1, y1, x2, y2, farbe)
```

Zeichnet eine Linie von Punkt 1 zu Punkt 2.

### Beispiele:

```benlang
// Diagonale Linie
ZEICHNE_LINIE(0, 0, 800, 600, "#ffffff")

// Horizontale Linie
ZEICHNE_LINIE(100, 300, 700, 300, "#ff0000")
```

## Text anzeigen

```benlang
ZEIGE_TEXT(text, x, y, farbe, groesse)
```

### Beispiele:

```benlang
// Großer Titel
ZEIGE_TEXT("Mein Spiel", 300, 100, "#4ecca3", 48)

// Kleiner Text
ZEIGE_TEXT("Drücke LEERTASTE", 320, 500, "#888888", 16)

// Text mit Variable
VAR punkte = 42
ZEIGE_TEXT("Punkte: " + punkte, 20, 30, "#ffffff", 20)
```

## Farben

Farben werden als "Hex-Codes" geschrieben. Sie beginnen mit `#` und haben 6 Zeichen:

| Farbe | Code | Aussehen |
|-------|------|----------|
| Rot | `"#ff0000"` | Knallrot |
| Grün | `"#00ff00"` | Hellgrün |
| Blau | `"#0000ff"` | Blau |
| Weiß | `"#ffffff"` | Weiß |
| Schwarz | `"#000000"` | Schwarz |
| Gelb | `"#ffff00"` | Gelb |
| Türkis | `"#4ecca3"` | Schönes Grün |
| Pink | `"#e94560"` | Rot-Pink |
| Orange | `"#f39c12"` | Orange |
| Lila | `"#9b59b6"` | Violett |
| Dunkelblau | `"#1a1a2e"` | Fast Schwarz |

### Eigene Farben mischen

Der Hex-Code besteht aus: `#RRGGBB`
- **RR** = Rot (00-ff)
- **GG** = Grün (00-ff)  
- **BB** = Blau (00-ff)

Je höher die Zahl (ff = 255), desto mehr von der Farbe!

## Reihenfolge ist wichtig!

Was du zuerst zeichnest, wird von späteren Dingen überdeckt:

```benlang
WENN_IMMER {
    // 1. Zuerst Hintergrund (ganz hinten)
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // 2. Dann Spielobjekte
    ZEICHNE_KREIS(400, 300, 50, "#4ecca3")
    
    // 3. Zuletzt UI/Text (ganz vorne)
    ZEIGE_TEXT("Punkte: 0", 20, 30, "#ffffff", 20)
}
```

## Beispiel: Gesicht malen

```benlang
SPIEL "Gesicht"

WENN_IMMER {
    // Hintergrund
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#87ceeb")
    
    // Gesicht (gelber Kreis)
    ZEICHNE_KREIS(400, 300, 150, "#ffff00")
    
    // Linkes Auge
    ZEICHNE_KREIS(340, 260, 25, "#ffffff")
    ZEICHNE_KREIS(340, 260, 10, "#000000")
    
    // Rechtes Auge
    ZEICHNE_KREIS(460, 260, 25, "#ffffff")
    ZEICHNE_KREIS(460, 260, 10, "#000000")
    
    // Mund (Rechteck als Lächeln)
    ZEICHNE_RECHTECK(340, 360, 120, 20, "#ff0000")
    
    // Text
    ZEIGE_TEXT("Hallo!", 360, 500, "#000000", 32)
}
```

## Bewegung durch Variablen

Mit Variablen kannst du Dinge bewegen:

```benlang
SPIEL "Bewegter Kreis"

VAR x = 400
VAR y = 300

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Der Kreis bewegt sich automatisch
    x = x + 2
    
    // Wenn er rechts raus ist, kommt er links wieder
    WENN x > 850 {
        x = -50
    }
    
    ZEICHNE_KREIS(x, y, 30, "#4ecca3")
}
```

## Übung

Male ein Haus mit:
- Einem braunen Rechteck als Wand
- Einem roten Dreieck als Dach (benutze 3 Linien oder überlappende Rechtecke)
- Einem gelben Rechteck als Tür
- Zwei blauen Rechtecken als Fenster

Viel Spaß beim Experimentieren!
