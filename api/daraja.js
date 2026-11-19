// Safaricom Daraja API Helper (OAuth Token Generation & Lipa na M-Pesa Online STK Push)

const MPESA_ENV = process.env.MPESA_ENVIRONMENT || 'production'; // 'sandbox' or 'production'
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || 'JLBBKf2WGg2kdVaMcOiMeDc9JZj39BzfdvQ5gpKfiCbdJHxI';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'T90R0bSwG449yeRw1ahNY6CdYAkEk3ilyjyomakguKxHv9U0kZKeNoJnwh1Rh494';
const PASSKEY = process.env.MPESA_PASSKEY || '05d1ac25756c991b403ebc1a551283d4402f1f8a6418218735aa7a1a293b4f44';
const SHORTCODE = process.env.MPESA_SHORTCODE || '5570700';
const PARTY_A_SHORTCODE = process.env.MPESA_PARTY_A || '7832826';

const BASE_URL = MPESA_ENV === 'sandbox'
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

/**
 * Generate Daraja OAuth Access Token
 */
export async function getDarajaToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Failed to get Daraja token:', errText);
    throw new Error(`Daraja token error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Format Kenyan phone number to 254XXXXXXXXX standard
 */
export function formatPhoneNumber(phone) {
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith('254') && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

/**
 * Trigger Lipa na M-Pesa Online (STK Push)
 */
export async function initiateStkPush({ phone, amount, accountReference, transactionDesc, callbackUrl, host, shortcode, passkey }) {
  const token = await getDarajaToken();
  const formattedPhone = formatPhoneNumber(phone);

  const orgShortcode = shortcode || PARTY_A_SHORTCODE || '7832826';
  const tillShortcode = SHORTCODE || '5570700';
  const activePasskey = passkey || PASSKEY;

  // Generate Timestamp: YYYYMMDDHHmmss
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

  // Generate Password: Base64(BusinessShortCode + Passkey + Timestamp)
  const password = Buffer.from(`${orgShortcode}${activePasskey}${timestamp}`).toString('base64');

  // Dynamically resolve working HTTPS CallBackURL
  let resolvedCallback = callbackUrl;
  if (!resolvedCallback) {
    if (process.env.MPESA_CALLBACK_URL) {
      resolvedCallback = process.env.MPESA_CALLBACK_URL;
    } else if (host) {
      const cleanHost = host.split(':')[0];
      const protocol = cleanHost.includes('localhost') ? 'http' : 'https';
      resolvedCallback = `${protocol}://${host}/api/daraja-callback`;
    } else {
      resolvedCallback = 'https://www.neuroannotator.online/api/daraja-callback';
    }
  }

  // Safaricom Till with HeadOffice STK push
  const payload = {
    BusinessShortCode: orgShortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerBuyGoodsOnline',
    Amount: Math.round(Number(amount)),
    PartyA: formattedPhone,
    PartyB: tillShortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: resolvedCallback,
    AccountReference: (accountReference || 'NEURO').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12),
    TransactionDesc: (transactionDesc || 'Deposit').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 13)
  };

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = resData.errorMessage || resData.ResponseDescription || `Safaricom Daraja API HTTP ${res.status}`;
    console.error('Daraja STK error:', resData);
    throw new Error(errorMsg);
  }

  return resData;
}
