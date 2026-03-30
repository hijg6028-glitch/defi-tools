let db = [];
let myPlan = [];
let curAPY = 0;

async function init() {
    const renderTarget = document.getElementById('dash-render');
    const config = window.WP_DEFI_CONFIG || { symbol: '', limit: 40 };

    try {
        const res = await fetch('https://yields.llama.fi/pools');
        const json = await res.json();
        db = json.data;

        if (config.symbol) {
            const filterLow = config.symbol.toLowerCase();
            db = db.filter(p => p.symbol.toLowerCase().includes(filterLow));
        }
        
        loadMode('yield', document.querySelector('.dash-btn'));
    } catch (e) {
        if (renderTarget) renderTarget.innerHTML = "データ取得エラー。";
    }
}

function loadMode(mode, btn) {
    if (!btn) return;
    document.querySelectorAll('.dash-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const target = document.getElementById('dash-render');
    const config = window.WP_DEFI_CONFIG || { limit: 40 };

    let list = (mode === 'yield') 
        ? db.filter(p => p.tvlUsd > 100000).sort((a,b) => b.apy - a.apy)
        : db.filter(p => p.tvlUsd > 1000000).sort((a,b) => b.tvlUsd - a.tvlUsd);

    // カードの高さを低くし、コンパクトなデザインに変更
    target.innerHTML = list.slice(0, config.limit).map(p => `
        <div class="yield-card" style="padding: 12px; min-height: 100px;">
            <button class="add-mark" onclick="saveToMemo('${p.symbol}', '${p.project}', ${p.apy}, '${p.chain}', '${p.pool}')">+</button>
            <div style="font-weight:bold; font-size:0.85rem; color:#fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right:25px;">${p.symbol}</div>
            <div style="font-size:0.6rem; color:#666; margin-top:2px;">${p.project} | ${p.chain}</div>
            <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.6rem; color:#444;">TVL: $${(p.tvlUsd/1000000).toFixed(1)}M</span>
                <span onclick="setCalc(${p.apy})" style="font-size:1.1rem; font-weight:900; color:${p.apy > 1000 ? '#ED4B9E' : '#31D0AA'}; cursor:pointer;">${p.apy > 1000 ? '1000%+' : p.apy.toFixed(1) + '%'}</span>
            </div>
            <a href="https://defillama.com/yields/pool/${p.pool}" target="_blank" class="link-node">❯ Details</a>
        </div>
    `).join('');
}

function setCalc(apy) {
    curAPY = apy;
    doCalc();
}

function doCalc() {
    const amt = document.getElementById('calc-input').value || 0;
    const d = (amt * (curAPY / 100)) / 365;
    document.getElementById('res-d').innerText = '$' + d.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('res-m').innerText = '$' + (d * 30).toLocaleString(undefined, {minimumFractionDigits: 2});
}

function saveToMemo(s, p, a, c, id) {
    // 重複チェック（pool IDで判定）
    if (myPlan.some(item => item.id === id)) {
        alert("この案件は既に追加されています。");
        return;
    }
    myPlan.push({s, p, a, c, id});
    renderMemo();
}

function renderMemo() {
    const box = document.getElementById('memo-box');
    const emptyMsg = document.getElementById('memo-empty');
    if(myPlan.length === 0) {
        emptyMsg.style.display = 'block';
        box.innerHTML = '';
        return;
    }
    emptyMsg.style.display = 'none';
    box.innerHTML = myPlan.map((m, i) => `
        <div style="background:#1b1a21; padding:8px; border-radius:8px; margin-bottom:6px; position:relative; border-left:3px solid #7645D9;">
            <div style="font-weight:bold; font-size:0.75rem;">${m.s} <small style="color:#31D0AA;">(${m.a.toFixed(1)}%)</small></div>
            <div style="font-size:0.6rem; color:#666;">${m.p} (${m.c})</div>
            <span onclick="delMemo(${i})" style="position:absolute; right:8px; top:8px; cursor:pointer; color:#444;">×</span>
        </div>
    `).join('');
}

function delMemo(i) {
    myPlan.splice(i, 1);
    renderMemo();
}

function showEmergencyInfo() {
    alert("緊急時はExplorerからContract操作を行ってください。");
}

function exportTxt() {
    if(myPlan.length === 0) return alert("メモが空です");
    let txt = "=== DeFi Strategy Plan ===\n\n" + myPlan.map((m, i) => `${i+1}. ${m.s} (${m.a.toFixed(1)}%)\n   ${m.p} on ${m.c}`).join('\n\n');
    const blob = new Blob([txt], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'strategy_plan.txt';
    a.click();
}
