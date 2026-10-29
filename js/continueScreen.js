import { CONTINUE } from './config.js';

// صفحه‌ی «ادامه با تبلیغ» بعد از باخت (همه‌ی متن‌ها انگلیسی، ظاهر هماهنگ با مودال نتیجه‌ی بازی).
//
// فازها:  IDLE → OFFER (شمارش معکوس فعال) ⇄ AD (تبلیغ در حال نمایش؛ تایمر متوقف) → IDLE
//
// پایان (فقط یک‌بار، idempotent):
//   'continue' → تبلیغ کامل دیده شد  → onContinue()
//   'decline'  → دکمه‌ی «NO THANKS» / تمام شدن مهلت / تبلیغ در دسترس نبود → onDecline()
//
// حالت‌هایی که پوشش داده شده:
//   • تایمر هنگام نمایش تبلیغ و هنگام رفتن برنامه به پس‌زمینه متوقف می‌شود
//   • تبلیغ نیمه‌کاره بسته شد → پاداش نیست، تایمر دوباره (حداقل resumeMinSec) ادامه پیدا می‌کند
//   • خطا / تبلیغ آماده نیست → پیام کوتاه و رفتن به صفحه‌ی نتیجه (بازی قفل نمی‌شود)
//   • کلیک چندباره روی دکمه‌ها بی‌اثر است

const R = 46;
const CIRC = 2 * Math.PI * R;

export class ContinueScreen {
    constructor(game) {
        this.game = game;
        this.phase = 'IDLE';
        this.remainingMs = 0;
        this.totalMs = 1;
        this.last = 0;
        this.raf = 0;
        this.cb = null;
        this._shownSec = -1;
        this._btnState = '';
        this._build();
        document.addEventListener('visibilitychange', () => this._onVisibility());
    }

    get isOpen() { return this.phase !== 'IDLE'; }

    _build() {
        const el = document.createElement('div');
        el.id = 'modal-continue';
        el.className = 'modal-backdrop hidden interactive';
        el.innerHTML = `
            <div class="modal-sheet" style="max-width: 340px;">
                <div class="result-center">
                    <div class="result-tag">GAME OVER</div>
                    <div class="cont-ring">
                        <svg viewBox="0 0 100 100" width="120" height="120">
                            <circle class="cont-ring-track" cx="50" cy="50" r="${R}"/>
                            <circle class="cont-ring-fill" id="cont-ring-fill" cx="50" cy="50" r="${R}"
                                    stroke-dasharray="${CIRC.toFixed(2)}" stroke-dashoffset="0"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="cont-count" id="cont-count">6</div>
                    </div>
                    <h2 class="modal-title" style="font-size: 24px;">CONTINUE?</h2>
                    <button class="primary-play-btn" id="cont-watch" style="height:52px;margin:14px 0 10px;">
                        <span id="cont-watch-text">WATCH AD TO CONTINUE</span>
                    </button>
                    <button class="nav-card-btn" id="cont-skip" style="height:48px;flex-direction:row;">
                        <span>NO THANKS</span>
                    </button>
                    <div class="cont-msg" id="cont-msg"></div>
                </div>
            </div>`;
        (document.getElementById('app') || document.body).appendChild(el);

        this.el = el;
        this.$count = el.querySelector('#cont-count');
        this.$ring = el.querySelector('#cont-ring-fill');
        this.$watch = el.querySelector('#cont-watch');
        this.$watchText = el.querySelector('#cont-watch-text');
        this.$skip = el.querySelector('#cont-skip');
        this.$msg = el.querySelector('#cont-msg');

        this.$watch.addEventListener('click', () => this._watch());
        this.$skip.addEventListener('click', () => this._finish('decline'));
    }

    open({ onContinue, onDecline }) {
        if (this.phase !== 'IDLE') return;
        this.cb = { onContinue, onDecline };
        this.totalMs = CONTINUE.countdownSec * 1000;
        this.remainingMs = this.totalMs;
        this._shownSec = -1;
        this._btnState = '';
        this.$msg.textContent = '';

        this.phase = 'OFFER';
        this.el.classList.remove('hidden');
        this.el.classList.remove('cont-urgent');
        this._render(true);
        this._start();
    }

    /* ---------------- تایمر ---------------- */

    _start() {
        cancelAnimationFrame(this.raf);
        this.last = performance.now();
        const tick = (now) => {
            if (this.phase !== 'OFFER') return;
            const dt = Math.min(250, now - this.last);
            this.last = now;
            this.remainingMs -= dt;
            if (this.remainingMs <= 0) {
                this.remainingMs = 0;
                this._render();
                this._finish('decline');
                return;
            }
            this._render();
            this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
    }

    _stop() { cancelAnimationFrame(this.raf); }

    _onVisibility() {
        if (this.phase !== 'OFFER') return;          // در حین تبلیغ دست نمی‌زنیم
        if (document.hidden) this._stop();
        else this._start();
    }

    /* ---------------- نمایش ---------------- */

    _render(force = false) {
        const sec = Math.ceil(this.remainingMs / 1000);
        if (force || sec !== this._shownSec) {
            this._shownSec = sec;
            this.$count.textContent = String(sec);
            this.el.classList.toggle('cont-urgent', sec <= 2);
        }
        const p = Math.max(0, Math.min(1, this.remainingMs / this.totalMs));
        this.$ring.setAttribute('stroke-dashoffset', (CIRC * (1 - p)).toFixed(2));

        // وضعیت دکمه‌ی تبلیغ
        const ads = this.game.ads;
        let state;
        if (this.phase === 'AD') state = 'playing';
        else if (ads.isReady('continue')) state = 'ready';
        else state = 'loading';
        if (state !== this._btnState) {
            this._btnState = state;
            this.$watch.disabled = state !== 'ready';
            this.$watchText.textContent =
                state === 'ready' ? 'WATCH AD TO CONTINUE' :
                state === 'playing' ? 'AD PLAYING…' : 'LOADING AD…';
        }
    }

    /* ---------------- تبلیغ ---------------- */

    async _watch() {
        if (this.phase !== 'OFFER' || !this.game.ads.isReady('continue')) return;

        this.phase = 'AD';
        this._stop();
        this.$msg.textContent = '';
        this._render(true);

        const res = await this.game.ads.show('continue');
        if (this.phase !== 'AD') return;              // وسط کار بسته شده

        if (res.status === 'REWARDED') {
            this._finish('continue');
            return;
        }

        if (res.status === 'CLOSED') {
            // تبلیغ کامل دیده نشد → پاداش نیست؛ مهلت ادامه پیدا می‌کند تا دوباره تلاش کند
            this.phase = 'OFFER';
            this.remainingMs = Math.max(this.remainingMs, CONTINUE.resumeMinSec * 1000);
            this.$msg.textContent = 'Watch the full ad to continue';
            this._btnState = '';
            this._render(true);
            this._start();
            return;
        }

        // ERROR / NOT_READY / BUSY / UNSUPPORTED
        this.$msg.textContent = 'No ad available';
        this.phase = 'OFFER';
        this._stop();
        setTimeout(() => this._finish('decline'), 900);
    }

    /* ---------------- پایان ---------------- */

    _finish(kind) {
        if (this.phase === 'IDLE') return;
        this._stop();
        this.phase = 'IDLE';
        this.el.classList.add('hidden');
        const cb = this.cb;
        this.cb = null;
        if (!cb) return;
        if (kind === 'continue') cb.onContinue && cb.onContinue();
        else cb.onDecline && cb.onDecline();
    }
}
