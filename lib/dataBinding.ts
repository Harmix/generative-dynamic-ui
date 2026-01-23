// Data Binding System - Resolves $data.path and $item.field syntax

/**
 * Resolves a value that may contain data binding syntax
 * @param value - The value to resolve (can be string, number, object, etc.)
 * @param data - The context data object
 * @param item - Optional item context for $item bindings
 * @returns Resolved value
 */
export function resolveValue(
  value: any,
  data: Record<string, any>,
  item?: Record<string, any>
): any {
  // If value is not a string, return as-is
  if (typeof value !== 'string') {
    return value
  }

  // Check for $data. binding
  if (value.startsWith('$data.')) {
    const path = value.substring(6) // Remove '$data.'
    const resolved = getNestedValue(data, path)
    
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('Resolving binding:', { binding: value, path, resolved, data });
    }
    
    return resolved
  }

  // Check for $item. binding
  if (value.startsWith('$item.') && item) {
    const path = value.substring(6) // Remove '$item.'
    return getNestedValue(item, path)
  }

  // Return value as-is if no binding detected
  return value
}

/**
 * Resolves all properties in an object that may contain data bindings
 * @param props - Object with potentially bound properties
 * @param data - The context data object
 * @param item - Optional item context for $item bindings
 * @returns New object with resolved values
 */
export function resolveProps(
  props: Record<string, any>,
  data: Record<string, any>,
  item?: Record<string, any>
): Record<string, any> {
  const resolved: Record<string, any> = {}

  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value)) {
      // Handle arrays - resolve each item
      resolved[key] = value.map(v => resolveValue(v, data, item))
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects recursively
      resolved[key] = resolveProps(value, data, item)
    } else {
      // Handle primitive values
      resolved[key] = resolveValue(value, data, item)
    }
  }

  return resolved
}

/**
 * Gets a nested value from an object using dot notation
 * @param obj - The object to traverse
 * @param path - Dot-separated path (e.g., "user.profile.name")
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined
  }

  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }

    // Handle array notation like "items[0]"
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch
      current = current[arrayKey]?.[parseInt(index, 10)]
    } else {
      current = current[key]
    }
  }

  return current
}

/**
 * Sets a nested value in an object using dot notation
 * @param obj - The object to modify
 * @param path - Dot-separated path
 * @param value - The value to set
 */
export function setNestedValue(
  obj: Record<string, any>,
  path: string,
  value: any
): void {
  const keys = path.split('.')
  const lastKey = keys.pop()

  if (!lastKey) return

  let current = obj

  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {}
    }
    current = current[key]
  }

  current[lastKey] = value
}

/**
 * Checks if a string contains data binding syntax
 * @param value - The string to check
 * @returns True if the string contains $data. or $item. binding
 */
export function hasBinding(value: string): boolean {
  if (typeof value !== 'string') return false
  return value.includes('$data.') || value.includes('$item.')
}

/**
 * Extracts all binding paths from a string
 * @param value - The string to parse
 * @returns Array of binding paths found
 */
export function extractBindings(value: string): string[] {
  if (typeof value !== 'string') return []

  const bindings: string[] = []
  const dataMatches = value.matchAll(/\$data\.[\w.[\]]+/g)
  const itemMatches = value.matchAll(/\$item\.[\w.[\]]+/g)

  for (const match of dataMatches) {
    bindings.push(match[0])
  }

  for (const match of itemMatches) {
    bindings.push(match[0])
  }

  return bindings
}

/**
 * Template string interpolation with data bindings
 * Example: "Hello ${$data.user.name}" -> "Hello John"
 * @param template - Template string with ${...} placeholders
 * @param data - Context data
 * @param item - Optional item context
 * @returns Interpolated string
 */
export function interpolateTemplate(
  template: string,
  data: Record<string, any>,
  item?: Record<string, any>
): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, expression) => {
    const resolved = resolveValue(expression.trim(), data, item)
    return resolved !== undefined ? String(resolved) : ''
  })
}

