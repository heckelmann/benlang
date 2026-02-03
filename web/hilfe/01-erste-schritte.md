# Erste Schritte mit BenLang

Willkommen bei BenLang! Hier lernst du, wie du dein erstes Spiel programmierst.

## Was ist BenLang?

BenLang ist eine Programmiersprache extra für Kinder. Mit BenLang kannst du:

- Eigene Spiele erstellen
- Figuren auf dem Bildschirm bewegen
- Mit Tastatur und Maus steuern
- Punkte zählen und anzeigen

## BenLang starten

### Schritt 1: Programm öffnen

Öffne ein Terminal (auf Mac) oder die Eingabeaufforderung (auf Windows) und tippe:

```bash
./benlang ./beispiele/snake
```

Das startet das Snake-Spiel als Beispiel.

### Schritt 2: Der Browser öffnet sich

Dein Browser öffnet sich automatisch. Du siehst:

- **Links**: Der Code-Editor (hier schreibst du)
- **Rechts**: Die Vorschau (hier siehst du dein Spiel)

### Schritt 3: Spiel starten

Klicke auf den grünen **"Starten"** Button oben in der Mitte!

## Dein erstes Programm

Jedes BenLang-Programm beginnt mit dem Spielnamen:

```benlang
SPIEL "Mein Spiel"
```

Dann schreibst du, was passieren soll:

```benlang
SPIEL "Hallo Welt"

WENN_START {
    SCHREIBE("Hallo! Ich bin dein erstes Programm!")
}

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    ZEIGE_TEXT("Willkommen bei BenLang!", 200, 300, "#4ecca3", 32)
}
```

## Was bedeuten die Wörter?

| Wort | Bedeutung |
|------|-----------|
| `SPIEL` | Gibt deinem Spiel einen Namen |
| `WENN_START` | Das passiert einmal am Anfang |
| `WENN_IMMER` | Das passiert die ganze Zeit (60x pro Sekunde!) |
| `SCHREIBE` | Schreibt eine Nachricht in die Konsole |
| `ZEIGE_TEXT` | Zeigt Text auf dem Bildschirm |
| `ZEICHNE_RECHTECK` | Malt ein Rechteck |

## Kommentare

Du kannst Notizen in deinen Code schreiben. Das Programm ignoriert sie:

```benlang
// Das ist ein Kommentar
// Er hilft dir, dich zu erinnern, was der Code macht

SPIEL "Test"  // Kommentare können auch hier stehen
```

## Speichern

Drücke `Strg+S` (oder `Cmd+S` auf Mac) um deinen Code zu speichern.

## Nächste Schritte

Super! Du hast dein erstes Programm geschrieben! 

Lies weiter in:
- `02-variablen.md` - Lerne, wie du dir Dinge merkst
- `03-zeichnen.md` - Male bunte Formen auf den Bildschirm
