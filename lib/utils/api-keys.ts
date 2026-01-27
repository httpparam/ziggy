import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'

const API_KEY_PREFIX = 'zipl_'
const API_KEY_LENGTH = 21

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${nanoid(API_KEY_LENGTH)}`
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10)
}

export async function compareApiKey(apiKey: string, hashedKey: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hashedKey)
}

export function formatApiKeyForDisplay(apiKey: string): string {
  if (!apiKey) return ''
  // Show only first 8 characters + prefix
  if (apiKey.length > 12) {
    return `${apiKey.slice(0, 12)}...`
  }
  return apiKey
}
