let db = [];
let myPlan = [];
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
            <div style="font-weight:bold; font-size:0.85rem; color:#fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right:28px;">
                <a href="https://defillama.com/yields/pool/${p.pool}" target="_blank" class="card-title-link">${p.symbol}</a>
            </div>
            <div style="font-size:0.6rem; color:#666; margin-top:2px;">${p.project} | ${p.chain}</div>
            <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:flex-end;">
                <span style="font-size:0.6rem; color:#444;">TVL: $${(p.tvlUsd/1000000).toFixed(1)}M</span>
                <span style="font-size:1.1rem; font-weight:900; color:${p.apy > 1000 ? '#ED4B9E' : '#31D0AA'}; line-height:1;">
                    ${p.apy > 1000 ? '1000%+' : p.apy.toFixed(1) + '%'}
                </span>
            </div>
        </div>
    `).join('');
}

function saveToMemo(s, p, a, c, id) {
    if (myPlan.some(item => item.id === id)) {
        alert("追加済みです。");
        return;
    }
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
        // 「Est. Daily」表示を削除し、銘柄とBudget入力のみに変更
        return `
            <div style="background:#1b1a21; padding:6px 8px; border-radius:8px; margin-bottom:5px; position:relative; border-left:3px solid #7645D9;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding-right:15px;">
                    <b style="font-size:0.7rem; color:#fff;">${m.s} <span style="color:#31D0AA; font-weight:normal;">(${m.a.toFixed(1)}%)</span></b>
                    <span onclick="delMemo(${i})" style="cursor:pointer; color:#444; font-size:0.9rem; font-weight:bold;">×</span>
                </div>
                <div style="display:flex; align-items:center; gap:4px; margin-top:2px;">
                    <span style="font-size:0.55rem; color:#666;">Budget: $</span>
                    <input type="number" value="${m.budget}" oninput="updateBudget(${i}, this.value)" 
                        style="width:70px; background:#08060B; border:1px solid #383241; color:#fff; font-size:0.65rem; border-radius:4px; padding:1px 4px; outline:none; height:18px;">
                </div>
            </div>
        `;
    }).join('');

    totalD.innerText = '$' + totalDaily.toLocaleString(undefined, {minimumFractionDigits: 2});
    totalM.innerText = '$' + (totalDaily * 30).toLocaleString(undefined, {minimumFractionDigits: 2});
}

function delMemo(i) {
    myPlan.splice(i, 1);
    renderMemo();
}

function clearAllMemo() {
    if (confirm("メモをすべて削除しますか？")) {
        myPlan = [];
        renderMemo();
    }
}

function exportTxt() {
    if(myPlan.length === 0) return alert("メモが空です");
    
    let totalD = 0;
    let txt = "=== DeFi Strategy Portfolio (作成日: " + new Date().toLocaleDateString('ja-JP') + ") ===\r\n\r\n";
    
    // --- 広告枠の設置 ---
    txt += "【PR】暗号資産の運用を安全に：Crypto Wallet X\n";
    txt += "詳細はこちら: https://example.com/ad-link\n";
    txt += "------------------------------------------------\r\n\r\n";

    myPlan.forEach((m, i) => {
        const d = (m.budget * (m.a / 100)) / 365;
        totalD += d;
        txt += `${i+1}. 銘柄: ${m.s} (${m.a.toFixed(1)}%)\r\n   投資額: $${m.budget}\r\n   日次収益:$${d.toFixed(2)} / 月次収益: $${(d*30).toFixed(2)}\r\n   プロトコル: ${m.p} (${m.c})\r\n\r\n`;
    });

    txt += "--------------------------------\r\n";
    txt += `合計月次収益予想:$${(totalD * 30).toFixed(2)}\r\n`;
    txt += "--------------------------------\r\nSource: DeFiLlama";

    // 文字化け対策（BOM付与）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, txt], {type: 'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'defi_portfolio_plan.txt';
    a.click();
}

document.addEventListener('DOMContentLoaded', init);
