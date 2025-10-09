import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../../services/api'

export interface SaleItem {
  tempId: string
  productId: string
  name: string
  code: string
  barcode?: string
  quantity: number
  unitPrice: number
  discount?: number
}

export interface Sale {
  id?: string
  customerId?: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'completed' | 'cancelled'
  createdAt?: string
}

export const useSalesStore = defineStore('sales', () => {
  const currentSale = ref<Sale | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Initialize a new sale if none exists
  const initCurrentSale = () => {
    if (!currentSale.value) {
      currentSale.value = {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'draft'
      }
    }
  }

  // Compute totals
  const computeTotals = () => {
    if (!currentSale.value) return
    const subtotal = currentSale.value.items.reduce(
      (acc, item) => acc + (item.quantity * item.unitPrice - (item.discount || 0)),
      0
    )
    const taxRate = 0.21 // Generic IVA; backend will define correctly per item/type
    const tax = subtotal * taxRate
    const total = subtotal + tax
    
    currentSale.value.subtotal = subtotal
    currentSale.value.tax = tax
    currentSale.value.total = total
  }

  // Search product by barcode
  const findProductByBarcode = async (barcode: string) => {
    try {
      // First try exact barcode match
      const barcodeResponse = await apiClient.get(`/products?barcode=${encodeURIComponent(barcode)}`)
      const barcodeData = barcodeResponse.data.data || barcodeResponse.data.products || barcodeResponse.data
      
      if (Array.isArray(barcodeData) && barcodeData.length > 0) {
        return barcodeData[0]
      }
      
      // Fallback: search by SKU/code (in case barcode field isn't populated but code is used)
      const skuResponse = await apiClient.get(`/products?sku=${encodeURIComponent(barcode)}`)
      const skuData = skuResponse.data.data || skuResponse.data.products || skuResponse.data
      
      if (Array.isArray(skuData) && skuData.length > 0) {
        return skuData[0]
      }

      // Additional fallback: search in product name/description
      const searchResponse = await apiClient.get(`/products/search?q=${encodeURIComponent(barcode)}&limit=1`)
      const searchData = searchResponse.data
      
      if (Array.isArray(searchData) && searchData.length > 0) {
        return searchData[0]
      }

      return null
    } catch (err) {
      console.error('Error searching product by barcode:', err)
      return null
    }
  }

  // Add item by barcode with quantity accumulation
  const addItemByBarcode = async (barcode: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      initCurrentSale()
      
      // 1) Search for product by barcode
      const product = await findProductByBarcode(barcode)
      if (!product) {
        error.value = `Producto no encontrado para código: ${barcode}`
        return false
      }
      
      // 2) Check if product already exists in current sale
      const existingItemIndex = currentSale.value!.items.findIndex(
        item => item.productId === product.id
      )
      
      if (existingItemIndex >= 0) {
        // 3a) Product exists, increment quantity
        currentSale.value!.items[existingItemIndex].quantity += 1
      } else {
        // 3b) New product, add as new item
        const newItem: SaleItem = {
          tempId: Math.random().toString(36).slice(2),
          productId: product.id,
          name: product.name || 'Producto sin nombre',
          code: product.sku || product.code || barcode,
          barcode: barcode,
          quantity: 1,
          unitPrice: product.salePrice || 0,
          discount: 0
        }
        currentSale.value!.items.push(newItem)
      }
      
      // 4) Recalculate totals (respects universal pricing engine - no recalc rules here)
      computeTotals()
      
      return true
    } catch (err: any) {
      console.error('Error adding item by barcode:', err)
      error.value = err.message || 'Error al agregar producto'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Clear current sale
  const clearSale = () => {
    currentSale.value = null
    error.value = null
  }

  // Remove item from sale
  const removeItem = (tempId: string) => {
    if (!currentSale.value) return
    const index = currentSale.value.items.findIndex(item => item.tempId === tempId)
    if (index >= 0) {
      currentSale.value.items.splice(index, 1)
      computeTotals()
    }
  }

  // Update item quantity
  const updateItemQuantity = (tempId: string, quantity: number) => {
    if (!currentSale.value) return
    const item = currentSale.value.items.find(item => item.tempId === tempId)
    if (item) {
      item.quantity = Math.max(0, quantity)
      if (item.quantity === 0) {
        removeItem(tempId)
      } else {
        computeTotals()
      }
    }
  }

  return {
    currentSale,
    isLoading,
    error,
    addItemByBarcode,
    clearSale,
    removeItem,
    updateItemQuantity,
    computeTotals
  }
})