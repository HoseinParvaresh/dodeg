package com.dodge.game

import android.content.Intent

/** یک خرید ثبت‌شده در فروشگاه (بازار یا مایکت). */
data class StorePurchase(val sku: String, val token: String, val orderId: String)

interface Callback<T> {
    fun ok(value: T)
    fun fail(code: String, message: String)
}

/**
 * رابط مشترک پرداخت. دو پیاده‌سازی دارد که هرکدام فقط در flavor خودشان کامپایل می‌شوند:
 *   src/bazaar → BazaarBilling (Poolakey)
 *   src/myket  → MyketBilling  (IabHelper مایکت)
 *
 * کدهای خطایی که JS می‌شناسد: CANCELED, STORE_MISSING, NOT_LOGGED_IN, ALREADY_OWNED, ERROR
 * همه‌ی متدها روی main thread صدا زده می‌شوند.
 */
interface BillingProvider {
    val storeName: String
    fun connect(cb: Callback<Unit>)
    fun purchase(sku: String, payload: String, cb: Callback<StorePurchase>)
    fun queryPurchases(cb: Callback<List<StorePurchase>>)
    fun consume(token: String, cb: Callback<Unit>)
    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean = false
    fun dispose()
}
