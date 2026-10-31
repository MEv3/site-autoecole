/* Permikar — interactions (vanilla JS, aucune dépendance) */
(function () {
  'use strict';

  var doc = document;

  /* --------------------------------------- Header + barre de progression route
     La barre est purement décorative : elle est créée en JS pour ne pas exister
     du tout quand le script ne tourne pas.
  -------------------------------------------------------------------------- */
  var header = doc.querySelector('.header');

  var roadFill = null;
  if (doc.body) {
    var road = doc.createElement('div');
    road.className = 'roadbar';
    road.setAttribute('aria-hidden', 'true');
    roadFill = doc.createElement('div');
    roadFill.className = 'roadbar__fill';
    road.appendChild(roadFill);
    doc.body.appendChild(road);
  }

  if (header || roadFill) {
    var ticking = false;
    var paint = function () {
      ticking = false;
      if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
      if (roadFill) {
        var run = doc.documentElement.scrollHeight - window.innerHeight;
        roadFill.style.width = (run > 0 ? Math.min(100, (window.scrollY / run) * 100) : 0) + '%';
      }
    };
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------- Menu mobile */
  var burger = doc.querySelector('.burger');
  var drawer = doc.getElementById('menu-mobile');

  if (burger && drawer) {
    var lastFocus = null;

    var openDrawer = function () {
      lastFocus = doc.activeElement;
      drawer.classList.add('is-open');
      drawer.removeAttribute('inert');
      burger.setAttribute('aria-expanded', 'true');
      doc.documentElement.style.overflow = 'hidden';
      var first = drawer.querySelector('.drawer__close');
      if (first) first.focus();
    };

    var closeDrawer = function () {
      drawer.classList.remove('is-open');
      drawer.setAttribute('inert', '');
      burger.setAttribute('aria-expanded', 'false');
      doc.documentElement.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };

    drawer.setAttribute('inert', '');

    burger.addEventListener('click', function () {
      if (drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('.drawer__backdrop, .drawer__close, a[href]')) closeDrawer();
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });

    // Piège de focus simple à l'intérieur du panneau
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = drawer.querySelectorAll('a[href], button:not([disabled])');
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ------------------------------------------------- Filtres des forfaits */
  var tablist = doc.querySelector('[data-tabs]');
  if (tablist) {
    var items = Array.prototype.slice.call(doc.querySelectorAll('[data-cat]'));
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('.tab'));

    var applyFilter = function (value) {
      items.forEach(function (el) {
        var match = value === 'tous' || el.getAttribute('data-cat') === value;
        el.hidden = !match;
      });
      tabs.forEach(function (t) {
        t.setAttribute('aria-selected', String(t.dataset.filter === value));
      });
    };

    tablist.addEventListener('click', function (e) {
      var tab = e.target.closest('.tab');
      if (tab) applyFilter(tab.dataset.filter);
    });

    tablist.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(doc.activeElement);
      if (i < 0) return;
      var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (next < 0) return;
      e.preventDefault();
      var target = tabs[(next + tabs.length) % tabs.length];
      target.focus();
      applyFilter(target.dataset.filter);
    });
  }

  /* ------------------------------------------------------ Le Chrono Permikar
     Estimateur maison : 4 réponses -> durée estimée + forfait conseillé.
     Les tarifs sont ceux de la page Forfaits ; toute évolution de prix doit
     être répercutée ici ET dans src/nos-offres.body.html.
  -------------------------------------------------------------------------- */
  var chrono = doc.getElementById('chrono');
  if (chrono) {
    var TARIFS = {
      manuelle: { 10: 880, 20: 1600, 30: 1990 },
      auto:     { 10: 880, 20: 1700, 30: 2190 }
    };
    var HEURES = { jamais: 30, peu: 20, avance: 10 };
    var STAGE_CODE = 450;
    var ECHELLE = 20; // graduation maximale du cadran, en jours

    var out = {
      days:  chrono.querySelector('[data-days]'),
      gauge: chrono.querySelector('[data-gauge]'),
      pack:  chrono.querySelector('[data-pack]'),
      price: chrono.querySelector('[data-price]'),
      extra: chrono.querySelector('[data-extra]'),
      cta:   chrono.querySelector('[data-cta]')
    };

    // toLocaleString('fr-FR') sépare les milliers par U+202F, absent de la
    // police Outfit : on insère une espace insécable classique à la place.
    var euros = function (n) {
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    var choix = function (name) {
      var el = chrono.querySelector('input[name="chrono-' + name + '"]:checked');
      return el ? el.value : '';
    };

    var estimer = function () {
      var niveau = choix('niveau');
      var boite = choix('boite') === 'auto' ? 'auto' : 'manuelle';
      var rythme = choix('rythme');
      var heures, prix, nom, ancre;

      if (niveau === 'annulation') {
        heures = 10; prix = 900; ancre = '#annulation';
        nom = 'Annulation de permis — forfait 10 h';
      } else {
        heures = HEURES[niveau] || 20;
        prix = TARIFS[boite][heures];
        ancre = boite === 'auto' ? '#automatique' : '#manuel';
        nom = 'Permis B ' + (boite === 'auto' ? 'automatique' : 'manuel') +
              ' — forfait ' + heures + ' h';
      }

      var parJour = rythme === 'souple' ? 2 : 4;
      var jours = Math.ceil(heures / parJour);
      var codeManquant = choix('code') === 'non';
      if (codeManquant) jours += 5;

      return {
        jours: jours, prix: prix, nom: nom, ancre: ancre,
        code: codeManquant, total: prix + (codeManquant ? STAGE_CODE : 0)
      };
    };

    // Compteur animé sur le nombre de jours
    var anim = null;
    var filet = null;
    var compter = function (vers) {
      var depuis = parseInt(out.days.textContent, 10) || 0;
      if (depuis === vers) return;
      if (anim) cancelAnimationFrame(anim);
      clearTimeout(filet);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        out.days.textContent = String(vers);
        return;
      }
      // Filet de sécurité : requestAnimationFrame ne tourne pas quand l'onglet
      // ne produit pas d'images. Sans cela, le chiffre resterait périmé.
      filet = setTimeout(function () { out.days.textContent = String(vers); }, 600);
      var debut = performance.now();
      var pas = function (now) {
        var t = Math.min(1, (now - debut) / 450);
        out.days.textContent = String(Math.round(depuis + (vers - depuis) * (1 - Math.pow(1 - t, 3))));
        if (t < 1) anim = requestAnimationFrame(pas);
        else { clearTimeout(filet); out.days.textContent = String(vers); }
      };
      anim = requestAnimationFrame(pas);
    };

    var afficher = function () {
      var r = estimer();
      compter(r.jours);
      out.gauge.setAttribute(
        'stroke-dashoffset',
        (264 * (1 - Math.min(1, r.jours / ECHELLE))).toFixed(1)
      );
      out.pack.textContent = r.nom;
      out.price.textContent = euros(r.prix);
      out.cta.setAttribute('href', '/nos-offres/' + r.ancre);
      if (r.code) {
        out.extra.hidden = false;
        out.extra.textContent = '+ stage de Code accéléré en 5 jours (' + euros(STAGE_CODE) +
          ' €) — soit ' + euros(r.total) + ' € TTC au total.';
      } else {
        out.extra.hidden = true;
        out.extra.textContent = '';
      }
    };

    // Les champs sont désactivés dans le HTML : sans JavaScript, le visiteur
    // voit un exemple cohérent plutôt que des boutons qui ne répondent pas.
    chrono.querySelectorAll('fieldset[disabled]').forEach(function (fs) {
      fs.removeAttribute('disabled');
    });

    chrono.addEventListener('change', afficher);
    afficher();
  }

  /* ----------------------------------------------- Apparition au défilement */
  var revealables = doc.querySelectorAll('.reveal');
  if (revealables.length) {
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.01 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* --------------------------------------------------------- Année footer */
  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ------------------------------------------------------------ Formulaire
     Aucun back-end n'est requis pour démarrer : si data-endpoint est vide,
     le message est ouvert dans le client mail de l'utilisateur.
     Renseignez data-endpoint (Formspree, Brevo, votre API…) pour l'envoi direct.
  -------------------------------------------------------------------------- */
  doc.querySelectorAll('form[data-mailto]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (form.dataset.endpoint) return; // envoi normal vers le back-end
      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var lines = [];
      data.forEach(function (value, key) {
        if (key === 'consent' || key === '_gotcha') return;
        lines.push(key + ' : ' + value);
      });

      var subject = form.dataset.subject || 'Demande via permikar.fr';
      var href = 'mailto:' + form.dataset.mailto +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));

      window.location.href = href;

      var note = form.querySelector('[data-form-status]');
      if (note) {
        note.hidden = false;
        note.textContent = 'Votre messagerie vient de s’ouvrir avec le message pré-rempli. ' +
          'Vous pouvez aussi nous appeler au 01 42 68 50 28.';
      }
    });
  });
})();
