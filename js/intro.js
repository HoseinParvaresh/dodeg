// صحنه‌ی ورود (انیمیشن اسم بازی): حداقل MIN_MS از شروع بارگذاری صفحه نشان داده می‌شود، یا با لمس بسته می‌شود.
const MIN_MS = 2000;

export function finishIntro() {
    const el = document.getElementById('intro');
    if (!el) return;
    let done = false;
    const hide = () => {
        if (done) return;
        done = true;
        el.classList.add('intro-out');
        setTimeout(() => el.remove(), 700);
    };
    el.addEventListener('pointerdown', hide, { once: true });
    // performance.now() از لحظه‌ی شروع بارگذاری صفحه حساب می‌شود
    setTimeout(hide, Math.max(0, MIN_MS - performance.now()));
}
