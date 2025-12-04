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
      <!-- Primera línea: Nombre + Tipo -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2">
          <label for="name" class="block text-sm mb-1">{{ t('inventory.article.fields.name') }}*</label>
          <input id="name" v-model.trim="form.name" type="text" class="border rounded px-3 py-2 w-full" required />
          <p v-if="errors.name" class="text-red-600 text-sm">{{ errors.name }}</p>
        </div>
        <div>
          <label for="type" class="block text-sm mb-1">{{ t('inventory.article.fields.type') }}</label>
          <BaseSelect id="type" v-model="form.type" :options="typeOptions" />
        </div>
      </div>
      <!-- Segunda línea: EAN/PLU + Código automático -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div class="md:col-span-2">
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

    <!-- Identificadores: se integró en Básicos (EAN/PLU y Código automático) -->

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
            <BaseButton type="button" variant="secondary" @click="aplicarImpuesto">Aplicar</BaseButton>
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

    <!-- Precios & Listas (4) -->
    <section v-if="showAdvanced" aria-labelledby="pricing-unified-section">
      <h2 id="pricing-unified-section" class="text-lg font-semibold">Precios & Listas (4)</h2>
      <ArticlePricingUnifiedCard :article-id="props.initial?.id ? String(props.initial.id) : undefined" @configure-l4="openPromoModal" />
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
          <textarea v-model.trim="form.description" class="border rounded px-3 py-2 w-full" rows="3"></textarea>
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


    <!-- Combos y Promociones -->
    <section v-if="showAdvanced" aria-labelledby="combos-promos-section">
      <h2 id="combos-promos-section" class="text-lg font-semibold">{{ t('inventory.article.sections.combosPromos') }}</h2>
      <div class="space-y-6">
        <!-- Tabla de componentes del combo -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <BaseButton variant="secondary" @click="addComboRow">Agregar componente</BaseButton>
              <label class="inline-flex items-center gap-2">
                <input type="checkbox" v-model="form.comboOwnPrice" />
                <span>Precio propio (no suma)</span>
              </label>
            </div>
            <div class="flex items-center gap-2">
              <BaseButton v-if="quantityPromoLoaded" variant="secondary" @click="openPromoModal">Editar promo</BaseButton>
              <BaseButton v-if="quantityPromoLoaded" variant="ghost" @click="removePromotion">Quitar promo</BaseButton>
              <BaseButton v-else variant="primary" @click="openPromoModal">Promoción por cantidad</BaseButton>
            </div>
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

        <!-- Card: Promoción por cantidad -->
        <div class="rounded-lg border p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-md font-semibold">Promoción por cantidad</h3>
              <p class="text-sm text-slate-600">Configura tiers de precio por cantidad para este artículo.</p>
            </div>
            <div class="flex items-center gap-2">
              <BaseButton v-if="quantityPromoLoaded && quantityPromo" variant="secondary" @click="openPromoModal">Editar</BaseButton>
              <BaseButton v-if="quantityPromoLoaded && quantityPromo" variant="ghost" @click="removePromotion">Quitar</BaseButton>
              <BaseButton v-if="!quantityPromoLoaded || !quantityPromo" variant="primary" @click="openPromoModal">Promoción por cantidad</BaseButton>
            </div>
          </div>
          <div v-if="promoErrorMsg" class="p-2 bg-red-50 text-red-700 text-sm mb-2" role="alert">{{ promoErrorMsg }}</div>
          <div v-if="promoLoading" class="text-sm text-gray-600">Cargando promoción…</div>
          <div v-else-if="quantityPromoLoaded && quantityPromo" class="text-sm text-gray-700">
            <ul class="list-disc ml-5">
              <li>Estado: <strong>{{ quantityPromo.active ? 'Activa' : 'Inactiva' }}</strong> — {{ quantityPromo.exclusive ? 'No acumular (exclusiva)' : 'Acumulable' }}</li>
              <li>Listas de precio: {{ (quantityPromo.priceListIds || []).join(', ') || 'Todas' }}</li>
              <li>Vigencia: {{ quantityPromo.startsAt ? formatDate(quantityPromo.startsAt) : '—' }} → {{ quantityPromo.endsAt ? formatDate(quantityPromo.endsAt) : '—' }}</li>
              <li># Tiers: {{ promoTiers.length }}</li>
            </ul>
            <!-- Vista previa simple -->
            <div class="mt-3">
              <div class="text-xs text-slate-500 mb-1">Vista previa de cálculo (precio base: {{ formatCurrency(form.pricePublic || 0) }})</div>
              <div class="grid grid-cols-3 gap-2">
                <div class="p-2 rounded border">
                  <div class="text-xs">Cantidad 1</div>
                  <div class="text-sm font-semibold">${{ formatCurrency(simulateUnitPrice(form.pricePublic || 0, 1)) }}</div>
                </div>
                <div class="p-2 rounded border">
                  <div class="text-xs">Cantidad 5</div>
                  <div class="text-sm font-semibold">${{ formatCurrency(simulateUnitPrice(form.pricePublic || 0, 5)) }}</div>
                </div>
                <div class="p-2 rounded border">
                  <div class="text-xs">Cantidad 10</div>
                  <div class="text-sm font-semibold">${{ formatCurrency(simulateUnitPrice(form.pricePublic || 0, 10)) }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-gray-600">Sin promoción configurada.</div>
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

    <!-- Modal: Promoción por cantidad -->
    <BaseModal v-model="showPromoModal" title="Promoción por cantidad" size="lg" @close="promoErrorMsg = ''">
      <form id="promoForm" @submit.prevent="savePromotion" class="space-y-4" aria-label="Configurar promoción por cantidad">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="quantityPromo.active" aria-label="Activa" />
            <span>Activa</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="quantityPromo.exclusive" aria-label="No acumular (exclusiva)" />
            <span>No acumular (exclusiva)</span>
          </label>
        </div>

        <!-- Listas de precio (multi-select simple con checkboxes) -->
        <div>
          <label class="block text-sm mb-1">Listas de precio</label>
          <div class="flex flex-wrap gap-3">
            <label v-for="pl in priceListOptions" :key="pl" class="inline-flex items-center gap-2">
              <input type="checkbox" :value="pl" v-model="quantityPromo.priceListIds" />
              <span>{{ pl }}</span>
            </label>
          </div>
          <p class="text-xs text-slate-500 mt-1">Por defecto: Lista 1</p>
        </div>

        <!-- Vigencia -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm mb-1">Vigencia desde</label>
            <input type="date" v-model="quantityPromo.startsAt" class="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label class="block text-sm mb-1">Vigencia hasta</label>
            <input type="date" v-model="quantityPromo.endsAt" class="border rounded px-3 py-2 w-full" />
          </div>
        </div>

        <!-- Tiers -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium">Tiers (UN)</label>
            <BaseButton variant="secondary" @click="addPromoTier" aria-keyshortcuts="Alt+T">+ Agregar fila</BaseButton>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr>
                  <th class="text-left py-2 px-3">Desde (UN)</th>
                  <th class="text-right py-2 px-3">Precio unitario</th>
                  <th class="text-right py-2 px-3">% desc.</th>
                  <th class="py-2 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(t, idx) in promoTiers" :key="idx">
                  <td class="py-2 px-3"><input v-model.number="t.minQtyUn" type="number" step="1" min="1" class="border rounded px-2 py-1 w-24 text-right" /></td>
                  <td class="py-2 px-3 text-right"><input v-model.number="t.pricePerUnit" type="number" step="0.01" min="0" :disabled="t.percentOff != null && Number(t.percentOff) > 0" class="border rounded px-2 py-1 w-28 text-right" /></td>
                  <td class="py-2 px-3 text-right"><input v-model.number="t.percentOff" type="number" step="0.01" min="0" :disabled="t.pricePerUnit != null && Number(t.pricePerUnit) > 0" class="border rounded px-2 py-1 w-24 text-right" /></td>
                  <td class="py-2 px-3"><BaseButton variant="ghost" @click="removePromoTier(idx)">Eliminar</BaseButton></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="promoErrorMsg" class="text-red-600 text-sm mt-2">{{ promoErrorMsg }}</p>
        </div>

        <!-- Vista previa -->
        <div class="mt-3">
          <div class="text-xs text-slate-500 mb-1">Vista previa (simulada): cantidades 1, 5 y 10</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="p-2 rounded border">
              <div class="text-xs">1 UN</div>
              <div class="text-sm font-semibold">${{ formatCurrency(simulateUnitPrice(form.pricePublic || 0, 1)) }}</div>
            </div>
            <div class="p-2 rounded border">
              <div class="text-xs">5 UN</div>
              <div class="text-sm font-semibold">${{ formatCurrency(simulateUnitPrice(form.pricePublic || 0, 5)) }}</div>
            </div>
            <div class="p-2 rounded border">
              <div class="text-xs">10 UN</div>
              <div class="text-sm font-semibold">${{ formatCurrency(simulateUnitPrice(form.pricePublic || 0, 10)) }}</div>
            </div>
          </div>
          <p class="text-xs text-slate-500 mt-2">Si la promo es exclusiva, no se acumula con mayorista/cupones.</p>
        </div>

      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="showPromoModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" type="submit" form="promoForm" :loading="promoLoading" aria-keyshortcuts="Ctrl+S">Guardar</BaseButton>
      </template>
    </BaseModal>


    <!-- Confirmación de borrado -->
    <ConfirmModal v-model="showDeleteModal" :title="t('actions.delete')" :message="t('inventory.article.confirm.delete')" @confirm="onSoftDelete" />
  </form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch } from 'vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import SupplierFormModal from '@/components/suppliers/SupplierFormModal.vue'
import ArticlePricingUnifiedCard from '@/components/articles/ArticlePricingUnifiedCard.vue'
import { useArticleStore } from '@/stores/articles'
import { useCategories } from '@/composables/useCategories'
import { useSuppliers } from '@/composables/useSuppliers'
import { useNotifications } from '@/composables/useNotifications'
import EntitySearch from '@/components/molecules/EntitySearch.vue'
import { addArticleSupplierLink, getArticleBarcodes, addArticleBarcode, deleteArticleBarcode, uploadArticleImage, deleteArticleImage } from '@/services/articles'
import { apiClient } from '@/services/api'
import { getPromotion, createPromotion, updatePromotion, deletePromotion, listTiers, createTier, updateTier, deleteTier, type ArticleQuantityPromotionDto, type ArticleQuantityPromoTierDto } from '@/services/quantityPromotionService'

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
  'inventory.article.sections.combosPromos': 'Combos y Promociones',
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
  { label: 'Ninguno', value: 'NONE' },
  { label: 'Fijo', value: 'FIXED' },
  { label: '%', value: 'PERCENT' }
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
const internalTaxType = ref<'NONE' | 'FIXED' | 'PERCENT'>('NONE')
const internalTaxValue = ref<number | null>(null)
const secondaryBarcodes = ref<Array<{ id: string; code: string }>>([])
const newBarcode = ref('')
const saving = ref(false)
const showDeleteModal = ref(false)
const showSupplierModal = ref(false)
const showAdvanced = ref(false)
const apiBase = String((import.meta as any).env?.VITE_API_URL || (apiClient.defaults.baseURL || ''))
function resolveImgUrl(p: string | null | undefined): string {
  const s = String(p || '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s
  const base = apiBase || ''
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  return s.startsWith('/') ? `${b}${s}` : `${b}/${s}`
}

// Promoción por cantidad (UI state)
const showPromoModal = ref(false)
const promoLoading = ref(false)
const promoErrorMsg = ref('')
const quantityPromoLoaded = ref(false)
const quantityPromo = reactive<ArticleQuantityPromotionDto>({
  active: true,
  exclusive: false,
  priceListIds: [],
  startsAt: null,
  endsAt: null
})
const promoTiers = reactive<ArticleQuantityPromoTierDto[]>([])
const priceListOptions = ref<string[]>(['LISTA-1', 'LISTA-2', 'LISTA-3'])

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
  // Load quantity promotion when editing
  if (props.mode === 'edit' && props.initial?.id) {
    await loadPromotion()
  }
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
    e.preventDefault();
    if (showPromoModal.value) {
      savePromotion()
    } else {
      onSubmit()
    }
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    if (showPromoModal.value) {
      showPromoModal.value = false
    } else {
      onCancel()
    }
  }
  if (e.altKey && e.key.toLowerCase() === 'n') {
    e.preventDefault(); showSupplierModal.value = true
  }
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  try {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date as Date)
  } catch (_) {
    return String(d)
  }
}

function formatCurrency(n: number): string {
  const x = Number(n || 0)
  return x.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function bestTierForQty(qty: number): ArticleQuantityPromoTierDto | null {
  if (!promoTiers.length) return null
  const applicable = promoTiers.filter(t => Number(t.minQtyUn) <= qty)
  if (!applicable.length) return null
  applicable.sort((a, b) => Number(b.minQtyUn) - Number(a.minQtyUn))
  return applicable[0]
}

function simulateUnitPrice(base: number, qty: number): number {
  const tier = bestTierForQty(qty)
  if (!tier) return Number(base || 0)
  if (tier.pricePerUnit != null && Number(tier.pricePerUnit) > 0) {
    return Number(tier.pricePerUnit)
  }
  if (tier.percentOff != null && Number(tier.percentOff) > 0) {
    const off = Number(tier.percentOff) / 100
    return Math.max(0, Number(base || 0) * (1 - off))
  }
  return Number(base || 0)
}

async function loadPromotion() {
  promoLoading.value = true
  promoErrorMsg.value = ''
  try {
    const articleId = String(props.initial!.id)
    const promo = await getPromotion(articleId)
    const tiers = await listTiers(articleId)
    if (promo) {
      quantityPromoLoaded.value = true
      Object.assign(quantityPromo, promo)
    } else {
      quantityPromoLoaded.value = false
      // initialize blank promo
      Object.assign(quantityPromo, {
        active: true,
        exclusive: false,
        priceListIds: ['LISTA-1'],
        startsAt: null,
        endsAt: null
      })
    }
    promoTiers.splice(0, promoTiers.length, ...tiers.sort((a,b) => Number(a.sort||0) - Number(b.sort||0)))
  } catch (err: any) {
    console.error('loadPromotion failed', err)
    promoErrorMsg.value = err?.response?.data?.message || 'Error al cargar promoción'
    quantityPromoLoaded.value = false
  } finally {
    promoLoading.value = false
  }
}

function openPromoModal() {
  if (!quantityPromoLoaded.value && props.mode === 'edit' && props.initial?.id) {
    loadPromotion().then(() => { showPromoModal.value = true })
    return
  }
  // initialize if creating from scratch
  if (!quantityPromo) {
    Object.assign(quantityPromo, {
      active: true,
      exclusive: false,
      priceListIds: ['LISTA-1'],
      startsAt: null,
      endsAt: null
    })
  }
  showPromoModal.value = true
}

function validateTiers(): string[] {
  const errs: string[] = []
  // Basic validations: minQty>0, ascending order, one mode per row, values>0
  if (!promoTiers.length) {
    errs.push('Debe agregar al menos un tier')
  }
  const sorted = [...promoTiers].map(t => ({...t}))
  for (let i=0;i<sorted.length;i++) {
    const t = sorted[i]
    const minq = Number(t.minQtyUn)
    if (!Number.isFinite(minq) || minq <= 0) errs.push(`Fila ${i+1}: Desde (UN) debe ser > 0`)
    const hasPrice = t.pricePerUnit != null && Number(t.pricePerUnit) > 0
    const hasPct = t.percentOff != null && Number(t.percentOff) > 0
    if (hasPrice && hasPct) errs.push(`Fila ${i+1}: Usar Precio unitario o % desc., no ambos`)
    if (!hasPrice && !hasPct) errs.push(`Fila ${i+1}: Completar Precio unitario o % desc.`)
  }
  const asc = [...promoTiers].map(t => Number(t.minQtyUn)).every((v, i, arr) => i === 0 || v >= arr[i-1])
  if (!asc) errs.push('El orden de Desde (UN) debe ser ascendente')
  return errs
}

async function savePromotion() {
  const errors = validateTiers()
  if (errors.length) { promoErrorMsg.value = errors[0]; return }
  promoErrorMsg.value = ''
  promoLoading.value = true
  try {
    const articleId = props.initial?.id ? String(props.initial.id) : ''
    // Persist promotion
    if (quantityPromoLoaded.value && quantityPromo?.id) {
      await updatePromotion(articleId, {
        active: !!quantityPromo.active,
        exclusive: !!quantityPromo.exclusive,
        priceListIds: Array.isArray(quantityPromo.priceListIds) ? quantityPromo.priceListIds : [],
        startsAt: quantityPromo.startsAt || null,
        endsAt: quantityPromo.endsAt || null
      })
    } else {
      const created = await createPromotion(articleId, {
        active: !!quantityPromo.active,
        exclusive: !!quantityPromo.exclusive,
        priceListIds: Array.isArray(quantityPromo.priceListIds) ? quantityPromo.priceListIds : [],
        startsAt: quantityPromo.startsAt || null,
        endsAt: quantityPromo.endsAt || null
      })
      Object.assign(quantityPromo, created)
      quantityPromoLoaded.value = true
    }
    // Replace tiers: delete existing and re-create
    const existing = await listTiers(articleId)
    for (const t of existing) { try { await deleteTier(articleId, String(t.id)) } catch (_) {} }
    const ordered = [...promoTiers].map((t, idx) => ({ ...t, sort: idx }))
    for (const t of ordered) {
      await createTier(articleId, {
        minQtyUn: Number(t.minQtyUn),
        pricePerUnit: (t.pricePerUnit != null && Number(t.pricePerUnit) > 0) ? Number(t.pricePerUnit) : null,
        percentOff: (t.percentOff != null && Number(t.percentOff) > 0) ? Number(t.percentOff) : null,
        sort: Number(t.sort ?? t.sort ?? 0)
      })
    }
    await loadPromotion()
    showPromoModal.value = false
    success('Promoción guardada')
  } catch (err: any) {
    console.error('savePromotion failed', err)
    promoErrorMsg.value = err?.response?.data?.message || 'Error al guardar promoción'
  } finally {
    promoLoading.value = false
  }
}

async function removePromotion() {
  if (props.mode !== 'edit' || !props.initial?.id) return
  promoLoading.value = true
  try {
    await deletePromotion(String(props.initial.id))
    quantityPromoLoaded.value = false
    promoTiers.splice(0, promoTiers.length)
    Object.assign(quantityPromo, { active: true, exclusive: false, priceListIds: ['LISTA-1'], startsAt: null, endsAt: null })
    success('Promoción eliminada')
  } catch (err: any) {
    console.error('removePromotion failed', err)
    promoErrorMsg.value = err?.response?.data?.message || 'Error al eliminar promoción'
  } finally {
    promoLoading.value = false
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
  if (!internalTaxValue.value || internalTaxType.value === 'NONE') return 0
  return internalTaxType.value === 'FIXED'
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

function aplicarImpuesto() {
  // Recalcula precio considerando impuesto interno, según último campo editado
  if (lastEdited === 'pricePublic') {
    recalcFromPublic()
  } else {
    recalcFromCost()
  }
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
  const isComboDerived = !form.comboOwnPrice && Array.isArray(form.comboComponents) && form.comboComponents.some((r: any) => r && r.code && Number(r.qty) > 0)
  const hasDirect = form.cost != null && form.gainPct != null
  const hasInverse = form.pricePublic != null
  errors.price = (hasDirect || hasInverse || isComboDerived) ? '' : 'Precio: completar costo+% o precio público'
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
  // Internal tax mapping (align with backend enum and defaults)
  if (internalTaxValue.value != null && Number(internalTaxValue.value) > 0) {
    payload.internalTaxType = internalTaxType.value
    payload.internalTaxValue = Number(internalTaxValue.value)
  } else {
    payload.internalTaxType = 'NONE'
    payload.internalTaxValue = 0
  }

  // Combos/Kits payload
  payload.comboOwnPrice = !!form.comboOwnPrice
  payload.comboComponents = Array.isArray(form.comboComponents)
    ? form.comboComponents
        .filter((row: any) => row && row.code && Number(row.qty) > 0)
        .map((row: any) => ({ code: String(row.code).trim(), qty: Number(row.qty) }))
    : []

  // Remove client-only / unsupported fields
  delete payload.photo
  delete payload.uomBase
  delete payload.uomFactor
  delete payload.uomPriceOverride
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
          const previewPath = result?.thumbnailUrl || result?.imageUrl
          photoPreview.value = resolveImgUrl(previewPath) || photoPreview.value
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
          const previewPath = result?.thumbnailUrl || result?.imageUrl
          photoPreview.value = resolveImgUrl(previewPath) || photoPreview.value
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

// Quantity Promotion tiers
function addPromoTier() {
  promoTiers.push({ minQtyUn: Math.max(1, (promoTiers.at(-1)?.minQtyUn || 0) + 1), pricePerUnit: null, percentOff: null, sort: promoTiers.length })
}
function removePromoTier(idx: number) { promoTiers.splice(idx, 1) }

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
    const url = props.initial?.image?.thumbnailUrl || props.initial?.imageUrl
    photoPreview.value = resolveImgUrl(url)
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
