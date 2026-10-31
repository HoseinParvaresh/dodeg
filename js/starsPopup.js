import { STAR_AD } from './config.js';

// پاپ‌آپ «ستاره‌ی رایگان»: هر وقت بازیکن روی چیزی بزند که ستاره‌اش را ندارد (یا دکمه‌ی + ستاره)،
// می‌تواند با دیدن کامل یک تبلیغ STAR_AD.stars ستاره بگیرد. بدون محدودیت تعداد (هر بار یک تبلیغ).
//
// حالت‌ها:  IDLE → OFFER ⇄ AD → (پاداش) IDLE
//   • تبلیغ کامل دیده شد → ستاره اضافه می‌شود (در ads.claimStars) و پاپ‌آپ بسته می‌شود
//   • تبلیغ نیمه‌کاره بسته شد → پاداش نیست، پیام نشان داده می‌شود و پاپ‌آپ باز می‌ماند
//   • خطا / تبلیغ آماده نیست → پیام کوتاه؛ دکمه تا آماده شدن تبلیغ بعدی غیرفعال است
//   • کلیک چندباره بی‌اثر است؛ دکمه‌ی NO THANKS هر وقت (جز حین تبلیغ) بسته می‌کند

export class StarsPopup {
    constructor(game) {
        this.game = game;
        this.phase = 'IDLE';
        this._btnState = '';
        this._build();
        game.ads.subscribe(() => { if (this.phase !== 'IDLE') this._render(); });
    }

    get isOpen() { return this.phase !== 'IDLE'; }

    _build() {
        const el = document.createElement('div');
        el.id = 'modal-stars';
        el.className = 'modal-backdrop hidden interactive';
        el.style.zIndex = '60';
        el.innerHTML = `
            <div class="modal-sheet" style="max-width: 340px;">
                <div class="result-center">
                    <div class="result-tag" id="stars-tag">NOT ENOUGH STARS</div>
                    <div class="stars-big"><span>+${STAR_AD.stars}</span><svg viewBox="0 0 24 24" width="34" height="34"><polygon points="12 2 15.1 8.6 22 9.6 17 14.5 18.2 21.5 12 18.2 5.8 21.5 7 14.5 2 9.6 8.9 8.6" fill="currentColor"/></svg></div>
                    <button class="primary-play-btn" id="stars-watch" style="height:52px;margin:6px 0 10px;">
                        <span id="stars-watch-text">WATCH AD</span>
                    </button>
                    <button class="nav-card-btn" id="stars-close" style="height:48px;flex-direction:row;">
                        <span>NO THANKS</span>
                    </button>
                    <div class="cont-msg" id="stars-msg"></div>
                </div>
            </div>`;
        (document.getElementById('app') || document.body).appendChild(el);

        this.el = el;
        this.$tag = el.querySelector('#stars-tag');
        this.$watch = el.querySelector('#stars-watch');
        this.$watchText = el.querySelector('#stars-watch-text');
        this.$close = el.querySelector('#stars-close');
        this.$msg = el.querySelector('#stars-msg');

        this.$watch.addEventListener('click', () => this._watch());
        this.$close.addEventListener('click', () => this.close());
        // کلیک روی پس‌زمینه‌ی تیره هم می‌بندد
        el.addEventListener('click', (e) => { if (e.target === el) this.close(); });
    }

    open({ notEnough = true } = {}) {
        if (this.phase !== 'IDLE') return;
        this.phase = 'OFFER';
        this._btnState = '';
        this.$msg.textContent = '';
        this.$tag.textContent = notEnough ? 'NOT ENOUGH STARS' : 'FREE STARS';
        this.el.classList.remove('hidden');
        this.game.ads.prepare('stars');
        this._render();
    }

    close() {
        if (this.phase !== 'OFFER') return;   // حین نمایش تبلیغ بسته نمی‌شود
        this.phase = 'IDLE';
        this.el.classList.add('hidden');
    }

    _render() {
        const ads = this.game.ads;
        const st = this.phase === 'AD' ? 'playing' : ads.statusOf('stars');   // ready | loading | failed | playing
        const key = st + '|' + ads.lastError;
        if (key === this._btnState) return;
        this._btnState = key;
        this.$watch.disabled = st === 'loading' || st === 'playing';
        this.$watchText.textContent =
            st === 'ready' ? 'WATCH AD' :
            st === 'playing' ? 'AD PLAYING…' :
            st === 'loading' ? 'LOADING AD…' : 'TAP TO RETRY';
        // اگر دریافت تبلیغ شکست خورده، دلیلش (کد خطا) نشان داده می‌شود تا بشود عیب‌یابی کرد
        if (st === 'failed') this.$msg.textContent = 'No ad available' + (ads.lastError ? ` (${ads.lastError})` : '');
        else if (st === 'loading' || st === 'ready') this.$msg.textContent = '';
    }

    async _watch() {
        if (this.phase !== 'OFFER') return;
        const ads = this.game.ads;
        const st = ads.statusOf('stars');
        if (st === 'loading') return;
        if (st === 'failed') {            // تلاش دوباره
            this._btnState = '';
            ads.retry('stars');
            this._render();
            return;
        }

        this.phase = 'AD';
        this.$msg.textContent = '';
        this._render();

        const res = await ads.claimStars();

        this.phase = 'OFFER';
        this._btnState = '';

        if (res.status === 'REWARDED') {
            this._afterReward();
            this.close();
            return;
        }
        this._render();
        if (res.status === 'CLOSED') this.$msg.textContent = 'Watch the full ad to get stars';
    }

    // بعد از گرفتن ستاره، صفحه‌های بازِ فروشگاه/ارتقا دوباره رسم می‌شوند تا دکمه‌ها فعال شوند
    _afterReward() {
        const ui = this.game.ui;
        const open = (id) => { const m = document.getElementById(id); return m && !m.classList.contains('hidden'); };
        if (open('modal-perks')) ui.renderPerksModal();
        if (open('modal-shop')) ui.renderShopTab();
    }
}
