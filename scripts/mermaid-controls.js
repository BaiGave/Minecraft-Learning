/**
 * Mermaid 图表：全屏、滚轮缩放、拖拽平移
 * 状态存在各 .mermaid-container 的 data-* 上，多图互不干扰。
 */
(function () {
    function getPan(wrapper) {
        return {
            x: parseFloat(wrapper.getAttribute('data-mermaid-pan-x') || '0') || 0,
            y: parseFloat(wrapper.getAttribute('data-mermaid-pan-y') || '0') || 0
        };
    }

    function setPan(wrapper, p) {
        wrapper.setAttribute('data-mermaid-pan-x', String(Math.round(p.x * 100) / 100));
        wrapper.setAttribute('data-mermaid-pan-y', String(Math.round(p.y * 100) / 100));
    }

    function resetPan(wrapper) {
        setPan(wrapper, { x: 0, y: 0 });
    }

    function applyTransform(wrapper, panning) {
        var scale = parseFloat(wrapper.getAttribute('data-mermaid-scale') || '1');
        var svg = wrapper.querySelector('.mermaid svg');
        if (!svg) return;
        var pan = getPan(wrapper);
        var rect = svg.getBoundingClientRect();
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        svg.style.transformOrigin = cx + 'px ' + cy + 'px';
        svg.style.transform = 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + scale + ')';
        svg.style.transition = panning ? 'none' : 'transform 0.2s ease';
    }

    function setScale(wrapper, scale, resetTranslation) {
        wrapper.setAttribute('data-mermaid-scale', scale.toFixed(2));
        var label = wrapper.querySelector('.mermaid-zoom-label');
        if (label) label.textContent = Math.round(scale * 100) + '%';
        if (resetTranslation) resetPan(wrapper);
        applyTransform(wrapper, false);
    }

    /* 全屏只会有一个元素：用单一监听避免 N 个 wrapper 重复绑定 */
    if (!window.__mcLearningMermaidFullscreenBound) {
        window.__mcLearningMermaidFullscreenBound = true;
        document.addEventListener('fullscreenchange', function () {
            var el = document.fullscreenElement;
            if (!el) {
                document.querySelectorAll('.mermaid-container.mermaid-fullscreen').forEach(function (w) {
                    w.classList.remove('mermaid-fullscreen');
                    setScale(w, 1, true);
                    var ic = w.querySelector('[data-mermaid-action="fullscreen"] i');
                    if (ic) ic.className = 'fas fa-expand';
                });
            } else if (el.classList && el.classList.contains('mermaid-container')) {
                el.classList.add('mermaid-fullscreen');
                var ic = el.querySelector('[data-mermaid-action="fullscreen"] i');
                if (ic) ic.className = 'fas fa-compress';
            }
        });
    }

    function waitForMermaidAndInit() {
        var maxTries = 25;
        var tries = 0;

        function tryInit() {
            var list = document.querySelectorAll('.mermaid-container:not([data-mermaid-init])');
            if (!list.length) {
                if (++tries < maxTries) setTimeout(tryInit, 280);
                return;
            }

            list.forEach(function (wrapper) {
                wrapper.setAttribute('data-mermaid-init', '1');
                wrapper.setAttribute('data-mermaid-scale', '1');
                resetPan(wrapper);

                var diagram = wrapper.querySelector('.mermaid');
                if (!diagram) return;

                var toolbar = document.createElement('div');
                toolbar.className = 'mermaid-toolbar';
                toolbar.setAttribute('aria-label', '图表操作');
                toolbar.innerHTML = [
                    '<button type="button" class="mermaid-btn" data-mermaid-action="fullscreen" title="全屏" aria-label="全屏">',
                    '  <i class="fas fa-expand"></i>',
                    '</button>',
                    '<button type="button" class="mermaid-btn" data-mermaid-action="zoom-in" title="放大" aria-label="放大">',
                    '  <i class="fas fa-search-plus"></i>',
                    '</button>',
                    '<button type="button" class="mermaid-btn" data-mermaid-action="zoom-out" title="缩小" aria-label="缩小">',
                    '  <i class="fas fa-search-minus"></i>',
                    '</button>',
                    '<button type="button" class="mermaid-btn" data-mermaid-action="zoom-reset" title="重置" aria-label="重置">',
                    '  <i class="fas fa-undo-alt"></i>',
                    '</button>'
                ].join('');

                var isPanning = false;
                var panStart = { x: 0, y: 0 };
                var panAtStart = { x: 0, y: 0 };

                toolbar.addEventListener('click', function (e) {
                    var btn = e.target.closest('[data-mermaid-action]');
                    if (!btn) return;
                    var action = btn.getAttribute('data-mermaid-action');
                    var cur = parseFloat(wrapper.getAttribute('data-mermaid-scale') || '1');
                    switch (action) {
                        case 'fullscreen':
                            if (document.fullscreenElement === wrapper) {
                                document.exitFullscreen().catch(function () {});
                            } else if (wrapper.requestFullscreen) {
                                wrapper.requestFullscreen().catch(function () {});
                            }
                            break;
                        case 'zoom-in':
                            setScale(wrapper, Math.min(cur + 0.1, 5), false);
                            break;
                        case 'zoom-out':
                            setScale(wrapper, Math.max(cur - 0.1, 0.2), false);
                            break;
                        case 'zoom-reset':
                            setScale(wrapper, 1, true);
                            break;
                    }
                });

                /* 在图表区域内滚轮直接缩放（仅在全屏模式下生效） */
                diagram.addEventListener('wheel', function (e) {
                    // 非全屏模式下不拦截滚轮，让页面正常滚动
                    if (!wrapper.classList.contains('mermaid-fullscreen')) return;
                    
                    e.preventDefault();
                    var delta = e.deltaY > 0 ? -0.06 : 0.06;
                    var c = parseFloat(wrapper.getAttribute('data-mermaid-scale') || '1');
                    setScale(wrapper, Math.max(0.2, Math.min(5, c + delta)), false);
                }, { passive: false });

                function startPan(e) {
                    if (e.button !== 0) return;
                    var cur = parseFloat(wrapper.getAttribute('data-mermaid-scale') || '1');
                    if (cur === 1 && !wrapper.classList.contains('mermaid-fullscreen')) return;
                    isPanning = true;
                    var p = getPan(wrapper);
                    panAtStart = { x: p.x, y: p.y };
                    panStart = { x: e.clientX, y: e.clientY };
                    diagram.style.cursor = 'grabbing';
                    e.preventDefault();
                }

                function doPan(e) {
                    if (!isPanning) return;
                    setPan(wrapper, {
                        x: panAtStart.x + (e.clientX - panStart.x),
                        y: panAtStart.y + (e.clientY - panStart.y)
                    });
                    applyTransform(wrapper, true);
                }

                function endPan() {
                    if (!isPanning) return;
                    isPanning = false;
                    diagram.style.cursor = '';
                    applyTransform(wrapper, false);
                }

                diagram.addEventListener('mousedown', startPan);
                document.addEventListener('mousemove', doPan);
                document.addEventListener('mouseup', endPan);

                wrapper.insertBefore(toolbar, wrapper.firstChild);

                var zoomLabel = document.createElement('span');
                zoomLabel.className = 'mermaid-zoom-label';
                zoomLabel.textContent = '100%';
                wrapper.appendChild(zoomLabel);
            });

            if (tries < maxTries) setTimeout(tryInit, 280);
        }

        tryInit();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForMermaidAndInit);
    } else {
        waitForMermaidAndInit();
    }
})();
