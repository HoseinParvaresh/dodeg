export class SaveStore {
    static KEY = 'dodge_v5_modular_save';

    static load() {
        const defaults = {
            stars: 0,
            unlockedLevel: 1,
            completedLevels: [],
            bestEndless: 0,
            bestOverdrive: 0,
            bestChaos: 0,
            shape: 'circle',
            unlockedShapes: ['circle'],
            trail: 'fade',
            unlockedTrails: ['fade'],
            theme: 'coral',
            unlockedThemes: ['coral'],
            fx: 'classic',
            unlockedFx: ['classic'],
            starterPackBought: false,
            vipDoubler: false,
            purchaseHistory: [],
            adShopRewardClaimed: false,
            perks: { shield: 0, magnet: 0, slow: 0, greed: 0, secondwind: 0, closecall: 0 },
            stats: {
                noHitWins: 0,
                closeCalls: 0,
                fastWins: 0,
                totalPickups: 0,
                dashesUsed: 0,
                powerupsPicked: 0
            },
            awardTiers: {},
            claimedAwards: [],
            settings: { bgmVol: 65, sfxVol: 100, smoothness: 100, haptics: true }
        };
        try {
            const raw = localStorage.getItem(this.KEY) || localStorage.getItem('dodge_v4_save');
            if (!raw) return defaults;
            const parsed = JSON.parse(raw);
            return {
                ...defaults,
                ...parsed,
                unlockedFx: parsed.unlockedFx || ['classic'],
                fx: parsed.fx || 'classic',
                perks: { ...defaults.perks, ...(parsed.perks || {}) },
                stats: { ...defaults.stats, ...(parsed.stats || {}) },
                awardTiers: { ...defaults.awardTiers, ...(parsed.awardTiers || {}) },
                settings: { ...defaults.settings, ...(parsed.settings || {}) }
            };
        } catch {
            return defaults;
        }
    }

    static save(data) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } catch { }
    }
}