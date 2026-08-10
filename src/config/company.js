import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

const name = extra.companyName || 'Royal Butterfly';
const phoneRaw = String(extra.companyPhone || '9594555962').replace(/\D/g, '');
const phoneDisplay =
  extra.companyPhoneDisplay ||
  (phoneRaw.length === 10 ? `+91 ${phoneRaw}` : phoneRaw);

export const COMPANY = {
  name,
  legalName: extra.companyLegalName || name,
  email: extra.companyEmail || 'care@royalbutterfly.in',
  phone: phoneRaw,
  phoneDisplay,
  phoneTel: phoneRaw ? `+91${phoneRaw}` : '',
  address:
    extra.companyAddress ||
    'Office No 2, Matadin, Valai Pada, Nalasopara East, Palghar, Maharashtra 401209',
};

export default COMPANY;
