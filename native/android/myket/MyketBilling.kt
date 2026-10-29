package com.dodge.game

import android.content.Intent
import com.getcapacitor.Plugin
// کلاس‌های کمکی مایکت (پوشه‌ی util از TrivialDrive مایکت) باید در این پکیج باشند: SETUP.md مرحله‌ی ۷
import com.dodge.game.util.IabHelper
import com.dodge.game.util.IabResult
import com.dodge.game.util.Inventory
import com.dodge.game.util.Purchase

/** flavor «myket» — پرداخت با IabHelper مایکت (مستند: myket.ir/kb → Implementing Myket In-App Purchase) */
fun createBillingProvider(plugin: Plugin): BillingProvider = MyketBilling(plugin)

class MyketBilling(private val plugin: Plugin) : BillingProvider {

    override val storeName = "myket"

    private var helper: IabHelper? = null
    private var ready = false
    private var connecting = false
    private val waiting = mutableListOf<Callback<Unit>>()
    private val known = HashMap<String, Purchase>()   // توکن → خرید (برای consume)

    // IabHelper فقط یک عملیات async هم‌زمان را قبول می‌کند؛ پس همه‌چیز در یک صف اجرا می‌شود
    private val ops = ArrayDeque<(finish: () -> Unit) -> Unit>()
    private var running = false

    private fun enqueue(op: (finish: () -> Unit) -> Unit) {
        ops.addLast(op)
        pump()
    }

    private fun pump() {
        if (running) return
        val op = ops.removeFirstOrNull() ?: return
        running = true
        op {
            running = false
            pump()
        }
    }

    override fun connect(cb: Callback<Unit>) {
        if (ready) { cb.ok(Unit); return }
        waiting.add(cb)
        if (connecting) return
        connecting = true
        val h = helper ?: IabHelper(plugin.context, BuildConfig.STORE_RSA_KEY).also {
            it.enableDebugLogging(BuildConfig.DEBUG)
            helper = it
        }
        try {
            h.startSetup(IabHelper.OnIabSetupFinishedListener { result: IabResult ->
                connecting = false
                val copy = waiting.toList()
                waiting.clear()
                if (result.isSuccess) {
                    ready = true
                    copy.forEach { it.ok(Unit) }
                } else {
                    copy.forEach { it.fail("STORE_MISSING", result.message ?: "Myket setup failed") }
                }
            })
        } catch (e: Exception) {
            connecting = false
            val copy = waiting.toList()
            waiting.clear()
            copy.forEach { it.fail("ERROR", e.message ?: "Myket setup failed") }
        }
    }

    private fun <T> withConnection(cb: Callback<T>, work: (IabHelper) -> Unit) {
        connect(object : Callback<Unit> {
            override fun ok(value: Unit) {
                val h = helper
                if (h == null) cb.fail("ERROR", "helper disposed") else work(h)
            }

            override fun fail(code: String, message: String) = cb.fail(code, message)
        })
    }

    override fun purchase(sku: String, payload: String, cb: Callback<StorePurchase>) {
        val act = plugin.activity ?: return cb.fail("ERROR", "no activity")
        withConnection(cb) { h ->
            enqueue { finish ->
                try {
                    h.launchPurchaseFlow(
                        act, sku, MyketRequestCode.PURCHASE,
                        IabHelper.OnIabPurchaseFinishedListener { result: IabResult, purchase: Purchase? ->
                            finish()
                            if (result.isSuccess && purchase != null) {
                                known[purchase.token] = purchase
                                cb.ok(StorePurchase(purchase.sku, purchase.token, purchase.orderId ?: ""))
                            } else {
                                cb.fail(mapResult(result), result.message ?: "purchase failed")
                            }
                        },
                        payload
                    )
                } catch (e: Exception) {
                    finish()
                    cb.fail("ERROR", e.message ?: "could not start purchase")
                }
            }
        }
    }

    override fun queryPurchases(cb: Callback<List<StorePurchase>>) {
        withConnection(cb) { h ->
            enqueue { finish ->
                try {
                    // querySkuDetails=false چون قیمت‌ها از shop.js می‌آید
                    h.queryInventoryAsync(false, null, null,
                        IabHelper.QueryInventoryFinishedListener { result: IabResult, inventory: Inventory? ->
                            finish()
                            if (result.isFailure || inventory == null) {
                                cb.fail("ERROR", result.message ?: "query failed")
                            } else {
                                val all = inventory.allPurchases
                                all.forEach { known[it.token] = it }
                                cb.ok(all.map { StorePurchase(it.sku, it.token, it.orderId ?: "") })
                            }
                        })
                } catch (e: Exception) {
                    finish()
                    cb.fail("ERROR", e.message ?: "query failed")
                }
            }
        }
    }

    override fun consume(token: String, cb: Callback<Unit>) {
        val cached = known[token]
        if (cached != null) { consumeKnown(cached, cb); return }
        // خرید را نمی‌شناسیم (مثلاً بعد از ری‌استارت) → اول لیست را می‌گیریم
        queryPurchases(object : Callback<List<StorePurchase>> {
            override fun ok(value: List<StorePurchase>) {
                val p = this@MyketBilling.known[token]
                if (p == null) cb.fail("ERROR", "purchase not found") else consumeKnown(p, cb)
            }

            override fun fail(code: String, message: String) = cb.fail(code, message)
        })
    }

    private fun consumeKnown(purchase: Purchase, cb: Callback<Unit>) {
        withConnection(cb) { h ->
            enqueue { finish ->
                try {
                    h.consumeAsync(purchase, IabHelper.OnConsumeFinishedListener { p: Purchase?, result: IabResult ->
                        finish()
                        if (result.isSuccess) {
                            known.remove(purchase.token)
                            cb.ok(Unit)
                        } else {
                            cb.fail("ERROR", result.message ?: "consume failed")
                        }
                    })
                } catch (e: Exception) {
                    finish()
                    cb.fail("ERROR", e.message ?: "consume failed")
                }
            }
        }
    }

    override fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean =
        helper?.handleActivityResult(requestCode, resultCode, data) ?: false

    override fun dispose() {
        try { helper?.disposeWhenFinished() } catch (_: Exception) { }
        helper = null
        ready = false
        connecting = false
    }

    // کدهای پاسخ استاندارد IabHelper: 1 و -1005 = لغو کاربر، 7 = قبلاً خریداری شده
    private fun mapResult(r: IabResult): String = when (r.response) {
        1, -1005 -> "CANCELED"
        7 -> "ALREADY_OWNED"
        3 -> "STORE_MISSING"
        else -> "ERROR"
    }
}
