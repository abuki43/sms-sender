package expo.modules.simsms

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telephony.SmsManager
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * Thin wrapper around Android's [SmsManager] that:
 *  - resolves the correct manager for a SIM subscription (dual SIM aware)
 *  - auto-splits long messages via [SmsManager.divideMessage]
 *  - reports per-message status through [SmsService.ResultHandler]
 *  - enforces a timeout in case no status is delivered
 */
class SmsService(private val context: Context) {

    companion object {
        private const val ACTION_SMS_SENT = "expo.modules.simsms.ACTION_SMS_SENT"
        private const val ACTION_SMS_DELIVERED = "expo.modules.simsms.ACTION_SMS_DELIVERED"
        private const val SEND_TIMEOUT_MS = 30_000L

        private val requestCounter = AtomicInteger(0)
        private val handler = Handler(Looper.getMainLooper())
    }

    /**
     * Callback type receiving the send result once resolved.
     * The map payload is JSON-serializable for the Expo Modules API.
     */
    fun interface ResultHandler {
        fun onResult(result: Map<String, Any?>)
    }

    /**
     * Sends an SMS message (optionally multipart) via the SIM identified by
     * [simSubscriptionId] (nullable = device default). Results are delivered
     * asynchronously via [onResult].
     */
    fun send(
        phone: String,
        message: String,
        simSubscriptionId: Int?,
        onResult: ResultHandler
    ) {
        val smsManager = resolveSmsManager(simSubscriptionId)
        if (smsManager == null) {
            onResult.onResult(mapOf("phone" to phone, "status" to "failed", "errorCode" to "NO_SIM"))
            return
        }

        val requestIdBase = requestCounter.getAndAdd(1000)
        val parts: ArrayList<String> = smsManager.divideMessage(message)
        val isMultipart = parts.size > 1

        val sentIntents = ArrayList<PendingIntent>(parts.size)
        val deliveredIntents = ArrayList<PendingIntent>(parts.size)

        val finished = AtomicBoolean(false)

        fun cleanup() {
            runCatching { context.unregisterReceiver(sentReceiver) }
            runCatching { context.unregisterReceiver(deliveredReceiver) }
            handler.removeCallbacksAndMessages(requestIdBase)
        }

        fun finish(result: Map<String, Any?>) {
            if (finished.compareAndSet(false, true)) {
                cleanup()
                onResult.onResult(result)
            }
        }

        fun statusResult(status: String, code: String?): Map<String, Any?> = mapOf(
            "phone" to phone,
            "status" to status,
            "errorCode" to code,
            "partCount" to parts.size,
            "multipart" to isMultipart
        )

        val sentReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action != ACTION_SMS_SENT) return
                when (resultCode) {
                    Activity.RESULT_OK -> finish(statusResult("sent", null))
                    SmsManager.RESULT_ERROR_GENERIC_FAILURE ->
                        finish(statusResult("failed", "GENERIC_FAILURE"))
                    SmsManager.RESULT_ERROR_NO_SERVICE ->
                        finish(statusResult("failed", "NO_SERVICE"))
                    SmsManager.RESULT_ERROR_NULL_PDU ->
                        finish(statusResult("failed", "NULL_PDU"))
                    SmsManager.RESULT_ERROR_RADIO_OFF ->
                        finish(statusResult("failed", "RADIO_OFF"))
                    else -> finish(statusResult("failed", "UNKNOWN_$resultCode"))
                }
            }
        }

        val deliveredReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action != ACTION_SMS_DELIVERED) return
                val status = if (resultCode == Activity.RESULT_OK) "delivered" else "failed"
                finish(
                    mapOf(
                        "phone" to phone,
                        "status" to status,
                        "deliveryResultCode" to resultCode
                    )
                )
            }
        }

        registerReceiverCompat(sentReceiver, IntentFilter(ACTION_SMS_SENT))
        registerReceiverCompat(deliveredReceiver, IntentFilter(ACTION_SMS_DELIVERED))

        for (index in parts.indices) {
            val requestCode = requestIdBase + index

            sentIntents.add(
                PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    Intent(ACTION_SMS_SENT),
                    PendingIntent.FLAG_IMMUTABLE
                )
            )
            deliveredIntents.add(
                PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    Intent(ACTION_SMS_DELIVERED),
                    PendingIntent.FLAG_MUTABLE
                )
            )
        }

        // Timeout guard in case no sent/delivered result arrives.
        handler.postAtTime(
            {
                finish(mapOf("phone" to phone, "status" to "failed", "errorCode" to "TIMEOUT"))
            },
            requestIdBase,
            android.os.SystemClock.uptimeMillis() + SEND_TIMEOUT_MS
        )

        try {
            if (isMultipart) {
                smsManager.sendMultipartTextMessage(
                    phone, null, parts, sentIntents, deliveredIntents
                )
            } else {
                smsManager.sendTextMessage(
                    phone, null, message, sentIntents[0], deliveredIntents[0]
                )
            }
        } catch (e: Exception) {
            finish(
                mapOf(
                    "phone" to phone,
                    "status" to "failed",
                    "errorCode" to "EXCEPTION",
                    "message" to (e.message ?: e.javaClass.simpleName)
                )
            )
        }
    }

    private fun resolveSmsManager(simSubscriptionId: Int?): SmsManager? {
        return if (simSubscriptionId != null && simSubscriptionId >= 0) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
                    .createForSubscriptionId(simSubscriptionId)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getSmsManagerForSubscriptionId(simSubscriptionId)
            }
        } else {
            try {
                SmsManager.getDefault()
            } catch (e: Exception) {
                null
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun registerReceiverCompat(
        receiver: BroadcastReceiver,
        filter: IntentFilter
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, filter)
        }
    }
}
