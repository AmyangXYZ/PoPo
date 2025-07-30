import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a short, unique ID from MPL content, name, and preview URL
 * Similar to Babylon.js playground format: playground.babylonjs.com/#JF18C0
 */
export function generatePoseId(mpl: string, name: string, previewUrl: string): string {
  // Combine all data into a single string
  const data = `${mpl.trim()}|${name.trim()}|${previewUrl}`

  // Create a simple hash using the built-in crypto API
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Convert to base64-like string (using only uppercase letters and numbers)
  const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  let hashAbs = Math.abs(hash)

  // Generate 6-8 character ID
  for (let i = 0; i < 8; i++) {
    result += base64Chars[hashAbs % base64Chars.length]
    hashAbs = Math.floor(hashAbs / base64Chars.length)
  }

  return result
}
