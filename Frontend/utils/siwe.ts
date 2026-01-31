/**
 * Sign-In with Ethereum (SIWE) utility functions
 * Follows the SIWE standard: https://eips.ethereum.org/EIPS/eip-4361
 */

export interface SIWEMessageParams {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  requestId?: string;
  resources?: string[];
}

/**
 * Creates a SIWE message following the EIP-4361 standard
 */
export function createSIWEMessage(params: SIWEMessageParams): string {
  const {
    domain,
    address,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    expirationTime,
    requestId,
    resources,
  } = params;

  let message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n`;

  if (statement) {
    message += `${statement}\n\n`;
  }

  message += `URI: ${uri}\n`;
  message += `Version: ${version}\n`;
  message += `Chain ID: ${chainId}\n`;
  message += `Nonce: ${nonce}\n`;
  message += `Issued At: ${issuedAt}`;

  if (expirationTime) {
    message += `\nExpiration Time: ${expirationTime}`;
  }

  if (requestId) {
    message += `\nRequest ID: ${requestId}`;
  }

  if (resources && resources.length > 0) {
    message += `\nResources:`;
    resources.forEach((resource) => {
      message += `\n- ${resource}`;
    });
  }

  return message;
}

/**
 * Generates a random nonce for SIWE
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a SIWE message with default parameters
 */
export function createDefaultSIWEMessage(
  address: string,
  domain: string = "your-app.com",
  chainId: number = 1
): string {
  return createSIWEMessage({
    domain,
    address,
    statement: "Sign in with Ethereum to the app.",
    uri: "your-app://",
    version: "1",
    chainId,
    nonce: generateNonce(),
    issuedAt: new Date().toISOString(),
  });
}

