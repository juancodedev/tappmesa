import { describe, it, expect, beforeEach } from 'vitest'
import { resetAllMocks, mockProduct } from '../utils'

// Cart utility functions extracted for testing
export const calculateItemTotal = (item) => {
  return item.product.price * item.quantity
}

export const calculateSubtotal = (items) => {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0)
}

export const calculateTax = (subtotal) => {
  // IVA en Chile es 19%
  return subtotal * 0.19
}

export const calculateTotal = (subtotal) => {
  return subtotal + calculateTax(subtotal)
}

export const getTotalItemCount = (items) => {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price)
}

export const createCartItem = (product, quantity = 1, temperature = 'hot', notes = '') => {
  return {
    id: `${product.id}_${temperature}_${Date.now()}`,
    product,
    quantity,
    temperature,
    notes,
    addedAt: new Date().toISOString(),
  }
}

export const findExistingCartItem = (items, productId, temperature) => {
  return items.findIndex(
    (item) => item.product.id === productId && item.temperature === temperature
  )
}

export const updateCartItemQuantity = (items, itemId, newQuantity) => {
  if (newQuantity <= 0) {
    return items.filter((item) => item.id !== itemId)
  }

  return items.map((item) =>
    item.id === itemId ? { ...item, quantity: newQuantity } : item
  )
}

export const updateCartItemNotes = (items, itemId, notes) => {
  return items.map((item) => 
    item.id === itemId ? { ...item, notes } : item
  )
}

describe('Cart Utility Functions', () => {
  let sampleItems
  
  beforeEach(() => {
    resetAllMocks()
    
    // Sample cart items for testing
    sampleItems = [
      createCartItem(mockProduct, 2, 'hot', 'Extra foam'),
      createCartItem(
        { ...mockProduct, id: 2, name: 'Latte', price: 4000 },
        1,
        'cold',
        'No sugar'
      ),
      createCartItem(
        { ...mockProduct, id: 3, name: 'Americano', price: 2500 },
        3,
        'hot',
        ''
      ),
    ]
  })

  describe('calculateItemTotal', () => {
    it('should calculate correct total for single item', () => {
      const item = createCartItem(mockProduct, 2)
      
      const total = calculateItemTotal(item)
      
      expect(total).toBe(7000) // 3500 * 2
    })

    it('should handle zero quantity', () => {
      const item = createCartItem(mockProduct, 0)
      
      const total = calculateItemTotal(item)
      
      expect(total).toBe(0)
    })

    it('should handle decimal quantities', () => {
      const item = createCartItem(mockProduct, 1.5)
      
      const total = calculateItemTotal(item)
      
      expect(total).toBe(5250) // 3500 * 1.5
    })
  })

  describe('calculateSubtotal', () => {
    it('should calculate correct subtotal for multiple items', () => {
      const subtotal = calculateSubtotal(sampleItems)
      
      // (3500 * 2) + (4000 * 1) + (2500 * 3) = 7000 + 4000 + 7500 = 18500
      expect(subtotal).toBe(18500)
    })

    it('should return 0 for empty cart', () => {
      const subtotal = calculateSubtotal([])
      
      expect(subtotal).toBe(0)
    })
  })

  describe('calculateTax', () => {
    it('should calculate 19% tax correctly', () => {
      const tax = calculateTax(10000)
      
      expect(tax).toBe(1900) // 10000 * 0.19
    })

    it('should handle zero subtotal', () => {
      const tax = calculateTax(0)
      
      expect(tax).toBe(0)
    })

    it('should handle decimal amounts', () => {
      const tax = calculateTax(18500)
      
      expect(tax).toBe(3515) // 18500 * 0.19
    })
  })

  describe('calculateTotal', () => {
    it('should calculate total including tax', () => {
      const subtotal = 10000
      const total = calculateTotal(subtotal)
      
      expect(total).toBe(11900) // 10000 + (10000 * 0.19)
    })

    it('should handle zero subtotal', () => {
      const total = calculateTotal(0)
      
      expect(total).toBe(0)
    })
  })

  describe('getTotalItemCount', () => {
    it('should count total items correctly', () => {
      const count = getTotalItemCount(sampleItems)
      
      expect(count).toBe(6) // 2 + 1 + 3
    })

    it('should return 0 for empty cart', () => {
      const count = getTotalItemCount([])
      
      expect(count).toBe(0)
    })
  })

  describe('formatPrice', () => {
    it('should format price in Chilean pesos', () => {
      const formatted = formatPrice(3500)
      
      expect(formatted).toBe('$3.500')
    })

    it('should handle zero price', () => {
      const formatted = formatPrice(0)
      
      expect(formatted).toBe('$0')
    })

    it('should handle large amounts', () => {
      const formatted = formatPrice(1000000)
      
      expect(formatted).toBe('$1.000.000')
    })

    it('should round decimal amounts', () => {
      const formatted = formatPrice(3500.67)
      
      expect(formatted).toBe('$3.501') // Rounded to nearest peso
    })
  })

  describe('createCartItem', () => {
    it('should create cart item with default values', () => {
      const item = createCartItem(mockProduct)
      
      expect(item).toMatchObject({
        product: mockProduct,
        quantity: 1,
        temperature: 'hot',
        notes: '',
      })
      expect(item.id).toMatch(/^1_hot_\d+$/)
      expect(item.addedAt).toBeDefined()
    })

    it('should create cart item with custom values', () => {
      const item = createCartItem(mockProduct, 3, 'cold', 'Extra sugar')
      
      expect(item).toMatchObject({
        product: mockProduct,
        quantity: 3,
        temperature: 'cold',
        notes: 'Extra sugar',
      })
      expect(item.id).toMatch(/^1_cold_\d+$/)
    })
  })

  describe('findExistingCartItem', () => {
    it('should find existing item by product and temperature', () => {
      const index = findExistingCartItem(sampleItems, mockProduct.id, 'hot')
      
      expect(index).toBe(0)
    })

    it('should return -1 if item not found', () => {
      const index = findExistingCartItem(sampleItems, 999, 'hot')
      
      expect(index).toBe(-1)
    })

    it('should distinguish between temperatures', () => {
      const hotIndex = findExistingCartItem(sampleItems, mockProduct.id, 'hot')
      const coldIndex = findExistingCartItem(sampleItems, mockProduct.id, 'cold')
      
      expect(hotIndex).toBe(0)
      expect(coldIndex).toBe(-1) // mockProduct with 'cold' doesn't exist
    })
  })

  describe('updateCartItemQuantity', () => {
    it('should update quantity of existing item', () => {
      const itemId = sampleItems[0].id
      const updatedItems = updateCartItemQuantity(sampleItems, itemId, 5)
      
      expect(updatedItems[0].quantity).toBe(5)
      expect(updatedItems.length).toBe(3)
    })

    it('should remove item when quantity is 0', () => {
      const itemId = sampleItems[0].id
      const updatedItems = updateCartItemQuantity(sampleItems, itemId, 0)
      
      expect(updatedItems.length).toBe(2)
      expect(updatedItems.find(item => item.id === itemId)).toBeUndefined()
    })

    it('should remove item when quantity is negative', () => {
      const itemId = sampleItems[0].id
      const updatedItems = updateCartItemQuantity(sampleItems, itemId, -1)
      
      expect(updatedItems.length).toBe(2)
    })

    it('should not affect other items', () => {
      const itemId = sampleItems[0].id
      const originalSecondItem = sampleItems[1]
      const updatedItems = updateCartItemQuantity(sampleItems, itemId, 10)
      
      expect(updatedItems[1]).toEqual(originalSecondItem)
    })
  })

  describe('updateCartItemNotes', () => {
    it('should update notes of existing item', () => {
      const itemId = sampleItems[0].id
      const newNotes = 'No foam, extra hot'
      const updatedItems = updateCartItemNotes(sampleItems, itemId, newNotes)
      
      expect(updatedItems[0].notes).toBe(newNotes)
    })

    it('should not affect other items', () => {
      const itemId = sampleItems[0].id
      const originalSecondItem = sampleItems[1]
      const updatedItems = updateCartItemNotes(sampleItems, itemId, 'New notes')
      
      expect(updatedItems[1]).toEqual(originalSecondItem)
    })

    it('should handle empty notes', () => {
      const itemId = sampleItems[0].id
      const updatedItems = updateCartItemNotes(sampleItems, itemId, '')
      
      expect(updatedItems[0].notes).toBe('')
    })
  })
})