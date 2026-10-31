# Permikar — nouveau site

Refonte statique du site [permikar.fr](https://permikar.fr/) : même contenu, design repensé,
optimisé pour le mobile et pour le référencement naturel.

Aucun framework, aucune dépendance, aucun appel à un service tiers. Le site est constitué de
fichiers HTML, CSS, JS et images à déposer tels quels sur un hébergement.

---

## 1. Mise en ligne

Copiez le contenu du dossier (sauf `src/`, `build.py` et `.claude/`) à la racine de votre
hébergement, en conservant l'arborescence.

```bash
# Aperçu local avant mise en ligne
python -m http.server 8099
# puis ouvrez http://localhost:8099
```

Le fichier `.htaccess` est prévu pour un hébergement Apache (OVH, o2switch, Ionos, Hostinger…).
Il gère la redirection HTTPS, la compression, le cache, les en-têtes de sécurité et surtout les
**redirections 301 depuis les anciennes URLs WordPress** — ne le supprimez pas, c'est lui qui
préserve le référencement déjà acquis.

Sur un hébergement Nginx ou une plateforme type Netlify / Vercel, il faut retranscrire ces règles
dans la configuration correspondante.

---

## 2. Arborescence

```
.
├── index.html                  Accueil
├── permis-acceleres/           Page pilier « permis accéléré »
├── nos-offres/                 Forfaits et tarifs
├── code-en-ligne/              Code de la route en ligne
├── nos-agences/                Points de rendez-vous et moniteurs
├── guide-permikar/             Guide de réservation
├── contact/                    Contact
├── mentions-legales/           Mentions légales, CGU, CGV, règlement, handicap
├── 404.html                    Page d'erreur
├── robots.txt
├── sitemap.xml
├── manifest.webmanifest
├── .htaccess
├── assets/
│   ├── css/style.css           Feuille de style unique (~22 Ko)
│   ├── js/main.js              Interactions (~5 Ko)
│   ├── fonts/                  Outfit + Inter, sous-ensemble latin, auto-hébergés
│   └── img/                    Visuels WebP, logos partenaires, favicons
├── src/                        Contenu des pages (voir § 3) — ne pas mettre en ligne
└── build.py                    Assembleur des pages (voir § 3)
```

Les URLs reprennent **exactement celles du site actuel** (`/nos-offres/`, `/nos-agences/`,
`/contact/`…), ce qui permet au positionnement Google de se reporter sans perte.

---

## 3. Modifier le site

### Un contenu de page

Les pages sont générées à partir des fragments du dossier `src/`. Modifiez par exemple
`src/nos-offres.body.html`, puis régénérez :

```bash
python build.py
```

`index.html` est la page de référence : c'est d'elle que `build.py` extrait l'en-tête, le menu
mobile, le pied de page et la barre d'actions mobile pour les réinjecter dans toutes les autres
pages. **Une modification du menu ou du pied de page se fait donc dans `index.html`**, suivie d'un
`python build.py`.

Les titres, descriptions et données structurées de chaque page sont définis en haut de `build.py`
dans la liste `PAGES`.

### Un tarif

Les prix apparaissent à quatre endroits — pensez à les mettre à jour partout :

1. `src/nos-offres.body.html` — les cartes de forfaits et les tableaux de tarifs unitaires ;
2. `src/nos-offres.body.html` — le bloc `<!--JSONLD ... -->` en tête de fichier (données
   structurées lues par Google) ;
3. `index.html` — l'aperçu des quatre formules les plus demandées et le `hasOfferCatalog` du
   JSON-LD ;
4. `assets/js/main.js` — les tableaux `TARIFS`, `HEURES` et `STAGE_CODE` du Chrono Permikar
   (voir § 5).

### Une image

Déposez le fichier dans `assets/img/` au format WebP et référencez-le. Les visuels existants sont
déclinés en trois largeurs (480 / 800 / 1200 ou 1600 px) via l'attribut `srcset`, pour que les
téléphones ne téléchargent que la version qui leur convient.

---

## 4. Référencement : ce qui a été mis en place

| Élément | Détail |
|---|---|
| Titres et descriptions | Uniques sur chaque page, longueurs calibrées (50–65 / 110–165 caractères) |
| URL canoniques | Déclarées sur chaque page, domaine sans `www` |
| Données structurées | `DrivingSchool` / `LocalBusiness` (adresse, horaires, zone desservie, catalogue d'offres), `WebSite`, `FAQPage` (8 questions), `BreadcrumbList`, `HowTo`, `Service`, `OfferCatalog`, `ContactPage` |
| Fil d'Ariane | Visible et balisé sur chaque page interne |
| Maillage interne | Liens croisés entre accueil, page pilier, forfaits, code, points de rendez-vous |
| Sitemap et robots | `sitemap.xml` (avec images) et `robots.txt` déclarant le sitemap |
| Redirections | 18 redirections 301 depuis les anciennes URLs dans `.htaccess` |
| Partage social | Open Graph et Twitter Card avec une image 1200 × 630 dédiée |
| Sémantique | Un seul `<h1>` par page, hiérarchie de titres respectée, `alt` sur toutes les images |
| Performance | Polices auto-hébergées et préchargées, image LCP préchargée, images WebP responsives, CSS et JS uniques et légers, aucun script tiers |
| Accessibilité | Lien d'évitement, focus visibles, menu mobile avec piège de focus et touche Échap, cibles tactiles ≥ 44 px, contrastes vérifiés |
| Mobile | Conception mobile d'abord, typographie fluide, barre d'actions fixe (Appeler / WhatsApp / Réserver), aucun débordement horizontal |

---

## 5. Les deux signatures du site

Deux éléments n'existent sur aucun site d'auto-école concurrent et donnent au site son identité.

### Le Chrono Permikar

Section `#chrono` sur la page d'accueil. Quatre questions — niveau au volant, boîte de vitesses,
Code déjà obtenu, rythme souhaité — et le visiteur obtient immédiatement, sur un cadran de
compteur de vitesse animé : le nombre de jours de formation estimé, le forfait conseillé, son
prix et un lien direct vers ce forfait. Sans inscription ni adresse e-mail.

Le calcul est volontairement transparent et repose sur vos tarifs réels :

| Réponse « niveau » | Forfait retenu |
|---|---|
| Jamais conduit | 30 h |
| Moins de 20 h | 20 h |
| 20 h ou plus | 10 h |
| Permis annulé | Annulation 10 h (900 €) |

Rythme intensif = 4 h par jour, rythme souple = 2 h par jour. Si le Code n'est pas obtenu,
5 jours et 450 € (stage de Code) s'ajoutent au résultat.

La logique tient dans `assets/js/main.js`, section « Le Chrono Permikar » ; les tarifs sont en
haut du bloc, dans `TARIFS`. Le résultat par défaut (8 jours / forfait 30 h / 1 990 €) est écrit
en dur dans le HTML : la section reste donc lisible et cohérente même si le JavaScript ne se
charge pas.

Une mention sous le résultat rappelle qu'il s'agit d'une estimation et que seule l'évaluation de
départ fait foi — à conserver.

### La barre « route »

Une fine bande de 4 px en haut de l'écran qui se remplit au défilement, dessinée comme une route :
dégradé bleu vers or, marquage central blanc en pointillés qui défile. Purement décorative, créée
en JavaScript, masquée aux lecteurs d'écran et désactivée si le visiteur a demandé moins
d'animations. Styles dans `assets/css/style.css`, section « Barre de progression route ».

---

## 6. À compléter avant la mise en ligne

Ces trois points demandent des informations ou un arbitrage de votre part.

### a. Le formulaire de contact

Par défaut, le formulaire ouvre la messagerie du visiteur avec le message pré-rempli — il
fonctionne donc sans serveur, mais ce n'est pas l'idéal.

Pour un envoi direct, ajoutez un service de formulaire (Formspree, Brevo, votre propre script PHP)
et renseignez son adresse dans `src/contact.body.html` :

```html
<form class="form" data-mailto="permikarfrance@gmail.com"
      data-endpoint="https://formspree.io/f/VOTRE_ID"
      action="https://formspree.io/f/VOTRE_ID" method="post">
```

Puis `python build.py`. Dès que `data-endpoint` est présent, le script laisse le formulaire
s'envoyer normalement.

### b. Les mentions légales

La page `mentions-legales/` contient un encadré listant les informations manquantes, obligatoires
au titre de la loi pour la confiance dans l'économie numérique : forme juridique et capital social,
numéro de TVA intracommunautaire, directeur de la publication, et coordonnées de l'hébergeur.
Complétez `src/mentions-legales.body.html` puis régénérez.

### c. La note Google

Le site affiche « Excellent — 1 778 avis », formulation reprise du site actuel. La note chiffrée
n'y figure nulle part, elle n'a donc **volontairement pas été inventée** dans les données
structurées : une note fausse est sanctionnée par Google.

Pour obtenir les étoiles dans les résultats de recherche, relevez votre note exacte sur votre
fiche Google Business, puis ajoutez ce bloc dans le `DrivingSchool` du JSON-LD de `index.html` :

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "reviewCount": "1778",
  "bestRating": "5"
}
```

---

## 7. Pages de l'ancien site non reprises

Le contenu principal a été intégralement repris. Six pages secondaires ne l'ont pas été ; leurs
URLs sont redirigées dans `.htaccess` pour éviter toute erreur 404, mais leur contenu est à
réintégrer si vous souhaitez le conserver :

- `/nos-actualites/` — blog
- `/le-monde-de-permikar/`
- `/permis-accelere-en-europe/`
- `/recrutement-moniteur-auto-ecole/`
- `/pitch-pour-nos-apporteurs-daffaires/`
- `/cours-pratiques-permis-accelere/`

L'espace élève (connexion, panier, planning) et la boutique restent sur votre plateforme actuelle :
les boutons « Commander » pointent pour l'instant vers la page Contact, à rebrancher vers vos URLs
de commande une fois celles-ci arrêtées.

---

## 8. Choix des visuels

Aucune photographie de personne n'est utilisée sur le site. Les visuels sont des photos de
véhicules, de routes et de paysages, complétées par des pictogrammes vectoriels dessinés pour le
site. Les logos de marque et de partenaires proviennent du site actuel.
