# Guide de Démarrage BetterCallClaude

Bienvenue sur BetterCallClaude - votre assistant juridique intelligent pour le droit suisse.

Ce guide vous aidera à démarrer en quelques minutes, que vous utilisiez Claude Desktop ou Claude Code CLI.

---

## Qu'est-ce que BetterCallClaude?

BetterCallClaude est un framework d'intelligence juridique conçu spécifiquement pour les avocats suisses. Il offre:

- **Recherche Juridique Intelligente** - Recherchez dans les arrêts du Tribunal fédéral (ATF) et les décisions cantonales
- **Support Multilingue** - Fonctionne en allemand, français, italien et anglais
- **Tous les 26 Cantons Suisses** - Accédez aux décisions de justice cantonales de chaque canton
- **Analyse des Citations** - Comprend et formate automatiquement les citations juridiques suisses
- **Agents Juridiques Spécialisés** - Assistants IA experts en recherche, rédaction, conformité et plus

---

## Installation (2 minutes)

### Étape 1: Exécuter l'installateur

Ouvrez votre terminal et collez cette commande:

```bash
curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh | bash
```

C'est tout! L'installateur va:
- Télécharger tous les composants nécessaires
- Configurer les serveurs MCP
- Mettre en place l'intégration Claude Desktop automatiquement

### Étape 2: Redémarrer Claude Desktop

Après l'installation, **redémarrez complètement Claude Desktop** (quitter et rouvrir) pour charger les nouveaux serveurs MCP.

---

## Utiliser BetterCallClaude

### Option A: Avec Claude Desktop (Recommandé pour les débutants)

1. **Ouvrez Claude Desktop**
2. **Démarrez une nouvelle conversation**
3. **Essayez votre première requête juridique:**

   Demandez simplement en langage naturel:
   ```
   Trouve les arrêts ATF récents sur la résiliation de contrat
   ```

   Ou utilisez une commande spécifique:
   ```
   /legal:research droit du travail protection contre le licenciement
   ```

### Option B: Avec Claude Code CLI

1. **Ouvrez votre terminal**
2. **Lancez Claude Code:**
   ```bash
   claude
   ```
3. **Utilisez les commandes juridiques:**
   ```
   /legal:help
   ```

---

## Vos Premières Commandes

Voici quelques commandes à essayer immédiatement:

### Obtenir de l'aide
```
/legal:help
```
Affiche toutes les commandes juridiques disponibles et leurs descriptions.

### Recherche Juridique
```
/legal:research [votre sujet]
```
Exemple: `/legal:research droit du bail résiliation`

### Rechercher les Arrêts du Tribunal Fédéral
```
/legal:bge [citation ou sujet]
```
Exemple: `/legal:bge ATF 147 III 226`

### Recherche Cantonale
```
/legal:cantonal [canton] [sujet]
```
Exemple: `/legal:cantonal GE litiges locatifs`

### Stratégie de Cas
```
/legal:strategy [décrivez votre cas]
```
Obtenez une analyse stratégique et des recommandations pour votre cas.

### Rédiger des Documents Juridiques
```
/legal:draft [type de document] [détails]
```
Exemple: `/legal:draft lettre de résiliation contrat de travail`

---

## Utiliser les Agents Juridiques

BetterCallClaude inclut des agents IA spécialisés pour différentes tâches. Appelez-les avec `@`:

| Agent | Objectif |
|-------|----------|
| `@researcher` | Recherche juridique approfondie et analyse |
| `@strategist` | Stratégie de cas et recommandations |
| `@drafter` | Rédaction de documents juridiques |
| `@compliance` | Vérifications de conformité réglementaire |
| `@risk` | Évaluation et atténuation des risques |
| `@translator` | Traduction juridique (DE/FR/IT/EN) |

**Exemple:**
```
@researcher Trouve tous les arrêts ATF de 2023 sur la protection des données
```

---

## Cantons Supportés

BetterCallClaude prend en charge les 26 cantons suisses:

**Germanophones:** ZH, BE, LU, UR, SZ, OW, NW, GL, ZG, SO, BS, BL, SH, AR, AI, SG, GR, AG, TG

**Francophones:** VD, GE, NE, JU

**Italophone:** TI

**Bilingues:** FR (DE/FR), VS (DE/FR)

---

## Modes de Langue

Changez de langue en utilisant:

- **Mode allemand:** `/legal:mode de`
- **Mode français:** `/legal:mode fr`
- **Mode italien:** `/legal:mode it`
- **Mode anglais:** `/legal:mode en`

Ou écrivez simplement vos requêtes dans votre langue préférée - BetterCallClaude s'adaptera automatiquement.

---

## Dépannage

### Les serveurs MCP ne se chargent pas?

1. Assurez-vous d'avoir redémarré Claude Desktop après l'installation
2. Vérifiez si les serveurs sont configurés dans les paramètres de Claude Desktop
3. Relancez l'installateur: `curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh | bash`

### Commandes non reconnues?

1. Essayez `/legal:help` pour voir les commandes disponibles
2. Assurez-vous d'utiliser la bonne syntaxe (notez les deux-points après `legal`)

### Besoin de plus d'aide?

- Consultez la [documentation complète](https://github.com/fedec65/BetterCallClaude)
- Ouvrez une issue sur [GitHub](https://github.com/fedec65/BetterCallClaude/issues)

---

## Carte de Référence Rapide

| Tâche | Commande |
|-------|----------|
| Obtenir de l'aide | `/legal:help` |
| Recherche | `/legal:research [sujet]` |
| Recherche ATF | `/legal:bge [citation/sujet]` |
| Recherche cantonale | `/legal:cantonal [canton] [sujet]` |
| Stratégie de cas | `/legal:strategy [détails du cas]` |
| Rédiger un document | `/legal:draft [type] [détails]` |
| Changer de langue | `/legal:mode [de/fr/it/en]` |

---

**Prêt à commencer?** Ouvrez Claude et essayez: `/legal:help`

---

*BetterCallClaude v1.3.2 - Framework d'Intelligence Juridique pour Avocats Suisses*
