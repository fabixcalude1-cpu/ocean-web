/* =====================================================================
   OCEAN V2 — EFFECT ENGINE / SHARED SITE JS
   ---------------------------------------------------------------------
   Minden, ami nagyon modern: egyedi kurzor, mágneses gombok, tilt- és
   spotlight-kártyák, scroll-reveal/stagger, részecskés vizorháttér,
   scroll progressz, typing, számlálók, glitch, marquee, live óra,
   back-to-top, toast, téma, mobil menü, FAQ, sidebar auto-nav.
   A régi API-k (go, showToast, toggleTheme, splitWords, openMobile,
   closeMobile, scrollToSection, applyTheme) kompatibilitásban maradnak.
   ===================================================================== */
(function () {
    'use strict';

    var reducedMotion = false;
    var finePointer = false;

    /* =================================================================
       00 — UTIL
       ================================================================= */
    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function listen(target, ev, fn, opts) {
        (target || document).addEventListener(ev, fn, opts || { passive: true });
    }

    function make(el, cls, html) {
        var n = document.createElement(el || 'div');
        if (cls) n.className = cls;
        if (html) n.innerHTML = html;
        return n;
    }

    /* =================================================================
       01 — SÖTÉT TÉMA KÉNYSZER (színpaletta + color-scheme)
       ================================================================= */
    function forceDarkScheme() {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        try {
            document.documentElement.style.setProperty('--background', '262 50% 4%');
            document.documentElement.style.setProperty('--foreground', '290 60% 97%');
            document.documentElement.style.setProperty('--card', '262 38% 6%');
            document.documentElement.style.setProperty('--border', '264 28% 16%');
            document.documentElement.style.setProperty('--brand', '265 92% 68%');
            document.documentElement.style.setProperty('--muted-foreground', '258 15% 64%');
        } catch (e) {}
    }
    forceDarkScheme();

    /* =================================================================
       02 — SZINTEZLŐ: AMBIENS RÉTEGEK (grain, scanline, progressz)
       ================================================================= */
    function buildAmbientLayers() {
        var noise = make('div', 'oc-noise');
        noise.setAttribute('aria-hidden', 'true');
        document.body.appendChild(noise);

        var scan = make('div', 'oc-scanline');
        scan.setAttribute('aria-hidden', 'true');
        document.body.appendChild(scan);

        var prog = make('div', 'oc-progress');
        prog.setAttribute('aria-hidden', 'true');
        document.body.appendChild(prog);

        var topBtn = document.createElement('button');
        topBtn.className = 'oc-top';
        topBtn.type = 'button';
        topBtn.setAttribute('aria-label', 'Back to top');
        topBtn.innerHTML = '↑';
        document.body.appendChild(topBtn);
        topBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        listen(window, 'scroll', function () {
            var s = window.scrollY;
            var h = document.documentElement.scrollHeight - window.innerHeight;
            var pct = h > 0 ? (s / h) * 100 : 0;
            prog.style.width = pct.toFixed(2) + '%';
            document.body.classList.toggle('oc-scrolled', s > 24);
            topBtn.classList.toggle('oc-show', s > 640);
        });
    }

    /* =================================================================
       03 — EGYEDI KURZOR + NYOMVONAL + BURST (csak fine pointer)
       ================================================================= */
    function initCursor() {
        if (!finePointer || reducedMotion) return;

        document.body.classList.add('oc-cursor-on');

        var cursor = make('div', 'oc-cursor');
        var follow = make('div', 'oc-cursor-follow');
        var ring = make('div', 'oc-cursor-ring');
        var aura = make('div', 'oc-cursor-aura');
        [cursor, follow, ring, aura].forEach(function (el) {
            el.setAttribute('aria-hidden', 'true');
            document.body.appendChild(el);
        });

        var mx = -100, my = -100;
        var fx = -100, fy = -100;
        var rx = -100, ry = -100;
        var ax = -100, ay = -100;
        var hoverEl = false;

        listen(document, 'mousemove', function (e) {
            mx = e.clientX;
            my = e.clientY;
            cursor.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
            var target = e.target;
            hoverEl = !!(target && target.closest && target.closest('a,button,input,textarea,select,[role="button"],[onclick],.oc-hover,label'));
            document.body.classList.toggle('oc-cursor-hover', hoverEl);

            if (e.target && e.target.closest && e.target.closest('[data-tilt],.oc-tilt,button,a,[role="button"],[class*="btn"]')) {
                var r = e.target.closest('[data-tilt],.oc-tilt');
                if (r && !r.classList.contains('oc-tilt')) r = r.closest('.oc-tilt');
                var rc = (r || e.currentTarget || {}).getBoundingClientRect ? (r || { getBoundingClientRect: function () { return { left: 0, top: 0, width: 0, height: 0 }; } }).getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
                var px = rc.width ? ((e.clientX - rc.left) / rc.width) * 100 : 50;
                var py = rc.height ? ((e.clientY - rc.top) / rc.height) * 100 : 50;
                if (r) r.style.setProperty('--oc-x', px.toFixed(1) + '%');
                if (r) r.style.setProperty('--oc-y', py.toFixed(1) + '%');
            }
        });

        var trailPool = [];
        var lastSpawn = 0;
        function spawnTrail() {
            var now = Date.now();
            if (now - lastSpawn < 26 || trailPool.length > 56) return;
            lastSpawn = now;
            var t = make('span', 'oc-cursor-trail');
            t.style.left = mx + 'px';
            t.style.top = my + 'px';
            t.style.opacity = String(0.35 + Math.random() * 0.5);
            var size = 2 + Math.random() * 5;
            t.style.width = size + 'px';
            t.style.height = size + 'px';
            t.style.marginLeft = (-size / 2) + 'px';
            t.style.marginTop = (-size / 2) + 'px';
            t.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            document.body.appendChild(t);
            trailPool.push(t);
            (function (node) {
                setTimeout(function () {
                    node.style.opacity = '0';
                    setTimeout(function () {
                        node.remove();
                        var i = trailPool.indexOf(node);
                        if (i > -1) trailPool.splice(i, 1);
                    }, 520);
                }, Math.random() * 120);
            })(t);
        }

        function burst(x, y) {
            for (var i = 0; i < 9; i++) {
                var b = make('span', 'oc-click-burst');
                b.style.left = x + 'px';
                b.style.top = y + 'px';
                b.style.animationDelay = (i * 0.02) + 's';
                b.style.borderColor = i % 2 ? 'rgba(34,211,238,0.8)' : 'rgba(216,180,254,0.8)';
                var ang = (i / 9) * Math.PI * 2;
                var dist = 26 + Math.random() * 30;
                (function (node, dx, dy) {
                    setTimeout(function () {
                        node.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s';
                        node.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0.5)';
                        node.style.opacity = '0';
                        node.addEventListener('transitionend', function () { node.remove(); }, { once: true });
                    }, 10);
                })(b, Math.cos(ang) * dist, Math.sin(ang) * dist);
                document.body.appendChild(b);
            }
        }

        listen(document, 'mousedown', function (e) { burst(e.clientX, e.clientY); });

        function frame() {
            fx = lerp(fx, mx, 0.16);
            fy = lerp(fy, my, 0.16);
            rx = lerp(rx, mx, 0.10);
            ry = lerp(ry, my, 0.10);
            ax = lerp(ax, mx, 0.07);
            ay = lerp(ay, my, 0.07);
            follow.style.transform = 'translate3d(' + fx + 'px,' + fy + 'px,0)';
            ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
            aura.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,0)';
            spawnTrail();
            if (!reducedMotion) requestAnimationFrame(frame);
        }
        frame();
    }

    /* =================================================================
       04 — MÁGNESES GOMBOK
       ================================================================= */
    function initMagnetic() {
        if (!finePointer) return;
        var targets = Array.prototype.slice.call(document.querySelectorAll('.oc-magnetic, nav a[class*="btn"], nav button[class*="btn"]'));
        if (!targets.length) return;
        targets.forEach(function (el) {
            el.classList.add('oc-magnetic');
            var strength = parseFloat(el.getAttribute('data-magnetic') || '0.35');
            listen(el, 'mousemove', function (e) {
                var r = el.getBoundingClientRect();
                var dx = (e.clientX - (r.left + r.width / 2)) * strength;
                var dy = (e.clientY - (r.top + r.height / 2)) * strength;
                el.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
            });
            listen(el, 'mouseleave', function () {
                el.style.transform = 'translate3d(0,0,0)';
                el.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
                setTimeout(function () { if (el) el.style.transition = ''; }, 460);
            });
        });
    }

    /* =================================================================
       05 — TILT KÁRTYÁK + GLARE + SPOTLIGHT CLOUD
       ================================================================= */
    function initTilt() {
        if (!finePointer || reducedMotion) return;
        var cards = document.querySelectorAll('.oc-tilt, [data-tilt]');
        if (!cards.length) return;
        Array.prototype.forEach.call(cards, function (card) {
            card.classList.add('oc-tilt');
            if (!card.querySelector('.oc-glare')) {
                var glare = make('div', 'oc-glare');
                glare.setAttribute('aria-hidden', 'true');
                card.appendChild(glare);
            }
            var max = parseFloat(card.getAttribute('data-tilt') || '10');
            var active = false;
            listen(card, 'mousemove', function (e) {
                active = true;
                var r = card.getBoundingClientRect();
                var px = clamp((e.clientX - r.left) / r.width, 0, 1);
                var py = clamp((e.clientY - r.top) / r.height, 0, 1);
                var rx = (0.5 - py) * max * 2;
                var ry = (px - 0.5) * max * 2;
                card.style.transition = 'transform 0.08s linear';
                card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-3px) scale3d(1.01,1.01,1)';
                card.style.setProperty('--oc-x', (px * 100).toFixed(1) + '%');
                card.style.setProperty('--oc-y', (py * 100).toFixed(1) + '%');
            });
            listen(card, 'mouseleave', function () {
                active = false;
                card.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
                card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0) scale3d(1,1,1)';
            });
        });
    }

    /* =================================================================
       06 — SPOTLIGHT HOVER (card-felületeken --oc-x / --oc-y)
       ================================================================= */
    function initSpotlight() {
        var els = document.querySelectorAll('.dash-card, .stat-card, .feature-card, [data-spotlight], .blog-card, .key-item');
        if (!els.length) return;
        Array.prototype.forEach.call(els, function (el) {
            if (!el.hasAttribute('data-tilt') && !el.classList.contains('oc-tilt')) {
                listen(el, 'mousemove', function (e) {
                    var r = el.getBoundingClientRect();
                    var px = r.width ? ((e.clientX - r.left) / r.width) * 100 : 50;
                    var py = r.height ? ((e.clientY - r.top) / r.height) * 100 : 50;
                    el.style.setProperty('--oc-x', px.toFixed(1) + '%');
                    el.style.setProperty('--oc-y', py.toFixed(1) + '%');
                });
            }
        });
    }

    /* =================================================================
       07 — REVEAL / STAGGER (IntersectionObserver)
       ================================================================= */
    function initRevealEffects() {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('oc-in');
                    if (en.target.classList.contains('reveal')) en.target.classList.add('visible');
                    obs.unobserve(en.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

        var all = document.querySelectorAll('.oc-reveal, .oc-reveal-left, .oc-reveal-right, .oc-reveal-zoom, .reveal, .oc-stagger');
        Array.prototype.forEach.call(all, function (el) { obs.observe(el); });
    }

    /* =================================================================
       08 — RÉSZECSKE-VIZSGÁLÓ CANVAS (háttér)
       ================================================================= */
    function initParticles() {
        if (reducedMotion) return;
        var canvas = document.createElement('canvas');
        canvas.className = 'oc-particles';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:0.75;';
        document.body.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        var w = 0, h = 0, dpr = 1;
        var dots = [];
        var mouse = { x: -9999, y: -9999 };
        var mouseIn = false;
        var maxDots = 64;

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var target = Math.min(maxDots, Math.floor((w * h) / 26000));
            if (dots.length > target) dots.length = target;
            while (dots.length < target) dots.push(spawn(true));
            ctx.globalCompositeOperation = 'lighter';
        }

        function spawn(anywhere) {
            var colorful = Math.random() < 0.35;
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                r: 0.8 + Math.random() * 2.2,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                hue: colorful ? (262 + Math.random() * 60) : (200 + Math.random() * 60),
                a: 0.18 + Math.random() * 0.4
            };
        }

        listen(window, 'resize', resize);
        listen(document, 'mousemove', function (e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouseIn = true;
        });
        listen(document, 'mouseleave', function () { mouseIn = false; });

        var start = Date.now();
        function step() {
            ctx.clearRect(0, 0, w, h);
            var i, d, j;
            for (i = 0; i < dots.length; i++) {
                d = dots[i];
                d.x += d.vx;
                d.y += d.vy;
                if (d.x < 0 || d.x > w) d.vx *= -1;
                if (d.y < 0 || d.y > h) d.vy *= -1;
                if (mouseIn) {
                    var dx = mouse.x - d.x, dy = mouse.y - d.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130 && dist > 0.1) {
                        var f = (130 - dist) / 130;
                        d.x += dx / dist * f * 1.1;
                        d.y += dy / dist * f * 1.1;
                    }
                }
                var tw = 0.5 + 0.5 * Math.sin((Date.now() - start) / 900 + i);
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                if (i % 4 === 0) {
                    ctx.fillStyle = 'hsla(' + d.hue + ', 92%, 70%, ' + (d.a * tw) + ')';
                    ctx.shadowColor = 'hsla(' + d.hue + ', 92%, 70%, 0.8)';
                    ctx.shadowBlur = 8;
                } else {
                    ctx.fillStyle = 'hsla(' + d.hue + ', 70%, 78%, ' + (d.a * 0.8) + ')';
                    ctx.shadowBlur = 0;
                }
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            for (i = 0; i < dots.length; i++) {
                for (j = i + 1; j < dots.length; j++) {
                    var a = dots[i], b = dots[j];
                    var dx = a.x - b.x, dy = a.y - b.y;
                    var dist = dx * dx + dy * dy;
                    if (dist < 140 * 140) {
                        var op = (1 - Math.sqrt(dist) / 140) * 0.14;
                        ctx.strokeStyle = 'rgba(168, 85, 247, ' + op + ')';
                        ctx.lineWidth = 0.7;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            if (!reducedMotion && dots.length) requestAnimationFrame(step);
        }

        resize();
        step();

        return {
            destroy: function () {
                canvas.remove();
                dots = [];
            }
        };
    }

    /* =================================================================
       09 — COUNTER [data-count] + [data-suffix] / [data-prefix]
       ================================================================= */
    function initCounters() {
        var els = document.querySelectorAll('[data-count]');
        if (!els.length) return;
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                obs.unobserve(el);
                var target = parseFloat(el.getAttribute('data-count')) || 0;
                var dur = parseFloat(el.getAttribute('data-duration') || '1400');
                var dec = el.getAttribute('data-decimals') !== null ? parseInt(el.getAttribute('data-decimals'), 10) : (target % 1 !== 0 ? 2 : 0);
                var suffix = el.getAttribute('data-suffix') || '';
                var prefix = el.getAttribute('data-prefix') || '';
                var start = null;
                function tick(ts) {
                    if (start === null) start = ts;
                    var p = clamp((ts - start) / dur, 0, 1);
                    var eased = 1 - Math.pow(1 - p, 3);
                    var val = target * eased;
                    el.textContent = prefix + val.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
                    if (p < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.4 });
        Array.prototype.forEach.call(els, function (el) { obs.observe(el); });
    }

    /* =================================================================
       10 — TYPING EFFECT [data-type="hello,world"]
       ================================================================= */
    function initTyping() {
        var els = document.querySelectorAll('[data-type]');
        if (!els.length) return;
        Array.prototype.forEach.call(els, function (el, idx) {
            var phrases = (el.getAttribute('data-type') || '').split(',');
            if (!phrases.length) return;
            el.classList.add('oc-type');
            var pi = 0, ci = 0, deleting = false;
            setTimeout(function () {
                (function type() {
                    var word = phrases[pi];
                    el.textContent = word.slice(0, ci);
                    var speed = deleting ? 22 : 55 + Math.random() * 30;
                    if (!deleting && ci === word.length) {
                        speed = 1600;
                        deleting = true;
                    } else if (deleting && ci === 0) {
                        deleting = false;
                        pi = (pi + 1) % phrases.length;
                        speed = 320;
                    }
                    ci += deleting ? -1 : 1;
                    setTimeout(type, speed);
                })();
            }, idx * 500);
        });
    }

    /* =================================================================
       11 — GLITCH: [data-glitch] duplikálja a szöveget pseudóknak
       ================================================================= */
    function initGlitch() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-glitch]'), function (el) {
            el.setAttribute('data-text', el.textContent);
        });
    }

    /* =================================================================
       12 — MARQUEE: tartalom duplikálása a zökkenőmentes loopért
       ================================================================= */
    function initMarquee() {
        Array.prototype.forEach.call(document.querySelectorAll('.oc-marquee'), function (mq) {
            var track = mq.querySelector('.oc-marquee-track');
            if (!track || track.getAttribute('data-cloned')) return;
            var clone = track.cloneNode(true);
            track.parentNode.appendChild(clone);
            var all = mq.querySelectorAll('.oc-marquee-track');
            var total = 0;
            Array.prototype.forEach.call(all, function (t) { total += t.scrollWidth; });
            track.setAttribute('data-cloned', '1');
        });
    }

    /* =================================================================
       13 — ÉLŐ ÓRA [data-clock] + dátum [data-today]
       ================================================================= */
    function initClock() {
        var clocks = document.querySelectorAll('[data-clock]');
        var dates = document.querySelectorAll('[data-today]');
        if (!clocks.length && !dates.length) return;
        var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        function render() {
            var d = new Date();
            var hh = ('0' + d.getHours()).slice(-2);
            var mm = ('0' + d.getMinutes()).slice(-2);
            var ss = ('0' + d.getSeconds()).slice(-2);
            var now = hh + ':' + mm + ':' + ss;
            var date = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
            clocks.forEach(function (el) { el.textContent = now; });
            dates.forEach(function (el) { el.textContent = date; });
        }
        render();
        setInterval(render, 1000);
    }

    /* =================================================================
       14 — AKTÍV NAV LÁNCOLÁS (scroll observer szekciókra)
       ================================================================= */
    function initActiveNav() {
        var links = Array.prototype.slice.call(document.querySelectorAll('.docs-sidebar a, [data-nav] a, nav a[href^="#"]'));
        if (!links.length) return;
        var map = {};
        links.forEach(function (a) {
            var id = (a.getAttribute('href') || '').replace('#', '');
            if (id) map['#' + id] = a;
        });
        var ids = Object.keys(map);
        if (!ids.length) return;
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                ids.forEach(function (id) {
                    var el = document.querySelector(id);
                    if (!el) return;
                    var r = el.getBoundingClientRect();
                    map[id].classList.toggle('active', r.top <= window.innerHeight * 0.3 && r.bottom >= 0);
                });
            });
        }, { threshold: 0, rootMargin: '-20% 0px -60% 0px' });
        ids.forEach(function (id) {
            var el = document.querySelector(id);
            if (el) obs.observe(el);
        });
    }

    /* =================================================================
       15 — TOAST (régi + új stílus)
       ================================================================= */
    window.showToast = function (msg, type) {
        var container = document.getElementById('toast-container');
        if (!container) {
            container = make('div', 'toast-container');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:2147483647;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
        }
        var toast = make('div', 'oc-toast');
        var icon = type === 'success' ? '✔' : type === 'error' ? '✕' : '◈';
        var color = type === 'success' ? '#34d399' : type === 'error' ? '#f87171' : '#22d3ee';
        toast.innerHTML = '<span style="color:' + color + ';text-shadow:0 0 10px ' + color + ';">' + icon + '</span><span>' + msg + '</span>';
        container.appendChild(toast);
        setTimeout(function () {
            toast.classList.add('oc-leave');
            setTimeout(function () { toast.remove(); }, 420);
        }, 3800);
    };

    /* =================================================================
       16 — TÉMA (régi kompatibilitás, de most fixen sötét)
       ================================================================= */
    var sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
    var moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    window.applyTheme = function () {
        document.documentElement.classList.add('dark');
        forceDarkScheme();
        var btn = document.getElementById('theme-toggle');
        if (btn) btn.innerHTML = sunIcon;
    };
    window.toggleTheme = function () {
        document.documentElement.classList.add('dark');
        forceDarkScheme();
        var btn = document.getElementById('theme-toggle');
        if (btn) btn.innerHTML = sunIcon;
    };

    function renderThemeToggle() {
        var host = document.getElementById('theme-toggle-host');
        if (!host) return;
        var btn = document.getElementById('theme-toggle');
        if (!btn) {
            host.innerHTML = '<button class="icon-btn" id="theme-toggle" type="button" title="Theme" aria-label="Theme" style="width:2.5rem;height:2.5rem;border-radius:0.5rem;border:1px solid rgba(168,85,247,0.3);background:rgba(168,85,247,0.08);cursor:pointer;color:#e9d5ff"></button>';
            btn = document.getElementById('theme-toggle');
            btn.addEventListener('click', window.toggleTheme);
        }
        btn.innerHTML = sunIcon;
    }

    /* =================================================================
       17 — NAV / FOOTER (régi hostokkal kompatibilis)
       ================================================================= */
    function logoMark() {
        return '<svg width="130" height="34" viewBox="0 0 206 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:2rem;width:auto"><rect x="2" y="6" width="38" height="38" rx="9" fill="url(#oc-logo-g)"/><defs><linearGradient id="oc-logo-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#e879f9"/></linearGradient></defs><path d="M24 14v15a7 7 0 0 0 14 0" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="50" y="33" font-family="Arial, sans-serif" font-weight="700" font-size="24" fill="#f7f8fa">OCEAN</text></svg>';
    }

    function renderNav() {
        var host = document.getElementById('nav-host');
        if (!host) return;
        host.innerHTML = `
            <nav class="navbar oc-glass" id="site-nav" style="position:fixed;top:0;left:0;right:0;z-index:1000;">
                <div class="container max-w-7xl nav-inner">
                    <a href="/" class="nav-logo" onclick="event.preventDefault();go('/')">
                        ${logoMark()}
                    </a>
                    <div class="nav-links-desktop">
                        <a href="/" class="nav-link" data-nav>Home</a>
                        <a href="/pricing" class="nav-link" data-nav>Pricing</a>
                        <a href="/docs" class="nav-link" data-nav>Docs</a>
                        <a href="/branding" class="nav-link" data-nav>Branding</a>
                        <a href="/downloads" class="nav-link" data-nav>Download</a>
                        <a href="https://discord.anticheat.ac" target="_blank" class="nav-link">Discord</a>
                    </div>
                    <div class="nav-actions">
                        <span id="theme-toggle-host"></span>
                        <button class="btn btn-outline text-sm" onclick="go('/login')" style="padding:0.5rem 1rem;">Login</button>
                        <button class="btn btn-brand text-sm" onclick="go('/register')" style="padding:0.5rem 1rem;">Sign Up</button>
                        <button class="nav-hamburger" id="hamburger" aria-label="Menu">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                        </button>
                    </div>
                </div>
            </nav>
            <div class="mobile-panel-overlay" id="mobile-overlay"></div>
            <div class="mobile-panel" id="mobile-panel">
                <div class="mobile-panel-header">
                    ${logoMark()}
                    <button class="icon-btn" onclick="closeMobile()" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                </div>
                <div style="padding:0 1rem;">
                    <a class="mobile-link" href="/" onclick="closeMobile()">Home</a>
                    <a class="mobile-link" href="/pricing" onclick="closeMobile()">Pricing</a>
                    <a class="mobile-link" href="/docs" onclick="closeMobile()">Docs</a>
                    <a class="mobile-link" href="/branding" onclick="closeMobile()">Branding</a>
                    <a class="mobile-link" href="/downloads" onclick="closeMobile()">Download</a>
                    <a class="mobile-link" href="/dashboard" onclick="closeMobile()">Dashboard</a>
                </div>
                <div class="mobile-panel-footer">
                    <button class="btn btn-brand" style="width:100%" onclick="go('/register')">Sign Up</button>
                    <button class="btn btn-outline" style="width:100%" onclick="go('/login')">Login</button>
                </div>
            </div>
        `;
    }

    function renderFooter() {
        var host = document.getElementById('footer-host');
        if (!host) return;
        host.innerHTML = `
            <footer class="footer">
                <div class="container max-w-7xl">
                    <div class="footer-grid">
                        <div class="footer-col">
                            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
                                ${logoMark()}
                            </div>
                            <p class="footer-tagline">Experience an unparalleled service designed with quality, safety, and speed in mind. The #1 screenshare tool for gaming communities.</p>
                        </div>
                        <div class="footer-col"><h4>Product</h4>
                            <a href="/downloads">Download</a>
                            <a href="/docs">Docs</a>
                            <a href="/pricing">Pricing</a>
                            <a href="/branding">Branding</a>
                            <a href="/blog">Blog</a>
                        </div>
                        <div class="footer-col"><h4>Legal</h4>
                            <a href="/tos">Terms of Service</a>
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/legal">Legal</a>
                        </div>
                        <div class="footer-col"><h4>Community</h4>
                            <a href="https://discord.anticheat.ac" target="_blank">Discord</a>
                            <a href="https://youtube.com/@OceanScanner" target="_blank">YouTube</a>
                            <a href="#" onclick="showToast('Contact: contact@anticheat.ac','info');return false;">Contact</a>
                        </div>
                        <div class="footer-col"><h4>Support</h4>
                            <a href="#" onclick="showToast('Email us: contact@anticheat.ac','info');return false;">Contact Us</a>
                            <a href="/downloads">Troubleshooting</a>
                        </div>
                    </div>
                    <div class="footer-bottom">© Copyright 2026 Ocean Anticheat. All rights reserved.</div>
                </div>
            </footer>
        `;
    }

    /* =================================================================
       18 — MOBILE MENÜ, SCROLL NAV, FAQ, WORD BLUR, AUTO NAV (régi)
       ================================================================= */
    function initScrollNav() {
        var nav = document.getElementById('site-nav');
        if (!nav) return;
        listen(window, 'scroll', function () {
            nav.classList.toggle('scrolled', window.scrollY > 10);
        });
    }

    function initHamburger() {
        var btn = document.getElementById('hamburger');
        var panel = document.getElementById('mobile-panel');
        var overlay = document.getElementById('mobile-overlay');
        if (!btn || !panel || !overlay) return;
        btn.addEventListener('click', openMobile);
        overlay.addEventListener('click', closeMobile);
    }
    window.openMobile = function () {
        var panel = document.getElementById('mobile-panel');
        var overlay = document.getElementById('mobile-overlay');
        if (panel) panel.classList.add('open');
        if (overlay) overlay.classList.add('open');
    };
    window.closeMobile = function () {
        var panel = document.getElementById('mobile-panel');
        var overlay = document.getElementById('mobile-overlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    };

    function initBlurWords() {
        var words = document.querySelectorAll('.word-blur');
        if (!words.length) return;
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });
        words.forEach(function (w, i) { w.style.transitionDelay = (i * 0.03) + 's'; obs.observe(w); });
    }

    function initFAQ() {
        document.querySelectorAll('.faq-question').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var answer = btn.nextElementSibling;
                var chev = btn.querySelector('.faq-chevron');
                var open = answer && answer.classList.contains('open');
                document.querySelectorAll('.faq-answer').forEach(function (a) { a.classList.remove('open'); });
                document.querySelectorAll('.faq-chevron').forEach(function (c) { c.classList.remove('open'); });
                if (!open && answer) {
                    answer.classList.add('open');
                    if (chev) chev.classList.add('open');
                }
            });
        });
    }

    window.splitWords = function (selector) {
        var els = document.querySelectorAll(selector || '.split');
        els.forEach(function (el) {
            var words = el.textContent.split(' ');
            el.textContent = '';
            words.forEach(function (w) {
                var span = document.createElement('span');
                span.className = 'word-blur';
                span.textContent = w + ' ';
                el.appendChild(span);
            });
        });
    };

    function initAutoNav() {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    var id = e.target.id;
                    document.querySelectorAll('.docs-sidebar a').forEach(function (a) {
                        a.classList.remove('active');
                        if (a.getAttribute('href') === '#' + id) a.classList.add('active');
                    });
                }
            });
        }, { threshold: 0.2 });
        document.querySelectorAll('section[id],div[id="getting-started"],div[id="api"],div[id="detections"],div[id="pins"],div[id="lookup"]')
            .forEach(function (el) { observer.observe(el); });
    }

    /* =================================================================
       19 — ROUTING (régi kompatibilitás)
       ================================================================= */
    window.go = function (url) {
        var map = {
            '/pages/login.html': '/login',
            '/pages/register.html': '/register',
            '/pages/pricing.html': '/pricing',
            '/pages/docs.html': '/docs',
            '/pages/branding.html': '/branding',
            '/pages/downloads.html': '/downloads',
            '/pages/dashboard.html': '/dashboard',
            '/pages/blog.html': '/blog',
            '/pages/tos.html': '/tos',
            '/pages/privacy.html': '/privacy',
            '/pages/legal.html': '/legal',
            '/pages/changelog.html': '/changelog'
        };
        window.location.href = map[url] || url;
    };
    window.scrollToSection = function (id) {
        var el = document.querySelector(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    /* =================================================================
       20 — RIPPLE A GOMBOKON
       ================================================================= */
    function initRipples() {
        document.addEventListener('click', function (e) {
            var t = e.target && e.target.closest ? e.target.closest('button,a[class*="btn"],[role="button"]') : null;
            if (!t) return;
            if (t.closest('.oc-magnetic')) return;
            var r = t.getBoundingClientRect();
            var rip = make('span', 'oc-ripple');
            var size = Math.max(r.width, r.height) * 0.6;
            rip.style.width = rip.style.height = size + 'px';
            rip.style.left = (e.clientX - r.left) + 'px';
            rip.style.top = (e.clientY - r.top) + 'px';
            rip.style.overflow = 'hidden';
            t.appendChild(rip);
            rip.addEventListener('animationend', function () { rip.remove(); }, { once: true });
        });
    }

    /* =================================================================
       21 — FONT AWESOME BETÖLTÉS (régi kompatibilitás)
       ================================================================= */
    function loadIcons() {
        if (document.querySelector('link[href*="font-awesome"]')) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        document.head.appendChild(link);
    }

    /* =================================================================
       22 — INDÍTÁS KAPCSOLÓK
       ================================================================= */
    function detect() {
        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        finePointer = window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(any-pointer: coarse)').matches;
    }

    function boot() {
        detect();
        document.body.classList.add('ocean-v2');

        buildAmbientLayers();
        renderThemeToggle();
        renderNav();
        renderFooter();
        initScrollNav();
        initHamburger();
        initBlurWords();
        initFAQ();
        initAutoNav();
        initActiveNav();
        initRevealEffects();
        initCounters();
        initTyping();
        initGlitch();
        initMarquee();
        initClock();
        initRipples();
        initMagnetic();
        initTilt();
        initSpotlight();
        initCursor();
        initParticles();
        loadIcons();
    }

    onReady(boot);

    /* =================================================================
       23 — KONZI GYŰJTEMÉNY: MINI EASTER EGG (ossze-vissza színváltás)
       ================================================================= */
    var konami = [];
    var konamiSeq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    listen(document, 'keydown', function (e) {
        konami.push(e.keyCode);
        if (konami.length > konamiSeq.length) konami.shift();
        if (konami.join(',') === konamiSeq.join(',')) {
            konami = [];
            var body = document.body;
            var hue = 0;
            var iv = setInterval(function () {
                hue = (hue + 18) % 360;
                body.style.background = 'hsl(' + hue + ' 60% 8%)';
            }, 240);
            setTimeout(function () {
                clearInterval(iv);
                body.style.background = '';
                window.showToast('Gratulálunk, hiba nélkül kalibráltál! 🎉', 'success');
            }, 4200);
        }
    });
})();