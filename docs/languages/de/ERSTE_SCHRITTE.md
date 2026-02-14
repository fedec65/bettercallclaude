# Erste Schritte mit BetterCallClaude

Willkommen bei BetterCallClaude - Ihrem KI-gestützten Rechtsassistenten für Schweizer Recht.

Diese Anleitung hilft Ihnen, in wenigen Minuten loszulegen, egal ob Sie Claude Desktop oder Claude Code CLI verwenden.

---

## Was ist BetterCallClaude?

BetterCallClaude ist ein Legal-Intelligence-Framework, das speziell für Schweizer Anwälte entwickelt wurde. Es bietet:

- **Intelligente Rechtsrecherche** - Durchsuchen Sie Bundesgerichtsentscheide (BGE) und kantonale Gerichtsentscheide
- **Mehrsprachige Unterstützung** - Funktioniert auf Deutsch, Französisch, Italienisch und Englisch
- **Alle 26 Schweizer Kantone** - Zugriff auf kantonale Gerichtsentscheide aus jedem Kanton
- **Zitationsanalyse** - Versteht und formatiert Schweizer Rechtszitationen automatisch
- **Spezialisierte Rechtsagenten** - KI-Experten für Recherche, Entwürfe, Compliance und mehr

---

## Installation (2 Minuten)

### Schritt 1: Installer ausführen

Öffnen Sie Ihr Terminal und fügen Sie diesen Befehl ein:

```bash
curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh | bash
```

Das war's! Der Installer wird:
- Alle notwendigen Komponenten herunterladen
- Die MCP-Server konfigurieren
- Die Claude Desktop Integration automatisch einrichten

### Schritt 2: Claude Desktop neu starten

Nach der Installation **starten Sie Claude Desktop vollständig neu** (beenden und neu öffnen), um die neuen MCP-Server zu laden.

---

## BetterCallClaude verwenden

### Option A: Mit Claude Desktop (Empfohlen für Einsteiger)

1. **Öffnen Sie Claude Desktop**
2. **Starten Sie eine neue Konversation**
3. **Probieren Sie Ihre erste Rechtsanfrage:**

   Fragen Sie einfach in natürlicher Sprache:
   ```
   Finde aktuelle BGE-Entscheide zur Vertragsauflösung
   ```

   Oder verwenden Sie einen spezifischen Befehl:
   ```
   /legal:research Arbeitsrecht Kündigungsschutz
   ```

### Option B: Mit Claude Code CLI

1. **Öffnen Sie Ihr Terminal**
2. **Starten Sie Claude Code:**
   ```bash
   claude
   ```
3. **Verwenden Sie Rechtsbefehle:**
   ```
   /legal:help
   ```

---

## Ihre ersten Befehle

Hier sind einige Befehle zum sofortigen Ausprobieren:

### Hilfe aufrufen
```
/legal:help
```
Zeigt alle verfügbaren Rechtsbefehle und deren Beschreibungen.

### Rechtsrecherche
```
/legal:research [Ihr Thema]
```
Beispiel: `/legal:research Mietrecht Kündigung`

### Bundesgerichtsentscheide suchen
```
/legal:bge [Zitation oder Thema]
```
Beispiel: `/legal:bge BGE 147 III 226`

### Kantonale Gerichtsentscheide
```
/legal:cantonal [Kanton] [Thema]
```
Beispiel: `/legal:cantonal ZH Mietstreitigkeiten`

### Fallstrategie
```
/legal:strategy [beschreiben Sie Ihren Fall]
```
Erhalten Sie strategische Analysen und Empfehlungen für Ihren Fall.

### Rechtsdokumente entwerfen
```
/legal:draft [Dokumenttyp] [Details]
```
Beispiel: `/legal:draft Kündigungsschreiben Arbeitsvertrag`

---

## Rechtsagenten verwenden

BetterCallClaude enthält spezialisierte KI-Agenten für verschiedene Aufgaben. Rufen Sie diese mit `@` auf:

| Agent | Zweck |
|-------|-------|
| `@researcher` | Tiefgehende Rechtsrecherche und Analyse |
| `@strategist` | Fallstrategie und Empfehlungen |
| `@drafter` | Erstellung von Rechtsdokumenten |
| `@compliance` | Prüfung der regulatorischen Compliance |
| `@risk` | Risikobewertung und -minderung |
| `@translator` | Juristische Übersetzung (DE/FR/IT/EN) |

**Beispiel:**
```
@researcher Finde alle BGE-Entscheide von 2023 zum Datenschutz
```

---

## Unterstützte Kantone

BetterCallClaude unterstützt alle 26 Schweizer Kantone:

**Deutschsprachig:** ZH, BE, LU, UR, SZ, OW, NW, GL, ZG, SO, BS, BL, SH, AR, AI, SG, GR, AG, TG

**Französischsprachig:** VD, GE, NE, JU

**Italienischsprachig:** TI

**Zweisprachig:** FR (DE/FR), VS (DE/FR)

---

## Sprachmodi

Wechseln Sie zwischen Sprachen mit:

- **Deutscher Modus:** `/legal:mode de`
- **Französischer Modus:** `/legal:mode fr`
- **Italienischer Modus:** `/legal:mode it`
- **Englischer Modus:** `/legal:mode en`

Oder schreiben Sie Ihre Anfragen einfach in Ihrer bevorzugten Sprache - BetterCallClaude passt sich automatisch an.

---

## Fehlerbehebung

### MCP-Server werden nicht geladen?

1. Stellen Sie sicher, dass Sie Claude Desktop nach der Installation neu gestartet haben
2. Prüfen Sie, ob die Server in den Claude Desktop Einstellungen konfiguriert sind
3. Führen Sie den Installer erneut aus: `curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh | bash`

### Befehle werden nicht erkannt?

1. Versuchen Sie `/legal:help` um verfügbare Befehle zu sehen
2. Stellen Sie sicher, dass Sie die korrekte Syntax verwenden (beachten Sie den Doppelpunkt nach `legal`)

### Weitere Hilfe benötigt?

- Lesen Sie die [vollständige Dokumentation](https://github.com/fedec65/BetterCallClaude)
- Eröffnen Sie ein Issue auf [GitHub](https://github.com/fedec65/BetterCallClaude/issues)

---

## Kurzreferenz

| Aufgabe | Befehl |
|---------|--------|
| Hilfe aufrufen | `/legal:help` |
| Recherche | `/legal:research [Thema]` |
| BGE-Suche | `/legal:bge [Zitation/Thema]` |
| Kantonale Suche | `/legal:cantonal [Kanton] [Thema]` |
| Fallstrategie | `/legal:strategy [Falldetails]` |
| Dokument entwerfen | `/legal:draft [Typ] [Details]` |
| Sprache wechseln | `/legal:mode [de/fr/it/en]` |

---

**Bereit loszulegen?** Öffnen Sie Claude und versuchen Sie: `/legal:help`

---

*BetterCallClaude v1.3.2 - Legal Intelligence Framework für Schweizer Anwälte*
