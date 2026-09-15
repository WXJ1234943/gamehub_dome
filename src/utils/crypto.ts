import AES from 'crypto-js/aes'
import Utf8 from 'crypto-js/enc-utf8'
import ECB from 'crypto-js/mode-ecb'
import PKCS7 from 'crypto-js/pad-pkcs7'
import JSEncrypt from 'jsencrypt'

const AES_KEY = Utf8.parse('gamehub2026sec!!')
const AES_IV = Utf8.parse('1234567890abcdef')
const RSA_PUBLIC_KEY = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD8Juxqryi/kplmOd0Rmwxk3TTiWMTW6wCYelbfTqtStA3KilP1n66Uf2zrsB+tT5/M4AZCi9YkSmmPNTv/J51MQfFMaqtVSH/SdzA9G8ijNpai8V/24qrf1hcEN8lQ2niI5OS/NS1Q43sN+G8rUKJXOzVn/95GE+uou3mE050dhwIDAQAB'

export function aesEncrypt(data: string): string {
  const encrypted = AES.encrypt(data, AES_KEY, {
    iv: AES_IV,
    mode: ECB,
    padding: PKCS7,
  })
  return encrypted.toString()
}

export function aesDecrypt(encrypted: string): string {
  const decrypted = AES.decrypt(encrypted, AES_KEY, {
    iv: AES_IV,
    mode: ECB,
    padding: PKCS7,
  })
  return decrypted.toString(Utf8)
}

export function rsaEncrypt(data: string): string {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(RSA_PUBLIC_KEY)
  return encryptor.encrypt(data) || ''
}

export function encryptPayload(payload: Record<string, any>): { encrypted: boolean; data: string } {
  const json = JSON.stringify(payload)
  return { encrypted: true, data: aesEncrypt(json) }
}

export function decryptResponse(encryptedData: string): any {
  try {
    const decrypted = aesDecrypt(encryptedData)
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}
