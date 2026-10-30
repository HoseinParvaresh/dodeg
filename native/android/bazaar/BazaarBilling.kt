package com.dodge.game

import androidx.activity.ComponentActivity
import com.getcapacitor.Plugin
import ir.cafebazaar.poolakey.Connection
import ir.cafebazaar.poolakey.Payment
import ir.cafebazaar.poolakey.config.PaymentConfiguration
import ir.cafebazaar.poolakey.config.SecurityCheck
import ir.cafebazaar.poolakey.request.PurchaseRequest

/** flavor «bazaar» — پرداخت با Poolakey (مستند: github.com/cafebazaar/Poolakey/wiki) */
fun createBillingProvider(plugin: Plugin): BillingProvider = BazaarBilling(plugin)

class BazaarBilling(private val plugin: Plugin) : BillingProvider {

    override val storeName = "bazaar"

    private var payment: Payment? = null
    private var connection: Connection? = null
    private var connected = false
    private var connecting = false
    private val waiting = mutableListOf<Callback<Unit>>()

    private fun payment(): Payment {
        payment?.let { return it }
        val config = PaymentConfiguration(
            localSecurityCheck = SecurityCheck.Enable(rsaPublicKey = BuildConfig.STORE_RSA_KEY)
        )
        return Payment(context = plugin.context, config = config).also { payment = it }
    }

    override fun connect(cb: Callback<Unit>) {
        if (connected) { cb.ok(Unit); return }
        waiting.add(cb)
        if (connecting) return
        connecting = true
        connection = payment().connect {
            connectionSucceed {
                connected = true
                connecting = false
                drain { it.ok(Unit) }
            }
            connectionFailed { t ->
                connected = false
                connecting = false
                drain { it.fail("STORE_MISSING", t.message ?: "Bazaar connection failed") }
            }
            disconnected {
                connected = false
                connecting = false
            }
        }
    }

    private fun drain(action: (Callback<Unit>) -> Unit) {
        val copy = waiting.toList()
        waiting.clear()
        copy.forEach(action)
    }

    /** اول مطمئن می‌شویم به بازار وصل هستیم، بعد کار اصلی را انجام می‌دهیم. */
    private fun <T> withConnection(cb: Callback<T>, work: (Payment) -> Unit) {
        connect(object : Callback<Unit> {
            override fun ok(value: Unit) = work(payment())
            override fun fail(code: String, message: String) = cb.fail(code, message)
        })
    }

    override fun purchase(sku: String, payload: String, cb: Callback<StorePurchase>) {
        val act = plugin.activity as? ComponentActivity
            ?: return cb.fail("ERROR", "activity is not a ComponentActivity")
        withConnection(cb) { p ->
            p.purchaseProduct(
                registry = act.activityResultRegistry,
                   request = PurchaseRequest(productId = sku, payload = payload)
            ) {
                purchaseFlowBegan { }
                failedToBeginFlow { t -> cb.fail(mapError(t), t.message ?: "failed to open Bazaar") }
                purchaseSucceed { e -> cb.ok(StorePurchase(e.productId, e.purchaseToken, e.orderId)) }
                purchaseCanceled { cb.fail("CANCELED", "canceled by user") }
                purchaseFailed { t -> cb.fail(mapError(t), t.message ?: "purchase failed") }
            }
        }
    }

    override fun queryPurchases(cb: Callback<List<StorePurchase>>) {
        withConnection(cb) { p ->
            p.getPurchasedProducts {
                querySucceed { list ->
                    cb.ok(list.map { StorePurchase(it.productId, it.purchaseToken, it.orderId) })
                }
                queryFailed { t -> cb.fail(mapError(t), t.message ?: "query failed") }
            }
        }
    }

    override fun consume(token: String, cb: Callback<Unit>) {
        withConnection(cb) { p ->
            p.consumeProduct(purchaseToken = token) {
                consumeSucceed { cb.ok(Unit) }
                consumeFailed { t -> cb.fail(mapError(t), t.message ?: "consume failed") }
            }
        }
    }

    override fun dispose() {
        try { connection?.disconnect() } catch (_: Exception) { }
        connection = null
        connected = false
        connecting = false
    }

    // نگاشت تقریبی خطاهای Poolakey به کدهای JS (بر اساس نام کلاس/پیام خطا)
    private fun mapError(t: Throwable): String {
        val name = t.javaClass.simpleName
        val msg = t.message ?: ""
        return when {
            name.contains("NotFound", true) || name.contains("Disconnect", true) -> "STORE_MISSING"
            name.contains("Login", true) || msg.contains("login", true) -> "NOT_LOGGED_IN"
            name.contains("AlreadyOwned", true) || msg.contains("already", true) -> "ALREADY_OWNED"
            else -> "ERROR"
        }
    }
}
