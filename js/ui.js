import { CHAPTERS, CHAPTER_INTROS, DASH_TUTORIAL, LEVELS, ACHIEVEMENTS } from './levels.js';
import { STAR_PACKS, STAR_PACK_ART, SHOP_DATA, SHAPE_SVGS, FX_SVGS } from './shop.js';
import { SaveStore } from './storage.js';
import { SHOP_REWARD_AD } from './config.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.activeShopTab = 'shapes';
        this.introQueue = [];
        this.injectStarStorePersianStyles();
        this.setupModesModalAndButton();
        this.setupFourthShopTab();
        this.ensureStarStoreModal();
        this.ensureChapterIntroModal();
        this.upgradeTopBarStarPill();
        this.bindUI();

        const hintEl = document.getElementById('hud-dash-hint');
        if (hintEl) hintEl.textContent = 'DOUBLE-TAP SCREEN TO DASH';
    }

    injectStarStorePersianStyles() {
        if (!document.getElementById('star-store-persian-style')) {
            const style = document.createElement('style');
            style.id = 'star-store-persian-style';
            style.textContent = `
                @keyframes floatArt {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-4px) scale(1.03); }
                }
                @keyframes shineSweep {
                    0% { transform: translateX(120%) skewX(-20deg); }
                    35%, 100% { transform: translateX(-180%) skewX(-20deg); }
                }
                #modal-star-store,
                #modal-star-store * {
                    font-family: 'Shabnam', var(--font-sans) !important;
                }
                #modal-star-store .modal-sheet {
                    direction: rtl;
                    background: linear-gradient(180deg, #1E2028 0%, #14161B 100%);
                    border: 1px solid rgba(251, 191, 36, 0.22);
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);
                }
                #modal-star-store .modal-title {
                    font-size: 20px !important;
                    font-weight: 700 !important;
                    letter-spacing: 0 !important;
                    background: linear-gradient(90deg, #FFFBEB, #FBBF24);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .store-section-label {
                    font-size: 12.5px;
                    font-weight: 700;
                    color: #9CA3AF;
                    padding: 2px 4px 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .store-section-label::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.08);
                }
                .store-hero-card {
                    position: relative;
                    border-radius: 20px;
                    padding: 14px;
                    border: 1.5px solid rgba(255, 255, 255, 0.14);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    overflow: hidden;
                    flex-shrink: 0;
                    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
                }
                .store-hero-card::before {
                    content: '';
                    position: absolute;
                    top: 0; bottom: 0; width: 45%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
                    animation: shineSweep 4.5s infinite;
                    pointer-events: none;
                }
                .store-hero-top {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .store-art-box {
                    width: 78px;
                    height: 78px;
                    border-radius: 18px;
                    background: rgba(12, 13, 16, 0.65);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    position: relative;
                }
                .store-art-box svg,
                .store-grid-art svg {
                    animation: floatArt 3.2s ease-in-out infinite;
                    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.45));
                }
                .store-hero-info {
                    flex: 1;
                    min-width: 0;
                    text-align: right;
                }
                .store-ribbon-badge {
                    display: inline-block;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 3px 10px;
                    border-radius: 99px;
                    margin-bottom: 5px;
                }
                .store-hero-info h4 {
                    font-size: 17px;
                    font-weight: 700;
                    color: #FFFFFF;
                    margin-bottom: 4px;
                }
                .store-hero-info p {
                    font-size: 13px;
                    font-weight: 400;
                    color: #D1D5DB;
                    line-height: 1.55;
                }
                .store-hero-bottom {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(12, 13, 16, 0.55);
                    padding: 8px 12px;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                }
                .store-packs-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    width: 100%;
                    flex-shrink: 0;
                }
                .store-grid-card {
                    position: relative;
                    border-radius: 20px;
                    padding: 14px 10px 12px;
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    justify-content: space-between;
                    gap: 6px;
                    overflow: hidden;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
                }
                .store-grid-badge {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    font-size: 10.5px;
                    font-weight: 700;
                    padding: 3px 6px;
                    text-align: center;
                }
                .store-grid-art {
                    height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 10px;
                }
                .store-grid-amount {
                    font-size: 19px;
                    font-weight: 700;
                    color: #FBBF24;
                    line-height: 1.1;
                    text-shadow: 0 2px 10px rgba(251, 191, 36, 0.35);
                }
                .store-grid-name {
                    font-size: 15px;
                    font-weight: 700;
                    color: #F3F4F6;
                }
                .store-grid-bonus {
                    font-size: 11.5px;
                    font-weight: 500;
                    padding: 2px 8px;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.07);
                    color: #E5E7EB;
                    margin-bottom: 4px;
                }
                .store-buy-btn {
                    width: 100%;
                    height: 40px;
                    border-radius: 12px;
                    border: none;
                    font-size: 13.5px;
                    font-weight: 700;
                    cursor: pointer;
                    background: linear-gradient(180deg, #FDE047 0%, #F59E0B 100%);
                    color: #121316;
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
                    transition: transform 0.12s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .store-buy-btn:active {
                    transform: scale(0.95);
                }
                .store-buy-btn.purchased {
                    background: rgba(52, 211, 153, 0.18);
                    color: #34D399;
                    border: 1px solid rgba(52, 211, 153, 0.4);
                    box-shadow: none;
                    cursor: default;
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupFourthShopTab() {
        const tabsContainer = document.querySelector('.shop-tabs');
        if (!tabsContainer) return;
        tabsContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
        if (!tabsContainer.querySelector('[data-tab="fx"]')) {
            const fxBtn = document.createElement('button');
            fxBtn.className = 'shop-tab-btn';
            fxBtn.dataset.tab = 'fx';
            fxBtn.textContent = 'FX';
            tabsContainer.appendChild(fxBtn);
        }
    }

    upgradeTopBarStarPill() {
        const starSpan = document.getElementById('ui-stars');
        const pill = starSpan?.closest('.pill-badge');
        if (pill && !pill.querySelector('.plus-buy-tag')) {
            pill.classList.add('interactive');
            pill.style.cursor = 'pointer';
            pill.style.borderColor = 'rgba(251, 191, 36, 0.35)';
            const plus = document.createElement('span');
            plus.className = 'plus-buy-tag';
            plus.textContent = '+';
            plus.style.cssText = 'background:var(--gold);color:#121316;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;margin-left:2px;';
            pill.appendChild(plus);
            pill.addEventListener('click', () => {
                if (this.game.state === 'PLAYING') return;
                this.game.audio.init();
                this.game.audio.playTap();
                this.openStarStoreModal();
            });
        }

        ['btn-gift-stars', 'btn-gift-stars-perks'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.innerHTML = '+ BUY ★';
                btn.style.cssText = 'font-size:11px;padding:6px 10px;min-width:auto;background:var(--gold);color:#121316;';
            }
        });
    }

    ensureStarStoreModal() {
        if (document.getElementById('modal-star-store')) return;
        const modal = document.createElement('div');
        modal.id = 'modal-star-store';
        modal.className = 'modal-backdrop hidden interactive';
        modal.style.zIndex = '50';
        modal.innerHTML = `
            <div class="modal-sheet" style="max-width: 430px; padding: 18px;">
                <div class="modal-header" style="margin-bottom: 12px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <svg class="icon-svg" style="width:24px;height:24px;color:var(--gold);fill:var(--gold);" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span class="modal-title">فروشگاه ستاره</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="display:flex;align-items:center;gap:5px;background:var(--bg);border:1px solid rgba(251,191,36,0.3);padding:5px 11px;border-radius:99px;font-weight:700;font-size:13.5px;color:var(--gold);direction:ltr;">
                            <span>★</span>
                            <span id="store-header-stars">0</span>
                        </div>
                        <button class="icon-btn" id="btn-close-star-store" style="width:36px;height:36px;">
                            <svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>
                <div class="modal-scroll" id="star-packs-container" style="gap:12px;"></div>
            </div>
        `;
        document.getElementById('app').appendChild(modal);

        document.getElementById('btn-close-star-store').addEventListener('click', () => {
            this.game.audio.init();
            this.game.audio.playTap();
            modal.classList.add('hidden');
        });
    }

    openStarStoreModal() {
        this.renderStarStoreModal();
        document.getElementById('modal-star-store')?.classList.remove('hidden');
    }

    renderStarStoreModal(justBoughtId = null) {
        const g = this.game;
        const container = document.getElementById('star-packs-container');
        if (!container) return;
        const prevScroll = container.scrollTop;
        container.innerHTML = '';

        const headerStars = document.getElementById('store-header-stars');
        if (headerStars) headerStars.textContent = g.save.stars.toLocaleString();

        this.renderShopRewardCard(container);

        const heroLabel = document.createElement('div');
        heroLabel.className = 'store-section-label';
        heroLabel.innerHTML = `<span>🔥 پیشنهادهای استثنایی</span>`;
        container.appendChild(heroLabel);

        const heroPacks = STAR_PACKS.filter(p => p.isHero);
        heroPacks.forEach(pack => {
            const isBought =
                (pack.id === 'starter_bundle' && g.save.starterPackBought) ||
                (pack.id === 'vip_doubler' && g.save.vipDoubler);

            const card = document.createElement('div');
            card.className = `store-hero-card ${justBoughtId === pack.id ? 'level-up-anim' : ''}`;
            card.style.background = pack.bgGrad;
            card.style.borderColor = `${pack.color}66`;

            card.innerHTML = `
                <div class="store-hero-top">
                    <div class="store-art-box" style="border-color:${pack.color}55; box-shadow: inset 0 0 18px ${pack.color}22;">
                        ${STAR_PACK_ART[pack.id] || ''}
                    </div>
                    <div class="store-hero-info">
                        <span class="store-ribbon-badge" style="background:${pack.color}28;color:${pack.color};border:1px solid ${pack.color}66;">
                            ${pack.badge}
                        </span>
                        <h4>${pack.name}</h4>
                        <p>${pack.desc}</p>
                    </div>
                </div>
                <div class="store-hero-bottom">
                    <div>
                        <div style="font-size:16px;font-weight:700;color:var(--gold);">
                            +${pack.stars.toLocaleString()} ★
                        </div>
                        <div style="font-size:11.5px;font-weight:700;color:${pack.color};">
                            ${pack.bonusText}
                        </div>
                    </div>
                    <button class="store-buy-btn ${isBought ? 'purchased' : ''}" ${isBought ? 'disabled' : ''} style="width:auto;min-width:132px;padding:0 16px;">
                        ${isBought ? 'فعال شده ✓' : g.billing.priceFor(pack)}
                    </button>
                </div>
            `;

            card.querySelector('button').onclick = () => {
                if (isBought) return;
                g.audio.init();
                g.billing.initiatePurchase(pack.sku);
            };
            container.appendChild(card);
        });

        const gridLabel = document.createElement('div');
        gridLabel.className = 'store-section-label';
        gridLabel.style.marginTop = '4px';
        gridLabel.innerHTML = `<span>💎 بسته‌های ستاره</span>`;
        container.appendChild(gridLabel);

        const gridWrap = document.createElement('div');
        gridWrap.className = 'store-packs-grid';

        const standardPacks = STAR_PACKS.filter(p => !p.isHero);
        standardPacks.forEach(pack => {
            const card = document.createElement('div');
            card.className = `store-grid-card ${justBoughtId === pack.id ? 'level-up-anim' : ''}`;
            card.style.background = pack.bgGrad;
            card.style.borderColor = `${pack.color}55`;

            card.innerHTML = `
                ${pack.badge
                    ? `<div class="store-grid-badge" style="background:${pack.color};color:#121316;">${pack.badge}</div>`
                    : `<div style="height:14px;"></div>`
                }
                <div class="store-grid-art">
                    ${STAR_PACK_ART[pack.id] || ''}
                </div>
                <div class="store-grid-amount">${pack.stars.toLocaleString()} ★</div>
                <div class="store-grid-name">${pack.name}</div>
                <div class="store-grid-bonus" style="color:${pack.color};border:1px solid ${pack.color}44;">
                    ${pack.bonusText}
                </div>
                <button class="store-buy-btn">
                    ${g.billing.priceFor(pack)}
                </button>
            `;

            card.querySelector('button').onclick = () => {
                g.audio.init();
                g.billing.initiatePurchase(pack.sku);
            };
            gridWrap.appendChild(card);
        });

        container.appendChild(gridWrap);
        container.scrollTop = prevScroll;
    }

    // کارت «ستاره‌ی رایگان با تماشای تبلیغ» — یک‌بار برای هر بازیکن
    renderShopRewardCard(container) {
        const g = this.game;
        const claimed = g.ads.isShopRewardClaimed();
        if (!claimed && !g.ads.supported) return;     // نسخه‌ی وب: تبلیغی در کار نیست

        const ready = g.ads.isReady('shopReward');
        const busy = g.ads.busy;
        const amount = SHOP_REWARD_AD.stars.toLocaleString('fa-IR');
        const label = claimed ? 'دریافت شد ✓'
            : busy ? 'در حال نمایش…'
            : ready ? 'تماشای تبلیغ' : 'در حال آماده‌سازی…';

        const card = document.createElement('div');
        card.className = `store-ad-card ${claimed ? 'claimed' : ''}`;
        card.innerHTML = `
            <div class="store-ad-art">
                <svg viewBox="0 0 48 48" width="46" height="46" fill="none">
                    <circle cx="24" cy="24" r="20" fill="rgba(251,191,36,0.14)" stroke="#FBBF24" stroke-width="1.6" stroke-dasharray="4 3"/>
                    <polygon points="24,9 28,19 39,20 31,27 33,38 24,32 15,38 17,27 9,20 20,19" fill="#FBBF24"/>
                    <polygon points="20,21 20,31 30,26" fill="#14161B"/>
                </svg>
            </div>
            <div class="store-ad-info">
                <span class="store-ad-badge">فقط یک‌بار</span>
                <h4>ستاره‌ی رایگان</h4>
                <p>یه تبلیغ کوتاه ببین و <b>${amount} ★</b> هدیه بگیر</p>
            </div>
            <button class="store-ad-btn" ${claimed || !ready || busy ? 'disabled' : ''}>${label}</button>
        `;
        const btn = card.querySelector('button');
        btn.onclick = async () => {
            if (btn.disabled) return;
            g.audio.init();
            btn.disabled = true;
            await g.ads.claimShopReward();
            this.renderStarStoreModal();
        };
        container.appendChild(card);
    }

    onAdsStateChanged() {
        this._refreshStoreIfOpen();
        this.refreshUnlockAllButton();
    }

    // وضعیت دکمه‌ی UNLOCK ALL: پنهان وقتی همه باز است، غیرفعال تا آماده شدن تبلیغ
    refreshUnlockAllButton() {
        const g = this.game;
        const btn = document.getElementById('btn-unlock-all');
        if (!btn || !g.ads) return;
        if (g.ads.isAllUnlocked()) { btn.style.display = 'none'; return; }
        btn.style.display = '';
        const ready = !g.ads.supported || (g.ads.isReady('unlockAll') && !g.ads.busy);
        btn.disabled = !ready;
        btn.style.opacity = ready ? '' : '0.5';
        btn.textContent = 'UNLOCK ALL ▶';
        btn.title = g.ads.supported ? 'Watch a short ad to unlock every level' : '';
    }
    onStoreDataChanged() { this._refreshStoreIfOpen(); }

    _refreshStoreIfOpen() {
        const m = document.getElementById('modal-star-store');
        if (m && !m.classList.contains('hidden')) this.renderStarStoreModal();
    }

    setupModesModalAndButton() {
        const modesStack = document.querySelector('.modes-stack');
        if (modesStack && !document.getElementById('modal-modes')) {
            const launchModesBtn = document.createElement('button');
            launchModesBtn.id = 'btn-open-modes';
            launchModesBtn.className = 'endless-banner-btn';
            launchModesBtn.style.height = '60px';
            launchModesBtn.innerHTML = `
                <div class="endless-left">
                    <div class="endless-icon-wrap" style="background:rgba(255,90,95,0.14);color:var(--accent);">
                        <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    </div>
                    <div>
                        <div class="endless-title">ARCADE GAME MODES</div>
                        <div class="endless-sub">2P Versus • Endless • Overdrive • Chaos</div>
                    </div>
                </div>
                <div class="endless-best-pill" style="color:var(--text);background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.16);">4 MODES</div>
            `;

            const modal = document.createElement('div');
            modal.id = 'modal-modes';
            modal.className = 'modal-backdrop hidden interactive';
            modal.innerHTML = `
                <div class="modal-sheet" style="max-width: 390px;">
                    <div class="modal-header">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <svg class="icon-svg" style="color:var(--accent);" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                            <span class="modal-title">GAME MODES</span>
                        </div>
                        <button class="icon-btn" id="btn-close-modes" style="width:34px;height:34px;">
                            <svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div class="modal-scroll" id="modes-modal-list" style="gap:12px;"></div>
                </div>
            `;

            modesStack.parentNode.insertBefore(launchModesBtn, modesStack);
            document.getElementById('app').appendChild(modal);

            const modalList = modal.querySelector('#modes-modal-list');

            const versusBtn = document.createElement('button');
            versusBtn.id = 'btn-play-versus';
            versusBtn.className = 'endless-banner-btn';
            versusBtn.innerHTML = `
                <div class="endless-left">
                    <div class="endless-icon-wrap" style="color:#34D399;background:rgba(52,211,153,0.12);">
                        <svg class="icon-svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                        <div class="endless-title">2P DUEL ARENA</div>
                        <div class="endless-sub">P1 Bottom • P2 Top • Last alive wins</div>
                    </div>
                </div>
                <div class="endless-best-pill" style="color:#34D399;background:rgba(52,211,153,0.12);border-color:rgba(52,211,153,0.3);">1v1</div>
            `;
            modalList.appendChild(versusBtn);

            while (modesStack.firstChild) {
                modalList.appendChild(modesStack.firstChild);
            }
            modesStack.remove();
        }
    }

    ensureChapterIntroModal() {
        if (document.getElementById('modal-chapter-intro')) return;
        const modal = document.createElement('div');
        modal.id = 'modal-chapter-intro';
        modal.className = 'modal-backdrop hidden interactive';
        modal.innerHTML = `
            <div class="modal-sheet" style="max-width: 360px; text-align: center; align-items: center; gap: 12px;">
                <div class="result-tag" id="chap-intro-tag" style="margin-bottom:0; color:var(--gold);">NEW MECHANIC</div>
                <h2 class="modal-title" id="chap-intro-title" style="font-size: 20px;">CHAPTER 1</h2>
                <div id="chap-intro-graphic" style="width:100%; height:105px; border-radius:16px; background:var(--bg); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; margin: 4px 0; overflow:hidden;"></div>
                <h4 id="chap-intro-sub" style="font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text);"></h4>
                <p id="chap-intro-desc" style="font-size:13px; color:var(--text-dim); line-height:1.55; margin-bottom:8px;"></p>
                <button class="primary-play-btn" id="btn-chap-intro-start" style="height:50px;">GOT IT • CONTINUE</button>
            </div>
        `;
        document.getElementById('app').appendChild(modal);

        document.getElementById('btn-chap-intro-start').addEventListener('click', () => {
            this.game.audio.init();
            this.game.audio.playTap();
            if (this.introQueue.length > 0) {
                this.presentNextIntroSlide();
            } else {
                modal.classList.add('hidden');
                if (this.game.state === 'INTRO_MODAL') {
                    this.game.state = 'PLAYING';
                }
            }
        });
    }

    showChapterIntro(chapId) {
        const chap = CHAPTERS.find(c => c.id === chapId);
        const info = CHAPTER_INTROS[chapId];
        if (!chap || !info) return false;

        this.introQueue = [
            {
                tag: `CHAPTER ${chapId} BRIEFING`,
                title: chap.title.toUpperCase(),
                svg: info.svg,
                sub: info.name,
                desc: info.desc,
                btnText: chapId === 1 ? 'NEXT • DASH TUTORIAL' : 'GOT IT • START'
            }
        ];

        if (chapId === 1) {
            this.introQueue.push({
                tag: DASH_TUTORIAL.tag,
                title: DASH_TUTORIAL.title,
                svg: DASH_TUTORIAL.svg,
                sub: DASH_TUTORIAL.sub,
                desc: DASH_TUTORIAL.desc,
                btnText: 'GOT IT • START GAME'
            });
        }

        this.presentNextIntroSlide();
        document.getElementById('modal-chapter-intro').classList.remove('hidden');
        return true;
    }

    presentNextIntroSlide() {
        const slide = this.introQueue.shift();
        if (!slide) return;
        document.getElementById('chap-intro-tag').textContent = slide.tag;
        document.getElementById('chap-intro-title').textContent = slide.title;
        document.getElementById('chap-intro-graphic').innerHTML = slide.svg;
        document.getElementById('chap-intro-sub').textContent = slide.sub;
        document.getElementById('chap-intro-desc').textContent = slide.desc;
        document.getElementById('btn-chap-intro-start').textContent = slide.btnText;
    }

    bindUI() {
        const g = this.game;
        const tap = (id, fn) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', () => {
                g.audio.init();
                g.audio.playTap();
                fn();
            });
        };

        tap('btn-play-main', () => g.startGame('LEVEL', g.currentLevelId));

        tap('btn-open-modes', () => {
            this.refreshHomeUI();
            document.getElementById('modal-modes')?.classList.remove('hidden');
        });
        tap('btn-close-modes', () => document.getElementById('modal-modes')?.classList.add('hidden'));

        tap('btn-play-versus', () => {
            document.getElementById('modal-modes')?.classList.add('hidden');
            g.startGame('VERSUS');
        });
        tap('btn-play-endless', () => {
            document.getElementById('modal-modes')?.classList.add('hidden');
            g.startGame('ENDLESS');
        });
        tap('btn-play-overdrive', () => {
            document.getElementById('modal-modes')?.classList.add('hidden');
            g.startGame('OVERDRIVE');
        });
        tap('btn-play-chaos', () => {
            document.getElementById('modal-modes')?.classList.add('hidden');
            g.startGame('CHAOS');
        });

        tap('btn-creator', () => document.getElementById('modal-creator').classList.remove('hidden'));
        tap('btn-close-creator', () => document.getElementById('modal-creator').classList.add('hidden'));

        tap('btn-open-levels', () => {
            this.renderLevelsModal();
            document.getElementById('modal-levels').classList.remove('hidden');
        });
        tap('btn-close-levels', () => document.getElementById('modal-levels').classList.add('hidden'));
        // دکمه‌ی UNLOCK ALL فقط بعد از دیدن کامل یک تبلیغ کار می‌کند
        tap('btn-unlock-all', async () => {
            const btn = document.getElementById('btn-unlock-all');
            if (!btn || btn.disabled) return;
            btn.disabled = true;
            await g.ads.claimUnlockAll();
            this.renderLevelsModal();
            this.refreshHomeUI();
            this.refreshUnlockAllButton();
        });

        tap('btn-open-perks', () => {
            this.renderPerksModal();
            document.getElementById('modal-perks').classList.remove('hidden');
        });
        tap('btn-close-perks', () => document.getElementById('modal-perks').classList.add('hidden'));

        tap('btn-gift-stars-perks', () => this.openStarStoreModal());
        tap('btn-gift-stars', () => this.openStarStoreModal());

        tap('btn-open-shop', () => {
            this.renderShopTab();
            document.getElementById('modal-shop').classList.remove('hidden');
        });
        tap('btn-close-shop', () => document.getElementById('modal-shop').classList.add('hidden'));

        tap('btn-open-awards', () => {
            this.renderAwardsModal();
            document.getElementById('modal-awards')?.classList.remove('hidden');
        });
        tap('btn-close-awards', () => document.getElementById('modal-awards')?.classList.add('hidden'));

        document.querySelectorAll('.shop-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                g.audio.init();
                g.audio.playTap();
                document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeShopTab = btn.dataset.tab;
                this.renderShopTab();
            });
        });

        tap('btn-settings', () => this.openSettingsModal());
        tap('btn-close-settings', () => document.getElementById('modal-settings').classList.add('hidden'));

        const syncSliders = () => {
            const bgm = Number(document.getElementById('slider-bgm').value);
            const sfx = Number(document.getElementById('slider-sfx').value);
            const smooth = Number(document.getElementById('slider-smoothness').value);
            document.getElementById('val-bgm').textContent = `${bgm}%`;
            document.getElementById('val-sfx').textContent = `${sfx}%`;
            document.getElementById('val-smoothness').textContent = `${smooth}%`;
            Object.assign(g.save.settings, { bgmVol: bgm, sfxVol: sfx, smoothness: smooth });
            g.audio.setVolumes(bgm, sfx);
            SaveStore.save(g.save);
        };

        ['slider-bgm', 'slider-sfx', 'slider-smoothness'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', syncSliders);
        });

        tap('btn-toggle-haptics', () => {
            g.save.settings.haptics = !g.save.settings.haptics;
            g.audio.haptics = g.save.settings.haptics;
            const btn = document.getElementById('btn-toggle-haptics');
            if (btn) btn.textContent = g.save.settings.haptics ? 'ON' : 'OFF';
            if (g.save.settings.haptics) g.audio.vibrate(25);
            SaveStore.save(g.save);
        });

        tap('btn-pause', () => g.togglePause());

        tap('btn-res-primary', () => {
            document.getElementById('modal-result').classList.add('hidden');
            if (g.state === 'PAUSED') {
                g.state = 'PLAYING';
                g.audio.setMusicDucking(false);
                return;
            }
            if (g.lastOutcome === 'WIN' && g.mode === 'LEVEL') {
                const nextLvl = g.currentLevelId < LEVELS.length ? g.currentLevelId + 1 : g.currentLevelId;
                g.startGame('LEVEL', nextLvl);
                return;
            }
            g.startGame(g.mode, g.currentLevelId);
        });

        tap('btn-res-levels', () => {
            document.getElementById('modal-result').classList.add('hidden');
            g.returnToMenu();
            this.renderLevelsModal();
            document.getElementById('modal-levels').classList.remove('hidden');
        });

        tap('btn-res-menu', () => {
            document.getElementById('modal-result').classList.add('hidden');
            g.returnToMenu();
        });
    }

    getAchievementProgress(a) {
        const s = this.game.save;
        if (a.stat === 'bestEndless') return s.bestEndless || 0;
        if (a.stat === 'bestOverdrive') return s.bestOverdrive || 0;
        if (a.stat === 'bestChaos') return s.bestChaos || 0;
        if (a.stat === 'completedCount') return (s.completedLevels || []).length;
        return s.stats?.[a.stat] || 0;
    }

    getCurrentQuestTierIndex(a) {
        const tiers = this.game.save.awardTiers || {};
        if (typeof tiers[a.id] === 'number') return tiers[a.id];
        return (this.game.save.claimedAwards || []).includes(a.id) ? 1 : 0;
    }

    refreshHomeUI() {
        const g = this.game;
        document.getElementById('ui-stars').textContent = g.save.stars;
        const headerStars = document.getElementById('store-header-stars');
        if (headerStars) headerStars.textContent = g.save.stars.toLocaleString();

        if (!g.currentLevelId || g.currentLevelId < 1 || g.currentLevelId > LEVELS.length) {
            g.currentLevelId = Math.min(g.save.unlockedLevel, LEVELS.length);
        }

        const displayLevelId = g.currentLevelId;
        const lvlCfg = LEVELS[displayLevelId - 1] || LEVELS[0];
        const chap = CHAPTERS.find(c => displayLevelId >= c.range[0] && displayLevelId <= c.range[1]) || CHAPTERS[0];

        document.getElementById('play-btn-label').textContent = `PLAY LEVEL ${displayLevelId}`;
        document.getElementById('home-chapter-eyebrow').textContent = chap.title.toUpperCase();
        document.getElementById('launch-chapter-name').textContent = chap.title.toUpperCase();
        document.getElementById('launch-target-stars').textContent = `GOAL: ${lvlCfg.target} ★`;

        const endEl = document.getElementById('home-best-endless');
        if (endEl) endEl.textContent = `BEST: ${g.save.bestEndless}`;

        const ovEl = document.getElementById('home-best-overdrive');
        if (ovEl) ovEl.textContent = `BEST: ${g.save.bestOverdrive || 0}`;

        const chEl = document.getElementById('home-best-chaos');
        if (chEl) chEl.textContent = `BEST: ${g.save.bestChaos || 0}`;

        const dotsWrap = document.getElementById('launch-chapter-dots');
        if (dotsWrap) {
            dotsWrap.innerHTML = '';
            for (let i = chap.range[0]; i <= chap.range[1]; i++) {
                const dot = document.createElement('div');
                const isDone = g.save.completedLevels.includes(i);
                const isCurr = i === displayLevelId;
                dot.className = `launch-dot ${isDone ? 'done' : ''} ${isCurr ? 'active' : ''}`;
                dotsWrap.appendChild(dot);
            }
        }

        const notifDot = document.getElementById('awards-notif-dot');
        if (notifDot) {
            const hasUnclaimed = ACHIEVEMENTS.some(a => {
                const tierIdx = this.getCurrentQuestTierIndex(a);
                if (tierIdx >= a.tiers.length) return false;
                return this.getAchievementProgress(a) >= a.tiers[tierIdx].goal;
            });
            notifDot.classList.toggle('hidden', !hasUnclaimed);
        }
    }

    openSettingsModal() {
        const s = this.game.save.settings;
        document.getElementById('slider-bgm').value = s.bgmVol;
        document.getElementById('slider-sfx').value = s.sfxVol;
        document.getElementById('slider-smoothness').value = s.smoothness;
        document.getElementById('val-bgm').textContent = `${s.bgmVol}%`;
        document.getElementById('val-sfx').textContent = `${s.sfxVol}%`;
        document.getElementById('val-smoothness').textContent = `${s.smoothness}%`;
        const hapBtn = document.getElementById('btn-toggle-haptics');
        if (hapBtn) hapBtn.textContent = s.haptics ? 'ON' : 'OFF';
        document.getElementById('modal-settings').classList.remove('hidden');
    }

    renderLevelsModal() {
        const g = this.game;
        this.refreshUnlockAllButton();
        const container = document.getElementById('levels-chapters-container');
        container.innerHTML = '';

        CHAPTERS.forEach(chap => {
            const block = document.createElement('div');
            block.className = 'chapter-block';
            let cleared = 0;
            for (let i = chap.range[0]; i <= chap.range[1]; i++) {
                if (g.save.completedLevels.includes(i)) cleared++;
            }
            block.innerHTML = `<div class="chapter-header"><span>${chap.title}</span><span>${cleared}/5</span></div>`;

            const grid = document.createElement('div');
            grid.className = 'levels-grid';

            for (let id = chap.range[0]; id <= chap.range[1]; id++) {
                const unlocked = id <= g.save.unlockedLevel;
                const done = g.save.completedLevels.includes(id);
                const cell = document.createElement('div');
                cell.className = `lvl-cell ${unlocked ? '' : 'locked'} ${done ? 'completed' : ''} ${id === g.currentLevelId ? 'current' : ''}`;
                cell.innerHTML = `<div class="lvl-num">${id}</div>${done ? '<div class="lvl-dot"></div>' : ''}`;
                if (unlocked) {
                    cell.onclick = () => {
                        g.audio.playTap();
                        g.currentLevelId = id;
                        document.getElementById('modal-levels').classList.add('hidden');
                        g.startGame('LEVEL', id);
                    };
                }
                grid.appendChild(cell);
            }
            block.appendChild(grid);
            container.appendChild(block);
        });
    }

    renderPerksModal(justId = null) {
        const g = this.game;
        const container = document.getElementById('perks-list-container');
        container.innerHTML = '';

        SHOP_DATA.perks.forEach(p => {
            const lvl = g.save.perks[p.id] || 0;
            const maxed = lvl >= p.max;
            const cost = p.baseCost * Math.pow(3, lvl);
            const canAfford = !maxed && g.save.stars >= cost;
            const segs = Array.from({ length: p.max }, (_, i) =>
                `<div class="perk-seg ${i < lvl ? 'filled' : ''} ${maxed ? 'max-seg' : ''}"></div>`
            ).join('');

            const card = document.createElement('div');
            card.className = `perk-card ${maxed ? 'maxed-card' : ''} ${justId === p.id ? 'level-up-anim' : ''}`;
            card.innerHTML = `
                <div class="perk-top">
                    <div class="item-info">
                        <div class="perk-title-row">
                            <h4>${p.name}</h4>
                            <span class="perk-lvl-badge ${maxed ? 'is-max' : ''}">${maxed ? 'MAXED' : `LVL ${lvl}/${p.max}`}</span>
                        </div>
                        <p>${p.desc}</p>
                        <div class="perk-stat-bonus" style="color:${maxed ? 'var(--mint)' : p.color}">${p.formatStat(lvl)}</div>
                    </div>
                    <button class="perk-upgrade-btn ${maxed ? 'maxed' : ''}" ${maxed ? 'disabled' : ''} style="${!canAfford && !maxed ? 'opacity:0.78;' : ''}">
                        ${maxed ? `<span>MAX</span><span class="up-sub">ACTIVE</span>` : `<span>${cost} ★</span><span class="up-sub">${canAfford ? 'LEVEL UP' : 'GET ★'}</span>`}
                    </button>
                </div>
                <div class="perk-segments" style="grid-template-columns:repeat(${p.max},1fr)">${segs}</div>`;

            card.querySelector('button').onclick = () => {
                if (maxed) return;
                if (g.save.stars < cost) {
                    g.audio.playTap();
                    this.openStarStoreModal();
                    return;
                }
                g.audio.playUpgrade();
                g.save.stars -= cost;
                g.save.perks[p.id] = lvl + 1;
                SaveStore.save(g.save);
                this.refreshHomeUI();
                this.renderPerksModal(p.id);
                g.showToast(`${p.name.toUpperCase()} LEVEL ${lvl + 1}!`);
            };
            container.appendChild(card);
        });
    }

    getTrailSVG(id) {
        if (id === 'dots') return `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="6" cy="21" r="2" fill="var(--accent)" opacity="0.5"/><circle cx="13" cy="15" r="2.8" fill="var(--accent)"/><circle cx="20" cy="8" r="4" fill="currentColor"/></svg>`;
        if (id === 'dual') return `<svg width="28" height="28" viewBox="0 0 28 28"><path d="M4 18 L16 6 M9 23 L21 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="8" r="4" fill="currentColor"/></svg>`;
        if (id === 'chroma') return `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="7" cy="20" r="2.5" fill="#C084FC"/><circle cx="13" cy="14" r="3" fill="#34D399"/><circle cx="20" cy="8" r="4" fill="#FF5A5F"/></svg>`;
        if (id === 'bolt') return `<svg width="28" height="28" viewBox="0 0 28 28"><polyline points="4 22 10 19 9 14 16 13 19 8" stroke="var(--gold)" stroke-width="2.2" fill="none"/><circle cx="20" cy="8" r="4" fill="currentColor"/></svg>`;
        return `<svg width="28" height="28" viewBox="0 0 28 28"><path d="M4 22 L18 8" stroke="currentColor" stroke-width="3" opacity="0.45" stroke-linecap="round"/><circle cx="20" cy="8" r="4.2" fill="currentColor"/></svg>`;
    }

    renderShopTab(justId = null) {
        const g = this.game;
        const container = document.getElementById('shop-list-container');
        container.innerHTML = '';
        const tab = this.activeShopTab;

        const keyMap = {
            shapes: ['unlockedShapes', 'shape'],
            trails: ['unlockedTrails', 'trail'],
            themes: ['unlockedThemes', 'theme'],
            fx: ['unlockedFx', 'fx']
        };
        const [uKey, aKey] = keyMap[tab] || keyMap.shapes;
        if (!g.save[uKey]) g.save[uKey] = ['classic'];

        SHOP_DATA[tab].forEach(item => {
            const owned = g.save[uKey].includes(item.id);
            const eq = g.save[aKey] === item.id;
            const canAfford = owned || g.save.stars >= item.cost;

            let icon = '';
            if (tab === 'shapes') {
                icon = `<svg class="icon-svg" viewBox="0 0 24 24">${SHAPE_SVGS[item.id] || SHAPE_SVGS.circle}</svg>`;
            } else if (tab === 'trails') {
                icon = this.getTrailSVG(item.id);
            } else if (tab === 'themes') {
                icon = `<div class="theme-swatch" style="background:${item.laser}"></div>`;
            } else {
                icon = FX_SVGS[item.id] || FX_SVGS.classic;
            }

            const row = document.createElement('div');
            row.className = `item-row ${eq ? 'equipped' : ''} ${justId === item.id ? 'level-up-anim' : ''}`;
            row.innerHTML = `
                <div class="item-left">
                    <div class="item-preview">${icon}</div>
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${item.desc}</p>
                    </div>
                </div>
                <button class="action-pill-btn ${owned ? 'secondary' : ''}" style="${!canAfford ? 'opacity:0.75;' : ''}">
                    ${eq ? 'ACTIVE' : (owned ? 'SELECT' : `${item.cost} ★`)}
                </button>`;

            row.querySelector('button').onclick = () => {
                if (owned) {
                    g.audio.playTap();
                    g.save[aKey] = item.id;
                } else if (g.save.stars >= item.cost) {
                    g.audio.playUpgrade();
                    g.save.stars -= item.cost;
                    g.save[uKey].push(item.id);
                    g.save[aKey] = item.id;
                    g.showToast(`${item.name.toUpperCase()} UNLOCKED!`);
                } else {
                    g.audio.playTap();
                    this.openStarStoreModal();
                    return;
                }
                SaveStore.save(g.save);
                g.applyThemeColors();
                this.refreshHomeUI();
                this.renderShopTab(item.id);
            };
            container.appendChild(row);
        });
    }

    renderAwardsModal(justClaimedId = null) {
        const g = this.game;
        const container = document.getElementById('awards-list-container');
        if (!container) return;
        container.innerHTML = '';

        ACHIEVEMENTS.forEach(a => {
            const totalTiers = a.tiers.length;
            const tierIdx = this.getCurrentQuestTierIndex(a);
            const allDone = tierIdx >= totalTiers;
            const activeTier = allDone ? a.tiers[totalTiers - 1] : a.tiers[tierIdx];

            const rawVal = this.getAchievementProgress(a);
            const prog = Math.min(activeTier.goal, rawVal);
            const canClaim = !allDone && rawVal >= activeTier.goal;
            const desc = a.descTemplate.replace('{goal}', activeTier.goal);

            const segs = Array.from({ length: totalTiers }, (_, i) =>
                `<div class="perk-seg ${i < tierIdx ? 'filled' : ''} ${allDone ? 'max-seg' : ''}"></div>`
            ).join('');

            const card = document.createElement('div');
            card.className = `perk-card ${allDone ? 'maxed-card' : ''} ${justClaimedId === a.id ? 'level-up-anim' : ''}`;
            card.innerHTML = `
                <div class="perk-top">
                    <div class="item-info">
                        <div class="perk-title-row">
                            <h4>${a.title}</h4>
                            <span class="perk-lvl-badge ${allDone ? 'is-max' : ''}">
                                ${allDone ? 'COMPLETED' : `STAGE ${tierIdx + 1}/${totalTiers}`}
                            </span>
                        </div>
                        <p>${desc}</p>
                        <div class="perk-stat-bonus" style="color:${allDone ? 'var(--mint)' : 'var(--gold)'}">
                            ${allDone ? `All ${totalTiers} stages cleared!` : `Progress: ${prog} / ${activeTier.goal} • Reward: +${activeTier.reward} ★`}
                        </div>
                    </div>
                    <button class="perk-upgrade-btn ${allDone ? 'maxed' : ''}" ${!canClaim ? 'disabled' : ''}>
                        ${allDone
                    ? `<span>MAX</span><span class="up-sub">DONE</span>`
                    : (canClaim
                        ? `<span>+${activeTier.reward} ★</span><span class="up-sub">CLAIM</span>`
                        : `<span>${prog}/${activeTier.goal}</span><span class="up-sub">LOCKED</span>`)
                }
                    </button>
                </div>
                <div class="perk-segments" style="grid-template-columns:repeat(${totalTiers},1fr)">${segs}</div>
            `;

            card.querySelector('button').onclick = () => {
                if (!canClaim) return;
                g.audio.playUpgrade();
                g.save.stars += activeTier.reward;
                if (!g.save.awardTiers) g.save.awardTiers = {};
                g.save.awardTiers[a.id] = tierIdx + 1;
                SaveStore.save(g.save);
                this.refreshHomeUI();
                this.renderAwardsModal(a.id);
                g.showToast(`STAGE ${tierIdx + 1} CLAIMED! +${activeTier.reward} ★`);
            };
            container.appendChild(card);
        });
    }
}