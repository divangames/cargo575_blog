(function () {
    var refreshMs = 5 * 60 * 1000;

    function resolveViewsJsonUrls() {
        if (typeof window !== 'undefined' && Array.isArray(window.CARGO_VIEWS_JSON_URLS) && window.CARGO_VIEWS_JSON_URLS.length) {
            return window.CARGO_VIEWS_JSON_URLS.slice().filter(Boolean);
        }
        var block = document.getElementById('cargo-articles-block');
        var raw = block && block.getAttribute('data-views-json');
        if (raw) {
            return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        }
        return [];
    }

    function formatViews(value) {
        var number = Number(value);
        if (!isFinite(number)) return '—';
        return number.toLocaleString('ru-RU');
    }

    function parseJsonResponse(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    function fetchViewsByUrl(url) {
        return fetch(url, { cache: 'no-store', mode: 'cors' })
            .then(parseJsonResponse);
    }

    function fetchViewsJson(urls) {
        function tryNext(index) {
            if (index >= urls.length) {
                throw new Error('All views sources failed');
            }
            var url = urls[index];
            return fetchViewsByUrl(url).catch(function () {
                var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
                return fetchViewsByUrl(proxyUrl).catch(function () {
                    return tryNext(index + 1);
                });
            });
        }
        return tryNext(0);
    }

    function normalizePath(href) {
        if (!href) return '';
        try {
            var url = new URL(href, window.location.origin);
            var pathname = decodeURIComponent(url.pathname || '/');
            return pathname.replace(/\/+$/, '') || '/';
        } catch (e) {
            return String(href).replace(/\/+$/, '') || '/';
        }
    }

    function getArticlePathByNode(node) {
        var card = node.closest('.cargo-article-card') || node.closest('.blog-card');
        if (!card) return '';
        if (card.matches && card.matches('a[href]')) {
            return normalizePath(card.getAttribute('href'));
        }
        var link = card.querySelector('h2 a[href]') || card.querySelector('a[href]');
        if (!link) return '';
        return normalizePath(link.getAttribute('href'));
    }

    function applyViewsToNode(node, viewsText) {
        var valueNode = node.querySelector('.lpm-blog-views-value');
        if (valueNode) valueNode.textContent = viewsText;
    }

    function updateViews() {
        var viewNodes = Array.prototype.slice.call(document.querySelectorAll('.lpm-blog-views'));
        if (!viewNodes.length) return;

        var urls = resolveViewsJsonUrls();
        if (!urls.length) {
            viewNodes.forEach(function (node) { applyViewsToNode(node, '—'); });
            return;
        }

        fetchViewsJson(urls)
            .then(function (data) {
                var viewsMap = (data && data.views) || {};
                viewNodes.forEach(function (node) {
                    var articlePath = getArticlePathByNode(node);
                    applyViewsToNode(node, formatViews(viewsMap[articlePath]));
                });
            })
            .catch(function () {
                viewNodes.forEach(function (node) { applyViewsToNode(node, '—'); });
            });
    }

    var viewsIntervalId = null;

    function startViewsAutoUpdate() {
        updateViews();
        if (viewsIntervalId === null) {
            viewsIntervalId = setInterval(updateViews, refreshMs);
        }
    }

    function schedule() {
        startViewsAutoUpdate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', schedule);
    } else {
        schedule();
    }
    window.addEventListener('load', schedule);
    setTimeout(schedule, 0);
    setTimeout(schedule, 400);
    setTimeout(schedule, 1200);
})();

