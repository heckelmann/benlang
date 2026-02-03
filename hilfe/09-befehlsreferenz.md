# BenLang Befehlsreferenz

Eine komplette Liste aller BenLang-Befehle zum Nachschlagen.

---

## Programm-Struktur

### SPIEL
Gibt deinem Spiel einen Namen.
```benlang
SPIEL "Mein tolles Spiel"
```

### WENN_START
Wird einmal am Anfang ausgeführt.
```benlang
WENN_START {
    // Code hier läuft einmal beim Start
}
```

### WENN_IMMER
Wird jeden Frame ausgeführt (~60x pro Sekunde).
```benlang
WENN_IMMER {
    // Code hier läuft die ganze Zeit
}
```

### WENN_TASTE
Reagiert auf Tastendruck (einmal pro Druck).
```benlang
WENN_TASTE("leertaste") {
    // Wird bei Tastendruck ausgeführt
}
```

### WENN_KOLLISION
Reagiert wenn zwei Figuren sich berühren.
```benlang
WENN_KOLLISION(spieler, gegner) {
    // Wird bei Kollision ausgeführt
}
```

---

## Variablen

### VAR
Erstellt eine neue Variable.
```benlang
VAR punkte = 0           // Zahl
VAR name = "Ben"         // Text
VAR aktiv = WAHR         // Wahrheitswert
VAR zahlen = [1, 2, 3]   // Liste
```

### FIGUR
Erstellt eine Spielfigur aus einem Bild.
```benlang
FIGUR spieler = LADE_BILD("spieler.png")
```

---

## Kontrollstrukturen

### WENN / SONST
Führt Code nur aus wenn Bedingung wahr ist.
```benlang
WENN punkte > 100 {
    SCHREIBE("Super!")
} SONST {
    SCHREIBE("Weiter so!")
}
```

### SOLANGE
Wiederholt Code solange Bedingung wahr ist.
```benlang
SOLANGE leben > 0 {
    // Spiel läuft
}
```

### FUER ... VON ... BIS
Zählt von einer Zahl zur anderen.
```benlang
FUER i VON 1 BIS 10 {
    SCHREIBE(i)  // 1, 2, 3, ... 10
}
```

### WIEDERHOLE
Wiederholt Code eine bestimmte Anzahl mal.
```benlang
WIEDERHOLE 5 {
    SCHREIBE("Hallo!")  // 5x "Hallo!"
}
```

---

## Logische Operatoren

### UND
Beide Bedingungen müssen wahr sein.
```benlang
WENN alter > 10 UND punkte > 50 {
    // Nur wenn beides zutrifft
}
```

### ODER
Mindestens eine Bedingung muss wahr sein.
```benlang
WENN leben == 0 ODER zeit == 0 {
    // Wenn eins davon zutrifft
}
```

### NICHT
Kehrt einen Wahrheitswert um.
```benlang
WENN NICHT spielVorbei {
    // Wenn spielVorbei FALSCH ist
}
```

---

## Vergleichsoperatoren

| Operator | Bedeutung | Beispiel |
|----------|-----------|----------|
| `==` | gleich | `x == 10` |
| `!=` | ungleich | `x != 0` |
| `>` | größer | `x > 5` |
| `<` | kleiner | `x < 100` |
| `>=` | größer oder gleich | `x >= 0` |
| `<=` | kleiner oder gleich | `x <= 800` |

---

## Mathematik-Operatoren

| Operator | Bedeutung | Beispiel |
|----------|-----------|----------|
| `+` | Addition | `5 + 3` = 8 |
| `-` | Subtraktion | `5 - 3` = 2 |
| `*` | Multiplikation | `5 * 3` = 15 |
| `/` | Division | `6 / 3` = 2 |
| `%` | Rest (Modulo) | `7 % 3` = 1 |

---

## Funktionen

### FUNKTION
Erstellt eine eigene Funktion.
```benlang
FUNKTION verdopple(zahl) {
    ZURUECK zahl * 2
}

VAR ergebnis = verdopple(5)  // ergebnis = 10
```

### ZURUECK
Gibt einen Wert aus einer Funktion zurück.
```benlang
FUNKTION addiere(a, b) {
    ZURUECK a + b
}
```

---

## Zeichnen

### ZEICHNE_RECHTECK
```benlang
ZEICHNE_RECHTECK(x, y, breite, hoehe, farbe)
```
Zeichnet ein gefülltes Rechteck.
- `x, y` - Position der oberen linken Ecke
- `breite, hoehe` - Größe
- `farbe` - Hex-Farbcode wie `"#ff0000"`

### ZEICHNE_KREIS
```benlang
ZEICHNE_KREIS(x, y, radius, farbe)
```
Zeichnet einen gefüllten Kreis.
- `x, y` - Mittelpunkt
- `radius` - Größe
- `farbe` - Hex-Farbcode

### ZEICHNE_LINIE
```benlang
ZEICHNE_LINIE(x1, y1, x2, y2, farbe)
```
Zeichnet eine Linie von Punkt 1 zu Punkt 2.

### ZEIGE_TEXT
```benlang
ZEIGE_TEXT(text, x, y, farbe, groesse)
```
Zeigt Text auf dem Bildschirm.
- `text` - Der anzuzeigende Text
- `x, y` - Position
- `farbe` - Textfarbe
- `groesse` - Schriftgröße in Pixeln

---

## Eingabe

### TASTE_GEDRUECKT
```benlang
WENN TASTE_GEDRUECKT("links") {
    // Solange Taste gehalten wird
}
```
Gibt WAHR zurück wenn die Taste gerade gedrückt ist.

### MAUS_X / MAUS_Y
```benlang
VAR mausPositionX = MAUS_X()
VAR mausPositionY = MAUS_Y()
```
Gibt die aktuelle Mausposition zurück.

### MAUS_GEDRUECKT
```benlang
WENN MAUS_GEDRUECKT() {
    // Maustaste ist gedrückt
}
```
Gibt WAHR zurück wenn Maustaste gedrückt ist.

### FRAGE
```benlang
VAR antwort = FRAGE("Deine Frage hier")
```
Zeigt ein Textfeld und wartet auf Eingabe.
- Das Spiel pausiert während der Eingabe
- Drücke Enter um die Eingabe zu bestätigen
- Gibt den eingegebenen Text zurück

**Beispiel:**
```benlang
VAR name = FRAGE("Wie heißt du?")
ZEIGE_TEXT("Hallo " + name, 100, 100, "#ffffff", 20)
```

---

## Verfügbare Tasten

| Kategorie | Tasten |
|-----------|--------|
| Pfeile | `"links"`, `"rechts"`, `"hoch"`, `"runter"` |
| Sonder | `"leertaste"`, `"eingabe"`, `"escape"` |
| Buchstaben | `"a"` bis `"z"` |
| Zahlen | `"0"` bis `"9"` |

---

## Medien

### LADE_BILD
```benlang
FIGUR meinBild = LADE_BILD("bild.png")
```
Lädt ein Bild aus dem Projektordner.

### BILD_WECHSELN
```benlang
BILD_WECHSELN(figur, "neues-bild.png")
```
Wechselt das Bild einer Figur zur Laufzeit.
- `figur` - Die Figur deren Bild gewechselt werden soll
- `"neues-bild.png"` - Pfad zum neuen Bild

**Beispiel:**
```benlang
FIGUR spieler = LADE_BILD("spieler-stehen.png")

WENN_TASTE("rechts") {
    BILD_WECHSELN(spieler, "spieler-laufen.png")
    spieler.x = spieler.x + 5
}
```

### SPIELE_TON
```benlang
SPIELE_TON("sound.mp3")
```
Spielt eine Audiodatei ab.

---

## Mathematik-Funktionen

### ZUFALL
```benlang
VAR zahl = ZUFALL(1, 10)  // Zufallszahl 1-10
```
Gibt eine zufällige Ganzzahl zwischen min und max zurück.

### RUNDEN
```benlang
VAR gerundet = RUNDEN(3.7)  // 4
```
Rundet zur nächsten Ganzzahl.

### ABSOLUT
```benlang
VAR positiv = ABSOLUT(-5)  // 5
```
Gibt den positiven Wert zurück.

---

## Figur-Eigenschaften

Nach `FIGUR spieler = LADE_BILD("bild.png")`:

| Eigenschaft | Beschreibung | Beispiel |
|-------------|--------------|----------|
| `spieler.x` | X-Position | `spieler.x = 100` |
| `spieler.y` | Y-Position | `spieler.y = 200` |
| `spieler.breite` | Breite | `spieler.breite = 50` |
| `spieler.hoehe` | Höhe | `spieler.hoehe = 50` |
| `spieler.sichtbar` | Sichtbarkeit | `spieler.sichtbar = WAHR` |
| `spieler.drehung` | Rotation (Grad) | `spieler.drehung = 45` |

**Tipp:** Mit `BILD_WECHSELN(spieler, "neues-bild.png")` kannst du das Bild einer Figur jederzeit ändern!

---

## Hilfsfunktionen

### SCHREIBE
```benlang
SCHREIBE("Debug-Nachricht")
SCHREIBE("Punkte: " + punkte)
```
Gibt Text in der Konsole aus (zum Debuggen).

### WARTE
```benlang
WARTE(1000)  // Wartet 1 Sekunde (1000 Millisekunden)
```
Pausiert das Programm für eine bestimmte Zeit.
- Der Parameter ist die Wartezeit in Millisekunden
- 1000 Millisekunden = 1 Sekunde

**Beispiel:**
```benlang
WENN_START {
    ZEIGE_TEXT("3...", 400, 300, "#ffffff", 48)
    WARTE(1000)
    ZEIGE_TEXT("2...", 400, 300, "#ffffff", 48)
    WARTE(1000)
    ZEIGE_TEXT("1...", 400, 300, "#ffffff", 48)
    WARTE(1000)
    ZEIGE_TEXT("Los!", 400, 300, "#00ff00", 48)
}
```

**Hinweis:** WARTE funktioniert nur in WENN_START, WENN_TASTE und eigenen Funktionen. In WENN_IMMER sollte es nicht verwendet werden, da dies den Spielablauf stört.

---

## Wahrheitswerte

| Wert | Bedeutung |
|------|-----------|
| `WAHR` | Ja, richtig, an |
| `FALSCH` | Nein, falsch, aus |

---

## Kommentare

```benlang
// Das ist ein einzeiliger Kommentar
// Kommentare werden vom Programm ignoriert

VAR punkte = 0  // Kommentar am Zeilenende
```

---

## Farben (Hex-Codes)

| Farbe | Code |
|-------|------|
| Rot | `"#ff0000"` |
| Grün | `"#00ff00"` |
| Blau | `"#0000ff"` |
| Weiß | `"#ffffff"` |
| Schwarz | `"#000000"` |
| Gelb | `"#ffff00"` |
| Türkis | `"#4ecca3"` |
| Pink | `"#e94560"` |
| Orange | `"#f39c12"` |
| Dunkelblau | `"#1a1a2e"` |

---

## Spielfeld

- **Breite**: 800 Pixel
- **Höhe**: 600 Pixel
- **Koordinaten**: (0,0) ist oben links
- **X-Achse**: 0 (links) bis 800 (rechts)
- **Y-Achse**: 0 (oben) bis 600 (unten)
