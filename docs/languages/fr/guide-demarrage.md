# Guide de Démarrage - BetterCallClaude

**Intelligence Juridique pour les Avocats Suisses** - Version 1.3.2

---

## Aperçu

BetterCallClaude est un cadre d'intelligence juridique complet qui offre aux avocats suisses:

- **80% d'économie de temps** sur l'analyse des précédents et la recherche juridique
- **25% d'amélioration de la qualité** grâce à une vérification systématique
- **Tous les 26 cantons**: Couverture complète de tous les cantons suisses
- **Précision multilingue** en terminologie juridique (DE, FR, IT, EN)
- **14 agents spécialisés** pour la conformité, la fiscalité, l'immobilier et plus
- **Intégration Ollama** pour l'inférence LLM locale sur les données sensibles

---

## Nouveautés v1.3.2

### Proxy Intelligent (`/legal`)
- **Langage naturel**: Décrivez votre besoin simplement avec vos mots
- **Routage automatique**: Redirection vers les agents spécialisés appropriés
- **Workflows multi-agents**: Exécution coordonnée de requêtes complexes

### 14 Agents Spécialisés
| Agent | Domaine |
|-------|---------|
| `@researcher` | Recherche juridique suisse |
| `@strategist` | Stratégie de litige |
| `@drafter` | Rédaction de documents |
| `@compliance` | FINMA, AML/KYC |
| `@data-protection` | RGPD, nLPD/LPD |
| `@risk` | Probabilité, dommages |
| `@procedure` | Délais, CPC/CPP |
| `@translator` | Terminologie DE/FR/IT |
| `@fiscal` | Droit fiscal, CDI |
| `@corporate` | M&A, contrats |
| `@cantonal` | Tous les 26 cantons |
| `@realestate` | Registre foncier, Lex Koller |

### Intégration Ollama
- Inférence LLM locale pour les travaux sensibles
- Aucun transfert de données vers des serveurs externes

---

## Configuration Requise

| Composant | Requis | Recommandé |
|-----------|--------|------------|
| **Système d'exploitation** | macOS, Linux, Windows (WSL2) | macOS ou Linux |
| **Claude Code** | Dernière version | Dernière version |
| **Node.js** | v18.0.0+ | v20.0.0+ |
| **Python** | 3.10+ | 3.11+ |
| **RAM** | 8GB | 16GB |
| **Espace disque** | 500MB | 1GB |

---

## Installation

### Installation Rapide (Recommandée)

La façon la plus simple d'installer BetterCallClaude est avec l'installateur interactif:

```bash
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash
```

L'installateur vous guide à travers:
1. **Portée de l'installation**: Utilisateur seul ou système
2. **Chemin des serveurs MCP**: Par défaut ou personnalisé
3. **Environnement Python**: Environnement virtuel, Python système ou ignorer
4. **Options de sauvegarde**: Sauvegarde automatique des configurations existantes

### Options d'Installation

```bash
# Aperçu de l'installation (aucune modification)
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --dry-run

# Installation non-interactive avec les valeurs par défaut
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --no-interactive

# Forcer la réinstallation
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --force
```

### Installation Développeur

Pour le développement ou les contributions:

```bash
git clone https://github.com/fedec65/bettercallclaude.git
cd bettercallclaude
./install.sh
```

### Après l'Installation

Vérifiez que tout fonctionne:

```bash
# Vérifier le statut de l'installation
./install.sh doctor
```

### Optionnel: Configurer les Clés API

Créez un fichier `.env` uniquement si vous avez besoin des fonctionnalités optionnelles:

```bash
# Optionnel - Pour la recherche web avancée
TAVILY_API_KEY=votre_cle_tavily

# Optionnel - Pour Ollama LLM local
OLLAMA_HOST=http://localhost:11434
```

> **Note**: Lors de l'utilisation de BetterCallClaude via Claude Code CLI, aucune clé API n'est requise pour les fonctionnalités de base.

---

## Utilisation du Proxy Intelligent

La façon la plus simple d'utiliser BetterCallClaude est le proxy intelligent `/legal`:

### Mode A - Langage Naturel (Le Plus Simple)
```
/legal J'ai besoin d'analyser un litige contractuel et de préparer une demande
→ Routage automatique: Researcher → Strategist → Drafter
```

### Mode B - Agent Direct
```
/legal @compliance Vérifier les exigences FINMA pour la garde de crypto
→ Routage direct vers l'agent Compliance Officer
```

### Mode C - Workflow Explicite
```
/legal --workflow full "Violation art. 97 CO, CHF 500'000 en litige"
→ Exécution du workflow défini avec points de contrôle
```

---

## Commandes

### Commandes de Recherche Juridique

| Commande | Description |
|----------|-------------|
| `/legal:research` | Rechercher dans les sources juridiques suisses |
| `/legal:analyze` | Analyser les arguments juridiques |
| `/legal:compare` | Comparer les précédents |
| `/legal:strategy` | Développer une stratégie de litige |
| `/legal:draft` | Rédiger des documents juridiques |

### Commandes d'Agent

| Commande | Description |
|----------|-------------|
| `/agent:researcher` | Démarrer la recherche juridique autonome |
| `/agent:strategist` | Démarrer l'analyse stratégique |
| `/agent:drafter` | Démarrer la rédaction de documents |

### Commandes d'Aide

| Commande | Description |
|----------|-------------|
| `/legal:help` | Afficher l'aide des commandes |
| `/legal:federal` | Forcer le mode droit fédéral |
| `/legal:cantonal [CANTON]` | Forcer le mode droit cantonal |

---

## Exemples d'Utilisation

### Recherche Juridique

```bash
# Démarrer Claude Code
claude

# Recherche ATF
"Rechercher ATF sur la responsabilité contractuelle art. 97 CO"

# Avec le proxy intelligent
"/legal Trouver tous les ATF pertinents sur le droit du bail et la protection contre les congés"
```

### Stratégie de Cas

```bash
"/legal @strategist Analyser la stratégie de litige pour une rupture de contrat sous l'art. 97 CO"
```

### Rédaction de Documents

```bash
"/legal @drafter Rédiger un contrat de services selon le CO suisse pour le développement logiciel"
```

### Vérification de Conformité

```bash
"/legal @compliance Vérifier les exigences LBA pour une transaction immobilière de CHF 2 Mio."
```

---

## Cantons Supportés

BetterCallClaude v1.3.2 supporte tous les 26 cantons suisses:

| Germanophones | Francophones | Italien/Romanche |
|---------------|--------------|------------------|
| ZH, BE, LU, UR | GE, VD, NE, JU | TI, GR |
| SZ, OW, NW, GL | FR (bilingue) | |
| ZG, SO, BS, BL | BE, VS (bilingue) | |
| SH, AR, AI, SG | | |
| AG, TG | | |

---

## Serveurs MCP

### Serveur Entscheidsuche
Recherche les décisions sur bundesgericht.ch et les tribunaux cantonaux.

### Serveur Legal Citations
Vérifie et formate les citations selon les normes suisses:
- Format ATF (ATF 123 III 456)
- Formats cantonaux (tous les 26 cantons)
- Adaptation multilingue

---

## Dépannage

### Framework non chargé
```bash
# Vérifier le statut de l'installation
./install.sh doctor

# Redémarrer Claude Code
claude
```

### Problèmes de Serveur MCP
```bash
# Exécuter la commande doctor
./install.sh doctor

# Réinstaller les modules Node
cd mcp-servers/legal-citations
rm -rf node_modules
npm install
npm run build
```

### Mauvais canton appliqué
- Tous les 26 cantons sont supportés en v1.3.2
- Utilisez les abréviations cantonales standard (ZH, BE, GE, etc.)
- Mention explicite: "selon le droit de GE"

---

## Ressources Supplémentaires

- [Documentation en anglais](../../getting-started.md)
- [Référence des Commandes](../../.claude/commands/legal:help.md)
- [Dépôt GitHub](https://github.com/fedec65/bettercallclaude)

---

## Avertissement

**IMPORTANT**: BetterCallClaude est un outil de recherche et d'analyse juridique. Tous les résultats:

- Nécessitent une révision professionnelle par un avocat
- Ne constituent pas un conseil juridique
- Peuvent contenir des erreurs ou des omissions
- Doivent être vérifiés auprès des sources officielles
- Doivent être adaptés aux circonstances spécifiques du cas

**Les avocats conservent l'entière responsabilité professionnelle pour tous les travaux juridiques.**

---

*BetterCallClaude v1.3.2 - Intelligence Juridique pour les Avocats Suisses*
