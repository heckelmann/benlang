---
layout: default
title: Figuren
nav_order: 7
---

# Figuren - Bilder laden und bewegen

Anstatt alles selbst zu zeichnen, kannst du Bilder laden und als Spielfiguren benutzen!

## Ein Bild laden

```benlang
FIGUR spieler = LADE_BILD("spieler.png")
```

Das Bild muss im selben Ordner wie dein Spiel liegen!

## Figur positionieren

```benlang
FIGUR spieler = LADE_BILD("spieler.png")

WENN_START {
    spieler.x = 400    // Horizontale Position
    spieler.y = 300    // Vertikale Position
}
```

## Figur-Eigenschaften

| Eigenschaft | Bedeutung |
|-------------|-----------|
| `figur.x` | X-Position (horizontal) |
| `figur.y` | Y-Position (vertikal) |
| `figur.breite` | Breite in Pixeln |
| `figur.hoehe` | Höhe in Pixeln |
| `figur.sichtbar` | WAHR oder FALSCH |
| `figur.drehung` | Drehung in Grad (0-360) |

## Figur bewegen

```benlang
FIGUR spieler = LADE_BILD("spieler.png")

VAR spielerX = 400
VAR spielerY = 300

WENN_START {
    spieler.x = spielerX
    spieler.y = spielerY
}

WENN_IMMER {
    // Hintergrund
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Steuerung
    WENN TASTE_GEDRUECKT("links") { spielerX = spielerX - 5 }
    WENN TASTE_GEDRUECKT("rechts") { spielerX = spielerX + 5 }
    WENN TASTE_GEDRUECKT("hoch") { spielerY = spielerY - 5 }
    WENN TASTE_GEDRUECKT("runter") { spielerY = spielerY + 5 }
    
    // Position aktualisieren
    spieler.x = spielerX
    spieler.y = spielerY
}
```

## Mehrere Figuren

```benlang
FIGUR spieler = LADE_BILD("spieler.png")
FIGUR gegner = LADE_BILD("gegner.png")
FIGUR schatz = LADE_BILD("schatz.png")

WENN_START {
    spieler.x = 100
    spieler.y = 300
    
    gegner.x = 700
    gegner.y = 300
    
    schatz.x = 400
    schatz.y = 200
}
```

## Figur verstecken/zeigen

```benlang
FIGUR powerup = LADE_BILD("stern.png")

WENN_START {
    powerup.sichtbar = WAHR
}

WENN_TASTE("p") {
    powerup.sichtbar = FALSCH    // Verstecken
}

WENN_TASTE("s") {
    powerup.sichtbar = WAHR      // Wieder zeigen
}
```

## Figur drehen

```benlang
FIGUR pfeil = LADE_BILD("pfeil.png")

VAR winkel = 0

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    winkel = winkel + 2    // Langsam drehen
    pfeil.drehung = winkel
    
    pfeil.x = 400
    pfeil.y = 300
}
```

## Eigene Bilder erstellen

Du kannst einfache PNG-Bilder mit jedem Zeichenprogramm erstellen:

- **Windows**: Paint, Paint 3D
- **Mac**: Vorschau, Pixelmator
- **Online**: Piskel (piskelapp.com), Pixilart (pixilart.com)
- **Kostenlos**: GIMP, Krita

### Tipps für Spielgrafiken:

1. **Klein halten**: 32x32 oder 64x64 Pixel reichen oft
2. **PNG benutzen**: Unterstützt Transparenz
3. **Einfache Formen**: Klare Umrisse sind besser erkennbar
4. **Transparenter Hintergrund**: So siehst du keinen weißen Kasten

## Beispiel: Sammler-Spiel mit Bildern

Erstelle zuerst diese Bilder in deinem Projektordner:
- `spieler.png` (32x32, z.B. ein grüner Kreis)
- `stern.png` (32x32, z.B. ein gelber Stern)

```benlang
SPIEL "Sterne Sammeln"

FIGUR spieler = LADE_BILD("spieler.png")
FIGUR stern = LADE_BILD("stern.png")

VAR spielerX = 400
VAR spielerY = 300
VAR sternX = 200
VAR sternY = 200
VAR punkte = 0

WENN_START {
    spieler.x = spielerX
    spieler.y = spielerY
    stern.x = sternX
    stern.y = sternY
    SCHREIBE("Sammle die Sterne!")
}

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Spieler steuern
    WENN TASTE_GEDRUECKT("links") { spielerX = spielerX - 5 }
    WENN TASTE_GEDRUECKT("rechts") { spielerX = spielerX + 5 }
    WENN TASTE_GEDRUECKT("hoch") { spielerY = spielerY - 5 }
    WENN TASTE_GEDRUECKT("runter") { spielerY = spielerY + 5 }
    
    // Figuren aktualisieren
    spieler.x = spielerX
    spieler.y = spielerY
    
    // Kollision prüfen
    VAR dx = spielerX - sternX
    VAR dy = spielerY - sternY
    WENN dx > -40 UND dx < 40 UND dy > -40 UND dy < 40 {
        punkte = punkte + 1
        sternX = ZUFALL(50, 750)
        sternY = ZUFALL(50, 550)
        stern.x = sternX
        stern.y = sternY
    }
    
    ZEIGE_TEXT("Punkte: " + punkte, 20, 40, "#ffffff", 24)
}
```

## Automatische Kollisionserkennung

BenLang kann Kollisionen zwischen Figuren automatisch erkennen:

```benlang
FIGUR spieler = LADE_BILD("spieler.png")
FIGUR gegner = LADE_BILD("gegner.png")

WENN_KOLLISION(spieler, gegner) {
    SCHREIBE("Autsch! Du wurdest getroffen!")
    leben = leben - 1
}
```

## Projektstruktur

Dein Projektordner sollte so aussehen:

```
mein-spiel/
├── hauptspiel.ben     # Dein Code
├── spieler.png        # Spieler-Grafik
├── gegner.png         # Gegner-Grafik
├── stern.png          # Sammelobjekt
├── hintergrund.png    # Optional: Hintergrundbild
└── musik.mp3          # Optional: Hintergrundmusik
```

## Übung

1. Erstelle 3 einfache Bilder:
   - Ein Raumschiff (spieler.png)
   - Ein Asteroid (hindernis.png)
   - Ein Stern (bonus.png)

2. Programmiere ein Spiel wo:
   - Das Raumschiff sich mit Pfeiltasten bewegt
   - Asteroiden von oben nach unten fliegen
   - Sterne gesammelt werden können
   - Bei Kollision mit Asteroid verlierst du ein Leben
