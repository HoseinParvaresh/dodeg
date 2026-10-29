package com.dodge.game

import android.content.Intent
import android.os.Handler
import android.os.Looper
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import ir.tapsell.mediation.Tapsell
import ir.tapsell.mediation.ad.AdStateListener
import ir.tapsell.mediation.ad.request.RequestResultListener
import ir.tapsell.mediation.ad.show.AdShowCompletionState
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

/**
 * پلاگین Capacitor با نام DodgeStore — قرارداد کامل در native/BRIDGE.md
 *
 *  • پرداخت: از طریق BillingProvider (بازار یا مایکت بسته به flavor)
 *  • تبلیغ پاداشی: Tapsell (مستند: developer.tapsell.ir/fa/docs/sdk/platforms/android)
 */
@CapacitorPlugin(name = "DodgeStore", requestCodes = [MyketRequestCode.PURCHASE])
class DodgeStorePlugin : Plugin() {

    private var billing: BillingProvider? = null
    private val ui = Handler(Looper.getMainLooper())

    override fun load() {
        billing = createBillingProvider(this)
    }

    override fun handleOnDestroy() {
        billing?.dispose()
        billing = null
    }

    // مایکت نتیجه‌ی صفحه‌ی پرداخت را از این مسیر می‌گیرد (requestCodes در annotation بالا)
    @Deprecated("Capacitor legacy activity result hook")
    override fun handleOnActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.handleOnActivityResult(requestCode, resultCode, data)
        billing?.handleActivityResult(requestCode, resultCode, data)
    }

    private fun onMain(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) block() else ui.post(block)
    }

    /* ============================ پرداخت ============================ */

    private fun <T> bridgeCallback(call: PluginCall, toJs: (T) -> JSObject): Callback<T> =
        object : Callback<T> {
            override fun ok(value: T) = call.resolve(toJs(value))
            override fun fail(code: String, message: String) = call.reject(message, code)
        }

    @PluginMethod
    fun billingConnect(call: PluginCall) {
        val b = billing ?: return call.reject("billing unavailable", "ERROR")
        onMain {
            b.connect(bridgeCallback<Unit>(call) {
                JSObject().apply { put("ok", true); put("store", b.storeName) }
            })
        }
    }

    // قیمت‌ها از js/shop.js خوانده می‌شود؛ اگر خواستید می‌توانید اینجا قیمت فروشگاه را برگردانید.
    @PluginMethod
    fun billingSkuDetails(call: PluginCall) {
        call.resolve(JSObject().apply { put("items", JSArray()) })
    }

    @PluginMethod
    fun billingPurchase(call: PluginCall) {
        val b = billing ?: return call.reject("billing unavailable", "ERROR")
        val sku = call.getString("sku") ?: return call.reject("sku required", "ERROR")
        onMain {
            b.purchase(sku, UUID.randomUUID().toString(), bridgeCallback<StorePurchase>(call) { p ->
                JSObject().apply {
                    put("sku", p.sku)
                    put("purchaseToken", p.token)
                    put("orderId", p.orderId)
                }
            })
        }
    }

    @PluginMethod
    fun billingQueryPurchases(call: PluginCall) {
        val b = billing ?: return call.reject("billing unavailable", "ERROR")
        onMain {
            b.queryPurchases(bridgeCallback<List<StorePurchase>>(call) { list ->
                val arr = JSArray()
                list.forEach { p ->
                    arr.put(JSObject().apply {
                        put("sku", p.sku)
                        put("purchaseToken", p.token)
                        put("orderId", p.orderId)
                    })
                }
                JSObject().apply { put("purchases", arr) }
            })
        }
    }

    @PluginMethod
    fun billingConsume(call: PluginCall) {
        val b = billing ?: return call.reject("billing unavailable", "ERROR")
        val token = call.getString("purchaseToken") ?: return call.reject("purchaseToken required", "ERROR")
        onMain { b.consume(token, bridgeCallback<Unit>(call) { JSObject() }) }
    }

    /* ============================ تبلیغ (تپسل) ============================ */

    // تپسل خودش هنگام شروع برنامه با ContentProvider فعال می‌شود (مستند Quick Start)؛
    // اگر درخواست زودتر از آماده شدن برسد، سمت JS با فاصله دوباره تلاش می‌کند.
    @PluginMethod
    fun adsInit(call: PluginCall) {
        call.resolve()
    }

    @PluginMethod
    fun adsRequest(call: PluginCall) {
        val zoneId = call.getString("zoneId") ?: return call.reject("zoneId required", "ERROR")
        val act = activity ?: return call.reject("no activity", "ERROR")
        act.runOnUiThread {
            try {
                Tapsell.requestRewardedAd(zoneId, act, object : RequestResultListener {
                    override fun onSuccess(adId: String) {
                        call.resolve(JSObject().apply { put("adId", adId) })
                    }

                    override fun onFailure(message: String) {
                        call.reject(message, "NO_FILL")
                    }
                })
            } catch (e: Exception) {
                call.reject(e.message ?: "request failed", "ERROR")
            }
        }
    }

    /**
     * وقتی تبلیغ کاملاً بسته شد resolve می‌شود: { rewarded, closedByUser }
     * rewarded فقط وقتی true است که callback پاداش تپسل (onRewarded) صدا زده شده باشد.
     */
    @PluginMethod
    fun adsShow(call: PluginCall) {
        val adId = call.getString("adId") ?: return call.reject("adId required", "ERROR")
        val act = activity ?: return call.reject("no activity", "SHOW_FAILED")

        val settled = AtomicBoolean(false)
        var rewarded = false
        var skipped = false
        var impressed = false

        val startWatchdog = Runnable {
            if (!impressed && settled.compareAndSet(false, true)) {
                call.reject("ad did not start in time", "SHOW_FAILED")
            }
        }

        fun settleClosed() {
            if (settled.compareAndSet(false, true)) {
                ui.removeCallbacks(startWatchdog)
                call.resolve(JSObject().apply {
                    put("rewarded", rewarded)
                    put("closedByUser", skipped)
                })
            }
        }

        ui.postDelayed(startWatchdog, SHOW_START_TIMEOUT_MS)

        act.runOnUiThread {
            try {
                Tapsell.showRewardedAd(adId, act, object : AdStateListener.Rewarded {
                    override fun onAdImpression() {
                        impressed = true
                        ui.removeCallbacks(startWatchdog)
                        notifyListeners("adOpened", JSObject().apply { put("adId", adId) })
                    }

                    override fun onAdClicked() {}

                    override fun onRewarded() {
                        rewarded = true
                    }

                    override fun onAdClosed(completionState: AdShowCompletionState) {
                        skipped = completionState == AdShowCompletionState.SKIPPED
                        // اگر onRewarded چند لحظه بعد از onAdClosed برسد هم از دست نمی‌رود
                        ui.postDelayed({ settleClosed() }, REWARD_GRACE_MS)
                    }

                    override fun onAdFailed(message: String) {
                        if (settled.compareAndSet(false, true)) {
                            ui.removeCallbacks(startWatchdog)
                            call.reject(message, "SHOW_FAILED")
                        }
                    }
                })
            } catch (e: Exception) {
                if (settled.compareAndSet(false, true)) {
                    ui.removeCallbacks(startWatchdog)
                    call.reject(e.message ?: "show failed", "SHOW_FAILED")
                }
            }
        }
    }

    companion object {
        private const val SHOW_START_TIMEOUT_MS = 25_000L
        private const val REWARD_GRACE_MS = 700L
    }
}

/** کد requestCode ای که مایکت برای صفحه‌ی پرداخت استفاده می‌کند (باید در annotation بالا هم باشد). */
object MyketRequestCode {
    const val PURCHASE = 7001
}
