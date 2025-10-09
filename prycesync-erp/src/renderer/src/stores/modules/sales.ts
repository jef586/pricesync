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
  const activeSaleId = ref<string | null>(null)
  const parkedList = ref<Array<{ saleId: string, token: string | null, customer: string | null, total: number, paid: number, remaining: number, parked_at: string | null }>>([])
  const isParking = ref(false)
  const isResuming = ref(false)

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
    activeSaleId.value = null
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
    activeSaleId,
    parkedList,
    isParking,
    isResuming,
    addItemByBarcode,
    clearSale,
    removeItem,
    updateItemQuantity,
    computeTotals,
    async parkSale(saleId?: string) {
      try {
        isParking.value = true
        const id = saleId || activeSaleId.value
        if (!id) {
          throw new Error('No hay venta activa para estacionar')
        }
        const resp = await apiClient.post(`/sales/${id}/park`, {})
        const data = resp.data
        // Keep activeSaleId; UI should reflect PARKED state (freeze edits client-side)
        return data
      } catch (e: any) {
        error.value = e?.response?.data?.message || e?.message || 'Error al estacionar venta'
        return null
      } finally {
        isParking.value = false
      }
    },
    async resumeSale(saleId: string, token?: string) {
      try {
        isResuming.value = true
        const resp = await apiClient.post(`/sales/${saleId}/resume`, token ? { token } : {})
        const data = resp.data
        // Set active sale to resumed one and fetch details to populate currentSale
        activeSaleId.value = saleId
        const saleResp = await apiClient.get(`/sales/${saleId}`)
        const sale = saleResp.data?.data || saleResp.data
        // Map backend sale to local structure (basic fields for POS view)
        currentSale.value = {
          id: sale.id,
          customerId: sale.customerId,
          items: (sale.items || []).map((it: any) => ({
            tempId: Math.random().toString(36).slice(2),
            productId: it.productId || '',
            name: it.description || it.product?.name || 'Item',
            code: it.product?.code || '',
            quantity: Number(it.quantity || 0),
            unitPrice: Number(it.unitPrice || 0),
            discount: Number(it.discount || 0)
          })),
          subtotal: Number(sale.subtotal || 0),
          tax: Number(sale.taxAmount || 0),
          total: Number(sale.totalRounded || sale.total || 0),
          status: (sale.status || 'draft')
        }
        return data
      } catch (e: any) {
        error.value = e?.response?.data?.message || e?.message || 'Error al reanudar venta'
        return null
      } finally {
        isResuming.value = false
      }
    },
    async fetchParked(params?: { search?: string, page?: number, limit?: number }) {
      try {
        const q = new URLSearchParams()
        if (params?.search) q.set('search', params.search)
        if (params?.page) q.set('page', String(params.page))
        if (params?.limit) q.set('limit', String(params.limit))
        const resp = await apiClient.get(`/sales/parked?${q.toString()}`)
        const rows = resp.data?.data || []
        parkedList.value = rows
        return rows
      } catch (e: any) {
        error.value = e?.response?.data?.message || e?.message || 'Error al listar ventas estacionadas'
        return []
      }
    }
  }
})