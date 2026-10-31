#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Assembleur statique Permikar.

index.html sert de page de référence : l'en-tête (top bar, header, menu mobile)
et le pied de page (footer, barre mobile) en sont extraits puis réinjectés dans
chaque page générée depuis src/<slug>.body.html.

    python build.py

Le résultat est du HTML statique pur : aucun serveur applicatif n'est requis.
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
SITE = "https://permikar.fr"

# --------------------------------------------------------------------------- #
# Définition des pages
# --------------------------------------------------------------------------- #
PAGES = [
    {
        "slug": "permis-acceleres",
        "nav": "/permis-acceleres/",
        "title": "Permis accéléré : formation intensive en 3 à 10 jours | Permikar",
        "desc": "Comment fonctionne le permis accéléré chez Permikar : formation intensive, "
                "date d'examen bloquée, formule Super Accéléré avec confirmation en 48 h.",
        "crumb": "Permis accéléré",
        "og_image": "/assets/img/hero-route.webp",
    },
    {
        "slug": "nos-offres",
        "nav": "/nos-offres/",
        "title": "Forfaits et tarifs permis B à Paris | Auto-école Permikar",
        "desc": "Tous les forfaits Permikar : permis B manuel dès 880 €, boîte automatique, "
                "conduite accompagnée, annulation de permis et stage de Code en 5 jours à 450 €.",
        "crumb": "Forfaits & tarifs",
        "og_image": "/assets/img/boite-automatique.webp",
    },
    {
        "slug": "code-en-ligne",
        "nav": "/code-en-ligne/",
        "title": "Code de la route en ligne sans vous déplacer | Permikar",
        "desc": "Révisez le Code de la route en ligne avec Permikar : Prépacode Tests Auto et "
                "Prépaconduite à 19,99 €, évaluation de départ Eval'Click Auto à 49,99 €.",
        "crumb": "Code en ligne",
        "og_image": "/assets/img/formation-conduite.webp",
    },
    {
        "slug": "nos-agences",
        "nav": "/nos-agences/",
        "title": "Points de rendez-vous et moniteurs Permikar | Paris et France",
        "desc": "Retrouvez les points de rendez-vous Permikar et nos moniteurs diplômés, "
                "disponibles dans chaque département de France, à l'emplacement de votre choix.",
        "crumb": "Points de rendez-vous",
        "og_image": "/assets/img/campagne-permis.webp",
    },
    {
        "slug": "guide-permikar",
        "nav": "/guide-permikar/",
        "title": "Guide Permikar : réserver ses heures de conduite pas à pas",
        "desc": "Choix du pack, inscription, activation du compte, réservation des heures de "
                "conduite et suivi des rendez-vous : le guide complet de la plateforme Permikar.",
        "crumb": "Guide",
        "og_image": "/assets/img/formation-conduite.webp",
    },
    {
        "slug": "contact",
        "nav": "/contact/",
        "title": "Contacter Permikar — auto-école permis accéléré à Paris 8",
        "desc": "Une question sur votre inscription, votre forfait ou votre planning ? "
                "Contactez l'équipe Permikar au 01 42 68 50 28 ou via le formulaire en ligne.",
        "crumb": "Contact",
        "og_image": "/assets/img/paris-permis.webp",
    },
    {
        "slug": "mentions-legales",
        "nav": "/mentions-legales/",
        "title": "Mentions légales, CGU et CGV | Permikar",
        "desc": "Mentions légales de Permikar, conditions générales d'utilisation et de vente, "
                "règlement intérieur, médiation de la consommation et référente handicap.",
        "crumb": "Mentions légales",
        "robots": "index, follow",
        "og_image": "/assets/img/og-permikar.jpg",
    },
    {
        "slug": "404",
        "flat": True,
        "nav": None,
        "title": "Page introuvable | Permikar",
        "desc": "La page demandée n'existe pas ou a été déplacée. Retrouvez le permis accéléré, "
                "les forfaits de conduite et les points de rendez-vous Permikar.",
        "crumb": "Page introuvable",
        "robots": "noindex, follow",
        "og_image": "/assets/img/og-permikar.jpg",
    },
]


# --------------------------------------------------------------------------- #
# Extraction des parties communes depuis index.html
# --------------------------------------------------------------------------- #
def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def write(path, content):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(content)


def chrome_from_index():
    html = read(os.path.join(ROOT, "index.html"))
    start = html.index('<a class="skip-link"')
    main_open = html.index('<main id="main">')
    main_close = html.index("</main>")
    end = html.index("</body>")
    return html[start:main_open], html[main_close + len("</main>"):end]


def set_current(chrome, href):
    """Déplace aria-current="page" vers le lien de la page courante."""
    chrome = chrome.replace(' aria-current="page"', "")
    if not href:
        return chrome
    chrome = chrome.replace(
        'class="nav__link" href="%s"' % href,
        'class="nav__link" href="%s" aria-current="page"' % href,
    )
    chrome = chrome.replace(
        'class="drawer__link" href="%s"' % href,
        'class="drawer__link" href="%s" aria-current="page"' % href,
    )
    return chrome


HEAD_TPL = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#060B18">
<meta name="author" content="Permikar">
<meta name="geo.region" content="FR-75">
<meta name="geo.placename" content="Paris 8e">

<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Permikar">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{site}{og_image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{site}{og_image}">

<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32">
<link rel="icon" href="/assets/img/icon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">

<link rel="preload" href="/assets/fonts/outfit-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/style.css">
<script>document.documentElement.classList.add('js')</script>
<script src="/assets/js/main.js" defer></script>

<script type="application/ld+json">
{jsonld}
</script>
</head>
<body>
"""


def build_jsonld(page, canonical):
    graph = [
        {
            "@type": "WebPage",
            "@id": canonical + "#webpage",
            "url": canonical,
            "name": page["title"],
            "description": page["desc"],
            "inLanguage": "fr-FR",
            "isPartOf": {"@id": SITE + "/#website"},
            "about": {"@id": SITE + "/#organization"},
        },
        {
            "@type": "BreadcrumbList",
            "@id": canonical + "#breadcrumb",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": page["crumb"], "item": canonical},
            ],
        },
    ]
    extra = page.get("jsonld_extra")
    if extra:
        graph.extend(extra)
    return json.dumps({"@context": "https://schema.org", "@graph": graph},
                      ensure_ascii=False, indent=2)


def main():
    top, bottom = chrome_from_index()
    built = []

    for page in PAGES:
        body_path = os.path.join(SRC, page["slug"] + ".body.html")
        if not os.path.exists(body_path):
            print("  ! fragment manquant :", body_path)
            continue

        body = read(body_path)

        # JSON-LD additionnel optionnel, en tête du fragment
        m = re.match(r"\s*<!--JSONLD\s*(.*?)-->\s*", body, re.S)
        if m:
            page = dict(page, jsonld_extra=json.loads(m.group(1)))
            body = body[m.end():]

        flat = page.get("flat")
        out = os.path.join(ROOT, page["slug"] + ".html") if flat \
            else os.path.join(ROOT, page["slug"], "index.html")
        canonical = SITE + "/" + (page["slug"] + ".html" if flat else page["slug"] + "/")

        html = HEAD_TPL.format(
            title=page["title"],
            desc=page["desc"],
            canonical=canonical,
            robots=page.get("robots", "index, follow, max-image-preview:large, "
                                      "max-snippet:-1, max-video-preview:-1"),
            site=SITE,
            og_image=page["og_image"],
            jsonld=build_jsonld(page, canonical),
        )
        html += set_current(top, page["nav"])
        html += "<main id=\"main\">\n" + body.strip() + "\n</main>\n"
        html += set_current(bottom, page["nav"])
        html += "</body>\n</html>\n"

        write(out, html)
        built.append(os.path.relpath(out, ROOT).replace("\\", "/"))
        print("  ok", built[-1], "(%d o)" % len(html.encode("utf-8")))

    print("\n%d page(s) générée(s)." % len(built))
    return 0


if __name__ == "__main__":
    sys.exit(main())
