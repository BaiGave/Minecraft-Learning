/**
 * 教程/分析页：侧栏折叠（桌面端），状态写入 localStorage
 */
(function () {
    var STORAGE_KEY = 'mc-learning-docs-sidebar-collapsed';

    function applyInitialState() {
        try {
            if (localStorage.getItem(STORAGE_KEY) === '1') {
                document.body.classList.add('docs-sidebar-collapsed');
            }
        } catch (e) {}
    }

    function bind() {
        var layout = document.getElementById('docsLayout');
        if (!layout) return;

        applyInitialState();

        document.querySelectorAll('[data-docs-sidebar-toggle]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.body.classList.toggle('docs-sidebar-collapsed');
                try {
                    localStorage.setItem(
                        STORAGE_KEY,
                        document.body.classList.contains('docs-sidebar-collapsed') ? '1' : '0'
                    );
                } catch (e) {}
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();
