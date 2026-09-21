export type MfaFactor = {
  id: string;
  factor_type: 'totp';
  friendly_name: string;
  created_at: string;
};

export type MfaStatus = {
  mfaEnabled: boolean;
  mfaType: 'totp' | null;
};

export type MfaEnrollResponse = {
  id: string;
  qrCode: string;
  secret: string;
};
