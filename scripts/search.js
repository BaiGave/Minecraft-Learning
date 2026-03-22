/**
 * MC 开发文档中心 - 搜索模块
 * 
 * 使用 FlexSearch 实现全文搜索
 */

export class SearchModule {
    constructor() {
        this.index = null;
        this.documents = [];
        this.initialized = false;
    }
    
    /**
     * 初始化搜索索引
     */
    async init() {
        if (this.initialized) return;
        
        // 加载 FlexSearch
        await this.loadFlexSearch();
        
        // 初始化索引
        this.index = new FlexSearch.Document({
            document: {
                id: 'id',
                index: ['title', 'content', 'tags'],
                store: ['id', 'title', 'url', 'module', 'type', 'excerpt']
            },
            tokenize: 'forward',
            resolution: 9,
            cache: true
        });
        
        this.initialized = true;
    }
    
    /**
     * 加载 FlexSearch 库
     */
    async loadFlexSearch() {
        if (typeof FlexSearch !== 'undefined') return;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/flexsearch@0.7.31/dist/flexsearch.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * 添加文档到索引
     */
    addDocument(doc) {
        if (!this.initialized) {
            console.warn('Search index not initialized');
            return;
        }
        this.documents.push(doc);
        this.index.add(doc);
    }
    
    /**
     * 添加多个文档
     */
    addDocuments(docs) {
        docs.forEach(doc => this.addDocument(doc));
    }
    
    /**
     * 搜索文档
     */
    search(query, options = {}) {
        if (!this.initialized || !query.trim()) {
            return [];
        }
        
        const limit = options.limit || 10;
        const results = this.index.search(query, {
            limit: limit,
            enrich: true
        });
        
        return this.flattenResults(results);
    }
    
    /**
     * 扁平化搜索结果
     */
    flattenResults(results) {
        const seen = new Set();
        const unique = [];
        
        results.forEach(field => {
            if (field.result) {
                field.result.forEach(item => {
                    const id = typeof item === 'object' ? item.id : item;
                    if (!seen.has(id)) {
                        seen.add(id);
                        const doc = this.documents.find(d => d.id === id);
                        if (doc) {
                            unique.push(doc);
                        }
                    }
                });
            }
        });
        
        return unique;
    }
    
    /**
     * 从 DOM 生成搜索索引
     */
    generateIndexFromDOM() {
        const searchData = document.querySelector('#search-data');
        if (!searchData) return;
        
        try {
            const data = JSON.parse(searchData.textContent);
            this.addDocuments(data);
        } catch (e) {
            console.error('Failed to parse search data:', e);
        }
    }
}

// 全局搜索实例
const searchModule = new SearchModule();

/**
 * 初始化搜索
 */
export async function initSearch() {
    await searchModule.init();
    searchModule.generateIndexFromDOM();
    return searchModule;
}

/**
 * 执行搜索
 */
export function search(query, options) {
    return searchModule.search(query, options);
}

/**
 * 绑定搜索事件
 */
export function bindSearchEvents() {
    const searchInput = document.getElementById('heroSearch') || document.getElementById('searchInput');
    const resultsBox = document.getElementById('heroSearchResults') || document.getElementById('searchResults');
    
    if (!searchInput || !resultsBox) return;
    
    let debounceTimer = null;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            
            if (!query) {
                resultsBox.style.display = 'none';
                return;
            }
            
            const results = search(query, { limit: 8 });
            renderSearchResults(results, query, resultsBox);
        }, 200);
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
            resultsBox.style.display = 'none';
        }
    });
}

/**
 * 渲染搜索结果
 */
function renderSearchResults(results, query, container) {
    if (results.length === 0) {
        container.innerHTML = `<div class="search-empty">
            <i class="fas fa-search"></i>
            <p>未找到 "${query}" 相关结果</p>
        </div>`;
        container.style.display = 'block';
        return;
    }
    
    container.innerHTML = results.map(item => `
        <a href="${item.url}" class="search-result-item">
            <div class="result-icon">
                <i class="fas fa-file-alt"></i>
            </div>
            <div class="result-content">
                <div class="result-title">${item.title}</div>
                <div class="result-meta">${item.module || ''} ${item.type ? '· ' + item.type : ''}</div>
            </div>
        </a>
    `).join('');
    
    container.style.display = 'block';
}

export default { initSearch, search, bindSearchEvents };
