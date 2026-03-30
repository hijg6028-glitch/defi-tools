add_shortcode('defi_dashboard', function($atts) {
    $a = shortcode_atts(array(
        'symbol' => '', 
        'limit'  => '40'
    ), $atts);

    ob_start(); ?>
    <div id="defi-app-v3" style="width: 100%; background: #08060B; color: #fff; font-family: sans-serif; border-radius: 24px; border: 1px solid #383241; padding: 25px; box-sizing: border-box;">
        
        <!-- ヘッダー -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <div>
                <h2 style="color: #1FC7D4; margin: 0; font-size: 1.5rem; letter-spacing: 1px;">Yield Strategy Board</h2>
                <div style="font-size: 0.7rem; color: #666; margin-top: 5px;">
                    Filter: <?php echo $a['symbol'] ?: 'Global Assets'; ?> | Data: DeFiLlama
                </div>
            </div>
            <div style="background: rgba(118, 69, 217, 0.1); border: 1px solid #7645D9; padding: 8px 15px; border-radius: 12px; font-size: 0.7rem; color: #B8ADD2; max-width: 400px;">
                <span style="color: #1FC7D4; font-weight: bold;">INFO:</span> 表示の利回りは算出時の概算値です。市場環境により変動するため、運用開始前にDEX側で最新値をご確認ください。
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 320px; gap: 25px;">
            
            <!-- 左カラム: 案件一覧 -->
            <div>
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button class="dash-btn active" onclick="loadMode('yield', this)">🔥 High Yield</button>
                    <button class="dash-btn" onclick="loadMode('tvl', this)">🛡️ Stable TVL</button>
                    <button class="dash-btn-sec" onclick="showEmergencyInfo()">🆘 Emergency Guide</button>
                </div>
                
                <div id="dash-render" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; max-height: 580px; overflow-y: auto; padding-right: 10px;">
                    <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #7645D9;">資産データをスキャン中...</div>
                </div>
            </div>

            <!-- 右カラム: メモ & 計算 -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="background: #131118; padding: 18px; border-radius: 18px; border: 1px solid #383241;">
                    <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 12px; color: #31D0AA;">Yield Calculator</div>
                    <div style="position: relative; margin-bottom: 12px;">
                        <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #666; font-size: 0.8rem;">$</span>
                        <input type="number" id="calc-input" value="1000" oninput="doCalc()" style="width: 100%; background: #08060B; border: 1px solid #383241; color: #fff; padding: 10px 10px 10px 25px; border-radius: 10px; outline: none;">
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #B8ADD2;">
                        <span>Daily: <b id="res-d" style="color: #fff;">$0.00</b></span>
                        <span>Monthly: <b id="res-m" style="color: #fff;">$0.00</b></span>
                    </div>
                </div>

                <div style="background: #131118; border-radius: 18px; border: 1px solid #383241; padding: 18px; flex: 1; display: flex; flex-direction: column;">
                    <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 8px; color: #1FC7D4;">Strategy Memo</div>
                    <div id="memo-box" style="flex: 1; overflow-y: auto; font-size: 0.75rem; color: #B8ADD2; min-height: 200px;">
                        <p id="memo-empty" style="text-align: center; color: #444; margin-top: 20px;">リストは空です</p>
                    </div>
                    <button onclick="exportTxt()" style="width: 100%; background: #7645D9; color: #fff; border: none; padding: 14px; border-radius: 14px; cursor: pointer; font-weight: bold; font-size: 0.85rem; margin-top: 15px; transition: 0.3s;">
                        Plan Download (.txt)
                    </button>
                </div>
            </div>
        </div>

        <style>
            #defi-app-v3 * { box-sizing: border-box; }
            .dash-btn { background: #1b1a21; border: 1px solid #383241; color: #B8ADD2; padding: 10px 18px; border-radius: 12px; cursor: pointer; font-size: 0.8rem; font-weight: bold; transition: 0.2s; }
            .dash-btn.active { background: #1FC7D4; color: #08060B; border-color: #1FC7D4; }
            .dash-btn-sec { background: transparent; border: 1px solid #444; color: #666; padding: 10px 15px; border-radius: 12px; cursor: pointer; font-size: 0.7rem; margin-left: auto; }
            .yield-card { background: #1b1a21; border: 1px solid #383241; border-radius: 16px; padding: 16px; position: relative; transition: 0.2s; }
            .yield-card:hover { border-color: #7645D9; transform: translateY(-2px); background: #1e1c26; }
            .add-mark { background: #31D0AA; color: #000; border: none; width: 26px; height: 26px; border-radius: 8px; cursor: pointer; font-weight: bold; position: absolute; top: 15px; right: 15px; z-index: 2; line-height: 1; }
            .link-node { color: #1FC7D4; font-size: 0.6rem; text-decoration: none; margin-top: 5px; display: inline-block; }
            .link-node:hover { text-decoration: underline; }
            #dash-render::-webkit-scrollbar, #memo-box::-webkit-scrollbar { width: 4px; }
            #dash-render::-webkit-scrollbar-thumb, #memo-box::-webkit-scrollbar-thumb { background: #383241; border-radius: 10px; }
            @media (max-width: 900px) {
                #defi-app-v3 .style-grid { grid-template-columns: 1fr !important; }
                #defi-app-v3 div[style*="display: grid"] { grid-template-columns: 1fr !important; }
            }
        </style>
    </div>

    <script>
    let db = [];
    let myPlan = [];
    let curAPY = 0;

    async function init() {
        try {
            const res = await fetch('https://yields.llama.fi/pools');
            const json = await res.json();
            const filterSym = "<?php echo $a['symbol']; ?>".toLowerCase();
            db = json.data;
            if (filterSym) {
                db = db.filter(p => p.symbol.toLowerCase().includes(filterSym));
            }
            loadMode('yield', document.querySelector('.dash-btn'));
        } catch (e) {
            document.getElementById('dash-render').innerHTML = "データ取得エラー。";
        }
    }

    function loadMode(mode, btn) {
        document.querySelectorAll('.dash-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const target = document.getElementById('dash-render');
        let list = (mode === 'yield') 
            ? db.filter(p => p.tvlUsd > 100000).sort((a,b) => b.apy - a.apy)
            : db.filter(p => p.tvlUsd > 1000000).sort((a,b) => b.tvlUsd - a.tvlUsd);

        target.innerHTML = list.slice(0, <?php echo $a['limit']; ?>).map(p => `
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
        const amt = document.getElementById('calc-input').value || 0;
        const d = (amt * (curAPY / 100)) / 365;
        document.getElementById('res-d').innerText = '$' + d.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('res-m').innerText = '$' + (d * 30).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    function saveToMemo(s, p, a, c) {
        myPlan.push({s, p, a, c});
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

    init();
    </script>
    <?php
    return ob_get_clean();
});
