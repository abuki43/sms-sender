package expo.modules.simsms

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo module that sends single/multipart SMS messages through the phone's own
 * SIM card(s). Provides:
 *  - [getSimCards] enumerating active SIM slots (dual SIM aware)
 *  - [sendSms] / [sendMultipartSms] for sending to one recipient
 *  - [onSmsStatus] events reporting per-recipient delivery status
 */
class ExpoSimSmsModule : Module() {

    private val smsService: SmsService by lazy { SmsService(appContext.reactContext ?: context()) }

    override fun definition() = ModuleDefinition {
        Name("ExpoSimSms")

        Events("onSmsStatus")

        AsyncFunction("getSimCards") {
            try {
                SimCardHelper.getSimCards(context()).map { it.toMap() }
            } catch (e: SecurityException) {
                emptyList<Map<String, Any?>>()
            } catch (e: Exception) {
                emptyList<Map<String, Any?>>()
            }
        }

        AsyncFunction("sendSms") { phone: String, message: String, subscriptionId: Int, promise: Promise ->
            sendInternal(phone, message, subscriptionId, includePartCount = false, promise = promise)
        }

        AsyncFunction("sendMultipartSms") { phone: String, message: String, subscriptionId: Int, promise: Promise ->
            sendInternal(phone, message, subscriptionId, includePartCount = true, promise = promise)
        }

        OnDestroy {
            // Receivers are cleaned up per-send; nothing further is required.
        }
    }

    private fun context(): android.content.Context {
        return appContext.reactContext ?: throw IllegalStateException("React context unavailable")
    }

    private fun sendInternal(
        phone: String,
        message: String,
        subscriptionId: Int,
        includePartCount: Boolean,
        promise: Promise
    ) {
        if (phone.isBlank() || message.isBlank()) {
            promise.resolve(
                mapOf(
                    "phone" to phone,
                    "status" to "failed",
                    "errorCode" to "INVALID_ARGUMENTS"
                )
            )
            return
        }

        val resolvedSubId =
            SimCardHelper.resolveSubscriptionId(context(), -1, if (subscriptionId < 0) null else subscriptionId)

        smsService.send(phone, message, resolvedSubId) { result ->
            val status = result["status"] as? String ?: "unknown"

            // Emit a live event regardless of outcome so JS can track progress.
            sendEvent(
                "onSmsStatus",
                mapOf(
                    "phone" to phone,
                    "status" to status,
                    "errorCode" to (result["errorCode"] as? String),
                    "partCount" to (result["partCount"] as? Int)
                )
            )

            val payload = if (includePartCount) {
                mapOf(
                    "phone" to phone,
                    "status" to status,
                    "errorCode" to (result["errorCode"] as? String),
                    "partCount" to (result["partCount"] as? Int ?: 1)
                )
            } else {
                mapOf(
                    "phone" to phone,
                    "status" to status,
                    "errorCode" to (result["errorCode"] as? String)
                )
            }

            promise.resolve(payload)
        }
    }
}
