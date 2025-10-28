<template>
  <form class="space-y-4" @submit.prevent="onSubmit" aria-label="Formulario de artículo">
    <!-- Vista compacta (modo create): datos esenciales sin scroll -->
    <section v-if="!showAdvanced" aria-labelledby="essential-section">
      <h2 id="essential-section" class="sr-only">Datos esenciales</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- Nombre -->
        <div class="md:col-span-2">
          <label for="name" class="block text-sm mb-1">{{ t('inventory.article.fields.name') }}*</label>
          <input id="name" v-model.trim="form.name" type="text" class="border rounded px-3 py-2 w-full" required />
          <p v-if="errors.name" class="text-red-600 text-sm">{{ errors.name }}</p>
        </div>
        <!-- Tipo -->
        <div>
          <label for="type" class="block text-sm mb-1">{{ t('inventory.article.fields.type') }}</label>
          <BaseSelect id="type" v-model="form.type" :options="typeOptions" />
        </div>
        <!-- Activo -->
        <div class="flex items-end">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="form.active" />
            <span>{{ t('inventory.article.fields.active') }}</span>
          </label>
        </div>
        <!-- Rubro -->
        <div>
          <label class="block text-sm mb-1">{{ t('inventory.article.fields.category') }}*</label>
          <BaseSelect v-model="form.categoryId" :options="categoryOptions" />
          <p v-if="errors.categoryId" class="text-red-600 text-sm">{{ errors.categoryId }}</p>
        </div>
        <!-- Sub-rubro -->
        <div>
          <label class="block text-sm mb-1">{{ t('inventory.article.fields.subcategory') }}</label>
          <BaseSelect v-model="form.subcategoryId" :options="subcategoryOptions" />
        </div>
        <!-- Proveedor 1 -->
        <div>
          <EntitySearch
            label="Proveedor 1*"
            :model-value="selectedSupplier1"
            @update:model-value="onSupplier1ModelUpdate"
            @select="onSupplier1Select"
            :search-function="searchSuppliers"
            placeholder="Buscar proveedor..."
            :secondary-field="'code'"
            :min-search-length="2"
          />
          <p v-if="errors.supplierId" class="text-red-600 text-sm">{{ errors.supplierId }}</p>
        </div>
        <!-- Nuevo proveedor -->
        <div class="flex items-end">
          <BaseButton type="button" variant="secondary" @click="showSupplierModal = true">{{ t('inventory.article.actions.newSupplier') }}</BaseButton>
        </div>
        <!-- EAN/PLU -->
        <div>
          <label class="block text-sm mb-1">EAN/PLU</label>
          <input v-model.trim="form.barcode" type="text" class="border rounded px-3 py-2 w-full" @blur="validateBarcode" />
          <p v-if="errors.barcode" class="text-red-600 text-sm">{{ errors.barcode }}</p>
        </div>
        <!-- Código automático -->
        <div class="flex items-end">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="autoCode" @change="toggleAutoCode" />
            <span>{{ t('inventory.article.fields.autoCode') }}</span>
          </label>
        </div>
        <!-- IVA -->
        <div>
          <label class="block text-sm mb-1">IVA%*</label>
          <input v-model.number="form.taxRate" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" required />
          <p v-if="errors.taxRate" class="text-red-600 text-sm">{{ errors.taxRate }}</p>
        </div>
        <!-- Costo -->
        <div>
          <label class="block text-sm mb-1">Costo</label>
          <input v-model.number="form.cost" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" @input="lastEdited = 'cost'; recalcFromCost()" />
        </div>
        <!-- Margen % -->
        <div>
          <label class="block text-sm mb-1">Margen %</label>
          <input v-model.number="form.gainPct" type="number" step="0.01" class="border rounded px-3 py-2 w-full" @input="lastEdited = 'gainPct'; recalcFromCost()" />
        </div>
        <!-- Precio público -->
        <div>
          <label class="block text-sm mb-1">Precio público</label>
          <input v-model.number="form.pricePublic" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" @input="lastEdited = 'pricePublic'; recalcFromPublic()" />
        </div>
        <!-- Stock -->
        <div>
          <label class="block text-sm mb-1">Stock</label>
          <input v-model.number="form.stock" type="number" step="1" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
        <!-- Stock mín. -->
        <div>
          <label class="block text-sm mb-1">Stock mín.</label>
          <input v-model.number="form.stockMin" type="number" step="1" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
      </div>
      <p v-if="errors.price" class="text-red-600 text-sm">{{ errors.price }}</p>
    </section>

    <!-- Mostrar/Ocultar opciones avanzadas -->
    <div class="flex justify-end">
      <BaseButton type="button" variant="ghost" @click="showAdvanced = !showAdvanced">
        {{ showAdvanced ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas' }}
      </BaseButton>
    </div>

    <!-- Básicos -->
    <section v-if="showAdvanced" aria-labelledby="basic-section">
      <h2 id="basic-section" class="text-lg font-semibold">{{ t('inventory.article.sections.basic') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="name" class="block text-sm mb-1">{{ t('inventory.article.fields.name') }}*</label>
          <input id="name" v-model.trim="form.name" type="text" class="border rounded px-3 py-2 w-full" required />
          <p v-if="errors.name" class="text-red-600 text-sm">{{ errors.name }}</p>
        </div>
        <div>
          <label for="type" class="block text-sm mb-1">{{ t('inventory.article.fields.type') }}</label>
          <BaseSelect id="type" v-model="form.type" :options="typeOptions" />
        </div>
        <div class="flex items-end">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="form.active" />
            <span>{{ t('inventory.article.fields.active') }}</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Clasificación -->
    <section v-if="showAdvanced" aria-labelledby="classification-section">
      <h2 id="classification-section" class="text-lg font-semibold">{{ t('inventory.article.sections.classification') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">{{ t('inventory.article.fields.category') }}*</label>
          <BaseSelect v-model="form.categoryId" :options="categoryOptions" />
          <p v-if="errors.categoryId" class="text-red-600 text-sm">{{ errors.categoryId }}</p>
        </div>
        <div>
          <label class="block text-sm mb-1">{{ t('inventory.article.fields.subcategory') }}</label>
          <BaseSelect v-model="form.subcategoryId" :options="subcategoryOptions" />
        </div>
        <div>
          <label class="block text-sm mb-1">{{ t('inventory.article.fields.sku') }}</label>
          <input v-model.trim="form.sku" type="text" class="border rounded px-3 py-2 w-full" />
        </div>
      </div>
    </section>

    <!-- Identificadores -->
    <section v-if="showAdvanced" aria-labelledby="ids-section">
      <h2 id="ids-section" class="text-lg font-semibold">{{ t('inventory.article.sections.ids') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">EAN/PLU</label>
          <input v-model.trim="form.barcode" type="text" class="border rounded px-3 py-2 w-full" @blur="validateBarcode" />
          <p v-if="errors.barcode" class="text-red-600 text-sm">{{ errors.barcode }}</p>
        </div>
        <div class="flex items-end">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="autoCode" @change="toggleAutoCode" />
            <span>{{ t('inventory.article.fields.autoCode') }}</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Fiscal -->
    <section v-if="showAdvanced" aria-labelledby="tax-section">
      <h2 id="tax-section" class="text-lg font-semibold">{{ t('inventory.article.sections.tax') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">IVA%*</label>
          <input v-model.number="form.taxRate" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" required />
          <p v-if="errors.taxRate" class="text-red-600 text-sm">{{ errors.taxRate }}</p>
        </div>
        <div>
          <label class="block text-sm mb-1">Impuesto Interno</label>
          <div class="flex gap-2">
            <BaseSelect v-model="internalTaxType" :options="internalTaxOptions" />
            <input v-model.number="internalTaxValue" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" />
          </div>
        </div>
        <div class="flex items-end gap-4">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="form.withIIBB" />
            <span>IIBB</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="form.withIncomeTax" />
            <span>Ganancias</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="form.withVatPerception" />
            <span>Percepción IVA</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Precio -->
    <section v-if="showAdvanced" aria-labelledby="price-section">
      <h2 id="price-section" class="text-lg font-semibold">{{ t('inventory.article.sections.price') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">Costo</label>
          <input v-model.number="form.cost" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" @input="lastEdited = 'cost'; recalcFromCost()" />
        </div>
        <div>
          <label class="block text-sm mb-1">Margen %</label>
          <input v-model.number="form.gainPct" type="number" step="0.01" class="border rounded px-3 py-2 w-full" @input="lastEdited = 'gainPct'; recalcFromCost()" />
        </div>
        <div>
          <label class="block text-sm mb-1">Precio público</label>
          <input v-model.number="form.pricePublic" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" @input="lastEdited = 'pricePublic'; recalcFromPublic()" />
          <p v-if="errors.price" class="text-red-600 text-sm">{{ errors.price }}</p>
        </div>
      </div>
    </section>

    <!-- Stock -->
    <section v-if="showAdvanced" aria-labelledby="stock-section">
      <h2 id="stock-section" class="text-lg font-semibold">{{ t('inventory.article.sections.stock') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm mb-1">Stock</label>
          <input v-model.number="form.stock" type="number" step="1" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Stock mín.</label>
          <input v-model.number="form.stockMin" type="number" step="1" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Stock máx.</label>
          <input v-model.number="form.stockMax" type="number" step="1" min="0" class="border rounded px-3 py-2 w-full" />
          <p v-if="errors.stockMax" class="text-red-600 text-sm">{{ errors.stockMax }}</p>
        </div>
        <div class="flex items-end">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="form.stockControl" />
            <span>{{ t('inventory.article.fields.stockControl') }}</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Varios -->
    <section v-if="showAdvanced" aria-labelledby="misc-section">
      <h2 id="misc-section" class="text-lg font-semibold">{{ t('inventory.article.sections.misc') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Descripción</label>
          <textarea v-model.trim="form.description" class="border rounded px-3 py-2 w-full" rows="3" />
        </div>
        <div>
          <label class="block text-sm mb-1">Foto</label>
          <input type="file" class="border rounded px-3 py-2 w-full" @change="onFileChange" accept="image/*" />
          <div v-if="photoPreview" class="mt-2 flex items-center gap-3">
            <img :src="photoPreview" alt="Preview" class="h-20 w-20 object-cover rounded border" />
            <BaseButton variant="ghost" type="button" @click="removePhoto">Quitar</BaseButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Proveedores -->
    <section v-if="showAdvanced" aria-labelledby="suppliers-section">
      <h2 id="suppliers-section" class="text-lg font-semibold">{{ t('inventory.article.sections.suppliers') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <EntitySearch
            label="Proveedor 1*"
            :model-value="selectedSupplier1"
            @update:model-value="onSupplier1ModelUpdate"
            @select="onSupplier1Select"
            :search-function="searchSuppliers"
            placeholder="Buscar proveedor..."
            :secondary-field="'code'"
            :min-search-length="2"
          />
          <p v-if="errors.supplierId" class="text-red-600 text-sm">{{ errors.supplierId }}</p>
        </div>
        <!-- Nuevo proveedor -->
        <div class="flex items-end">
          <BaseButton type="button" variant="secondary" @click="showSupplierModal = true">{{ t('inventory.article.actions.newSupplier') }}</BaseButton>
        </div>
        <div>
          <EntitySearch
            label="Proveedor 2"
            :model-value="selectedSupplier2"
            @update:model-value="onSupplier2ModelUpdate"
            @select="onSupplier2Select"
            :search-function="searchSuppliers"
            placeholder="Buscar proveedor..."
            :secondary-field="'code'"
            :min-search-length="2"
          />
        </div>
        <div class="flex items-end">
          <BaseButton variant="secondary" type="button" @click="showSupplierModal = true">{{ t('inventory.article.actions.newSupplier') }}</BaseButton>
        </div>
      </div>
    </section>

    <!-- Modal: Nuevo Proveedor -->
    <SupplierFormModal
      v-if="showSupplierModal"
      @close="showSupplierModal = false"
      @supplier-created="onSupplierCreated"
    />

    <!-- Códigos secundarios -->
    <!-- Se mantiene solo en modo edición -->
    <section v-if="mode === 'edit'" aria-labelledby="barcodes-section">
      <h2 id="barcodes-section" class="text-lg font-semibold">{{ t('inventory.article.sections.secondaryBarcodes') }}</h2>
      <div class="flex items-center gap-2 mb-2">
        <input v-model.trim="newBarcode" type="text" class="border rounded px-3 py-2" placeholder="Nuevo código" @keyup.enter="addSecondaryBarcode" />
        <BaseButton variant="secondary" @click="addSecondaryBarcode">Agregar</BaseButton>
      </div>
      <ul class="list-disc ml-5">
        <li v-for="bc in secondaryBarcodes" :key="bc.id" class="flex items-center gap-2">
          <span>{{ bc.code }}</span>
          <BaseButton variant="ghost" @click="removeSecondaryBarcode(bc.id)">Eliminar</BaseButton>
        </li>
      </ul>
      <p v-if="errors.secondaryBarcodes" class="text-red-600 text-sm">{{ errors.secondaryBarcodes }}</p>
    </section>

    <!-- UoM -->
    <section v-if="showAdvanced" aria-labelledby="uom-section">
      <h2 id="uom-section" class="text-lg font-semibold">{{ t('inventory.article.sections.uom') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">Unidad base</label>
          <BaseSelect v-model="form.uomBase" :options="uomOptions" />
        </div>
        <div>
          <label class="block text-sm mb-1">Factor conversión</label>
          <input v-model.number="form.uomFactor" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Precio override</label>
          <input v-model.number="form.uomPriceOverride" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
      </div>
    </section>


    <!-- Combos/Kits -->
    <section v-if="showAdvanced" aria-labelledby="combo-section">
      <h2 id="combo-section" class="text-lg font-semibold">{{ t('inventory.article.sections.combo') }}</h2>
      <div>
        <div class="flex items-center gap-2 mb-2">
          <BaseButton variant="secondary" @click="addComboRow">Agregar componente</BaseButton>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="form.comboOwnPrice" />
            <span>Precio propio (no suma)</span>
          </label>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="text-left py-2 px-3">Código</th>
                <th class="text-left py-2 px-3">Nombre</th>
                <th class="text-right py-2 px-3">Cantidad</th>
                <th class="py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in form.comboComponents" :key="idx">
                <td class="py-2 px-3"><input v-model.trim="row.code" type="text" class="border rounded px-2 py-1 w-full" /></td>
                <td class="py-2 px-3"><input v-model.trim="row.name" type="text" class="border rounded px-2 py-1 w-full" /></td>
                <td class="py-2 px-3 text-right"><input v-model.number="row.qty" type="number" step="0.01" min="0" class="border rounded px-2 py-1 w-24 text-right" /></td>
                <td class="py-2 px-3"><BaseButton variant="ghost" @click="removeComboRow(idx)">Eliminar</BaseButton></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Precio por mayor -->
    <section v-if="showAdvanced" aria-labelledby="wholesale-section">
      <h2 id="wholesale-section" class="text-lg font-semibold">{{ t('inventory.article.sections.wholesale') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">Cantidad mínima</label>
          <input v-model.number="form.wholesaleMinQty" type="number" step="1" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Precio mayorista</label>
          <input v-model.number="form.wholesalePrice" type="number" step="0.01" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Aplicar IVA</label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="form.wholesaleHasTax" />
            <span>Sí</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Puntos y Días de stock -->
    <section v-if="showAdvanced" aria-labelledby="points-stockdays-section">
      <h2 id="points-stockdays-section" class="text-lg font-semibold">{{ t('inventory.article.sections.pointsStockDays') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">Puntos</label>
          <input v-model.number="form.points" type="number" step="1" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Días de stock</label>
          <input v-model.number="form.stockDays" type="number" step="1" min="0" class="border rounded px-3 py-2 w-full" />
        </div>
      </div>
    </section>


    <!-- Confirmación de borrado -->
    <ConfirmModal v-model="showDeleteModal" :title="t('actions.delete')" :message="t('inventory.article.confirm.delete')" @confirm="onSoftDelete" />
  </form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch } from 'vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import SupplierFormModal from '@/components/suppliers/SupplierFormModal.vue'
import { useArticleStore } from '@/stores/articles'
import { useCategories } from '@/composables/useCategories'
import { useSuppliers } from '@/composables/useSuppliers'
import { useNotifications } from '@/composables/useNotifications'
import EntitySearch from '@/components/molecules/EntitySearch.vue'
import { addArticleSupplierLink, getArticleBarcodes, addArticleBarcode, deleteArticleBarcode, uploadArticleImage, deleteArticleImage } from '@/services/articles'

const props = defineProps<{ mode: 'create' | 'edit'; initial?: any }>()
const emits = defineEmits(['saved', 'cancel', 'price-change'])

function t(key: string) {
  const dict: Record<string, string> = {
    'inventory.article.sections.basic': 'Básicos',
    'inventory.article.sections.classification': 'Clasificación',
    'inventory.article.sections.ids': 'Identificadores',
    'inventory.article.sections.tax': 'Fiscal',
    'inventory.article.sections.price': 'Precio',
    'inventory.article.sections.stock': 'Stock',
    'inventory.article.sections.misc': 'Varios',
    'inventory.article.sections.suppliers': 'Proveedores',
    'inventory.article.sections.secondaryBarcodes': 'Códigos secundarios',
    'inventory.article.sections.uom': 'Unidades/Conversiones',
    'inventory.article.sections.combo': 'Combos/Kits',
    'inventory.article.sections.wholesale': 'Precio por mayor',
    'inventory.article.sections.pointsStockDays': 'Puntos y Días de stock',
    'inventory.article.fields.name': 'Nombre',
    'inventory.article.fields.type': 'Tipo',
    'inventory.article.fields.active': 'Activo',
    'inventory.article.fields.category': 'Rubro',
    'inventory.article.fields.subcategory': 'Sub-rubro',
    'inventory.article.fields.sku': 'SKU',
    'inventory.article.fields.autoCode': 'Código automático',
    'inventory.article.fields.stockControl': 'Control de stock',
    'inventory.article.actions.newSupplier': 'Nuevo proveedor',
    'inventory.article.actions.delete': 'Borrar',
    'inventory.article.confirm.delete': '¿Eliminar el artículo? Esta acción es reversible (soft delete).',
    'actions.new': 'Nuevo',
    'actions.save': 'Guardar',
    'actions.delete': 'Eliminar',
    'actions.close': 'Cerrar',
    'states.saving': 'Guardando…'
  }
  return dict[key] || key
}

const store = useArticleStore()
const { categories, subcategoriesByParent } = useCategories()
const { suppliers, searchSuppliers, getSupplier, fetchSuppliers } = useSuppliers()
const { success, error: notifyError } = useNotifications()

const typeOptions = [
  { label: 'Producto', value: 'PRODUCT' },
  { label: 'Servicio', value: 'SERVICE' }
]

const uomOptions = [
  { label: 'UN', value: 'UN' },
  { label: 'BU', value: 'BU' },
  { label: 'KG', value: 'KG' },
  { label: 'LT', value: 'LT' }
]

const internalTaxOptions = [
  { label: 'Fijo', value: 'FIX' },
  { label: '%', value: 'PCT' }
]

const stockWindowOptions = [
  { label: '7', value: 7 },
  { label: '30', value: 30 },
  { label: '90', value: 90 }
]

const form = reactive<any>({
  name: '',
  type: 'PRODUCT',
  active: true,
  categoryId: null,
  subcategoryId: null,
  sku: '',
  barcode: '',
  taxRate: null,
  cost: null,
  gainPct: null,
  pricePublic: null,
  withIIBB: false,
  withIncomeTax: false,
  withVatPerception: false,
  stock: null,
  stockMin: null,
  stockMax: null,
  stockControl: false,
  description: '',
  supplierId: null,
  supplier2Id: null,
  uomBase: 'UN',
  uomFactor: null,
  uomPriceOverride: null,
  comboOwnPrice: false,
  comboComponents: [] as Array<{ code: string; name: string; qty: number }>,
  wholesaleTiers: [] as Array<{ uom: string; qty: number; price?: number | null; discountPct?: number | null }>,
  pointsPerUnit: null,
  leadTimeDays: null
})

const errors = reactive<Record<string, string>>({})
const autoCode = ref(false)
const internalTaxType = ref<'FIX' | 'PCT'>('FIX')
const internalTaxValue = ref<number | null>(null)
const secondaryBarcodes = ref<Array<{ id: string; code: string }>>([])
const newBarcode = ref('')
const saving = ref(false)
const showDeleteModal = ref(false)
const showSupplierModal = ref(false)
const showAdvanced = ref(false)
const apiBase = String((import.meta as any).env?.VITE_API_URL || '')

// Selección de proveedores con EntitySearch
const selectedSupplier1 = ref<any | null>(null)
const selectedSupplier2 = ref<any | null>(null)
function onSupplier1Select(s: any) {
  selectedSupplier1.value = s
  form.supplierId = s?.id || null
}
function onSupplier1ModelUpdate(val: any) {
  selectedSupplier1.value = val
  form.supplierId = val?.id || null
}
function onSupplier2Select(s: any) {
  selectedSupplier2.value = s
  form.supplier2Id = s?.id || null
}
function onSupplier2ModelUpdate(val: any) {
  selectedSupplier2.value = val
  form.supplier2Id = val?.id || null
}

const stockWindow = ref(30)

const categoryOptions = computed(() => [
  { label: 'Selecciona…', value: null },
  ...categories.value.map((c: any) => ({ label: c.name, value: c.id }))
])

const subcategoryOptions = computed(() => {
  const subs = form.categoryId ? subcategoriesByParent.value[form.categoryId] || [] : []
  return [{ label: 'Selecciona…', value: null }, ...subs.map((s: any) => ({ label: s.name, value: s.id }))]
})

const supplierOptions = computed(() => [
  { label: 'Selecciona…', value: null },
  ...suppliers.value.map((s: any) => ({ label: s.name, value: s.id }))
])

onMounted(async () => {
  if (props.initial) {
    Object.assign(form, {
      ...props.initial,
      comboComponents: props.initial.comboComponents || [],
      wholesaleTiers: props.initial.wholesaleTiers || []
    })
  }
  // Pre-popular selección de proveedores si existen IDs iniciales
  if (form.supplierId) {
    const s1 = await getSupplier(String(form.supplierId))
    selectedSupplier1.value = s1
  }
  if (form.supplier2Id) {
    const s2 = await getSupplier(String(form.supplier2Id))
    selectedSupplier2.value = s2
  }
  // keyboard shortcuts
  window.addEventListener('keydown', onKeyDown)
})

watch(() => form.categoryId, () => {
  form.subcategoryId = null
})

watch([
  () => form.cost,
  () => form.gainPct,
  () => form.taxRate,
  () => internalTaxType.value,
  () => internalTaxValue.value
], () => {
  emits('price-change', getPriceBreakdown())
})

function onKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key.toLowerCase() === 's') {
    e.preventDefault(); onSubmit()
  }
  if (e.key === 'Escape') {
    e.preventDefault(); onCancel()
  }
  if (e.altKey && e.key.toLowerCase() === 'n') {
    e.preventDefault(); showSupplierModal.value = true
  }
}

function toggleAutoCode() {
  if (autoCode.value) {
    // simple auto code: generate placeholder barcode
    form.barcode = `AUTO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }
}

function validateBarcode() {
  if (!form.barcode) { errors.barcode = ''; return }
  const code = String(form.barcode)
  // Basic EAN-13 validation: length 8 or 13 numeric, or allow non-numeric PLU
  if (!/^\d{8}$/.test(code) && !/^\d{13}$/.test(code) && !/^[A-Za-z0-9\-_.]{3,}$/.test(code)) {
    errors.barcode = 'Código inválido (esperado EAN-8/EAN-13 o PLU alfanumérico)'
  } else {
    errors.barcode = ''
  }
}

function internalTaxAmount(baseCost: number): number {
  if (!internalTaxValue.value) return 0
  return internalTaxType.value === 'FIX'
    ? Number(internalTaxValue.value)
    : baseCost * (Number(internalTaxValue.value) / 100)
}

let lastEdited: 'cost' | 'gainPct' | 'pricePublic' | null = null

function round2(n: number) { return Math.round(n * 100) / 100 }

function recalcFromCost() {
  // Directo: CostoBase = cost + internalTax → neto = CostoBase*(1+gainPct/100) → pricePublic = neto*(1+taxRate/100)
  if (form.cost == null || form.gainPct == null || form.taxRate == null) return
  const costBase = Number(form.cost) + internalTaxAmount(Number(form.cost))
  const neto = costBase * (1 + Number(form.gainPct) / 100)
  form.pricePublic = round2(neto * (1 + Number(form.taxRate) / 100))
  emits('price-change', getPriceBreakdown())
}

function recalcFromPublic() {
  // Inverso: quitar IVA → quitar margen → quitar internalTax → recalcular gainPct
  if (form.pricePublic == null || form.taxRate == null || form.cost == null) return
  const sinIva = Number(form.pricePublic) / (1 + Number(form.taxRate) / 100)
  const costBase = Number(form.cost) + internalTaxAmount(Number(form.cost))
  const margen = sinIva / costBase - 1
  form.gainPct = round2(margen * 100)
  emits('price-change', getPriceBreakdown())
}

function getPriceBreakdown() {
  const cost = Number(form.cost ?? 0)
  const gain = Number(form.gainPct ?? 0)
  const ivaPct = Number(form.taxRate ?? 0)
  const base = cost + internalTaxAmount(cost)
  const neto = base * (1 + gain / 100)
  const iva = neto * (ivaPct / 100)
  const publico = neto + iva
  return { base: round2(base), neto: round2(neto), iva: round2(iva), publico: round2(publico) }
}

function validateRequired() {
  errors.name = form.name ? '' : 'Nombre es requerido'
  errors.categoryId = form.categoryId ? '' : 'Rubro es requerido'
  errors.taxRate = form.taxRate != null ? '' : 'IVA es requerido'
  const hasDirect = form.cost != null && form.gainPct != null
  const hasInverse = form.pricePublic != null
  errors.price = hasDirect || hasInverse ? '' : 'Precio: completar costo+% o precio público'
  errors.stockMax = form.stockMax != null && form.stockMin != null && Number(form.stockMax) < Number(form.stockMin)
    ? 'Stock máx. debe ser ≥ stock mín.'
    : ''
  errors.supplierId = form.supplierId ? '' : 'Proveedor 1 es requerido'
  return Object.values(errors).every((v) => !v)
}

function normalizePayload() {
  const payload: any = { ...form }
  // Map UI-specific keys to backend/DTO
  payload.type = String(form.type).toUpperCase() // 'PRODUCT' | 'SERVICE'
  // Detect barcodeType when possible
  if (payload.barcode) {
    const code = String(payload.barcode)
    if (/^\d{13}$/.test(code)) payload.barcodeType = 'EAN13'
    else if (/^\d{8}$/.test(code)) payload.barcodeType = 'EAN8'
    else payload.barcodeType = null
  }
  // Stock control naming
  if ('stockControl' in payload) {
    payload.controlStock = !!payload.stockControl
    delete payload.stockControl
  }
  // Tax flags naming
  payload.subjectIIBB = !!form.withIIBB
  payload.subjectGanancias = !!form.withIncomeTax
  payload.subjectPercIVA = !!form.withVatPerception
  delete payload.withIIBB
  delete payload.withIncomeTax
  delete payload.withVatPerception
  // Internal tax mapping
  payload.internalTaxType = internalTaxValue.value != null ? internalTaxType.value : null
  payload.internalTaxValue = internalTaxValue.value != null ? Number(internalTaxValue.value) : null

  // Remove client-only / unsupported fields
  delete payload.photo
  delete payload.uomBase
  delete payload.uomFactor
  delete payload.uomPriceOverride
  delete payload.comboOwnPrice
  delete payload.comboComponents
  delete payload.wholesaleTiers
  delete payload.leadTimeDays
  delete payload.supplierId
  delete payload.supplier2Id

  return payload
}

async function linkSuppliers(articleId: string) {
  try {
    if (form.supplierId) {
      await addArticleSupplierLink(articleId, String(form.supplierId), { isPrimary: true })
    }
    if (form.supplier2Id) {
      await addArticleSupplierLink(articleId, String(form.supplier2Id), { isPrimary: false })
    }
  } catch (e: any) {
    console.error('Error al vincular proveedores', e)
    notifyError('Error al vincular proveedores')
  }
}

async function onSubmit() {
  if (!validateRequired()) return
  saving.value = true
  try {
    const payload = normalizePayload()
    if (props.mode === 'create') {
      const created = await store.create(payload)
      await linkSuppliers(created.id)
      if (photoFile.value) {
        try {
          const result = await uploadArticleImage(created.id, photoFile.value)
          photoPreview.value = result?.imageUrl ? `${apiBase}${result.imageUrl}` : photoPreview.value
        } catch (err: any) {
          console.error('Upload image failed:', err)
        }
      }
      success('Artículo creado')
      emits('saved', created.id)
    } else {
      await store.update(props.initial!.id, payload)
      if (photoFile.value) {
        try {
          const result = await uploadArticleImage(props.initial!.id, photoFile.value)
          photoPreview.value = result?.imageUrl ? `${apiBase}${result.imageUrl}` : photoPreview.value
        } catch (err: any) {
          console.error('Upload image failed:', err)
        }
      }
      success('Artículo actualizado')
      emits('saved', props.initial!.id)
    }
  } catch (e: any) {
    if (e?.response?.status === 409) {
      errors.barcode = 'Código de barras duplicado'
    }
    notifyError(e?.response?.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function onSoftDelete() {
  if (props.mode !== 'edit') return
  try {
    await store.remove(props.initial!.id)
    success('Artículo eliminado')
    emits('saved', props.initial!.id)
  } catch (e: any) {
    notifyError(e?.response?.data?.message || 'Error al eliminar')
  }
}

function onCancel() { emits('cancel') }
function onReset() { Object.keys(form).forEach((k) => (form as any)[k] = null); form.type = 'PRODUCT'; form.active = true; form.uomBase = 'UN'; form.comboComponents = []; form.wholesaleTiers = [] }

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) {
    errors.photo = 'La foto no debe superar 3MB'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = String(reader.result)
  }
  reader.readAsDataURL(file)
  photoFile.value = file
}

function removePhoto() { photoPreview.value = ''; photoFile.value = null }
const photoPreview = ref('')
const photoFile = ref<File | null>(null)

// Secondary barcodes (edit mode)
async function loadSecondaryBarcodes() {
  if (props.mode !== 'edit' || !props.initial?.id) { secondaryBarcodes.value = []; return }
  try {
    const rows = await getArticleBarcodes(props.initial!.id)
    secondaryBarcodes.value = rows
    errors.secondaryBarcodes = ''
  } catch (e: any) {
    errors.secondaryBarcodes = e?.response?.data?.message || 'Error al cargar códigos'
    secondaryBarcodes.value = []
  }
}
async function addSecondaryBarcode() {
  if (!newBarcode.value || props.mode !== 'edit' || !props.initial?.id) return
  try {
    const type =
      /^\d{13}$/.test(newBarcode.value) ? 'EAN13' :
      /^\d{8}$/.test(newBarcode.value) ? 'EAN8' : null
    const created = await addArticleBarcode(props.initial!.id, newBarcode.value, type)
    secondaryBarcodes.value.push(created)
    newBarcode.value = ''
    errors.secondaryBarcodes = ''
  } catch (e: any) {
    if (e?.response?.status === 400) {
      errors.secondaryBarcodes = 'Código duplicado'
    } else {
      errors.secondaryBarcodes = e?.response?.data?.message || 'Error al agregar código'
    }
  }
}
async function removeSecondaryBarcode(id: string) {
  if (props.mode !== 'edit' || !props.initial?.id) return
  try {
    await deleteArticleBarcode(props.initial!.id, id)
    secondaryBarcodes.value = secondaryBarcodes.value.filter((b) => b.id !== id)
  } catch (e: any) {
    errors.secondaryBarcodes = e?.response?.data?.message || 'Error al eliminar código'
  }
}

// Combos
function addComboRow() { form.comboComponents.push({ code: '', name: '', qty: 1 }) }
function removeComboRow(idx: number) { form.comboComponents.splice(idx, 1) }

// Wholesale
function addWholesaleTier() { form.wholesaleTiers.push({ uom: 'UN', qty: 1, price: null, discountPct: null }) }
function removeWholesaleTier(idx: number) { form.wholesaleTiers.splice(idx, 1) }

// Stock Days widget
const stockSemaphoreClass = computed(() => {
  const days = computeStockDays()
  if (days == null) return 'text-gray-600'
  if (days < 7) return 'text-red-600'
  if (days < 30) return 'text-yellow-600'
  return 'text-green-600'
})
const stockDaysLabel = computed(() => {
  const d = computeStockDays(); return d == null ? '— días de stock' : `${d} días de stock`
})
const breakDateLabel = computed(() => {
  const d = computeStockDays(); if (d == null) return '—'
  const breakDate = new Date(); breakDate.setDate(breakDate.getDate() + d)
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(breakDate)
})
function computeStockDays(): number | null {
  if (form.stock == null) return null
  const avgDaily = (form.stockMin ?? 0) / (stockWindow.value || 30)
  if (avgDaily <= 0) return 999
  return Math.floor(Number(form.stock) / avgDaily)
}

onMounted(() => {
  if (props.mode === 'edit' && props.initial?.id) {
    loadSecondaryBarcodes()
    const url = props.initial?.imageUrl
    if (url) photoPreview.value = `${apiBase}${url}`
  }
})
// Add watcher to reload secondary barcodes when initial.id changes
watch(() => props.initial?.id, (id) => {
  if (props.mode === 'edit' && id) {
    loadSecondaryBarcodes()
  }
})

function onSupplierCreated() {
  fetchSuppliers()
  showSupplierModal.value = false
}
defineExpose({
  submit: onSubmit,
  cancel: onCancel,
  toggleAdvanced: () => { showAdvanced.value = !showAdvanced.value },
  getPriceBreakdown
})
</script>