---
layout: default
title: Variablen
nav_order: 2
---

# Variablen - Dinge merken

Variablen sind wie Schubladen, in denen du Sachen aufbewahren kannst. Du gibst der Schublade einen Namen und legst etwas hinein.

## Eine Variable erstellen

Benutze das Wort `VAR`:

```benlang
VAR punkte = 0
VAR name = "Ben"
VAR leben = 3
```

## Was kann in eine Variable?

### Zahlen

```benlang
VAR alter = 10
VAR groesse = 150.5
VAR minusZahl = -20
```

### Text (in Anführungszeichen)

```benlang
VAR name = "Anna"
VAR farbe = "blau"
VAR nachricht = "Hallo Welt!"
```

### Wahr oder Falsch

```benlang
VAR spielLaeuft = WAHR
VAR istGameOver = FALSCH
```

### Listen (mehrere Werte)

```benlang
VAR zahlen = [1, 2, 3, 4, 5]
VAR farben = ["rot", "grün", "blau"]
```

## Variablen benutzen

Einmal erstellt, kannst du die Variable überall verwenden:

```benlang
VAR punkte = 0

WENN_IMMER {
    ZEIGE_TEXT("Punkte: " + punkte, 20, 30, "#ffffff", 20)
}
```

## Variablen ändern

Du kannst den Wert einer Variable jederzeit ändern:

```benlang
VAR punkte = 0

WENN_TASTE("leertaste") {
    punkte = punkte + 10    // 10 Punkte dazu
}
```

### Rechnen mit Variablen

```benlang
VAR x = 100

x = x + 5     // x ist jetzt 105
x = x - 10    // x ist jetzt 95
x = x * 2     // x ist jetzt 190
x = x / 2     // x ist jetzt 95
```

## Listen verwenden

Bei Listen kannst du einzelne Werte mit `[nummer]` holen:

```benlang
VAR farben = ["rot", "grün", "blau"]

VAR ersteFarbe = farben[0]    // "rot"
VAR zweiteFarbe = farben[1]   // "grün"
VAR dritteFarbe = farben[2]   // "blau"
```

**Wichtig:** Computer fangen bei 0 an zu zählen!

## Beispiel: Punktezähler

```benlang
SPIEL "Punktezähler"

VAR punkte = 0
VAR rekord = 0

WENN_IMMER {
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    ZEIGE_TEXT("Punkte: " + punkte, 20, 40, "#4ecca3", 24)
    ZEIGE_TEXT("Rekord: " + rekord, 20, 80, "#e94560", 24)
    ZEIGE_TEXT("Drücke LEERTASTE für Punkte!", 200, 300, "#ffffff", 20)
}

WENN_TASTE("leertaste") {
    punkte = punkte + 1
    
    WENN punkte > rekord {
        rekord = punkte
    }
}

WENN_TASTE("r") {
    punkte = 0    // Reset
}
```

## Tipps

- Gib deinen Variablen sinnvolle Namen: `spielerX` ist besser als `x`
- Variablen mit GROSSBUCHSTABEN sind Befehle (wie `VAR`, `WENN`)
- Deine eigenen Variablen sollten kleinbuchstaben oder camelCase sein

## Übung

Erstelle ein Programm mit:
1. Einer Variable `leben` die bei 3 startet
2. Bei Taste "a" geht 1 Leben verloren
3. Bei Taste "h" bekommst du 1 Leben dazu
4. Zeige die Leben auf dem Bildschirm an

Tipp: Schau dir an, wie das Snake-Spiel (`beispiele/snake`) Punkte und Leben verwaltet!
