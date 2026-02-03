# Dein eigenes Spiel erstellen

Jetzt weißt du alles, um dein eigenes Spiel zu bauen! Hier ist eine Schritt-für-Schritt-Anleitung.

## Schritt 1: Idee entwickeln

Beantworte diese Fragen:

1. **Was ist das Ziel?** (Punkte sammeln, Überleben, Rätsel lösen)
2. **Wie steuert man?** (Pfeiltasten, Maus, WASD)
3. **Was sind die Regeln?** (Wann gewinnt/verliert man?)
4. **Welche Objekte brauchst du?** (Spieler, Gegner, Sammelobjekte)

### Beispiel-Idee: "Meteor Dodge"

- **Ziel**: So lange wie möglich überleben
- **Steuerung**: Maus bewegt das Raumschiff
- **Regeln**: Meteore ausweichen, bei Treffer Game Over
- **Objekte**: Raumschiff, Meteore, Sterne für Bonuspunkte

## Schritt 2: Projektordner erstellen

Erstelle einen neuen Ordner für dein Spiel:

```
meteor-dodge/
└── hauptspiel.ben
```

## Schritt 3: Grundgerüst schreiben

Jedes Spiel braucht diese Struktur:

```benlang
SPIEL "Meteor Dodge"

// ===== VARIABLEN =====
VAR spielerX = 400
VAR spielerY = 500
VAR punkte = 0
VAR leben = 3
VAR spielLaeuft = WAHR

// ===== START =====
WENN_START {
    SCHREIBE("Spiel gestartet!")
}

// ===== SPIELSCHLEIFE =====
WENN_IMMER {
    // 1. Hintergrund zeichnen
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#0a0a20")
    
    WENN spielLaeuft {
        // 2. Spieler steuern
        
        // 3. Objekte bewegen
        
        // 4. Kollisionen prüfen
        
        // 5. Alles zeichnen
    }
    
    // 6. UI anzeigen (Punkte, Leben)
}

// ===== STEUERUNG =====
WENN_TASTE("leertaste") {
    // Aktion
}
```

## Schritt 4: Spieler hinzufügen

```benlang
// Spieler folgt der Maus
WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#0a0a20")
    
    WENN spielLaeuft {
        // Spieler zur Maus bewegen
        spielerX = MAUS_X()
        spielerY = MAUS_Y()
        
        // Spieler zeichnen (Raumschiff als Dreieck)
        ZEICHNE_RECHTECK(spielerX - 15, spielerY - 10, 30, 20, "#4ecca3")
        ZEICHNE_RECHTECK(spielerX - 5, spielerY - 25, 10, 15, "#4ecca3")
    }
    
    ZEIGE_TEXT("Punkte: " + punkte, 20, 30, "#ffffff", 20)
}
```

## Schritt 5: Gegner/Hindernisse hinzufügen

```benlang
// Meteore
VAR meteorX = [100, 200, 300, 400, 500, 600, 700]
VAR meteorY = [-50, -100, -150, -80, -120, -90, -60]
VAR meteorSpeed = [3, 4, 2, 5, 3, 4, 2]
VAR anzahlMeteore = 7

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#0a0a20")
    
    WENN spielLaeuft {
        spielerX = MAUS_X()
        spielerY = MAUS_Y()
        
        // Meteore bewegen und zeichnen
        FUER i VON 0 BIS anzahlMeteore - 1 {
            meteorY[i] = meteorY[i] + meteorSpeed[i]
            
            // Wenn Meteor unten raus, oben neu starten
            WENN meteorY[i] > 650 {
                meteorY[i] = -50
                meteorX[i] = ZUFALL(50, 750)
                punkte = punkte + 1
            }
            
            // Meteor zeichnen
            ZEICHNE_KREIS(meteorX[i], meteorY[i], 20, "#8b4513")
            ZEICHNE_KREIS(meteorX[i] - 5, meteorY[i] - 5, 5, "#a0522d")
        }
        
        // Spieler zeichnen
        ZEICHNE_RECHTECK(spielerX - 15, spielerY - 10, 30, 20, "#4ecca3")
    }
    
    ZEIGE_TEXT("Punkte: " + punkte, 20, 30, "#ffffff", 20)
}
```

## Schritt 6: Kollisionen hinzufügen

```benlang
// In der WENN_IMMER Schleife, nach dem Meteor-Zeichnen:

// Kollision prüfen
FUER i VON 0 BIS anzahlMeteore - 1 {
    VAR dx = spielerX - meteorX[i]
    VAR dy = spielerY - meteorY[i]
    
    // Einfache Kreis-Kollision
    WENN dx * dx + dy * dy < 900 {    // 30*30 = 900
        leben = leben - 1
        meteorY[i] = -100    // Meteor weg
        
        WENN leben <= 0 {
            spielLaeuft = FALSCH
        }
    }
}
```

## Schritt 7: Game Over und Neustart

```benlang
// Am Ende von WENN_IMMER:

WENN NICHT spielLaeuft {
    ZEICHNE_RECHTECK(200, 200, 400, 200, "#16213e")
    ZEIGE_TEXT("GAME OVER", 300, 270, "#e94560", 48)
    ZEIGE_TEXT("Punkte: " + punkte, 340, 330, "#ffffff", 24)
    ZEIGE_TEXT("LEERTASTE für Neustart", 280, 380, "#888888", 18)
}

// Neustart
WENN_TASTE("leertaste") {
    WENN NICHT spielLaeuft {
        spielLaeuft = WAHR
        punkte = 0
        leben = 3
        
        // Meteore zurücksetzen
        FUER i VON 0 BIS anzahlMeteore - 1 {
            meteorY[i] = ZUFALL(-200, -50)
            meteorX[i] = ZUFALL(50, 750)
        }
    }
}
```

## Komplettes Spiel: Meteor Dodge

```benlang
SPIEL "Meteor Dodge"

// Spieler
VAR spielerX = 400
VAR spielerY = 500

// Meteore
VAR meteorX = [100, 200, 300, 400, 500, 600, 700]
VAR meteorY = [-50, -100, -150, -80, -120, -90, -60]
VAR meteorSpeed = [3, 4, 2, 5, 3, 4, 2]
VAR anzahlMeteore = 7

// Spielstatus
VAR punkte = 0
VAR leben = 3
VAR spielLaeuft = WAHR

WENN_START {
    SCHREIBE("Bewege die Maus um den Meteoren auszuweichen!")
}

WENN_IMMER {
    // Sternenhimmel
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#0a0a20")
    
    WENN spielLaeuft {
        // Spieler folgt Maus
        spielerX = MAUS_X()
        spielerY = MAUS_Y()
        
        // Spieler im Spielfeld halten
        WENN spielerX < 20 { spielerX = 20 }
        WENN spielerX > 780 { spielerX = 780 }
        WENN spielerY < 20 { spielerY = 20 }
        WENN spielerY > 580 { spielerY = 580 }
        
        // Meteore bewegen
        FUER i VON 0 BIS anzahlMeteore - 1 {
            meteorY[i] = meteorY[i] + meteorSpeed[i]
            
            WENN meteorY[i] > 650 {
                meteorY[i] = -50
                meteorX[i] = ZUFALL(50, 750)
                meteorSpeed[i] = ZUFALL(2, 6)
                punkte = punkte + 1
            }
            
            // Kollision
            VAR dx = spielerX - meteorX[i]
            VAR dy = spielerY - meteorY[i]
            WENN dx * dx + dy * dy < 900 {
                leben = leben - 1
                meteorY[i] = -100
                WENN leben <= 0 {
                    spielLaeuft = FALSCH
                }
            }
            
            // Meteor zeichnen
            ZEICHNE_KREIS(meteorX[i], meteorY[i], 20, "#8b4513")
            ZEICHNE_KREIS(meteorX[i] - 5, meteorY[i] - 5, 5, "#a0522d")
        }
        
        // Spieler zeichnen
        ZEICHNE_RECHTECK(spielerX - 15, spielerY - 10, 30, 20, "#4ecca3")
        ZEICHNE_RECHTECK(spielerX - 5, spielerY - 25, 10, 15, "#4ecca3")
    }
    
    // UI
    ZEIGE_TEXT("Punkte: " + punkte, 20, 30, "#4ecca3", 20)
    ZEIGE_TEXT("Leben: " + leben, 700, 30, "#e94560", 20)
    
    // Game Over
    WENN NICHT spielLaeuft {
        ZEICHNE_RECHTECK(200, 200, 400, 200, "#16213e")
        ZEIGE_TEXT("GAME OVER", 300, 270, "#e94560", 48)
        ZEIGE_TEXT("Punkte: " + punkte, 340, 330, "#ffffff", 24)
        ZEIGE_TEXT("LEERTASTE = Neustart", 285, 375, "#888888", 16)
    }
}

WENN_TASTE("leertaste") {
    WENN NICHT spielLaeuft {
        spielLaeuft = WAHR
        punkte = 0
        leben = 3
        FUER i VON 0 BIS anzahlMeteore - 1 {
            meteorY[i] = ZUFALL(-200, -50)
            meteorX[i] = ZUFALL(50, 750)
        }
    }
}
```

## Checkliste für dein Spiel

- [ ] Spielname definiert (`SPIEL "..."`)
- [ ] Alle Variablen am Anfang deklariert
- [ ] `WENN_START` für Initialisierung
- [ ] `WENN_IMMER` für Spielschleife
- [ ] Hintergrund wird jeden Frame gezeichnet
- [ ] Spieler kann gesteuert werden
- [ ] Spielobjekte bewegen sich
- [ ] Kollisionen werden geprüft
- [ ] Punkte/Leben werden angezeigt
- [ ] Game Over Zustand vorhanden
- [ ] Neustart möglich

## Ideen für mehr Spiele

1. **Flappy Bird Klon**: Vogel fliegt, Hindernisse ausweichen
2. **Weltraum Shooter**: Schieße auf Aliens
3. **Labyrinth**: Finde den Ausgang
4. **Memory**: Finde die Paare
5. **Reaktionstest**: Klicke so schnell wie möglich
6. **Fang-Spiel**: Fange fallende Objekte
7. **Quiz**: Beantworte Fragen richtig

## Viel Spaß beim Programmieren!

Das Wichtigste: **Experimentiere!** Ändere Zahlen, Farben und Regeln. Wenn etwas nicht funktioniert, ist das okay - daraus lernt man am meisten!

Schau dir auch die Beispiele an:
- `beispiele/snake` - Klassisches Snake
- `beispiele/breakout` - Blöcke zerstören
- `beispiele/pong` - 2-Spieler Tennis
