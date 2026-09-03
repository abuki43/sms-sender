SMS Limits Research: Ethio Telecom & Android
Comprehensive research on SMS sending limits, carrier restrictions, and best practices for bulk SMS applications in Ethiopia and on Android platforms.

Executive Summary
This document outlines the critical SMS sending limits and restrictions for Ethio Telecom (Ethiopia's primary carrier) and Android's app-level SMS controls. Key findings indicate that proper rate limiting, sender ID registration, and timing windows are essential for successful bulk SMS delivery.

Ethio Telecom Carrier Limits
Sender ID Requirements
Mandatory Registration (Effective October 8, 2026)

All Sender IDs must be registered with Ethio Telecom [1]
Unregistered Sender IDs will be blocked after this date [1]
Alphanumeric Sender IDs are supported and required [1]
Numeric Sender IDs are overwritten to ensure delivery on Ethio Telecom network [2]
Sender IDs must be case-sensitive and contain the brand name [2]
Generic Sender IDs (INFO, SMS, NOTICE, etc.) are prohibited [2]
Registration Process

Pre-registration is mandatory for Ethio Telecom network [1]
Provisioning time: 14 days [1]
Requires business documentation and use case approval [1]
Time Window Restrictions
Bulk SMS (BSMS) Sending Hours

Weekdays: 8:00 AM to 8:00 PM [3]
Saturday: 8:00 AM to 6:00 PM [3]
Sunday & Holidays: Not allowed [3]
Night Hours: 8:00 PM to 8:00 AM (weekdays) and 6:00 PM to 8:00 AM (Saturday) are prohibited [3]
Exceptions

Auto-reply messages: No time restrictions [3]
Content provider replies: No time restrictions [3]
Special services: Requires prior approval for different time windows [3]
Message Content Limits
Character Limits

Latin fonts: Maximum 160 characters per message [3]
Geez fonts: Maximum 70 characters (140 bytes) [3]
Concatenation: Supported for longer messages [4]
Content Restrictions

Local banking traffic: Forbidden [1]
Promotional traffic: Forbidden [1]
Hate speech, violence, discrimination: Prohibited [5]
Religious or political content restrictions apply [5]
Content inappropriate for minors: Prohibited [5]
Frequency Limits
Per Recipient

Maximum 5 days per week for raffle messages [3]
Maximum 1 message per day (excluding Saturday, Sunday, holidays) [3]
BSMS to consenting customers: Once per week maximum [3]
Rate Limiting

Maximum throughput: 10 messages per second per sender ID [6]
Carrier-level throttling may apply during peak hours [6]
Space out bulk sends to avoid velocity triggers [6]
Tariff Structure
Volume Range	Unit Price (Birr)
Up to 10,000	0.10 [7]
10,001 - 2,000,000	0.0135 [7]
2,000,001+	0.013 [7]
Safaricom Ethiopia (Alternative Carrier)
Content Approval

Messages must be vetted before sending [5]
Application required at least 1 week (6 days) prior [5]
Content must comply with guidelines and Advertisement/VAS proclamation [5]
Sending Hours

Promotional messages: 0800 hrs to 1800 hrs only [5]
Transactional messages: No time restrictions [5]
Prohibited Content

Hate, violence, discrimination [5]
Religious/political convictions [5]
Inappropriate for minors [5]
Gender, marital status, national origin discrimination [5]
Crimes or banned substances [5]
Human dignity violations [5]
Android SMS Application Limits
Default SMS App Privileges
Unlimited Sending

Apps designated as the default SMS app have NO send limits [8]
No rate limiting applies to default SMS apps [8]
No user confirmation prompts required [8]
Bypasses all SMS usage monitoring [8]
How to Become Default SMS App

App must request and handle android.provider.Telephony role [8]
User must explicitly select the app as default in system settings [8]
App must implement SMS functionality (send, receive, compose) [8]
Requires SEND_SMS permission [8]
Non-Default App Limits
Default Rate Limits

Checking Period: 60,000ms (1 minute) [8]
Maximum Count: 30 SMS per checking period [8]
Queue Limit: 5 pending messages maximum [9]
Historical Limits (Older Android Versions)

Android 1.x/2.x: 100 SMS per hour [10]
Android 4.x: 30 SMS per 30 minutes [10]
Some versions: 100 SMS per hour (3,600,000ms period) [11]
System Settings

Settings.Global.SMS_OUTGOING_CHECK_MAX_COUNT (default: 30) [8]
Settings.Global.SMS_OUTGOING_CHECK_INTERVAL_MS (default: 60000) [8]
Can be modified via ADB on some devices (not guaranteed) [12]
Error Codes
RESULT_ERROR_LIMIT_EXCEEDED (5)

Failed because sending queue limit was reached [9]
Occurs when pending messages exceed queue limit (5) [9]
RESULT_RIL_REQUEST_RATE_LIMITED

Radio denied operation due to overly-frequent requests [8]
Carrier-level rate limiting triggered [8]
RESULT_UNEXPECTED_EVENT_STOP_SENDING

User denied or canceled dialog for premium shortcode [8]
Rate-limited SMS was rejected by user [8]
Bypassing Limits (Advanced)
Method 1: Default SMS App (Recommended)

No system modifications required [8]
User grants permission through system settings [8]
Fully legitimate and sustainable approach [8]
Method 2: ADB Commands (Device-Dependent)


bash
# Increase limit
adb shell settings put global sms_outgoing_check_max_count 999999
 
# Verify setting
adb shell settings get global sms_outgoing_check_max_count
Not guaranteed to work on all devices [12]
Some manufacturers use different settings [12]
May reset after device restart [12]
Method 3: Root Access

Modify system framework files [13]
Change DEFAULT_SMS_MAX_COUNT constant [13]
Requires custom ROM or framework modification [13]
Not recommended for production apps [13]
Important Note

Manufacturer-specific restrictions may prevent bypass [12]
Some devices have hard-coded limits that cannot be changed [12]
Bypass methods may violate app store policies [12]
Bulk SMS Best Practices
Rate Limiting Strategy
Recommended Delays

Conservative: 2-3 seconds between messages [10]
Moderate: 1 second between messages [10]
Aggressive: 0.5 seconds between messages (risk of blocking) [10]
Per-Minute Targets

Safe: 20-30 messages per minute [12]
Moderate: 60 messages per minute [12]
High: 100-200 messages per minute (carrier-dependent) [14]
Carrier-Specific Limits

Most carriers: 200-300 messages per minute [14]
Ethio Telecom: 10 messages per second (600 per minute) [6]
AWS SNS: 100 messages per second (configurable) [14]
Twilio: 1 msg/sec (trial), 10 msg/sec (standard) [6]
Anti-Spam Measures
Content Guidelines

Avoid spammy words: "free", "winner", "urgent", "act now" [14, 15]
Avoid excessive punctuation (!!!, ???) [14]
Avoid ALL CAPS messaging [14]
Limit URL usage (especially shortened URLs) [14]
Keep messages concise and relevant [14]
Opt-In Compliance

Obtain explicit consent before sending [14, 15]
Document consent records (verbal, form, text opt-in) [14]
Email consent is NOT valid for SMS [14]
Honor opt-out requests immediately [14]
Include STOP/HELP mechanism in messages [1]
List Hygiene

Clean contact lists regularly [14, 15]
Remove inactive or invalid numbers [14, 15]
Remove numbers that have opted out [14]
Validate phone numbers before sending [14]
Segment lists by consent type [14]
Sending Patterns
Timing

Send during business hours (8 AM - 6 PM) [6]
Respect local time zones [6]
Avoid sending during night hours [6]
Respect holidays and cultural events [6]
Ethiopia: Follow Ethio Telecom time windows [3]
Volume Distribution

Don't blast all messages at once [14, 15]
Distribute over multiple hours or days [6]
Use drip campaigns for large volumes [12]
Monitor delivery rates in real-time [6]
Adjust pace based on delivery feedback [6]
Retry Logic

Implement exponential backoff for failures [14]
Don't retry permanent failures immediately [14]
Set maximum retry attempts (3-5) [14]
Use different routes for retries if available [14]
Monitor retry success rates [14]
Monitoring & Analytics
Key Metrics

Delivery success rate [14]
Delivery latency (time to deliver) [14]
Failure rate by error code [14]
Opt-out rate [14]
Complaint rate [14]
Alerts

Sudden drop in delivery rate [14]
Spike in failure rate [14]
Unusual latency increases [14]
High complaint rates [14]
SIM balance thresholds [16]
Implementation Recommendations
For Your Bulk SMS App
1. Become Default SMS App (Recommended)

Implement full SMS functionality
Guide users to set app as default
This eliminates all Android rate limits
Most sustainable long-term solution
2. Implement Conservative Rate Limiting

Default delay: 2 seconds between messages
Configurable delay slider (0.5s - 10s)
Respect Ethio Telecom time windows
Pause during prohibited hours
3. Add Safety Features

Message counter with limit warnings
Pause/resume functionality
Progress indicator for bulk sends
Error handling with user-friendly messages
Delivery status tracking
4. Compliance Features

Opt-in consent management
Opt-out handling (STOP keyword)
Message template validation
Sender ID registration guidance
Content filtering for prohibited words
5. User Education

Explain rate limits and why they exist
Show estimated completion time
Warn about carrier restrictions
Provide best practices tips
Display Ethio Telecom time windows
Recommended Configuration
Default Settings

Delay between messages: 2 seconds
Max messages per batch: 100
Pause on error: Yes
Respect time windows: Yes
Retry failed messages: Yes (3 attempts)
Advanced Settings

Custom delay: 0.5s - 10s range
Batch size: 10 - 1000 messages
Time window enforcement: On/Off
Delivery tracking: On/Off
Auto-retry: On/Off
Risk Assessment
High Risk
Sending during prohibited hours (Ethio Telecom)
Using unregistered Sender ID (blocked after Oct 2026)
Sending promotional content (forbidden)
Exceeding 10 messages/second rate limit
Not being default SMS app with high volume
Medium Risk
Sending to non-opt-in contacts
Using spammy content patterns
Sending during night hours
High frequency to same recipient
Poor list hygiene
Low Risk
Transactional messages with consent
Registered Sender ID
Conservative rate limiting
Proper time window compliance
Clean contact lists
Summary Checklist
Before Sending Bulk SMS:

App is set as default SMS app OR using conservative delays
Sender ID is registered with Ethio Telecom
Current time is within allowed window (8AM-8PM weekdays)
Message content is not promotional/banking
Message length is under 160 characters (Latin) or 70 (Geez)
Recipients have given opt-in consent
Contact list is cleaned and validated
Rate limiting is configured (2s delay recommended)
Delivery tracking is enabled
Opt-out mechanism is available
During Bulk Send:

Monitor delivery rates in real-time
Watch for error spikes
Respect configured delays
Pause if issues detected
Track progress for user
After Bulk Send:

Review delivery report
Process opt-out requests
Update contact list status
Analyze failure reasons
Adjust strategy for next send
References
[1] Twilio Ethiopia SMS Guidelines - https://www.twilio.com/en-us/guidelines/et/sms

[2] Vonage Ethiopia SMS Features and Restrictions - https://nexmo1700665158.zendesk.com/hc/en-us/articles/15972328914076-Ethiopia-SMS-Features-and-Restrictions

[3] Ethio Telecom VAS Agreement - https://pdfcoffee.com/download/new-agreement-mohammed-pdf-free.html

[4] Plivo Ethiopia SMS Coverage - https://www.plivo.com/sms-coverage/et/

[5] Safaricom Ethiopia Bulk SMS Guidelines - https://www.scribd.com/document/799470738/SMS-CONTENT-MESSAGES-APPROVAL-FORM-Ethiopia-9637

[6] Ethiopia SMS Best Practices and Compliance - https://www.sent.dm/es/resources/sms-compliance/ethiopia-sms-guide

[7] Ethio Telecom Bulk SMS Tariff - https://dev.ethiotelecom.et/bulk-sms/

[8] Android SmsUsageMonitor Source Code (AOSP) - https://android.googlesource.com/platform/frameworks/opt/telephony/+/refs/heads/main/src/java/com/android/internal/telephony/SmsUsageMonitor.java

[9] Android SMSDispatcher Source Code (AOSP) - https://android.googlesource.com/platform/frameworks/base/+/f19e4b420de65306f09c199829e7e06fe210e21d/telephony/java/com/android/internal/telephony/SMSDispatcher.java

[10] StackOverflow - Android SMS sending limits - https://stackoverflow.com/questions/30215246/android-how-often-can-i-send-sms-message

[11] Android SmsUsageMonitor (older version) - https://android.googlesource.com/platform/frameworks/base/+/22c1700/telephony/java/com/android/internal/telephony/SmsUsageMonitor.java

[12] WhatSnap SMS Limit Bypass Guide - https://whatsnap.gitbook.io/whatsnap-docs/account-management/sms/troubleshooting/sms-limit-bypass

[13] StackOverflow - Remove SMS limit on KitKat with root - https://stackoverflow.com/questions/28413315/remove-sms-limit-on-kitkat-with-root-access

[14] Onyx CRM Bulk Messaging Best Practices - https://blog.onyx-crm.com/bulk-messaging-best-practices-avoid-suspension/

[15] Message Central - How to Send Bulk SMS Without Getting Blocked - https://www.messagecentral.com/blog/how-to-send-bulk-sms-via-api-without-getting-blocked

[16] Telarvo Store - Bulk SMS Troubleshooting Guide - https://blog.telarvostore.com/bulk-sms-not-delivered-troubleshooting-guide-with-error-codes-

[17] AWS SMS Best Practices - https://aws.amazon.com/blogs/messaging-and-targeting/a-guide-to-optimizing-sms-delivery-and-best-practices/

[18] AWS End User Messaging SMS Best Practices - https://docs.aws.amazon.com/sms-voice/latest/userguide/best-practices.html