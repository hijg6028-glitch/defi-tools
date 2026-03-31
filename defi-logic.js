let db = [];
let myPlan = [];
let isInitialized = false;

// フィルタ状態
let currentMode = 'yield';
let selectedChain = 'all';
let isStableOnly = false;
let searchQuery = '';

async function init() {
    if (isInitialized) return;
    const renderTarget = document.getElementById('dash-render');
    try {
        const res = await fetch('https://yields.llama.fi/pools');
        const json = await res.json();
        db = json.data;
        isInitialized = true;
        applyFilters(); 
    } catch (e) {
        if (renderTarget) renderTarget.innerHTML = "データ取得エラー。";
    }
}

function updateChain(chain, btn) {
    selectedChain = chain;
    document.querySelectorAll('.filter-btn').forEach(b => {
        if(b.parentNode.innerText.includes('CHAIN')) b.classList.remove('active');
    });
    btn.classList.add('active');
    applyFilters();
}

function toggleStable(btn) {
    isStableOnly = !isStableOnly;
    btn.classList.toggle('active', isStableOnly);
    applyFilters();
}

function updateSearch(val) {
    searchQuery = val.toLowerCase();
    applyFilters();
}

function loadMode(mode, btn) {
    currentMode = mode;
    document.querySelectorAll('.dash-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
}

function applyFilters() {
    if (!isInitialized) return;
    const target = document.getElementById('dash-render');
    const config = window.WP_DEFI_CONFIG || { limit: 60 };

    let filtered = db.filter(p => {
        // 1. 基本TVLフィルタ
        if (p.tvlUsd < 100000) return false;
        // 2. チェーンフィルタ
        if (selectedChain !== 'all' && p.chain !== selectedChain) return false;
        // 3. ステーブルフィルタ
        if (isStableOnly && !p.stablecoin) return false;
        // 4. トークン検索
        if (searchQuery && !p.symbol.toLowerCase().includes(searchQuery)) return false;
        return true;
    });

    // ソート
    if (currentMode === 'yield') {
        filtered.sort((a, b) => b.apy - a.apy);
    } else {
        filtered.sort((a, b) => b.tvlUsd - a.tvlUsd);
    }

    renderList(filtered.slice(0, config.limit));
}

function renderList(list) {
    const target = document.getElementById('dash-render');
    target.innerHTML = list.map(p => `
        <div class="yield-card">
            <button class="add-mark" onclick="saveToMemo('${p.symbol}', '${p.project}', ${p.apy}, '${p.chain}', '${p.pool}')">+</button>
            <div style="font-weight:bold; font-size:0.8rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:25px;">
                <a href="https://defillama.com/yields/pool/${p.pool}" target="_blank" style="color:#fff; text-decoration:none;">${p.symbol}</a>
            </div>
            <div style="font-size:0.55rem; color:#666; margin-top:2px;">${p.project} | ${p.chain}</div>
            <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:flex-end;">
                <span style="font-size:0.55rem; color:#444;">TVL: $${(p.tvlUsd/1000000).toFixed(1)}M</span>
                <span style="font-size:1rem; font-weight:900; color:${p.apy > 100 ? '#ED4B9E' : '#31D0AA'};">
                    ${p.apy > 1000 ? '1000%+' : p.apy.toFixed(1) + '%'}
                </span>
            </div>
        </div>
    `).join('');
}

// 既存の saveToMemo, renderMemo, exportTxt 等の関数を以下に継続
// (文字数制限のため省略しますが、ロジックに変更はありません)

window.addEventListener('DOMContentLoaded', init);
window.updateChain = updateChain;
window.toggleStable = toggleStable;
window.updateSearch = updateSearch;
window.loadMode = loadMode;
