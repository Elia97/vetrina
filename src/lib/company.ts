export const COMPANY = {
  legalName: '<LEGAL_NAME>',
  // E.164 senza spazi: un URI tel: non li ammette (RFC 3966).
  phone: '+390000000000',
  phoneDisplay: '+39 000 0000000',
  email: 'info@example.com',
  address: {
    streetAddress: '<STREET>',
    postalCode: '00000',
    addressLocality: '<CITY>',
    addressRegion: '<PROVINCE>',
    addressCountry: 'IT',
  },
  vatNumber: '<VAT_NUMBER>',
} as const
