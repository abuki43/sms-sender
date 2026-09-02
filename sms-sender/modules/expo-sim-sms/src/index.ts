import { requireNativeModule, NativeModule } from 'expo-modules-core';

export type SmsStatus = 'sent' | 'delivered' | 'failed' | 'unknown';

export type SimCard = {
  id: number;
  displayName: string;
  slotIndex: number;
  carrierName: string | null;
  subscriptionId: number;
};

export type SendSmsResult = {
  phone: string;
  status: SmsStatus;
  errorCode?: string | null;
};

export type SendMultipartSmsResult = SendSmsResult & {
  partCount: number;
};

export type SmsStatusEvent = {
  phone: string;
  status: SmsStatus;
  errorCode?: string | null;
  partCount?: number | null;
};

type ExpoSimSmsModuleEvents = {
  onSmsStatus(event: SmsStatusEvent): void;
};

declare class ExpoSimSmsModule extends NativeModule<ExpoSimSmsModuleEvents> {
  getSimCards(): Promise<SimCard[]>;
  sendSms(phone: string, message: string, subscriptionId?: number): Promise<SendSmsResult>;
  sendMultipartSms(
    phone: string,
    message: string,
    subscriptionId?: number,
  ): Promise<SendMultipartSmsResult>;
}

const ExpoSimSms = requireNativeModule<ExpoSimSmsModule>('ExpoSimSms');

export default ExpoSimSms;
