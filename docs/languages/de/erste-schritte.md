# Erste Schritte mit BetterCallClaude

**Rechtliche Intelligenz für Schweizer Anwälte** - Version 1.3.2

---

## Übersicht

BetterCallClaude ist ein umfassendes Framework für rechtliche Intelligenz, das Schweizer Anwälten folgendes bietet:

- **80% Zeitersparnis** bei der Präzedenzfallanalyse und Rechtsrecherche
- **25% Qualitätsverbesserung** durch systematische Verifizierung
- **Alle 26 Kantone**: Vollständige Abdeckung aller Schweizer Kantone
- **Mehrsprachige Präzision** in rechtlicher Terminologie (DE, FR, IT, EN)
- **14 spezialisierte Agenten** für Compliance, Steuern, Immobilien und mehr
- **Ollama-Integration** für lokale LLM-Inferenz bei sensiblen Daten

---

## Neu in v1.3.2

### Intelligenter Proxy (`/legal`)
- **Natürliche Sprache**: Beschreiben Sie Ihr Anliegen einfach in Ihren Worten
- **Automatisches Routing**: Weiterleitung an die richtigen spezialisierten Agenten
- **Multi-Agenten-Workflows**: Koordinierte Ausführung komplexer Anfragen

### 14 Spezialisierte Agenten
| Agent | Bereich |
|-------|---------|
| `@researcher` | Schweizer Rechtsrecherche |
| `@strategist` | Prozessstrategie |
| `@drafter` | Dokumentenerstellung |
| `@compliance` | FINMA, AML/KYC |
| `@data-protection` | DSGVO, nDSG/DSG |
| `@risk` | Wahrscheinlichkeit, Schadenersatz |
| `@procedure` | Fristen, ZPO/StPO |
| `@translator` | DE/FR/IT Terminologie |
| `@fiscal` | Steuerrecht, DBA |
| `@corporate` | M&A, Verträge |
| `@cantonal` | Alle 26 Kantone |
| `@realestate` | Grundbuch, Lex Koller |

### Ollama-Integration
- Lokale LLM-Inferenz für datenschutzsensible Arbeiten
- Keine Datenübertragung an externe Server

---

## Systemanforderungen

| Komponente | Erforderlich | Empfohlen |
|------------|--------------|-----------|
| **Betriebssystem** | macOS, Linux, Windows (WSL2) | macOS oder Linux |
| **Claude Code** | Neueste Version | Neueste Version |
| **Node.js** | v18.0.0+ | v20.0.0+ |
| **Python** | 3.10+ | 3.11+ |
| **RAM** | 8GB | 16GB |
| **Speicherplatz** | 500MB | 1GB |

---

## Installation

### Schnellinstallation (Empfohlen)

Die einfachste Art, BetterCallClaude zu installieren, ist mit dem interaktiven Installer:

```bash
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash
```

Der Installer führt Sie durch:
1. **Installationsumfang**: Nur Benutzer oder systemweit
2. **MCP-Server-Pfad**: Standard oder benutzerdefiniert
3. **Python-Umgebung**: Virtuelle Umgebung, System-Python oder überspringen
4. **Backup-Optionen**: Automatische Sicherung bestehender Konfigurationen

### Installationsoptionen

```bash
# Vorschau der Installation (keine Änderungen)
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --dry-run

# Nicht-interaktive Installation mit Standardwerten
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --no-interactive

# Neuinstallation erzwingen
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --force
```

### Entwickler-Installation

Für Entwicklung oder Beiträge:

```bash
git clone https://github.com/fedec65/bettercallclaude.git
cd bettercallclaude
./install.sh
```

### Nach der Installation

Überprüfen Sie, ob alles funktioniert:

```bash
# Installationsstatus prüfen
./install.sh doctor
```

### Optional: API-Schlüssel konfigurieren

Erstellen Sie eine `.env`-Datei nur bei Bedarf für optionale Funktionen:

```bash
# Optional - Für erweiterte Web-Recherche
TAVILY_API_KEY=ihr_tavily_schlüssel

# Optional - Für Ollama lokales LLM
OLLAMA_HOST=http://localhost:11434
```

> **Hinweis**: Bei Verwendung von BetterCallClaude über die Claude Code CLI sind für die Grundfunktionalität keine API-Schlüssel erforderlich.

---

## Verwendung des Intelligenten Proxy

Der einfachste Weg, BetterCallClaude zu nutzen, ist der `/legal` intelligente Proxy:

### Modus A - Natürliche Sprache (Einfachste)
```
/legal Ich brauche eine Analyse eines Vertragsbruchs und eine Klageschrift
→ Automatisches Routing: Researcher → Strategist → Drafter
```

### Modus B - Direkter Agent
```
/legal @compliance FINMA-Anforderungen für Krypto-Verwahrung prüfen
→ Direktes Routing zum Compliance Officer Agent
```

### Modus C - Expliziter Workflow
```
/legal --workflow full "Art. 97 OR Verletzung, CHF 500'000 Streitwert"
→ Ausführung des definierten Workflows mit Checkpoints
```

---

## Befehle

### Rechtsrecherche-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `/legal:research` | Schweizer Rechtsquellen durchsuchen |
| `/legal:analyze` | Rechtliche Argumente analysieren |
| `/legal:compare` | Präzedenzfälle vergleichen |
| `/legal:strategy` | Prozessstrategie entwickeln |
| `/legal:draft` | Rechtsdokumente erstellen |

### Agent-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `/agent:researcher` | Autonome Rechtsrecherche starten |
| `/agent:strategist` | Strategieanalyse starten |
| `/agent:drafter` | Dokumentenerstellung starten |

### Hilfsbefehle

| Befehl | Beschreibung |
|--------|--------------|
| `/legal:help` | Befehlshilfe anzeigen |
| `/legal:federal` | Bundesrecht-Modus erzwingen |
| `/legal:cantonal [KANTON]` | Kantonalrecht-Modus erzwingen |

---

## Anwendungsbeispiele

### Rechtsrecherche

```bash
# Claude Code starten
claude

# BGE-Recherche
"Suche BGE zu Art. 97 OR Vertragshaftung"

# Mit intelligentem Proxy
"/legal Finde alle relevanten BGE zu Mietrecht und Kündigungsschutz"
```

### Fallstrategie

```bash
"/legal @strategist Analysiere die Prozessstrategie für einen Vertragsbruch unter Art. 97 OR"
```

### Dokumentenerstellung

```bash
"/legal @drafter Erstelle einen Dienstleistungsvertrag nach Schweizer OR für Softwareentwicklung"
```

### Compliance-Prüfung

```bash
"/legal @compliance Prüfe AML-Anforderungen für eine CHF 2 Mio. Immobilientransaktion"
```

---

## Unterstützte Kantone

BetterCallClaude v1.3.2 unterstützt alle 26 Schweizer Kantone:

| Deutschsprachig | Französischsprachig | Italienisch/Rätoromanisch |
|-----------------|---------------------|---------------------------|
| ZH, BE, LU, UR | GE, VD, NE, JU | TI, GR |
| SZ, OW, NW, GL | FR (zweisprachig) | |
| ZG, SO, BS, BL | BE, VS (zweisprachig) | |
| SH, AR, AI, SG | | |
| AG, TG | | |

---

## MCP-Server

### Entscheidsuche-Server
Durchsucht bundesgericht.ch und kantonale Gerichte nach Entscheidungen.

### Legal Citations Server
Verifiziert und formatiert Zitierungen nach Schweizer Standards:
- BGE-Format (BGE 123 III 456)
- Kantonale Formate (alle 26 Kantone)
- Mehrsprachige Anpassung

---

## Fehlerbehebung

### Framework wird nicht geladen
```bash
# Installationsstatus prüfen
./install.sh doctor

# Claude Code neu starten
claude
```

### MCP-Server-Probleme
```bash
# Doctor-Befehl ausführen
./install.sh doctor

# Node-Module neu installieren
cd mcp-servers/legal-citations
rm -rf node_modules
npm install
npm run build
```

### Falscher Kanton angewendet
- Alle 26 Kantone werden in v1.3.2 unterstützt
- Verwenden Sie Standard-Kantonskürzel (ZH, BE, GE, etc.)
- Explizite Erwähnung: "gemäss ZH-Recht"

---

## Weitere Ressourcen

- [Englische Dokumentation](../../getting-started.md)
- [Befehlsreferenz](../../.claude/commands/legal:help.md)
- [GitHub Repository](https://github.com/fedec65/bettercallclaude)

---

## Haftungsausschluss

**WICHTIG**: BetterCallClaude ist ein Werkzeug für Rechtsrecherche und -analyse. Alle Ergebnisse:

- Erfordern professionelle anwaltliche Überprüfung
- Stellen keine Rechtsberatung dar
- Können Fehler oder Auslassungen enthalten
- Sollten anhand offizieller Quellen verifiziert werden
- Müssen an spezifische Fallumstände angepasst werden

**Anwälte behalten die volle professionelle Verantwortung für alle rechtlichen Arbeitsergebnisse.**

---

*BetterCallClaude v1.3.2 - Rechtliche Intelligenz für die Schweizer Anwaltschaft*
