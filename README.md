# BenLang

Eine kindgerechte Programmiersprache mit deutscher Syntax zum Erstellen von Spielen. Perfekt für Kinder im Alter von 8-12 Jahren!

## Features

- **Deutsche Keywords**: `WENN`, `SONST`, `FUNKTION`, `SOLANGE`, etc.
- **Integrierte Game-Engine**: Einfaches Erstellen von 2D-Spielen
- **Browser-IDE**: Code-Editor mit Syntax-Highlighting
- **Live-Vorschau**: Spiele direkt im Browser testen
- **Cross-Platform**: Läuft auf macOS und Windows
- **Bilder & Sounds**: Lade eigene Grafiken und Töne

## Installation

### Download

Lade die passende Version für dein Betriebssystem aus dem `dist/` Ordner:

- **macOS (Apple Silicon)**: `benlang-mac-arm64`
- **macOS (Intel)**: `benlang-mac-amd64`
- **Windows**: `benlang-windows-amd64.exe`

### Von Source bauen

```bash
git clone https://github.com/dein-repo/benlang.git
cd benlang
go build -o benlang ./cmd/benlang
```

### Cross-Compile für alle Plattformen

```bash
make build-all
```

## Verwendung

```bash
# Ein Beispiel-Projekt starten
./benlang ./beispiele/snake

# Eigenes Projekt öffnen
./benlang ./mein-spiel

# Arbeitsverzeichnis festlegen (schränkt den Projekt-Browser ein)
./benlang --workdir ./meine-spiele

# Mit anderem Port starten
./benlang --port 8080 ./mein-spiel

# Version anzeigen
./benlang --version
```

Der Server startet und öffnet automatisch den Browser mit der IDE.

### Projekt-Browser

In der Web-IDE kannst du über das **Projekt-Menü** (oben links) neue Spiele erstellen oder zwischen deinen Abentereuern wechseln. Wenn du den Server mit `--workdir` startest, zeigt der Browser nur Projekte in diesem Ordner an.

## Schnellstart

### Dein erstes Spiel

```benlang
SPIEL "Mein erstes Spiel"

VAR punkte = 0
VAR x = 400
VAR y = 300

WENN_START {
    SCHREIBE("Spiel gestartet!")
}

WENN_IMMER {
    // Hintergrund
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Spieler mit Pfeiltasten bewegen
    WENN TASTE_GEDRUECKT("links") {
        x = x - 5
    }
    WENN TASTE_GEDRUECKT("rechts") {
        x = x + 5
    }
    WENN TASTE_GEDRUECKT("hoch") {
        y = y - 5
    }
    WENN TASTE_GEDRUECKT("runter") {
        y = y + 5
    }
    
    // Spieler zeichnen
    ZEICHNE_KREIS(x, y, 25, "#4ecca3")
    
    // Punkte anzeigen
    ZEIGE_TEXT("Punkte: " + punkte, 20, 30, "#ffffff", 20)
}

WENN_TASTE("leertaste") {
    punkte = punkte + 1
    SCHREIBE("Punkt!")
}
```

## Sprachübersicht

### Variablen

```benlang
VAR name = "Ben"           // Text
VAR alter = 10             // Zahl
VAR istSchnell = WAHR      // Wahrheitswert
VAR punkte = [0, 10, 20]   // Liste
```

### Kontrollstrukturen

```benlang
// Wenn-Dann-Sonst
WENN bedingung {
    // wird ausgeführt wenn bedingung WAHR ist
} SONST {
    // wird ausgeführt wenn bedingung FALSCH ist
}

// Solange-Schleife
SOLANGE bedingung {
    // wird wiederholt solange bedingung WAHR ist
}

// Für-Schleife (zählt von 1 bis 10)
FUER i VON 1 BIS 10 {
    SCHREIBE(i)
}

// Wiederhole X mal
WIEDERHOLE 5 {
    SCHREIBE("Hallo!")
}
```

### Logische Operatoren

```benlang
WENN alter > 10 UND name == "Ben" {
    // UND: beide müssen WAHR sein
}

WENN punkte < 0 ODER leben == 0 {
    // ODER: mindestens eins muss WAHR sein
}

WENN NICHT spielVorbei {
    // NICHT: kehrt WAHR/FALSCH um
}
```

### Funktionen

```benlang
FUNKTION addiere(a, b) {
    ZURUECK a + b
}

VAR ergebnis = addiere(5, 3)  // ergebnis = 8
```

### Spiel-Events

```benlang
WENN_START {
    // Wird einmal beim Spielstart ausgeführt
}

WENN_IMMER {
    // Wird jeden Frame ausgeführt (~60x pro Sekunde)
}

WENN_TASTE("leertaste") {
    // Wird ausgeführt wenn Taste gedrückt wird
}

WENN_KOLLISION(spieler, gegner) {
    // Wird ausgeführt wenn zwei Figuren sich berühren
}
```

### Figuren und Bilder

```benlang
// Bild laden (muss im Projektordner liegen)
FIGUR spieler = LADE_BILD("spieler.png")

// Position setzen
spieler.x = 100
spieler.y = 200

// Größe ändern
spieler.breite = 50
spieler.hoehe = 50

// Sichtbarkeit
spieler.sichtbar = WAHR
```

## Eingebaute Funktionen

### Zeichnen

| Funktion | Beschreibung |
|----------|--------------|
| `ZEICHNE_RECHTECK(x, y, breite, hoehe, farbe)` | Zeichnet ein gefülltes Rechteck |
| `ZEICHNE_KREIS(x, y, radius, farbe)` | Zeichnet einen gefüllten Kreis |
| `ZEICHNE_LINIE(x1, y1, x2, y2, farbe)` | Zeichnet eine Linie |
| `ZEIGE_TEXT(text, x, y, farbe, groesse)` | Zeigt Text an |

### Eingabe

| Funktion | Beschreibung |
|----------|--------------|
| `TASTE_GEDRUECKT(taste)` | Gibt WAHR zurück wenn Taste gedrückt ist |
| `MAUS_X()` | X-Position der Maus |
| `MAUS_Y()` | Y-Position der Maus |
| `MAUS_GEDRUECKT()` | Gibt WAHR zurück wenn Maustaste gedrückt |

### Medien

| Funktion | Beschreibung |
|----------|--------------|
| `LADE_BILD(pfad)` | Lädt ein Bild und gibt eine Figur zurück |
| `LOESCHEN(figur)` | Entfernt eine Figur aus dem Spiel |
| `SPIELE_TON(pfad)` | Spielt eine Sound-Datei ab |

### Mathematik

| Funktion | Beschreibung |
|----------|--------------|
| `ZUFALL(min, max)` | Zufällige Ganzzahl zwischen min und max |
| `RUNDEN(zahl)` | Rundet zur nächsten Ganzzahl |
| `ABSOLUT(zahl)` | Gibt den positiven Wert zurück |

### Verfügbare Tasten

| Taste | Name in BenLang |
|-------|-----------------|
| Pfeiltasten | `"links"`, `"rechts"`, `"hoch"`, `"runter"` |
| Leertaste | `"leertaste"` |
| Enter | `"eingabe"` |
| Escape | `"escape"` |
| Buchstaben | `"a"` bis `"z"` |
| Zahlen | `"0"` bis `"9"` |

### Farben

Farben werden als Hex-Codes angegeben:

```benlang
"#ff0000"   // Rot
"#00ff00"   // Grün
"#0000ff"   // Blau
"#ffffff"   // Weiß
"#000000"   // Schwarz
"#4ecca3"   // Türkis
"#e94560"   // Pink
"#f39c12"   // Orange
```

## Beispiele

Im Ordner `beispiele/` findest du fertige Projekte zum Lernen:

| Projekt | Beschreibung | Schwierigkeit |
|---------|--------------|---------------|
| `fang-den-stern` | Sammle Sterne mit der Maus | Anfänger |
| `huepfender-ball` | Ball mit Schwerkraft und Bounce | Anfänger |
| `snake` | Klassisches Snake-Spiel | Mittel |
| `breakout` | Zerstöre alle Blöcke | Mittel |
| `pong` | 2-Spieler Tennis | Mittel |
| `dino-sprung` | Spring über Kakteen (wie Chrome Dino) | Mittel |

### Beispiel starten

```bash
./benlang ./beispiele/snake
```

## Projektstruktur

Ein BenLang-Projekt ist ein Ordner mit:

```
mein-spiel/
├── hauptspiel.ben    # Dein Spielcode (erforderlich)
├── spieler.png       # Bilder (optional)
├── gegner.png
├── musik.mp3         # Sounds (optional)
└── effekt.wav
```

## Hilfe & Dokumentation

Im Ordner `hilfe/` findest du ausführliche Anleitungen:

- `01-erste-schritte.md` - So startest du
- `02-variablen.md` - Speichere Werte
- `03-zeichnen.md` - Male auf dem Bildschirm
- `04-steuerung.md` - Tastatur und Maus
- `05-schleifen.md` - Wiederhole Dinge
- `06-bedingungen.md` - Wenn-Dann Entscheidungen
- `07-figuren.md` - Bilder laden und bewegen
- `08-spiel-erstellen.md` - Baue dein eigenes Spiel

## Tipps

1. **Starte klein**: Beginne mit einem einfachen Beispiel und baue darauf auf
2. **Experimentiere**: Ändere Zahlen und Farben und schau was passiert
3. **Kommentare**: Benutze `//` um Notizen in deinen Code zu schreiben
4. **Fehler sind OK**: Jeder macht Fehler - lies die Fehlermeldung und versuche es nochmal

## Entwicklung

### Build

```bash
# Standard Build
go build -o benlang ./cmd/benlang

# Alle Plattformen
make build-all

# Tests ausführen
go test ./...
```

### Projektstruktur

```
benlang/
├── cmd/benlang/         # CLI Entry Point
├── internal/
│   ├── lexer/           # Tokenizer
│   ├── parser/          # AST Parser
│   ├── transpiler/      # JS Code Generator
│   ├── server/          # HTTP Server
│   └── project/         # Projektverwaltung
├── web/                 # Browser IDE
│   ├── index.html
│   ├── css/
│   └── js/
├── beispiele/           # Beispielprojekte
├── hilfe/               # Dokumentation
└── dist/                # Fertige Executables
```

## Lizenz

MIT License

## Mitwirken

Beiträge sind willkommen! Öffne ein Issue oder einen Pull Request.
