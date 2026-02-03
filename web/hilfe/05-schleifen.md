# Schleifen - Dinge wiederholen

Schleifen sind super praktisch, wenn du etwas mehrmals machen willst, ohne den Code mehrmals zu schreiben!

## WIEDERHOLE - X mal machen

Die einfachste Schleife:

```benlang
WIEDERHOLE 5 {
    SCHREIBE("Hallo!")
}
```

Das schreibt "Hallo!" fünfmal!

### Beispiel: Kreise zeichnen

```benlang
VAR y = 50

WIEDERHOLE 10 {
    ZEICHNE_KREIS(400, y, 20, "#4ecca3")
    y = y + 50
}
```

Das zeichnet 10 Kreise untereinander.

## FUER - Zählen von A bis B

Mit `FUER` kannst du zählen:

```benlang
FUER i VON 1 BIS 10 {
    SCHREIBE(i)
}
```

Das schreibt: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

### Beispiel: Nummern anzeigen

```benlang
WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    FUER i VON 1 BIS 10 {
        ZEIGE_TEXT("Nummer " + i, 20, i * 50, "#ffffff", 20)
    }
}
```

### Beispiel: Gitter zeichnen

```benlang
WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Vertikale Linien
    FUER x VON 0 BIS 8 {
        ZEICHNE_LINIE(x * 100, 0, x * 100, 600, "#333333")
    }
    
    // Horizontale Linien
    FUER y VON 0 BIS 6 {
        ZEICHNE_LINIE(0, y * 100, 800, y * 100, "#333333")
    }
}
```

## SOLANGE - Wiederholen bis etwas passiert

Mit `SOLANGE` wiederholst du, bis eine Bedingung nicht mehr wahr ist:

```benlang
VAR zaehler = 0

SOLANGE zaehler < 5 {
    SCHREIBE(zaehler)
    zaehler = zaehler + 1
}
```

Das schreibt: 0, 1, 2, 3, 4

**Vorsicht!** Wenn die Bedingung nie falsch wird, läuft die Schleife für immer (Endlosschleife)!

## Verschachtelte Schleifen

Du kannst Schleifen ineinander setzen:

```benlang
FUER zeile VON 0 BIS 4 {
    FUER spalte VON 0 BIS 4 {
        ZEICHNE_RECHTECK(spalte * 50, zeile * 50, 45, 45, "#4ecca3")
    }
}
```

Das zeichnet ein 5x5 Gitter aus Quadraten!

### Beispiel: Schachbrett

```benlang
SPIEL "Schachbrett"

WENN_IMMER {
    FUER zeile VON 0 BIS 7 {
        FUER spalte VON 0 BIS 7 {
            VAR farbe = "#ffffff"
            
            // Abwechselnde Farben
            WENN (zeile + spalte) % 2 == 0 {
                farbe = "#000000"
            }
            
            ZEICHNE_RECHTECK(spalte * 75, zeile * 75, 75, 75, farbe)
        }
    }
}
```

## Sterne am Himmel

```benlang
SPIEL "Sternenhimmel"

// Sternpositionen vorher festlegen
VAR sternX = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
VAR sternY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
VAR anzahlSterne = 20

WENN_START {
    // Zufällige Positionen für Sterne
    FUER i VON 0 BIS anzahlSterne - 1 {
        sternX[i] = ZUFALL(0, 800)
        sternY[i] = ZUFALL(0, 600)
    }
}

WENN_IMMER {
    // Dunkler Himmel
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#0a0a20")
    
    // Sterne zeichnen
    FUER i VON 0 BIS anzahlSterne - 1 {
        ZEICHNE_KREIS(sternX[i], sternY[i], 2, "#ffffff")
    }
}
```

## Schleifen für Spiellogik

### Feinde zeichnen

```benlang
VAR feindX = [100, 200, 300, 400, 500]
VAR feindY = [100, 100, 100, 100, 100]
VAR anzahlFeinde = 5

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Alle Feinde bewegen und zeichnen
    FUER i VON 0 BIS anzahlFeinde - 1 {
        // Feind nach unten bewegen
        feindY[i] = feindY[i] + 1
        
        // Wenn unten angekommen, oben neu starten
        WENN feindY[i] > 600 {
            feindY[i] = 0
            feindX[i] = ZUFALL(50, 750)
        }
        
        // Feind zeichnen
        ZEICHNE_RECHTECK(feindX[i] - 20, feindY[i] - 20, 40, 40, "#e94560")
    }
}
```

## Tipps

1. **FUER** ist am besten wenn du weißt, wie oft du wiederholen willst
2. **SOLANGE** ist am besten wenn du bis zu einem Ereignis wiederholen willst
3. **WIEDERHOLE** ist am einfachsten für simple Wiederholungen
4. Pass auf bei **SOLANGE** - vergiss nicht, die Bedingung irgendwann falsch zu machen!

## Übung

1. Zeichne eine Treppe aus Rechtecken (jede Stufe weiter rechts und höher)
2. Erstelle einen "Regen" aus fallenden blauen Kreisen
3. Zeichne konzentrische Kreise (Kreise ineinander, wie eine Zielscheibe)
