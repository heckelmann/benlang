---
layout: default
title: Bedingungen
nav_order: 6
---

# Bedingungen - Wenn-Dann Entscheidungen

Mit Bedingungen kann dein Programm Entscheidungen treffen!

## WENN - Die einfache Entscheidung

```benlang
WENN punkte > 100 {
    ZEIGE_TEXT("Super!", 400, 300, "#4ecca3", 32)
}
```

Übersetzt: **WENN** die Punkte größer als 100 sind, **DANN** zeige "Super!" an.

## WENN-SONST - Entweder oder

```benlang
WENN leben > 0 {
    ZEIGE_TEXT("Spiel läuft!", 300, 300, "#4ecca3", 24)
} SONST {
    ZEIGE_TEXT("Game Over!", 300, 300, "#e94560", 24)
}
```

## Vergleiche

| Zeichen | Bedeutung | Beispiel |
|---------|-----------|----------|
| `==` | ist gleich | `punkte == 100` |
| `!=` | ist ungleich | `leben != 0` |
| `>` | größer als | `alter > 10` |
| `<` | kleiner als | `x < 0` |
| `>=` | größer oder gleich | `punkte >= 50` |
| `<=` | kleiner oder gleich | `zeit <= 0` |

### Beispiele:

```benlang
WENN punkte == 100 {
    SCHREIBE("Genau 100 Punkte!")
}

WENN x < 0 {
    x = 0    // Nicht aus dem Bildschirm laufen
}

WENN leben <= 0 {
    spielVorbei = WAHR
}
```

## Mehrere Bedingungen verbinden

### UND - Beide müssen wahr sein

```benlang
WENN punkte > 50 UND leben > 0 {
    ZEIGE_TEXT("Du machst das gut!", 300, 300, "#4ecca3", 24)
}
```

### ODER - Mindestens eins muss wahr sein

```benlang
WENN x < 0 ODER x > 800 {
    SCHREIBE("Spieler ist außerhalb!")
}
```

### NICHT - Umkehren

```benlang
WENN NICHT spielVorbei {
    // Spiel läuft noch
}
```

## Mehrere Möglichkeiten prüfen

```benlang
WENN punkte >= 100 {
    ZEIGE_TEXT("Perfekt!", 400, 300, "#ffd700", 32)
} SONST {
    WENN punkte >= 50 {
        ZEIGE_TEXT("Gut!", 400, 300, "#4ecca3", 32)
    } SONST {
        WENN punkte >= 25 {
            ZEIGE_TEXT("Okay", 400, 300, "#f39c12", 32)
        } SONST {
            ZEIGE_TEXT("Versuch es nochmal", 400, 300, "#e94560", 32)
        }
    }
}
```

## Beispiel: Ampel

```benlang
SPIEL "Ampel"

VAR farbe = "rot"
VAR timer = 0

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#333333")
    
    // Ampelgehäuse
    ZEICHNE_RECHTECK(350, 100, 100, 300, "#222222")
    
    // Lichter (grau wenn aus)
    VAR rotFarbe = "#440000"
    VAR gelbFarbe = "#444400"
    VAR gruenFarbe = "#004400"
    
    // Aktive Farbe hell machen
    WENN farbe == "rot" {
        rotFarbe = "#ff0000"
    }
    WENN farbe == "gelb" {
        gelbFarbe = "#ffff00"
    }
    WENN farbe == "gruen" {
        gruenFarbe = "#00ff00"
    }
    
    ZEICHNE_KREIS(400, 150, 35, rotFarbe)
    ZEICHNE_KREIS(400, 250, 35, gelbFarbe)
    ZEICHNE_KREIS(400, 350, 35, gruenFarbe)
    
    // Timer erhöhen
    timer = timer + 1
    
    // Alle 120 Frames (~2 Sekunden) wechseln
    WENN timer > 120 {
        timer = 0
        
        WENN farbe == "rot" {
            farbe = "gruen"
        } SONST {
            WENN farbe == "gruen" {
                farbe = "gelb"
            } SONST {
                farbe = "rot"
            }
        }
    }
}
```

## Beispiel: Kollisionserkennung

```benlang
SPIEL "Kollision"

VAR spielerX = 400
VAR spielerY = 500
VAR zielX = 400
VAR zielY = 200
VAR punkte = 0

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Spieler steuern
    WENN TASTE_GEDRUECKT("links") { spielerX = spielerX - 5 }
    WENN TASTE_GEDRUECKT("rechts") { spielerX = spielerX + 5 }
    WENN TASTE_GEDRUECKT("hoch") { spielerY = spielerY - 5 }
    WENN TASTE_GEDRUECKT("runter") { spielerY = spielerY + 5 }
    
    // Abstand berechnen
    VAR abstandX = spielerX - zielX
    VAR abstandY = spielerY - zielY
    
    // Wenn Abstand klein genug = Kollision!
    WENN abstandX > -40 UND abstandX < 40 {
        WENN abstandY > -40 UND abstandY < 40 {
            // Getroffen!
            punkte = punkte + 1
            zielX = ZUFALL(50, 750)
            zielY = ZUFALL(50, 450)
        }
    }
    
    // Zeichnen
    ZEICHNE_KREIS(zielX, zielY, 30, "#e94560")
    ZEICHNE_KREIS(spielerX, spielerY, 25, "#4ecca3")
    ZEIGE_TEXT("Punkte: " + punkte, 20, 40, "#ffffff", 24)
}
```

## Spielzustände

Benutze Variablen um den Spielzustand zu speichern:

```benlang
VAR spielZustand = "menu"   // "menu", "spielen", "gameover"

WENN_IMMER {
    WENN spielZustand == "menu" {
        ZEIGE_TEXT("Drücke LEERTASTE zum Starten", 200, 300, "#ffffff", 24)
    }
    
    WENN spielZustand == "spielen" {
        // Dein Spielcode hier
    }
    
    WENN spielZustand == "gameover" {
        ZEIGE_TEXT("Game Over!", 300, 300, "#e94560", 48)
        ZEIGE_TEXT("R für Neustart", 300, 380, "#888888", 20)
    }
}

WENN_TASTE("leertaste") {
    WENN spielZustand == "menu" {
        spielZustand = "spielen"
    }
}

WENN_TASTE("r") {
    WENN spielZustand == "gameover" {
        spielZustand = "menu"
        punkte = 0
        leben = 3
    }
}
```

## Tipps

1. `=` ist zum **Zuweisen** (`punkte = 10`)
2. `==` ist zum **Vergleichen** (`WENN punkte == 10`)
3. Vergiss die geschweiften Klammern `{ }` nicht!
4. Du kannst Bedingungen verschachteln (Wenn in Wenn)

## Übung

Erstelle ein Spiel wo:
1. Ein Quadrat in der Mitte ist
2. Es wird grün wenn die Maus darüber ist
3. Bei Klick auf das Quadrat bekommst du einen Punkt
4. Nach 10 Punkten erscheint "Gewonnen!"
