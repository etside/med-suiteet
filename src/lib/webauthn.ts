/** Browser WebAuthn helpers (platform authenticator / Touch ID / Face ID / Windows Hello) */

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
  return buffer.buffer;
}

export type SerializedCredential = {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    attestationObject?: string;
    authenticatorData?: string;
    signature?: string;
    userHandle?: string | null;
  };
};

function serializeCredential(credential: PublicKeyCredential): SerializedCredential {
  const response = credential.response;

  if ("attestationObject" in response) {
    const att = response as AuthenticatorAttestationResponse;
    return {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToBase64url(att.clientDataJSON),
        attestationObject: bufferToBase64url(att.attestationObject),
      },
    };
  }

  const assertion = response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(assertion.clientDataJSON),
      authenticatorData: bufferToBase64url(assertion.authenticatorData),
      signature: bufferToBase64url(assertion.signature),
      userHandle: assertion.userHandle ? bufferToBase64url(assertion.userHandle) : null,
    },
  };
}

export type RegisterOptionsPayload = {
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  pubKeyCredParams: { type: string; alg: number }[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
};

export async function createPlatformCredential(
  options: RegisterOptionsPayload
): Promise<SerializedCredential> {
  const publicKey: PublicKeyCredentialCreationOptions = {
    rp: options.rp,
    user: {
      id: base64urlToBuffer(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    challenge: base64urlToBuffer(options.challenge),
    pubKeyCredParams: options.pubKeyCredParams.map((p) => ({
      type: p.type as PublicKeyCredentialType,
      alg: p.alg,
    })),
    timeout: options.timeout ?? 60000,
    attestation: options.attestation ?? "none",
    authenticatorSelection: options.authenticatorSelection ?? {
      authenticatorAttachment: "platform",
      userVerification: "required",
    },
  };

  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!credential) {
    throw new Error("Biometric registration was cancelled");
  }
  return serializeCredential(credential);
}

export type LoginOptionsPayload = {
  challenge: string;
  timeout?: number;
  rpId: string;
  allowCredentials: { type: string; id: string; transports?: AuthenticatorTransport[] }[];
  userVerification?: UserVerificationRequirement;
};

export async function getPlatformAssertion(
  options: LoginOptionsPayload
): Promise<SerializedCredential> {
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: base64urlToBuffer(options.challenge),
    timeout: options.timeout ?? 60000,
    rpId: options.rpId,
    allowCredentials: options.allowCredentials.map((c) => ({
      type: c.type as PublicKeyCredentialType,
      id: base64urlToBuffer(c.id),
      transports: c.transports,
    })),
    userVerification: options.userVerification ?? "required",
  };

  const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  if (!credential) {
    throw new Error("Biometric sign-in was cancelled");
  }
  return serializeCredential(credential);
}
