let db = [];
let myPlan = [];
let curAPY = 0;

// WordPress側から呼ばれる初期化関数
async function init() {
    const renderTarget = document.getElementById('dash-render');
    
    // WordPress側で定義したグローバル変数（WP_DEFI_CONFIG）を読み込む
    const config = window.WP_DEFI_CONFIG || { symbol: '', limit: 40 };

    try {
        const res = await fetch('https://yields.llama.fi/pools');
        const json = await res.json();
        db = json.data;

        // フィルタリング
        if (config.symbol) {
            const filterLow = config.symbol.toLowerCase();
            db = db.filter(p => p.symbol.toLowerCase().includes(filterLow));
        }
        
        // 最初の表示（High Yieldモード）
        const firstBtn = document.querySelector('.dash-btn');
        loadMode('yield', firstBtn);

    } catch (e) {
        if (renderTarget) renderTarget.innerHTML = "データ取得エラー。";
        console.error(e);
    }
}

function loadMode(mode, btn) {
    if (!btn) return;
    document.querySelectorAll('.dash-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const target = document.getElementById('dash-render');
    if (!target) return;

    // 設定の読み込み
    const config = window.WP_DEFI_CONFIG || { limit: 40 };

    let list = (mode === 'yield') 
        ? db.filter(p => p.tvlUsd > 100000).sort((a,b) => b.apy - a.apy)
        : db.filter(p => p.tvlUsd > 1000000).sort((a,b) => b.tvlUsd - a.tvlUsd);

    target.innerHTML = list.slice(0, config.limit).map(p => `
        <div class="yield-card">
            <button class="add-mark" onclick="saveToMemo('${p.symbol}', '${p.project}', ${p.apy}, '${p.chain}')">+</button>
            <div style="font-weight:bold; font-size:0.9rem; color:#fff; padding-right:30px;">${p.symbol}</div>
            <div style="font-size:0.6rem; color:#666; margin-top:3px;">${p.project} | ${p.chain}</div>
            <a href="https://defillama.com/yields/pool/${p.pool}" target="_blank" class="link-node">詳細・DEXへ ❯</a>
            <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:baseline;">
                <span style="font-size:0.6rem; color:#444;">TVL: $${(p.tvlUsd/1000000).toFixed(1)}M</span>
                <span onclick="setCalc(${p.apy})" style="font-size:1.2rem; font-weight:900; color:${p.apy > 1000 ? '#ED4B9E' : '#31D0AA'}; cursor:pointer;">${p.apy > 1000 ? '1000%+' : p.apy.toFixed(1) + '%'}</span>
            </div>
        </div>
    `).join('');
}

function setCalc(apy) {
    curAPY = apy;
    doCalc();
}

function doCalc() {
    const input = document.getElementById('calc-input');
    const amt = input ? input.value : 0;
    const d = (amt * (curAPY / 100)) / 365;
    
    const resD = document.getElementById('res-d');
    const resM = document.getElementById('res-m');
    
    if (resD) resD.innerText = '$' + d.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (resM) resM.innerText = '$' + (d * 30).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function saveToMemo(s, p, a, c) {
    myPlan.push({s, p, a, c});
    renderMemo();
}

function renderMemo() {
    const box = document.getElementById('memo-box');
    const emptyMsg = document.getElementById('memo-empty');
    if (!box) return;
    
    if(myPlan.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        box.innerHTML = ''; 
        return;
    }
    
    if (emptyMsg) emptyMsg.style.display = 'none';
    box.innerHTML = myPlan.map((m, i) => `
        <div style="background:#1b1a21; padding:10px; border-radius:10px; margin-bottom:8px; position:relative; border-left:3px solid #7645D9;">
            <b style="color:#fff;">${m.s}</b> <small>(${m.a.toFixed(1)}%)</small>
            <div style="font-size:0.6rem; color:#666;">${m.p} (${m.c})</div>
            <span onclick="delMemo(${i})" style="position:absolute; right:10px; top:10px; cursor:pointer; color:#666; font-size:1.2rem;">×</span>
        </div>
    `).join('');
}

function delMemo(i) {
    myPlan.splice(i, 1);
    renderMemo();
}

function showEmergencyInfo() {
    alert("【緊急離脱・コントラクト操作】\n公式サイトが重い、または404の場合：\n1. カードのリンクからDeFiLlamaへ飛び、'Pool Address'をコピー\n2. 各チェーンのExplorer(Etherscan等)で検索\n3. 'Contract' -> 'Write as Proxy'等から'EmergencyWithdraw'または'Withdraw'を実行してください。");
}

function exportTxt() {
    if(myPlan.length === 0) return alert("メモが空です");
    let txt = "=== DeFi Yield Strategy Plan ===\n\n";
    myPlan.forEach((m, i) => {
        txt += `${i+1}. ${m.s}\n   APY: ${m.a.toFixed(1)}%\n   Protocol: ${m.p} (${m.c})\n\n`;
    });
    txt += "--------------------------------\n";
    txt += "【AD】資産の移動・ブリッジならこちら: https://example.com\n";
    txt += "--------------------------------\n";
    const blob = new Blob([txt], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my_defi_plan.txt';
    a.click();
}
