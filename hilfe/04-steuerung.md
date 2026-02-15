---
layout: default
title: Steuerung
nav_order: 4
---

# Steuerung - Tastatur und Maus

Jetzt lernst du, wie du dein Spiel mit Tastatur und Maus steuern kannst!

## Tastatur

### Taste gedrückt halten

Mit `TASTE_GEDRUECKT` prüfst du, ob eine Taste gerade gedrückt ist:

```benlang
WENN_IMMER {
    WENN TASTE_GEDRUECKT("links") {
        x = x - 5    // Nach links bewegen
    }
    WENN TASTE_GEDRUECKT("rechts") {
        x = x + 5    // Nach rechts bewegen
    }
}
```

Das ist perfekt für **flüssige Bewegungen** - solange du die Taste hältst, bewegt sich etwas.

### Aktuelle Taste auslesen

Mit `GEDRUECKTE_TASTE` kannst du die zuletzt gedrückte Taste auslesen und in einer Variable speichern:

```benlang
VAR buchstabe = GEDRUECKTE_TASTE
```

Das ist nützlich für Spiele wie Galgenmännchen, wo Spieler Buchstaben eingeben:

```benlang
WENN_IMMER {
    VAR taste = GEDRUECKTE_TASTE
    
    // Nur neue Tasten verarbeiten
    WENN taste != "" UND taste != letzteTaste {
        letzteTaste = taste
        SCHREIBE("Du hast " + taste + " gedrueckt!")
    }
}
```

### Taste einmal drücken

Mit `WENN_TASTE` reagierst du auf einen einzelnen Tastendruck:

```benlang
WENN_TASTE("leertaste") {
    SCHREIBE("Leertaste gedrückt!")
    punkte = punkte + 1
}
```

Das ist perfekt für **Aktionen** wie Springen, Schießen oder Punkte sammeln.

## Verfügbare Tasten

### Pfeiltasten

| Taste | Name |
|-------|------|
| ← | `"links"` |
| → | `"rechts"` |
| ↑ | `"hoch"` |
| ↓ | `"runter"` |

### Sondertasten

| Taste | Name |
|-------|------|
| Leertaste | `"leertaste"` |
| Enter | `"eingabe"` |
| Escape | `"escape"` |

### Buchstaben und Zahlen

Einfach den Buchstaben in Kleinbuchstaben:

```benlang
WENN_TASTE("a") { ... }
WENN_TASTE("w") { ... }
WENN_TASTE("1") { ... }
```

## Beispiel: Spieler bewegen

```benlang
SPIEL "Steuerung Demo"

VAR spielerX = 400
VAR spielerY = 300
VAR geschwindigkeit = 5

WENN_IMMER {
    // Hintergrund
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Pfeiltasten-Steuerung
    WENN TASTE_GEDRUECKT("links") {
        spielerX = spielerX - geschwindigkeit
    }
    WENN TASTE_GEDRUECKT("rechts") {
        spielerX = spielerX + geschwindigkeit
    }
    WENN TASTE_GEDRUECKT("hoch") {
        spielerY = spielerY - geschwindigkeit
    }
    WENN TASTE_GEDRUECKT("runter") {
        spielerY = spielerY + geschwindigkeit
    }
    
    // Spieler zeichnen
    ZEICHNE_KREIS(spielerX, spielerY, 25, "#4ecca3")
    
    // Anleitung
    ZEIGE_TEXT("Benutze die Pfeiltasten!", 280, 50, "#ffffff", 20)
}
```

## WASD-Steuerung

Viele Spiele benutzen WASD statt der Pfeiltasten:

```benlang
WENN TASTE_GEDRUECKT("w") {
    spielerY = spielerY - 5    // Hoch
}
WENN TASTE_GEDRUECKT("s") {
    spielerY = spielerY + 5    // Runter
}
WENN TASTE_GEDRUECKT("a") {
    spielerX = spielerX - 5    // Links
}
WENN TASTE_GEDRUECKT("d") {
    spielerX = spielerX + 5    // Rechts
}
```

## Maus

### Mausposition

```benlang
VAR mausX = MAUS_X()    // X-Position der Maus
VAR mausY = MAUS_Y()    // Y-Position der Maus
```

### Mausklick

```benlang
WENN MAUS_GEDRUECKT() {
    SCHREIBE("Maus geklickt!")
}
```

## Beispiel: Mit der Maus malen

```benlang
SPIEL "Malen"

WENN_START {
    SCHREIBE("Klicke und ziehe zum Malen!")
}

WENN_IMMER {
    // Kein Hintergrund löschen = Spur bleibt!
    
    WENN MAUS_GEDRUECKT() {
        // Male einen Kreis an der Mausposition
        ZEICHNE_KREIS(MAUS_X(), MAUS_Y(), 10, "#4ecca3")
    }
    
    // Zeige Mausposition
    ZEIGE_TEXT("X: " + MAUS_X() + " Y: " + MAUS_Y(), 20, 30, "#ffffff", 16)
}

WENN_TASTE("c") {
    // Clear - Bildschirm löschen
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
}
```

## Beispiel: Maus verfolgen

```benlang
SPIEL "Mausverfolger"

VAR ballX = 400
VAR ballY = 300

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Ball bewegt sich langsam zur Maus
    VAR zielX = MAUS_X()
    VAR zielY = MAUS_Y()
    
    // Etwas in Richtung Maus bewegen
    ballX = ballX + (zielX - ballX) * 0.05
    ballY = ballY + (zielY - ballY) * 0.05
    
    // Ball zeichnen
    ZEICHNE_KREIS(ballX, ballY, 30, "#e94560")
    
    // Zielkreuz an Mausposition
    ZEICHNE_KREIS(MAUS_X(), MAUS_Y(), 5, "#ffffff")
}
```

## Spielfeldgrenzen

Verhindere, dass der Spieler aus dem Bildschirm läuft:

```benlang
// Nach dem Bewegen prüfen:

WENN spielerX < 0 {
    spielerX = 0
}
WENN spielerX > 800 {
    spielerX = 800
}
WENN spielerY < 0 {
    spielerY = 0
}
WENN spielerY > 600 {
    spielerY = 600
}
```

## 2-Spieler Steuerung

```benlang
// Spieler 1: WASD
VAR spieler1X = 100
VAR spieler1Y = 300

// Spieler 2: Pfeiltasten
VAR spieler2X = 700
VAR spieler2Y = 300

WENN_IMMER {
    // Spieler 1
    WENN TASTE_GEDRUECKT("w") { spieler1Y = spieler1Y - 5 }
    WENN TASTE_GEDRUECKT("s") { spieler1Y = spieler1Y + 5 }
    
    // Spieler 2
    WENN TASTE_GEDRUECKT("hoch") { spieler2Y = spieler2Y - 5 }
    WENN TASTE_GEDRUECKT("runter") { spieler2Y = spieler2Y + 5 }
    
    // Zeichnen
    ZEICHNE_KREIS(spieler1X, spieler1Y, 25, "#4ecca3")
    ZEICHNE_KREIS(spieler2X, spieler2Y, 25, "#e94560")
}
```

Schau dir das Pong-Beispiel an für ein komplettes 2-Spieler-Spiel!

## Übung

Erstelle ein Spiel, in dem:
1. Ein Kreis der Maus folgt
2. Bei Leertaste wird der Kreis größer
3. Bei Taste "r" wird der Kreis wieder klein
4. Die Kreisfarbe wechselt bei jedem Mausklick

## Text-Eingabe

### FRAGE

Mit `FRAGE` kannst du den Spieler nach Text fragen:

```benlang
VAR name = FRAGE("Wie heißt du?")
ZEIGE_TEXT("Hallo " + name, 100, 100, "#ffffff", 20)
```

Das Spiel pausiert, bis der Spieler etwas eingibt und Enter drückt.

- Ein Textfeld erscheint auf dem Bildschirm
- Der Spieler kann Text eingeben
- Mit Enter wird die Eingabe bestätigt
- Der eingegebene Text wird zurückgegeben

### Beispiel: Namenabfrage

```benlang
SPIEL "Begruessung"

VAR spielerName = ""

WENN_START {
    spielerName = FRAGE("Wie heißt du?")
}

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    ZEIGE_TEXT("Willkommen, " + spielerName + "!", 200, 300, "#4ecca3", 30)
}
```

### Beispiel: Rechenquiz

```benlang
SPIEL "Mathe Quiz"

VAR punkte = 0
VAR antwort = ""

WENN_TASTE("q") {
    antwort = FRAGE("Was ist 5 + 3?")
    WENN antwort == "8" {
        punkte = punkte + 1
        SCHREIBE("Richtig!")
    } SONST {
        SCHREIBE("Leider falsch!")
    }
}

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    ZEIGE_TEXT("Punkte: " + punkte, 50, 50, "#ffffff", 24)
    ZEIGE_TEXT("Druecke Q fuer eine Frage!", 200, 300, "#4ecca3", 20)
}
```
