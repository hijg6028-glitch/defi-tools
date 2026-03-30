let db = [];
let myPlan = [];
let curAPY = 0;
let isInitialized = false;

async function init() {
    if (isInitialized) return;
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
        
        isInitialized = true;
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
}

function saveToMemo(s, p, a, c, id) {
    // 【重要】重複チェックを「id(pool)」で厳密に行う
    if (myPlan.some(item => item.id === id)) {
        alert("この案件は既に追加されています。");
        return;
    }
    // 初期予算1000ドルでオブジェクトを作成
    myPlan.push({s, p, a, c, id, budget: 1000});
    renderMemo();
}

function updateBudget(index, value) {
    myPlan[index].budget = parseFloat(value) || 0;
    renderMemo();
}

function renderMemo() {
    const box = document.getElementById('memo-box');
    const emptyMsg = document.getElementById('memo-empty');
    const totalD = document.getElementById('total-res-d');
    const totalM = document.getElementById('total-res-m');

    if (myPlan.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (box) box.innerHTML = '';
        if (totalD) totalD.innerText = '$0.00';
        if (totalM) totalM.innerText = '$0.00';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    let totalDaily = 0;

    box.innerHTML = myPlan.map((m, i) => {
        const daily = (m.budget * (m.a / 100)) / 365;
        totalDaily += daily;
        return `
            <div style="background:#1b1a21; padding:10px; border-radius:10px; margin-bottom:8px; position:relative; border-left:3px solid #7645D9;">
                <div style="display:flex; justify-content:space-between; align-items:start; padding-right:15px;">
                    <b style="font-size:0.75rem;">${m.s} <span style="color:#31D0AA;">(${m.a.toFixed(1)}%)</span></b>
                    <span onclick="delMemo(${i})" style="cursor:pointer; color:#444; font-size:1rem;">×</span>
                </div>
                <div style="display:flex; align-items:center; gap:5px; margin-top:5px;">
                    <span style="font-size:0.6rem; color:#666;">Budget: $</span>
                    <input type="number" value="${m.budget}" oninput="updateBudget(${i}, this.value)" 
                        style="width:75px; background:#08060B; border:1px solid #383241; color:#fff; font-size:0.7rem; border-radius:4px; padding:2px 4px; outline:none;">
                </div>
                <div style="font-size:0.55rem; color:#444; margin-top:3px;">Est. Daily: $${daily.toFixed(2)}</div>
            </div>
        `;
    }).join('');

    // 合計値を画面に反映
    if (totalD) totalD.innerText = '$' + totalDaily.toLocaleString(undefined, {minimumFractionDigits: 2});
    if (totalM) totalM.innerText = '$' + (totalDaily * 30).toLocaleString(undefined, {minimumFractionDigits: 2});
}

function delMemo(i) {
    myPlan.splice(i, 1);
    renderMemo();
}

function exportTxt() {
    if(myPlan.length === 0) return alert("メモが空です");
    let totalD = 0;
    let txt = "=== DeFi Strategy Portfolio ===\\n\\n";
    myPlan.forEach((m, i) => {
        const d = (m.budget * (m.a / 100)) / 365;
        totalD += d;
        txt += `${i+1}. ${m.s} (${m.a.toFixed(1)}%)\\n   Budget: $${m.budget}\\n   Est. Monthly: $${(d*30).toFixed(2)}\\n   Protocol: ${m.p} (${m.c})\\n\\n`;
    });
    txt += "--------------------------------\\n";
    txt += `TOTAL MONTHLY ESTIMATE: $${(totalD * 30).toFixed(2)}\\n`;
    txt += "--------------------------------\\n";
    const blob = new Blob([txt], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'defi_portfolio.txt';
    a.click();
}
