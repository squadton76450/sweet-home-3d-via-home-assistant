# Plan Maison 3D pour Home Assistant

Une page web autonome (un seul fichier `.html`) qui affiche un **plan 3D
interactif de ta maison**, basé sur un plan **Sweet Home 3D**, avec
intégration directe des entités **Home Assistant** (lampes, capteurs,
volets, caméras, prises…) directement cliquables dans la scène 3D.

Aucun serveur, aucune dépendance à installer : tout tient dans une seule
page HTML (Three.js est chargé depuis un CDN), à héberger comme n'importe
quel fichier statique dans Home Assistant.

![Aperçu](docs/screenshot.png)
*(remplace cette image par une capture de ta propre maison une fois importée)*

## Fonctionnalités

- **Import direct d'un fichier `.sh3d`** (Sweet Home 3D) par glisser-déposer,
  aucune conversion manuelle nécessaire.
- **Vue 3D complète ou éclatée** (chaque étage séparé, avec réglage indépendant
  de la hauteur et du décalage latéral/avant-arrière de chaque niveau).
- **Entités Home Assistant intégrées** : associe chaque porte, fenêtre, lampe
  ou meuble du plan à une entité HA (capteur, lumière, volet…) directement
  cliquable dans la scène.
- **Dashboards personnalisés** : crée plusieurs vues sauvegardées (angle de
  caméra, niveau affiché) réutilisables comme cartes dans ton tableau de bord.
- **Carte Home Assistant dédiée** (`maison-card.js`) : affiche une de tes vues
  directement comme une carte native dans un dashboard Lovelace, avec un
  bouton de verrouillage de la caméra qui n'empêche pas de cliquer sur les
  entités.
- Fonctionne entièrement côté client, tes données de plan restent dans ton
  navigateur (stockage local / IndexedDB) et dans le fichier que tu héberges
  toi-même.

## Installation

1. Copie `plan_maison_home_assistant.html` dans le dossier
   `config/www/` de ton installation Home Assistant.
2. Ouvre `http://<ton-ha>:8123/local/plan_maison_home_assistant.html`
   dans un navigateur : tu arrives sur une maison de démonstration vide
   (une seule pièce).
3. Dans l'onglet **Configuration**, glisse-dépose ton propre fichier
   `.sh3d` exporté depuis Sweet Home 3D pour remplacer le plan de démo par
   ta vraie maison (murs, pièces, meubles).
4. Associe tes entités Home Assistant aux portes/fenêtres/meubles qui
   t'intéressent depuis le panneau de configuration de la page.
5. (Optionnel) Ajoute la page comme **panneau iframe** dans Home Assistant
   (`configuration.yaml`) pour l'avoir dans le menu latéral :

   ```yaml
   panel_iframe:
     maison_3d:
       title: "Maison 3D"
       icon: mdi:home-city
       url: "/local/plan_maison_home_assistant.html"
   ```

### Mettre à jour le plan plus tard

Si tu modifies ta maison dans Sweet Home 3D (nouvelle fenêtre, mur déplacé…),
réimporte simplement le fichier `.sh3d` mis à jour depuis l'onglet
Configuration : les entités Home Assistant déjà associées sont conservées
automatiquement.

## Utiliser la carte Home Assistant (`maison-card.js`)

1. Copie `maison-card.js` dans `config/www/` également.
2. Ajoute la ressource dans **Paramètres → Tableaux de bord → Ressources** :
   `/local/maison-card.js` (type : Module JavaScript).
3. Ajoute une carte de type `custom:maison-card` dans un dashboard.
4. Ouvre `maison-card.js` et adapte la liste `FIXED_VIEWS` en haut du
   fichier au nombre réel de niveaux de ta maison (après import, tes
   niveaux s'appellent `level0`, `level1`, `level2`… par ordre de hauteur
   croissante — un commentaire dans le fichier l'explique).

## Structure du dépôt

| Fichier | Rôle |
|---|---|
| `plan_maison_home_assistant.html` | La page principale (plan 3D + import + configuration) |
| `maison-card.js` | Carte Lovelace optionnelle pour intégrer une vue dans un dashboard |

## Limites connues

- Les rideaux et certains objets Sweet Home 3D très fins peuvent rester
  visibles en transparence à travers les murs en vue éclatée (limitation
  du modèle 3D d'origine, pas de la page).
- Pensé pour un usage personnel/local : aucune donnée n'est envoyée à un
  serveur externe, tout reste dans le fichier et le navigateur.

## Licence

Ce projet est distribué sous licence MIT — voir le fichier `LICENSE`.
Sweet Home 3D et ses formats de fichiers appartiennent à leurs auteurs
respectifs ; ce projet n'est pas affilié à Sweet Home 3D.

## Contribuer

Les suggestions, corrections et retours d'expérience sont bienvenus via les
issues et pull requests.
