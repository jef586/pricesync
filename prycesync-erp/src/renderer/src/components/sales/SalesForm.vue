<template>
  <!-- Layout principal: diseÃ±o compacto con encabezado a ancho completo -->
  <div class="h-full min-h-0 grid grid-cols-1 xl:grid-cols-12 xl:grid-rows-[auto_1fr] items-stretch gap-6 font-inter overflow-hidden">
    <!-- Encabezado (full width) -->
    <section class="xl:col-span-9 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-4" aria-label="Encabezado del comprobante">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Encabezado</h2>
        <span class="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300">Lista de Precios: {{ selectedPriceList?.name || '—' }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3">
        <div class="xl:col-span-2">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Fecha</label>
          <input type="date" v-model="header.date" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Fecha" tabindex="1" />
        </div>

        <div class="xl:col-span-3">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Tipo de comprobante</label>
          <select v-model="header.type" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Tipo de comprobante" tabindex="2">
            <option>Factura A</option>
            <option>Factura B</option>
            <option>Factura C</option>
            <option>Ticket</option>
            <option>Presupuesto</option>
          </select>
        </div>

        <div class="xl:col-span-2">
          <label class="block text-xs text-slate-600 dark:text-slate-300">N° Comprobante</label>
          <input type="text" :value="header.number" readonly class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Número de comprobante" tabindex="-1" />
        </div>

        <div class="xl:col-span-5">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Cliente</label>
          <div class="mt-1 flex items-center gap-2">
            <input type="text" :value="header.client" placeholder="Cliente ocasional" :readonly="!manualHeaderEdit" class="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Cliente" tabindex="-1" />
            <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="showCustomerModal = true" tabindex="3">Seleccionar</button>
            <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="showCuitModal = true" title="Buscar por CUIT">Buscar CUIT</button>
          </div>
          
        </div>

        <div class="xl:col-span-4">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Condición de IVA</label>
          <select v-model="header.ivaCondition" :disabled="!manualHeaderEdit" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Condición de IVA" tabindex="4">
            <option>Consumidor Final</option>
            <option>Monotributista</option>
            <option>Resp.Inscripto</option>
            <option>Exento</option>
          </select>
        </div>

        <div class="xl:col-span-4">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Condición de venta</label>
          <select v-model="header.saleCondition" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Condición de venta" tabindex="5">
            <option>Contado</option>
            <option>Cuenta Corriente</option>
          </select>
        </div>

        <div class="xl:col-span-4">
          <label for="price-list-select" class="block text-xs text-slate-600 dark:text-slate-300">Lista de Precios</label>
          <select id="price-list-select" v-model="selectedPriceListId" @change="handlePriceListChange" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Lista de Precios" data-testid="price-list-select" tabindex="6">
            <option disabled value="">Seleccionar…</option>
            <option v-for="pl in priceLists" :key="pl.id" :value="pl.id">{{ pl.name }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Card B: Productos (izquierda) -->
    <section class="xl:col-span-3 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-4 flex flex-col min-h-0 overflow-hidden" aria-label="Productos">
      <div class="flex items-end gap-2 mb-3">
        <div class="flex-1 min-w-[140px] relative">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Buscar producto</label>
          <input
            type="text"
            v-model="searchQuery"
            @input="debouncedSearch"
            placeholder="Buscar por nombre o SKU..."
            class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            aria-label="Buscar producto"
            tabindex="7"
          />
          <!-- Resultados: overlay absoluto que no empuja los demÃ¡s inputs -->
          <div
            v-if="productResults.length > 0"
            class="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg"
          >
            <ul>
              <li
                v-for="prod in productResults"
                :key="prod.id"
                class="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                @click="onProductSelected(prod)"
              >
                <div>
                  <div class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ prod.name }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-300">SKU: {{ prod.sku || prod.code }}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="w-36 shrink-0">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Código de barras</label>
          <input id="pos-barcode-input" type="text" v-model="barcode" @keydown="onBarcodeKeyDown" @input="onBarcodeInput" @blur="onBarcodeBlur" placeholder="Escanear / escribir" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Código de barras" tabindex="8" />
        </div>
        <div class="w-16 shrink-0">
          <label class="block text-xs text-slate-600 dark:text-slate-300">Cantidad</label>
          <input type="number" min="1" v-model.number="newQty" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" aria-label="Cantidad para agregar" tabindex="9" />
        </div>
      </div>

      <!-- BotÃ³n Agregar debajo de los inputs -->
      <div class="mt-2">
        <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="addRowFromBarcode">Agregar</button>
      </div>

      <!-- Botones por departamento: visibles sin quitar lugar al visor de imÃ¡genes -->
      <div class="mt-2">
        <div class="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">F8 - Seleccionar Departamento</div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-28 overflow-y-auto pr-1">
          <button
            v-for="dept in departmentLabels"
            :key="dept"
            type="button"
            class="px-2 py-2 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
            :aria-label="`Departamento ${dept}`"
            @click="addRowFromDepartment(dept)"
          >{{ dept }}</button>
        </div>
      </div>

      <!-- (Eliminado) Tabla duplicada en el panel izquierdo. La tabla principal estÃ¡ en el centro. -->
      <!-- Visor de imagen del producto seleccionado -->
      <div v-if="selectedImageUrl" class="mt-3">
        <img :src="selectedImageUrl" alt="Imagen del producto" class="w-full h-40 object-contain rounded-lg border border-slate-200 dark:border-slate-700" />
      </div>
    </section>

    <!-- Card D: Tabla de productos (centro) -->
    <section class="xl:col-span-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-4 flex flex-col min-h-0 overflow-hidden" aria-label="Tabla de productos">
      <div v-if="rows.length === 0" class="text-sm text-slate-600 dark:text-slate-300">Sin productos</div>
      <!-- El scroll DEBE estar dentro del div de la tabla -->
      <div v-else :class="['flex-1 min-h-0 h-full overflow-x-auto', rows.length >= 9 ? 'overflow-y-auto' : '']">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-slate-600 dark:text-slate-300">
              <th class="py-2 pr-4">Cantidad</th>
              <th class="py-2 pr-4">Artículo</th>
              <th class="py-2 pr-4">Precio $</th>
              <th class="py-2 pr-4">Desc %</th>
              <th class="py-2 pr-4">Total $</th>
              <th class="py-2 pr-4">#</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            <tr v-for="(r, idx) in rows" :key="r.id" class="text-slate-900 dark:text-slate-100">
              <td class="py-2 pr-4">
                <input type="number" min="1" v-model.number="r.qty" @change="syncTotals" class="w-20 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-saira" aria-label="Cantidad" />
              </td>
              <td class="py-2 pr-4">
                <input type="text" v-model="r.desc" class="w-64 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" aria-label="Artículo" />
                <div class="text-xs text-slate-500">SKU: {{ r.sku }}</div>
              </td>
              <td class="py-2 pr-4">
                <div class="flex items-center gap-2">
                  <input type="number" min="0" v-model.number="r.price" @change="lockPrice(r)" :title="priceOriginTitle(r)" data-testid="row-price-input" class="w-28 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-saira" aria-label="Precio" />
                  <span v-if="r.manualLocked" class="inline-flex items-center px-2 py-1 text-xs rounded-md bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" title="🔒 Origen: Manual">🔒</span>
                </div>
              </td>
              <td class="py-2 pr-4">
                <input type="number" min="0" max="100" v-model.number="r.disc" @change="syncTotals" class="w-20 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-saira" aria-label="Descuento" />
              </td>
              <td class="py-2 pr-4 font-mono">${{ (r.qty * r.price * (1 - (r.disc || 0)/100)).toLocaleString('es-AR') }}</td>
              <td class="py-2 pr-4">
                <button class="px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 flex items-center justify-center" @click="removeRow(idx)" title="Eliminar" aria-label="Eliminar">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span class="sr-only">Eliminar</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Card C: Resumen / Pago (derecha) -->
  <section class="xl:col-span-3 xl:row-span-2 xl:row-start-1 xl:col-start-10 h-full bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-4 flex flex-col min-h-0 overflow-hidden" aria-label="Resumen y pago">
      <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Resumen</h2>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600 dark:text-slate-300">Subtotal</span>
          <span class="text-xl font-semibold text-slate-900 dark:text-white font-saira">${{ subtotal.toLocaleString('es-AR') }}</span>
        </div>
        <!-- Recargo -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="text-slate-600 dark:text-slate-300">Recargo</span>
            <select v-model="summary.surchargeType" class="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs">
              <option value="NONE">Ninguno</option>
              <option value="PERCENT">% Porcentaje</option>
              <option value="ABS">$ Monto</option>
            </select>
            <input v-if="summary.surchargeType !== 'NONE'" type="number" min="0" v-model.number="summary.surchargeValue" class="w-24 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs" :placeholder="summary.surchargeType === 'PERCENT' ? '%' : '$'" />
          </div>
          <span class="text-xl font-semibold text-emerald-700 dark:text-emerald-400 font-saira">${{ globalSurchargeAmount.toLocaleString('es-AR') }}</span>
        </div>
        <!-- Descuento final -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="text-slate-600 dark:text-slate-300">Descuento final</span>
            <select v-model="summary.finalDiscountType" class="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs">
              <option value="NONE">Ninguno</option>
              <option value="PERCENT">% Porcentaje</option>
              <option value="ABS">$ Monto</option>
            </select>
            <input v-if="summary.finalDiscountType !== 'NONE'" type="number" min="0" v-model.number="summary.finalDiscountValue" class="w-24 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs" :placeholder="summary.finalDiscountType === 'PERCENT' ? '%' : '$'" />
          </div>
          <span class="text-xl font-semibold text-red-600 dark:text-red-400 font-saira">${{ globalDiscountAmount.toLocaleString('es-AR') }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="text-slate-600 dark:text-slate-300">Impuestos</span>
            <button class="px-2 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100 text-xs" @click="showToast('Detalle de impuestos próximamente')">+info</button>
          </div>
          <span class="text-xl font-semibold text-slate-900 dark:text-white font-saira">$0</span>
        </div>
        <!-- Percepción -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600 dark:text-slate-300">Percepción</span>
          <span class="text-xl font-semibold text-slate-900 dark:text-white font-saira">${{ summary.perception.toLocaleString('es-AR') }}</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-slate-900 dark:text-slate-100 font-semibold">TOTAL</span>
          <span class="text-5xl font-extrabold text-slate-900 dark:text-white font-saira" data-testid="grand-total">${{ grandTotal.toLocaleString('es-AR') }}</span>
        </div>
      </div>

      <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">Tipo de pago</h2>
      <div>
        <select v-model="pay.type" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
          <option>Efectivo</option>
          <option>Tarjeta</option>
          <option>Transferencia</option>
          <option>Mixto</option>
        </select>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Monto recibido</label>
          <input type="number" min="0" v-model.number="pay.received" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-300">Vuelto</label>
          <input type="text" :value="changeDisplay" readonly class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
        </div>
      </div>

      <div v-if="header.saleCondition === 'Cuenta Corriente'" class="mt-3 text-sm text-amber-700 dark:text-amber-300">Adeuda ${{ grandTotal.toLocaleString('es-AR') }}</div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="cancelSale">Cancelar</button>
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="saveSale">Guardar venta</button>
        <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="confirmAndCharge" data-testid="pay-btn">Confirmar y Cobrar</button>
    </div>
  </section>
</div>

<!-- Modal CUIT para enriquecer datos -->
<div v-if="showCuitModal" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 w-[90%] max-w-md">
    <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">Buscar cliente por CUIT</h3>
    <div>
      <label class="block text-xs text-slate-600 dark:text-slate-300">CUIT/CUIL</label>
      <input type="text" v-model="cuitInputModal" placeholder="20xxxxxxxxx" class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
      <div v-if="padron.error" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ padron.error }}</div>
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="showCuitModal = false">Cerrar</button>
      <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60" :disabled="padron.isLoading" @click="onSearchCuitModal">{{ padron.isLoading ? 'Buscandoâ€¦' : 'Buscar CUIT' }}</button>
    </div>
  </div>
</div>

<!-- Modal reutilizable de bÃºsqueda de cliente -->
<CustomerSearchModal v-model="showCustomerModal" @select="onCustomerSelected" />

  <!-- Modal cambio lista -->
  <div v-if="modal.show" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 w-[90%] max-w-md">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">Cambiar Lista de Precios</h3>
      <p class="text-sm text-slate-600 dark:text-slate-300">Cambiar la lista actualizará los precios no editados. ¿Continuar?</p>
      <div class="mt-4 flex justify-end gap-2">
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="modalCancel">Cancelar</button>
        <button class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" @click="modalConfirm">Continuar</button>
      </div>
    </div>
  </div>

  

  <!-- Toast -->
  <div v-if="toast.show" class="fixed bottom-4 right-4 px-3 py-2 rounded-md bg-slate-900 text-white shadow-md">{{ toast.message }}</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineExpose, onBeforeUnmount, onActivated, onDeactivated } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useCustomers } from '@/composables/useCustomers'
import { usePadronStore } from '@/stores/modules/padron'
import CustomerSearchModal from '@/components/molecules/CustomerSearchModal.vue'
import { useBarcodeListener } from '@/composables/useBarcodeListener'
import { getPosBarcodeSettings } from '@/services/posBarcodeSettings'
import { getPricingPreview, lookup, resolveArticle } from '@/services/articles'

type PriceList = { id: string; name: string; multiplier?: number; priceMap?: Record<string, number> }
type Row = { id: string; sku: string; desc: string; qty: number; price: number; manualLocked: boolean; disc?: number; productId?: string; discountType?: 'PERCENT' | 'ABS'; discountValue?: number; isDiscountable?: boolean }

// Estado encabezado
const header = ref({
  date: new Date().toISOString().split('T')[0],
  type: 'Factura B',
  number: 'AUTO-0001',
  client: '',
  ivaCondition: 'Consumidor Final',
  saleCondition: 'Contado' as 'Contado' | 'Cuenta Corriente'
})

// Listas de precios (mock)
const priceLists = ref<PriceList[]>([
  { id: 'l1', name: 'Lista 1', multiplier: 1.0 },
  { id: 'l2', name: 'Lista 2', multiplier: 1.1 },
  { id: 'l3', name: 'Lista 3', multiplier: 1.2 },
  { id: 'l4', name: 'Lista 4', multiplier: 1.3, priceMap: { 'SKU-001': 1200, 'SKU-XYZ': 9900 } }
])
const selectedPriceListId = ref<string>('')
const selectedPriceList = computed(() => priceLists.value.find(p => p.id === selectedPriceListId.value))

// Productos y filas
const rows = ref<Row[]>([])
const searchQuery = ref('')
const productResults = ref<any[]>([])
let searchTimer: any = null
const barcode = ref('')
const newQty = ref(1)
// Visor: URL de imagen del Ãºltimo producto seleccionado
const selectedImageUrl = ref<string>('')

// Etiquetas de departamentos para selecciÃ³n rÃ¡pida (UI-only)
const departmentLabels = [
  'Verdulería', 'Carnicería', 'Limpieza', 'Almacén', 'Bebidas', 'Panadería',
  'Lácteos', 'Perfumería', 'Fiambrería', 'Congelados', 'Rotisería', 'Hogar'
]

// (Se removiÃ³ la secciÃ³n de sugeridos para que la tabla ocupe todo el alto disponible)

// Productos API
const { searchProducts } = useProducts()
const { searchCustomers, createCustomer } = useCustomers()
const padron = usePadronStore()
// Cliente ocasional: helper para obtener o crear si no existe
const OCCASIONAL_CUSTOMER_NAME = 'Cliente ocasional'
const getOrCreateOccasionalCustomer = async () => {
  try {
    const matches = await searchCustomers(OCCASIONAL_CUSTOMER_NAME, 1)
    if (Array.isArray(matches) && matches.length > 0) {
      return matches[0]
    }
    const created = await createCustomer({ name: OCCASIONAL_CUSTOMER_NAME, taxId: '', type: 'individual' })
    return created
  } catch (e) {
    throw e
  }
}

// BÃºsqueda con debounce
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (!searchQuery.value || searchQuery.value.length < 2) {
      productResults.value = []
      return
    }
    productResults.value = await searchProducts(searchQuery.value, 10)
  }, 300)
}

// Al seleccionar, insertar fila en la tabla
const onProductSelected = (p: any) => {
  addRowFromProduct(p)
  productResults.value = []
  searchQuery.value = ''
  // Actualizar visor de imagen si existe
  selectedImageUrl.value = (p?.imageUrl || p?.image || p?.photo || '') as string
}

// Cliente
const customerQuery = ref('')
const customerResults = ref<any[]>([])
let customerSearchTimer: any = null
const selectedCustomer = ref<any | null>(null)
const cuitInput = ref('')
const cuitInputModal = ref('')
const showCuitModal = ref(false)
const showCustomerModal = ref(false)
const manualHeaderEdit = ref(false)

const debouncedSearchCustomer = () => {
  if (customerSearchTimer) clearTimeout(customerSearchTimer)
  customerSearchTimer = setTimeout(async () => {
    if (!customerQuery.value || customerQuery.value.length < 2) {
      customerResults.value = []
      return
    }
    customerResults.value = await searchCustomers(customerQuery.value, 10)
  }, 300)
}

const onCustomerSelected = (cust: any) => {
  selectedCustomer.value = cust
  header.value.client = cust?.name || ''
  customerQuery.value = cust?.name || ''
  customerResults.value = []
}

const enrichCustomerByCuit = async () => {
  if (!cuitInput.value || cuitInput.value.replace(/\D/g, '').length < 11) {
    showToast('CUIT/CUIL inválido')
    return
  }
  const result = await padron.enrichByCuit(cuitInput.value)
  if (result) {
    // Autocompletar encabezado
    header.value.client = result.name || header.value.client
    if (result.ivaCondition) header.value.ivaCondition = result.ivaCondition

    // Intentar vincular cliente existente por CUIT
    try {
      const matches = await searchCustomers(cuitInput.value, 5)
      const exact = (matches || []).find((m: any) => (m.taxId || '').replace(/\D/g, '') === result.taxId)
      if (exact) {
        onCustomerSelected(exact)
        showToast('Cliente seleccionado por CUIT')
      } else {
        showToast('Datos autocompletados. Selecciona cliente si corresponde')
      }
    } catch (e) {
      showToast('Autocompletado realizado (no se pudo buscar clientes)')
    }
  } else if (!padron.error) {
    showToast('CUIT no encontrado en padrón')
  }
}

const onSearchCuitModal = async () => {
  cuitInput.value = cuitInputModal.value
  await enrichCustomerByCuit()
  if (padron.lastResult) {
    showCuitModal.value = false
  }
}

// Base price mock
const basePriceForSku = (sku: string): number => {
  const map: Record<string, number> = { 'SKU-001': 1000, 'SKU-XYZ': 9000 }
  return map[sku] ?? 1500
}

const addRowFromBarcode = async () => {
  const sanitizeScannedCode = (raw: string) => String(raw || '')
    .replace(/(Shift|Enter|Tab)/gi, '')
    .replace(/\s+/g, '')
    .trim()
  const code = sanitizeScannedCode(String(barcode.value || ''))
  console.log('POS:addRowFromBarcode', { raw: String(barcode.value || ''), code })
  if (!code) return
  try {
    console.log('POS:lookup', code)
    const art = await lookup({ barcode: code })
    console.log('POS:lookup result', !!art, art?.id)
    if (!art) { showToast('No se encontró el artículo'); return }
    await addRowFromResolvedArticle(art)
  } catch (_) {
    const status = (_ as any)?.response?.status
    const rid = (_ as any)?.requestId || (_ as any)?.response?.headers?.['x-request-id']
    console.log('POS:lookup error', status, rid)
    if (status === 422) showToast('Código inválido')
    else if (status >= 500) { showToast('Error del servidor'); console.error('POS:lookup requestId', rid) }
    else showToast('Error resolviendo artículo')
  }
}

async function addRowFromResolvedArticle(art: any) {
  const qty = newQty.value || 1
  const list = String(selectedPriceListId.value || '').toLowerCase()
  let unitPrice = Number(art?.pricePublic || 0)
  if (['l1', 'l2', 'l3'].includes(list)) {
    try {
      const prev = await getPricingPreview(String(art.id), qty, list as 'l1'|'l2'|'l3')
      unitPrice = Number(prev.finalUnitPrice || prev.baseUnitPrice || unitPrice)
    } catch (_) {}
  }
  const keySku = art?.sku || art?.id
  const idx = rows.value.findIndex(r => r.productId === String(art.id) || r.sku === keySku)
  if (idx >= 0) {
    const current = rows.value[idx]
    const nextQty = (current.qty || 0) + qty
    let nextPrice = current.price
    if (!current.manualLocked && ['l1', 'l2', 'l3'].includes(list)) {
      try {
        const prev = await getPricingPreview(String(art.id), nextQty, list as 'l1'|'l2'|'l3')
        nextPrice = Math.round(Number(prev.finalUnitPrice || prev.baseUnitPrice || nextPrice))
      } catch (_) {}
    }
    rows.value[idx] = { ...current, qty: nextQty, price: nextPrice }
    console.log('SalesForm:accumulate row', rows.value[idx])
  } else {
    const row = { id: cryptoRandom(), sku: keySku, desc: art?.name || 'Artículo', qty, price: Math.round(unitPrice), manualLocked: false, disc: 0, productId: String(art.id) }
    console.log('SalesForm:push row', row)
    rows.value.push(row)
  }
  barcode.value = ''
  newQty.value = 1
  selectedImageUrl.value = (art?.imageUrl || '') as string
  syncTotals()
}



const addRowFromProduct = (product: any) => {
  const sku = product.sku || product.code || product.id
  const desc = product.name || 'Producto'
  const pl = selectedPriceList.value
  const price = computePriceForProduct(product, pl)
  const qty = newQty.value || 1
  const idx = rows.value.findIndex(r => r.sku === sku)
  if (idx >= 0) {
    const current = rows.value[idx]
    rows.value[idx] = { ...current, qty: (current.qty || 0) + qty }
  } else {
    rows.value.push({ id: cryptoRandom(), sku, desc, qty, price, manualLocked: false, disc: 0 })
  }
  newQty.value = 1
  syncTotals()
}

// Agregar producto rÃ¡pido desde un departamento
const addRowFromDepartment = (dept: string) => {
  const name = `articulo de ${dept}`
  const product = { name, sku: `DEPT-${dept.toUpperCase()}`, salePrice: 0 }
  addRowFromProduct(product)
  showToast(`Agregado: ${name}`)
}

const computePriceForSku = (sku: string, pl?: PriceList): number => {
  if (!pl) return basePriceForSku(sku)
  if (pl.priceMap && pl.priceMap[sku] !== undefined) return pl.priceMap[sku]
  const base = basePriceForSku(sku)
  const mult = pl.multiplier ?? 1
  return Math.round(base * mult)
}

const computePriceForProduct = (p: any, pl?: PriceList): number => {
  if (!pl) return Math.round(p?.salePrice || 0)
  const sku = p?.sku || p?.code
  if (sku && pl.priceMap && pl.priceMap[sku] !== undefined) return pl.priceMap[sku]
  const base = Number(p?.salePrice || 0)
  const mult = pl.multiplier ?? 1
  return Math.round(base * mult)
}

// Totales con descuentos por Ã­tem (%/$) y descuento final
const lineGross = (r: Row) => r.qty * r.price
const lineDiscount = (r: Row) => {
  const isDisc = r.isDiscountable !== false
  if (!isDisc) return 0
  const gross = lineGross(r)
  const type = r.discountType ?? (r.disc != null ? 'PERCENT' : undefined)
  const value = r.discountValue ?? (r.disc ?? 0)
  if (type === 'ABS') return Math.min(Math.max(value || 0, 0), gross)
  const pct = Math.min(Math.max(value || 0, 0), 100)
  return gross * (pct / 100)
}
const lineNet = (r: Row) => lineGross(r) - lineDiscount(r)
const subtotal = computed(() => rows.value.reduce((sum, r) => sum + lineGross(r), 0))
const totalDiscount = computed(() => rows.value.reduce((sum, r) => sum + lineDiscount(r), 0))
const netSubtotal = computed(() => subtotal.value - totalDiscount.value)

// Resumen con descuento final y recargo (NONE/PERCENT/ABS)
const summary = ref({
  surchargeType: 'NONE' as 'NONE' | 'PERCENT' | 'ABS',
  surchargeValue: 0,
  finalDiscountType: 'NONE' as 'NONE' | 'PERCENT' | 'ABS',
  finalDiscountValue: 0,
  perception: 0
})
const globalDiscountAmount = computed(() => {
  const base = netSubtotal.value
  if (summary.value.finalDiscountType === 'NONE') return 0
  if (summary.value.finalDiscountType === 'ABS') return Math.min(Math.max(summary.value.finalDiscountValue || 0, 0), base)
  const pct = Math.min(Math.max(summary.value.finalDiscountValue || 0, 0), 100)
  return Math.round(base * (pct / 100))
})
const globalSurchargeAmount = computed(() => {
  const base = netSubtotal.value
  if (summary.value.surchargeType === 'NONE') return 0
  if (summary.value.surchargeType === 'ABS') return Math.min(Math.max(summary.value.surchargeValue || 0, 0), base)
  const pct = Math.min(Math.max(summary.value.surchargeValue || 0, 0), 100)
  return Math.round(base * (pct / 100))
})
const grandTotal = computed(() => netSubtotal.value - globalDiscountAmount.value + globalSurchargeAmount.value)

const pay = ref({ type: 'Efectivo', received: 0 })
const changeDisplay = computed(() => {
  const change = (pay.value.received || 0) - grandTotal.value
  return (change > 0 ? '$' + change.toLocaleString('es-AR') : '$0')
})

// Bloqueo de precio al editar manualmente
const lockPrice = (r: Row) => { r.manualLocked = true; syncTotals() }
const priceOriginTitle = (r: Row) => r.manualLocked ? 'Origen: Manual' : `Origen: ${selectedPriceList.value?.name ?? '—'}`

// Recalcular al cambiar lista
const modal = ref({ show: false, nextId: '' as string })
const handlePriceListChange = () => {
  if (rows.value.length === 0) { applyNewPriceList(); return }
  modal.value = { show: true, nextId: selectedPriceListId.value }
}
const modalCancel = () => { modal.value.show = false }
const modalConfirm = () => { applyNewPriceList(); modal.value.show = false }
const applyNewPriceList = async () => {
  const nextId = String(selectedPriceListId.value || '').toLowerCase()
  let affected = 0
  const updated = await Promise.all(rows.value.map(async (r) => {
    if (r.manualLocked) return r
    let price = r.price
    if (r.productId && ['l1','l2','l3'].includes(nextId)) {
      try {
        const prev = await getPricingPreview(String(r.productId), r.qty, nextId as 'l1'|'l2'|'l3')
        price = Number(prev.finalUnitPrice || prev.baseUnitPrice || price)
        affected++
        return { ...r, price: Math.round(price) }
      } catch (_) {
        affected++
        return r
      }
    } else {
      affected++
      return r
    }
  }))
  rows.value = updated
  const pl = priceLists.value.find(p => p.id === selectedPriceListId.value)
  showToast(`Precios actualizados por ${pl?.name ?? '—'} · ${affected} filas`)
}

// Toast simple
const toast = ref({ show: false, message: '' })
const showToast = (msg: string) => {
  toast.value = { show: true, message: msg }
  setTimeout(() => (toast.value.show = false), 2500)
}

// Sincronizar totales (placeholder por si luego hay side-effects)
const syncTotals = () => {/* no-op, computeds se actualizan solos */}

watch(rows, (nv) => {
  console.log('SalesForm:rows changed', nv.length)
}, { deep: true })

// Acciones
const removeRow = (idx: number) => { rows.value.splice(idx, 1) }
const cancelSale = () => { rows.value = []; pay.value = { type: 'Efectivo', received: 0 }; showToast('Venta cancelada') }

// Resetear formulario tras finalizar venta
const resetAfterSale = () => {
  rows.value = []
  pay.value = { type: 'Efectivo', received: 0 }
  summary.value = {
    surchargeType: 'NONE',
    surchargeValue: 0,
    finalDiscountType: 'NONE',
    finalDiscountValue: 0,
    perception: 0
  }
}
import { apiClient } from '@/services/api'
interface Emits { (e: 'sale-success', saleId: string): void }
const emit = defineEmits<Emits>()
const saveSale = async () => {
  try {
        let customerId = selectedCustomer.value?.id
    if (!customerId) {
      try {
        const oc = await getOrCreateOccasionalCustomer()
        selectedCustomer.value = oc
        header.value.client = oc?.name || OCCASIONAL_CUSTOMER_NAME
        customerId = oc.id
        showToast('Usando cliente ocasional')
      } catch (e) {
        showToast('No se pudo usar cliente ocasional')
        return
      }
    }
    const items = rows.value.map(r => {
      const item: any = {
        description: r.desc,
        quantity: r.qty,
        unitPrice: r.price,
        is_discountable: r.isDiscountable !== false,
        taxRate: 21
      }
      const dType = (r.isDiscountable !== false) ? (r.discountType ?? (r.disc != null ? 'PERCENT' : undefined)) : undefined
      const dValue = (r.isDiscountable !== false) ? (r.discountValue ?? (r.disc ?? 0)) : 0
      if (dType) item.discount_type = dType
      if (dValue) item.discount_value = dValue
      if (r.productId) item.productId = r.productId
      return item
    })
    const finalDiscount = summary.value.finalDiscountType === 'NONE' ? undefined : { type: summary.value.finalDiscountType, value: summary.value.finalDiscountValue || 0 }
    const payload: any = { customerId, items, finalDiscount }
    if (summary.value.surchargeType !== 'NONE') {
      payload.surcharge_type = summary.value.surchargeType
      payload.surcharge_value = summary.value.surchargeValue || 0
    }
    await apiClient.post('/sales', payload)
    showToast('Venta guardada')
  } catch (err) {
    console.error('Error guardando venta:', err)
    showToast('Error guardando venta')
  }
}
const confirmAndCharge = async () => {
  try {
        let customerId = selectedCustomer.value?.id
    if (!customerId) {
      try {
        const oc = await getOrCreateOccasionalCustomer()
        selectedCustomer.value = oc
        header.value.client = oc?.name || OCCASIONAL_CUSTOMER_NAME
        customerId = oc.id
        showToast('Usando cliente ocasional')
      } catch (e) {
        showToast('No se pudo usar cliente ocasional')
        return
      }
    }
    const items = rows.value.map(r => {
      const item: any = {
        description: r.desc,
        quantity: r.qty,
        unitPrice: r.price,
        is_discountable: r.isDiscountable !== false,
        taxRate: 21
      }
      const dType = (r.isDiscountable !== false) ? (r.discountType ?? (r.disc != null ? 'PERCENT' : undefined)) : undefined
      const dValue = (r.isDiscountable !== false) ? (r.discountValue ?? (r.disc ?? 0)) : 0
      if (dType) item.discount_type = dType
      if (dValue) item.discount_value = dValue
      if (r.productId) item.productId = r.productId
      return item
    })
    const finalDiscount = summary.value.finalDiscountType === 'NONE' ? undefined : { type: summary.value.finalDiscountType, value: summary.value.finalDiscountValue || 0 }
    const payments = [{ method: pay.value.type, amount: grandTotal.value, currency: 'ARS' }]
    const payload: any = { customerId, items, finalDiscount, payments }
    if (summary.value.surchargeType !== 'NONE') {
      payload.surcharge_type = summary.value.surchargeType
      payload.surcharge_value = summary.value.surchargeValue || 0
    }
    const res = await apiClient.post('/sales', payload)
    const sid = (res?.data?.data?.id) || (res?.data?.id) || ''
    showToast('Venta cobrada')
    if (sid) {
      emit('sale-success', sid)
      resetAfterSale()
    }
  } catch (err) {
    console.error('Error cobrando venta:', err)
    showToast('Error cobrando venta')
  }
}

// Atajos de teclado
const handleKey = (e: KeyboardEvent) => {
if (e.key === 'F2') { e.preventDefault(); confirmAndCharge() }
if (e.key === 'Escape') { e.preventDefault(); cancelSale() }
}
onMounted(() => {
  window.addEventListener('keydown', handleKey)
})

// IntegraciÃ³n del lector de cÃ³digos de barras (HID)
let barcodeCtrl: ReturnType<typeof useBarcodeListener> | null = null
onMounted(async () => {
  try {
    const raw = await getPosBarcodeSettings()
    const settings: any = {
      enabled: raw?.enabled ?? true,
      // Umbral inferior permisivo para escÃ¡neres rÃ¡pidos
      windowMsMin: 0,
      // MÃ¡s holgura por si el lector es lento
      interKeyTimeout: 300,
      minLength: raw?.minLength ?? 6,
      // Captura sin terminador y sin necesidad de foco
      suffix: 'none',
      // Evita que el escaneo escriba en otros inputs durante la rÃ¡faga
      preventInInputs: true,
      // Forzar foco al input de barras para capturar en el campo correcto
      forceFocus: true,
      autoSelectSingle: (raw as any)?.autoSelectSingle ?? true,
    }
    console.log('SalesForm:init barcode listener', settings)
    barcodeCtrl = useBarcodeListener(settings)
    barcodeCtrl.onScan((code) => {
      console.log('SalesForm:onScan', code)
      barcode.value = code
      if (settings.autoSelectSingle) {
        addRowFromBarcode()
      }
    })
    barcodeCtrl.start()
    // Asegurar foco inicial al campo de barras
    try {
      const el = document.getElementById('pos-barcode-input') as HTMLInputElement | null
      el?.focus()
    } catch (_) {}
  } catch (err) {
    console.error('Barcode listener init failed:', err)
  }
})

onBeforeUnmount(() => {
  barcodeCtrl?.stop()
  window.removeEventListener('keydown', handleKey)
})

// Pausar/Reanudar listeners cuando la vista se desactiva/activa (keep-alive)
onDeactivated(() => {
  try { window.removeEventListener('keydown', handleKey) } catch (_) {}
  try { barcodeCtrl?.stop() } catch (_) {}
})

onActivated(() => {
  try { window.addEventListener('keydown', handleKey) } catch (_) {}
  try { barcodeCtrl?.start() } catch (_) {}
  try {
    const el = document.getElementById('pos-barcode-input') as HTMLInputElement | null
    el?.focus()
  } catch (_) {}
})

// Utils
const cryptoRandom = () => Math.random().toString(36).slice(2)

let barcodeInputTimer: any = null
const onBarcodeKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') { e.preventDefault(); console.log('SalesForm:onBarcodeKeyDown Enter'); addRowFromBarcode() }
}
const onBarcodeInput = () => {
  if (barcodeInputTimer) clearTimeout(barcodeInputTimer)
  barcodeInputTimer = setTimeout(() => {
    const code = String(barcode.value || '')
    if (code.length >= 6) { console.log('SalesForm:onBarcodeInput burst', code); addRowFromBarcode() }
  }, 180)
}
const onBarcodeBlur = () => {
  const code = String(barcode.value || '')
  if (code.length >= 6) { console.log('SalesForm:onBarcodeBlur', code); addRowFromBarcode() }
}

// Exponer mÃ©todos para control desde la barra superior en SalesNewView
defineExpose({ confirmAndCharge, cancelSale, saveSale })
</script>

<style scoped>
.font-inter { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; }
</style>
