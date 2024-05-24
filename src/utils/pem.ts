import crypto from 'crypto'

/**
 * Converts a private key in PKCS1 format to PKCS8 format
 * @param privateKey Private key in PKCS1 format
 */
export const generatePKCS8Key = (privateKey: string) => {
  const privateKeyPkcs8 = crypto
    .createPrivateKey(privateKey.replace(/\\n/g, '\n'))
    .export({
      type: 'pkcs8',
      format: 'pem',
    })
    .toString()

  return privateKeyPkcs8
}
