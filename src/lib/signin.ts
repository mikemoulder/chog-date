// Shared by the client (to sign) and the server (to verify). Must match byte for byte.
export const signInMessage = (address: string, nonce: string) =>
  `Sign in to Chog Date\n\nOnly Chog Genesis holders can date.\n\nWallet: ${address.toLowerCase()}\nNonce: ${nonce}`;
