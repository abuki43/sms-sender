package expo.modules.simsms

import android.content.Context
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager

/**
 * Represents a single SIM slot available on the device.
 */
data class SimCard(
    val id: Int,
    val displayName: String,
    val slotIndex: Int,
    val carrierName: String?,
    val subscriptionId: Int
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "displayName" to displayName,
        "slotIndex" to slotIndex,
        "carrierName" to carrierName,
        "subscriptionId" to subscriptionId
    )
}

/**
 * Helper that enumerates the device's active SIM cards (dual SIM aware) using
 * [SubscriptionManager].
 */
object SimCardHelper {

    /**
     * Returns the list of active SIM cards. Uses [SubscriptionManager.activeSubscriptionInfoList]
     * which requires READ_PHONE_STATE permission (or similar). Callers must guard
     * against [SecurityException] when the permission is missing.
     */
    fun getSimCards(context: Context): List<SimCard> {
        val subscriptionManager =
            context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
                ?: return emptyList()

        val subscriptions: List<SubscriptionInfo>? =
            subscriptionManager.activeSubscriptionInfoList

        return subscriptions?.mapIndexedNotNull { index, info ->
            val slot = info.simSlotIndex
            val carrier = info.carrierName?.toString()
            SimCard(
                id = slot,
                displayName = info.displayName?.toString() ?: carrier ?: "SIM $slot",
                slotIndex = slot,
                carrierName = carrier,
                subscriptionId = info.subscriptionId
            )
        } ?: emptyList()
    }

    /**
     * Returns the subscription id for a targeted SIM slot, or null if not found.
     * Falls back to the active default data subscription when [slotIndex] is invalid (-1).
     */
    fun resolveSubscriptionId(
        context: Context,
        slotIndex: Int,
        subscriptionId: Int?
    ): Int? {
        if (subscriptionId != null && subscriptionId >= 0) {
            return subscriptionId
        }

        val subscriptionManager =
            context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
                ?: return null

        val subscriptions: List<SubscriptionInfo>? =
            subscriptionManager.activeSubscriptionInfoList

        if (subscriptions.isNullOrEmpty()) {
            return null
        }

        if (slotIndex >= 0) {
            val matching = subscriptions.firstOrNull { it.simSlotIndex == slotIndex }
            if (matching != null) {
                return matching.subscriptionId
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val defaultSubId = subscriptionManager.defaultDataSubscriptionId
            if (defaultSubId != SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
                return defaultSubId
            }
        }

        return subscriptions.first().subscriptionId
    }
}
