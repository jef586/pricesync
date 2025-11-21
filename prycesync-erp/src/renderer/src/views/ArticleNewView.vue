<template>
  <DashboardLayout>
    <div class="bg-gray-50 dark:bg-gray-900 h-full flex flex-col">
    <!-- Header Fijo -->
    <header class="sticky top-0 bg-white dark:bg-gray-800 ps-header shadow-md px-6 z-10">
      <div class="w-full flex items-center justify-between">
        <!-- Izquierda: Volver -->
        <button class="ps-btn ps-btn--secondary" @click="goBack">← Volver</button>

        <!-- Centro: Título con indicador dirty -->
        <h1 class="text-lg font-bold flex items-center gap-2">
          Nuevo artículo
          <span v-if="isDirty" title="Cambios sin guardar" class="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
        </h1>

        <!-- Derecha: Toggle Activo + Acciones -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
          <!-- Switch animado vinculado a estado (sin peer) -->
          <button
            type="button"
            role="switch"
            :aria-checked="String(form.active)"
            class="relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            :class="form.active ? 'bg-emerald-500' : 'bg-gray-300'"
            @click="form.active = !form.active"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              :class="form.active ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>

          <button class="ps-btn ps-btn--secondary" @click="saveAndNew" :disabled="isSaving">
            {{ isSaving ? 'Guardando…' : 'Guardar y nuevo' }}
          </button>
          <button class="ps-btn ps-btn--primary" @click="save" :disabled="isSaving">
            {{ isSaving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido Principal con Grid -->
    <main class="pt-4 px-4 flex-1">
      <div class="grid grid-cols-3 gap-5 items-stretch h-full">
        <!-- Columna 1: Básicos, Códigos, Imagen -->
        <div class="col-span-1 grid grid-rows-[minmax(300px,auto)_minmax(260px,auto)_auto] gap-4 h-full">
          <!-- Básicos -->
          <div class="ps-card p-4 min-h-[300px]">
            <h2 class="text-base font-bold mb-2">Básicos</h2>
            <div class="grid grid-cols-12 gap-1.5">
              <!-- Fila 1: Nombre + Tipo -->
              <div class="col-span-6">
                <label class="text-xs font-semibold">Nombre *</label>
                <input v-model="form.name" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Nombre del artículo" />
              </div>
              <div class="col-span-6">
                <label class="text-xs font-semibold">Tipo</label>
                <select v-model="form.type" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default">
                  <option value="PRODUCT">Producto</option>
                  <option value="SERVICE">Servicio</option>
                </select>
              </div>

              <!-- Fila 2: EAN/PLU + Código automático -->
              <div class="col-span-6">
                <label class="text-xs font-semibold">EAN / PLU</label>
                <input v-model="form.ean" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Código de barras" />
                <p v-if="validation.eanDuplicate" class="mt-1 text-[10px] text-red-600">EAN duplicado</p>
              </div>
              <div class="col-span-6">
                <div class="mt-6">
                  <label class="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" v-model="form.autoCode" />
                    Código automático
                  </label>
                </div>
              </div>

              <!-- Fila 2: 33% / 33% / 33% -->
              <div class="col-span-4">
                <label class="text-xs font-semibold">Rubro *</label>
                <select v-model="form.categoryId" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" :disabled="loadingRubros">
                  <option value="">{{ loadingRubros ? 'Cargando...' : 'Seleccionar' }}</option>
                  <option v-for="rubro in rubros" :key="rubro.id" :value="rubro.id">
                    {{ rubro.name }}
                  </option>
                </select>
              </div>
              <div class="col-span-4">
                <label class="text-xs font-semibold">Sub-rubro *</label>
                <select v-model="form.subCategoryId" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" :disabled="!form.categoryId || subrubros.length === 0">
                  <option value="">{{ !form.categoryId ? 'Seleccione rubro primero' : subrubros.length === 0 ? 'Sin subrubros' : 'Seleccionar' }}</option>
                  <option v-for="subrubro in subrubros" :key="subrubro.id" :value="subrubro.id">
                    {{ subrubro.name }}
                  </option>
                </select>
              </div>
              <div class="col-span-4">
                <label class="text-xs font-semibold">SKU</label>
                <input v-model="form.sku" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Opcional" />
              </div>

              <!-- Fila 3: 33% / 33% / 33% -->
              <div class="col-span-4">
                <label class="text-xs font-semibold">Proveedor 1 *</label>
                <select v-model="form.supplierId" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default">
                  <option value="">{{ suppliersLoading ? 'Cargando...' : 'Seleccionar' }}</option>
                  <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }} ({{ s.code }})</option>
                </select>
              </div>
              <div class="col-span-4">
                <label class="text-xs font-semibold">Proveedor 2</label>
                <select v-model="form.supplier2Id" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default">
                  <option value="">{{ suppliersLoading ? 'Cargando...' : 'Seleccionar' }}</option>
                  <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }} ({{ s.code }})</option>
                </select>
              </div>
              
            </div>
          </div>

          <!-- Códigos -->
          <div class="ps-card p-4 min-h-[260px]">
            <h2 class="text-base font-bold mb-2">Códigos</h2>
            <div>
              <div class="text-xs font-semibold mb-2">Códigos secundarios (alias)</div>
              <div class="flex items-center gap-2">
                <input v-model="aliasInput" class="flex-1 mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Agregar alias" />
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="addAlias">Agregar</button>
              </div>
              <ul class="mt-2 text-xs list-disc ml-5">
                <li v-for="a in aliases" :key="a">{{ a }} <button class="text-red-600 ml-2" @click="removeAlias(a)">Eliminar</button></li>
              </ul>
              <p v-if="validation.aliasDuplicate" class="mt-1 text-[10px] text-red-600">Alias duplicado</p>
            </div>
            <div class="mt-6">
              <div class="text-xs font-semibold mb-2">Código proveedor (equivalencia)</div>
              <table class="ps-table w-full text-xs leading-tight">
                <thead><tr><th>Proveedor</th><th>supplierSku</th><th>Notas</th></tr></thead>
                <tbody>
                  <tr>
                    <td><input class="w-full px-2 py-1 text-xs rounded-md border-default" placeholder="Proveedor" /></td>
                    <td><input class="w-full px-2 py-1 text-xs rounded-md border-default" placeholder="SKU" /></td>
                    <td><input class="w-full px-2 py-1 text-xs rounded-md border-default" placeholder="Notas" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Imagen -->
          <div class="ps-card p-4">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-base font-bold">Imagen</h2>
              <div class="flex items-center gap-2">
                <input ref="imageInput" type="file" class="hidden" accept="image/jpeg,image/png,image/webp" @change="onImageSelected" />
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="selectImageFile">Importar imagen</button>
              </div>
            </div>
            <!-- Layout: Dropzone izquierda, Miniatura derecha -->
            <div class="grid grid-cols-3 gap-3 items-start">
              <!-- Dropzone -->
              <div
                class="col-span-2 border-dashed border-2 rounded-md p-3 text-center text-xs text-secondary min-h-[140px] flex items-center justify-center cursor-pointer"
                @click="selectImageFile"
                @dragover.prevent
                @drop.prevent="onDrop"
              >
                <span>Dropzone (jpg/png/webp, hasta 3 MB)</span>
              </div>
              <!-- Miniatura fija -->
              <div class="col-span-1">
                <div class="rounded-md border-default bg-[var(--ps-input-bg)] flex items-center justify-center min-h-[140px]">
                  <img v-if="imagePreview" :src="imagePreview" alt="Miniatura" class="w-28 h-28 rounded-md object-cover" />
                  <span v-else class="text-xs text-secondary">Sin miniatura</span>
                </div>
                <div class="mt-2 flex gap-2">
                  <button v-if="imagePreview" class="ps-btn ps-btn--danger ps-btn--compact text-xs px-3 py-1" @click="removeImage">Quitar</button>
                </div>
              </div>
            </div>
            <p v-if="imageError" class="mt-2 text-[10px] text-red-600">{{ imageError }}</p>
          </div>
        </div>

        <!-- Columna 2: Precios, Stock, UoM -->
        <div class="col-span-1 grid grid-rows-[auto_auto_auto] gap-3 h-full">
          <section class="ps-card overflow-hidden max-w-full p-4">
            <h2 class="text-base font-bold mb-2">Precios y Listas</h2>
            <div class="flex items-center gap-3 mb-1">
              <label class="flex items-center gap-1.5 text-xs"><input type="radio" value="direct" v-model="calc.mode" /> Directo (costo→precio)</label>
              <label class="flex items-center gap-1.5 text-xs"><input type="radio" value="inverse" v-model="calc.mode" /> Inverso (precio→margen)</label>
            </div>
            <div class="grid grid-cols-2 gap-1">
              <div>
                <label class="text-xs font-semibold">Costo</label>
                <input type="number" v-model.number="calc.cost" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
              </div>
              <div>
                <label class="text-xs font-semibold">Impuesto Interno</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="number" v-model.number="calc.internalTax" class="flex-1 px-2 py-1 text-xs rounded-md border-default" />
                  <label class="flex items-center gap-1.5 text-xs"><input type="checkbox" v-model="calc.internalTaxIsPct" /> %</label>
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold">IVA %</label>
                <select v-model.number="calc.ivaPct" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default">
                  <option :value="0">0%</option>
                  <option :value="10.5">10.5%</option>
                  <option :value="21">21%</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold">Margen %</label>
                <input type="number" v-model.number="calc.marginPct" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
              </div>
              <div class="col-span-2">
                <label class="text-xs font-semibold">Precio público</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="number" v-model.number="calc.pricePublic" class="flex-1 px-2 py-1 text-xs rounded-md border-default" />
                  <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="recalculate">↻ Recalcular</button>
                </div>
              </div>
            </div>
            <div class="mt-2 grid grid-cols-4 gap-1 text-xs">
              <div>Ganancia: <strong>{{ toCurrency(computedGainAmount) }}</strong></div>
              <div>Margen: <strong>{{ computedMarginPct }}%</strong></div>
              <div>IVA: <strong>{{ toCurrency(ivaAmount) }}</strong></div>
              <div>Imp. Interno: <strong>{{ toCurrency(effectiveInternalTax) }}</strong></div>
            </div>
            <div class="mt-2 grid grid-cols-3 gap-1 text-xs">
              <label class="flex items-center gap-1.5"><input type="checkbox" v-model="fiscal.iibbRetPerc" /> IIBB (ret/perc)</label>
              <label class="flex items-center gap-1.5"><input type="checkbox" v-model="fiscal.gananciasRet" /> Ganancias (ret)</label>
              <label class="flex items-center gap-1.5"><input type="checkbox" v-model="fiscal.percIva" /> Percepción IVA</label>
            </div>
            <div class="mt-3 space-y-1 w-full text-xs">
              <div class="grid grid-cols-12 gap-0.5 items-center w-full">
                <div class="col-span-5 flex items-center gap-1 min-w-0">
                  <span class="font-semibold truncate">L1 Ganancia %:</span>
                  <input type="number" step="0.01" v-model.number="priceLists[1].margin" @input="lastEditedByRow[1] = 'margin'" class="compact-input compact-input--sm rounded-md border-default" />
                </div>
                <div class="col-span-5 flex items-center gap-1 min-w-0">
                  <span class="font-semibold truncate">Precio final:</span>
                  <input type="number" step="0.01" v-model.number="priceLists[1].final" @input="lastEditedByRow[1] = 'final'" class="compact-input compact-input--price rounded-md border-default" />
                </div>
                <div class="col-span-2 min-w-0">
                  
                </div>
              </div>
              <div class="grid grid-cols-12 gap-0.5 items-center w-full">
                <div class="col-span-5 flex items-center gap-1 min-w-0">
                  <span class="font-semibold truncate">L2 Ganancia %:</span>
                  <input type="number" step="0.01" v-model.number="priceLists[2].margin" @input="lastEditedByRow[2] = 'margin'" class="compact-input compact-input--sm rounded-md border-default" />
                </div>
                <div class="col-span-5 flex items-center gap-1 min-w-0">
                  <span class="font-semibold truncate">Precio final:</span>
                  <input type="number" step="0.01" v-model.number="priceLists[2].final" @input="lastEditedByRow[2] = 'final'" class="compact-input compact-input--price rounded-md border-default" />
                </div>
                <div class="col-span-2 min-w-0">
                  
                </div>
              </div>
              <div class="grid grid-cols-12 gap-0.5 items-center w-full">
                <div class="col-span-5 flex items-center gap-1 min-w-0">
                  <span class="font-semibold truncate">L3 Ganancia %:</span>
                  <input type="number" step="0.01" v-model.number="priceLists[3].margin" @input="lastEditedByRow[3] = 'margin'" class="compact-input compact-input--sm rounded-md border-default" />
                </div>
                <div class="col-span-5 flex items-center gap-1 min-w-0">
                  <span class="font-semibold truncate">Precio final:</span>
                  <input type="number" step="0.01" v-model.number="priceLists[3].final" @input="lastEditedByRow[3] = 'final'" class="compact-input compact-input--price rounded-md border-default" />
                </div>
                <div class="col-span-2 min-w-0">
                  
                </div>
              </div>
              <div class="grid grid-cols-12 gap-0.5 items-center w-full">
                <div class="col-span-5 flex items-center gap-1 min-w-0">
                  <span class="font-semibold truncate">L4 (Promo) Precio:</span>
                  <input :value="toCurrency(l4Preview)" class="compact-input compact-input--price rounded-md border-default bg-gray-50" readonly />
                </div>
                <div class="col-span-5 flex items-center gap-1 min-w-0">
                  <span class="font-semibold truncate">Cantidad:</span>
                  <input type="number" min="1" v-model.number="l4Qty" class="compact-input compact-input--sm rounded-md border-default" placeholder="Qty" />
                </div>
                <div class="col-span-2 min-w-0">
                  <button class="ps-btn ps-btn--secondary ps-btn--compact px-2 py-1 w-full" @click="openPromoModal">Configurar</button>
                </div>
              </div>
              <div class="text-[10px] text-secondary">Redondeo: 2 dec, HALF_UP. IVA e Imp. Interno incluidos. Si Qty ≥ mínimo y hay promo, se aplica % desc.</div>
            </div>
          </section>
          <!-- Stock -->
          <div class="ps-card p-3">
            <h2 class="text-base font-bold mb-2">Stock</h2>
            <div class="grid grid-cols-2 gap-1">
              <div>
                <label class="text-xs font-semibold">Stock mín</label>
                <input type="number" v-model.number="stock.min" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
              </div>
              <div>
                <label class="text-xs font-semibold">Stock máx</label>
                <input type="number" v-model.number="stock.max" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
                <p v-if="validation.stockInvalid" class="mt-1 text-[10px] text-red-600">stock máximo menor que mínimo</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-1 mt-1">
              <div>
                <label class="text-xs font-semibold">Días de stock</label>
                <input type="number" min="0" v-model.number="stock.days" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="0" />
              </div>
            </div>
          </div>

          <!-- Unidades de medida -->
          <div class="ps-card p-3">
            <h2 class="text-base font-bold mb-2">Unidades de medida</h2>
            <div>
              <label class="text-xs font-semibold">Unidad base: UN</label>
            </div>
            <div class="mt-1">
              <div class="text-xs font-semibold mb-1.5">Conversiones</div>
              <div class="grid grid-cols-3 gap-1 text-xs">
                <div>BU</div>
                <div><input type="number" v-model.number="uom.bu.factor" class="w-full px-2 py-1 text-xs rounded-md border-default" /></div>
                <div><input type="number" v-model.number="uom.bu.decimals" class="w-full px-2 py-1 text-xs rounded-md border-default" /></div>
                <div>KG</div>
                <div><input type="number" v-model.number="uom.kg.factor" class="w-full px-2 py-1 text-xs rounded-md border-default" /></div>
                <div><input type="number" v-model.number="uom.kg.decimals" class="w-full px-2 py-1 text-xs rounded-md border-default" /></div>
                <div>LT</div>
                <div><input type="number" v-model.number="uom.lt.factor" class="w-full px-2 py-1 text-xs rounded-md border-default" /></div>
                <div><input type="number" v-model.number="uom.lt.decimals" class="w-full px-2 py-1 text-xs rounded-md border-default" /></div>
              </div>
              <p v-if="validation.uomInvalid" class="mt-1 text-[10px] text-blue-700">Info: factor UoM inválido / regla mayorista inconsistente</p>
            </div>
          </div>
        </div>
        <!-- Columna 3: Combos, Reglas, Resumen -->
        <div class="col-span-1 grid grid-rows-[1fr_1fr_1fr] gap-4 h-full">
          <!-- Combos/Kits -->
          <div class="ps-card p-4 h-full">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-base font-bold">Combos y Promociones</h2>
              <div class="flex items-center gap-2">
                <button
                  v-if="!hasPromo"
                  class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1"
                  @click="openPromoModal"
                >Promoción por cantidad</button>
                <button
                  v-else
                  class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1"
                  @click="openPromoModal"
                >Editar promo</button>
                <button
                  v-if="hasPromo"
                  class="ps-btn ps-btn--danger ps-btn--compact text-xs px-3 py-1"
                  @click="removePromo"
                >Quitar promo</button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="ps-table w-full table-fixed text-xs leading-tight">
                <thead>
                  <tr>
                    <th class="px-2 py-1">Código</th>
                    <th class="px-2 py-1">Nombre</th>
                    <th class="px-2 py-1">Cantidad</th>
                    <th class="px-2 py-1">UoM</th>
                    <th class="px-2 py-1">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in components" :key="c.key" class="hover:bg-gray-50">
                    <td class="px-2 py-1">{{ c.sku || c.barcode || c.articleId || '—' }}</td>
                    <td class="px-2 py-1 break-words">{{ c.name || '—' }}</td>
                    <td class="px-2 py-1">{{ c.qty }}</td>
                    <td class="px-2 py-1">UN</td>
                    <td class="px-2 py-1">{{ c.stock ?? '—' }}</td>
                  </tr>
                  <tr v-if="components.length === 0">
                    <td class="px-2 py-1 text-secondary" colspan="5">Sin componentes. Agregue al menos uno.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3">
              <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="showComponentModal = true">+ Agregar componente</button>
              <p class="mt-2 text-xs text-secondary">Al vender combo descuenta stock de componentes.</p>
            </div>
          </div>

          <!-- Reglas -->
          <div class="ps-card p-4 h-full">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-bold">Reglas</h2>
              <div class="flex items-center gap-2">
                <!-- <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="tab9 = 'mayorista'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'mayorista' }">Mayorista & Promos</button> -->
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="tab9 = 'puntos'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'puntos' }">Puntos</button>
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="tab9 = 'dos'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'dos' }">Días de stock</button>
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="tab9 = 'auditoria'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'auditoria' }">Auditoría</button>
              </div>
            </div>
            <!-- <div v-show="tab9 === 'mayorista'" class="space-y-3">
              <div class="text-sm font-semibold">Reglas por cantidad</div>
              <div>
                <table class="ps-table w-full table-auto text-xs leading-tight">
                  <thead>
                    <tr>
                      <th class="px-2 py-1">UoM</th>
                      <th class="px-2 py-1">minQty</th>
                      <th class="px-2 py-1">UNIT_PRICE/%OFF</th>
                      <th class="px-2 py-1">Vigencia</th>
                      <th class="px-2 py-1">Activo</th>
                      <th class="px-2 py-1">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody class="text-[11px]">
                    <tr>
                      <td class="px-2 py-1">{{ promoForm.uom }}</td>
                      <td class="px-2 py-1">{{ promoForm.minQty }}</td>
                      <td class="px-2 py-1 break-words">{{ hasPromo ? ('%OFF ' + promoForm.offPct) : '—' }}</td>
                      <td class="px-2 py-1 break-words">2025-01-01→2025-12-31</td>
                      <td class="px-2 py-1">{{ hasPromo ? '✔' : '—' }}</td>
                      <td class="px-2 py-1">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div> -->
            <div v-show="tab9 === 'puntos'" class="text-xs">
              <label class="text-sm font-semibold">pointsPerUnit</label>
              <input type="number" v-model.number="pointsPerUnit" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
              <p class="mt-1 text-[10px] text-secondary">0 = no otorga.</p>
            </div>
            <div v-show="tab9 === 'dos'" class="text-xs space-y-2">
              <div class="flex items-center gap-2">
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="refreshDos">Actualizar</button>
              </div>
              <div>
                <div>avg 7/30/90: {{ dosStats ? `${dosStats.avgDaily} / — / —` : '— / — / —' }}</div>
                <div>ventana usada: {{ dosStats ? `${dosStats.windowUsed}d` : '—' }}</div>
                <div>DoS: {{ dosStats ? dosStats.daysOfStock : '—' }}</div>
                <div>ROP: {{ dosStats ? dosStats.reorderPoint : '—' }}</div>
                <div>Sugerida: {{ dosStats ? dosStats.suggestedQty : '—' }}</div>
              </div>
              <button class="ps-btn ps-btn--primary ps-btn--compact text-xs px-3 py-1">Crear orden sugerida</button>
            </div>
            <div v-show="tab9 === 'auditoria'" class="text-sm space-y-2">
              <div>Creado por: — / fecha: —</div>
              <div>Actualizado por: — / fecha: —</div>
              <div>Ver Kardex del artículo</div>
            </div>
          </div>

          
          </div>
      </div>
    </main>
    </div>
  </DashboardLayout>

  <!-- Modal de Promoción por cantidad -->
  <BaseModal v-model="showPromoModal" title="Promoción por cantidad" size="md">
    <form id="promoForm" @submit.prevent="savePromo" class="space-y-3">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label class="text-xs font-semibold">UoM</label>
          <select v-model="promoForm.uom" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default">
            <option value="UN">UN</option>
            <option value="KG">KG</option>
            <option value="LT">LT</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold">Cantidad mínima</label>
          <input type="number" v-model.number="promoForm.minQty" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
        </div>
        <div class="col-span-2">
          <label class="text-xs font-semibold">Descuento %</label>
          <input type="number" v-model.number="promoForm.offPct" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
        </div>
      </div>
    </form>
    <template #footer>
      <button class="ps-btn ps-btn--secondary" @click="showPromoModal = false">Cancelar</button>
      <button class="ps-btn ps-btn--primary" form="promoForm" @click="savePromo">Guardar</button>
    </template>
  </BaseModal>
  <!-- Modal de componente de combo -->
  <BaseModal v-model="showComponentModal" title="Agregar componente" size="md">
    <form id="compForm" @submit.prevent="addComponent" class="space-y-3">
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div class="col-span-2">
          <label class="text-xs font-semibold">Código (SKU / EAN)</label>
          <input v-model="componentForm.code" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Ingrese SKU o código de barras" />
          <p v-if="componentForm.error" class="mt-1 text-[10px] text-red-600">{{ componentForm.error }}</p>
        </div>
        <div>
          <label class="text-xs font-semibold">Cantidad</label>
          <input type="number" min="1" v-model.number="componentForm.qty" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
        </div>
        <div class="col-span-3">
          <button type="button" class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="resolveComponent">Buscar y precargar</button>
          <div v-if="componentForm.resolved" class="mt-2 text-xs">
            <div><strong>Artículo:</strong> {{ componentForm.resolved.name }} ({{ componentForm.resolved.sku || componentForm.resolved.barcode || componentForm.resolved.id }})</div>
          </div>
        </div>
      </div>
    </form>
    <template #footer>
      <button class="ps-btn ps-btn--secondary" @click="showComponentModal = false">Cancelar</button>
      <button class="ps-btn ps-btn--primary" form="compForm" @click="addComponent">Agregar</button>
    </template>
  </BaseModal>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import DashboardLayout from '@/components/organisms/DashboardLayout.vue';
import BaseModal from '@/components/atoms/BaseModal.vue';
import { useSuppliers } from '@/composables/useSuppliers';
import { useRouter } from 'vue-router';
import { createArticle, resolveArticle } from '@/services/articles';
import { apiClient } from '@/services/api';
import { createPromotion, getPromotion, createTier } from '@/services/quantityPromotionService';
import { listRubros } from '@/services/rubros';
import type { RubroDTO } from '@/types/rubro';

  const router = useRouter();
  const isDirty = ref(false);
  const isSaving = ref(false);
  const { suppliers, fetchSuppliers, isLoading: suppliersLoading } = useSuppliers();

  // Estados para rubros y subrubros
  const rubros = ref<RubroDTO[]>([]);
  const subrubros = ref<RubroDTO[]>([]);
  const loadingRubros = ref(false);

// Header state integrado al formulario

// Form basics
const form = ref({
  name: '',
  type: 'PRODUCT',
  categoryId: '',
  subCategoryId: '',
  sku: '',
  ean: '',
  active: true,
  autoCode: false,
  supplierId: '',
  supplier2Id: ''
});
  const imagePreview = ref('');
  const imageInput = ref<HTMLInputElement | null>(null);
  const imageFile = ref<File | null>(null);
  const imageError = ref('');

  function selectImageFile() {
    imageInput.value?.click();
  }

  function onImageSelected(event: Event) {
    imageError.value = '';
    const target = event.target as HTMLInputElement;
    const files = target?.files;
    if (!files || !files[0]) return;
    const file = files[0];
    handleImageFile(file);
  }

  function onDrop(event: DragEvent) {
    imageError.value = '';
    const files = event.dataTransfer?.files;
    if (!files || !files[0]) return;
    const file = files[0];
    handleImageFile(file);
  }

  function handleImageFile(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      imageError.value = 'Formato no soportado. Use JPG/PNG/WebP.';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      imageError.value = 'El archivo supera 3 MB.';
      return;
    }
    if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
    const url = URL.createObjectURL(file);
    imagePreview.value = url;
    imageFile.value = file;
  }

  function removeImage() {
    if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
    imagePreview.value = '';
    imageFile.value = null;
  }

// Pricing
const calc = ref({
  mode: 'direct', // 'direct' | 'inverse'
  cost: 0,
  internalTax: 0,
  internalTaxIsPct: false,
  ivaPct: 21,
  marginPct: 20,
  pricePublic: 0
});

// Fiscal flags
const fiscal = ref({ iibbRetPerc: false, gananciasRet: false, percIva: false });

// (Simulador eliminado)

// Stock & UoM
const stock = ref({ min: 0, max: 0, days: 0, byWeight: false });
const uom = ref({
  bu: { factor: 12, decimals: 0 },
  kg: { factor: 1, decimals: 3 },
  lt: { factor: 1, decimals: 3 }
});

// Codes
const aliases = ref<string[]>([]);
const aliasInput = ref('');

// Tabs (.div9)
const tab9 = ref<'mayorista' | 'puntos' | 'dos' | 'auditoria'>('mayorista');
const pointsPerUnit = ref(0);

// Promoción por cantidad (UI local)
const hasPromo = ref(false);
const showPromoModal = ref(false);
const promoForm = ref({ uom: 'UN', minQty: 10, offPct: 5 });
const openPromoModal = () => { showPromoModal.value = true };
const removePromo = () => { hasPromo.value = false };
const savePromo = () => { hasPromo.value = true; showPromoModal.value = false };

// Combos dinámicos
type ComboComponent = { key: string; articleId?: string; sku?: string; barcode?: string; name?: string; qty: number; stock?: number };
const components = ref<ComboComponent[]>([]);
const showComponentModal = ref(false);
const componentForm = ref<{ code: string; qty: number; resolved: any | null; error: string | null }>({ code: '', qty: 1, resolved: null, error: null });

async function resolveComponent() {
  componentForm.value.error = null;
  const code = componentForm.value.code?.trim();
  if (!code) {
    componentForm.value.error = 'Ingrese un código para buscar';
    return;
  }
  try {
    const art = await resolveArticle({ barcode: code, sku: code });
    if (!art) {
      componentForm.value.error = 'Artículo no encontrado';
      componentForm.value.resolved = null;
      return;
    }
    componentForm.value.resolved = art;
  } catch (err: any) {
    componentForm.value.error = err?.message || 'Error resolviendo artículo';
  }
}

function addComponent() {
  componentForm.value.error = null;
  const qty = Number(componentForm.value.qty || 0);
  if (!(qty > 0)) {
    componentForm.value.error = 'Cantidad debe ser > 0';
    return;
  }
  const art = componentForm.value.resolved;
  if (!art) {
    componentForm.value.error = 'Primero busque y seleccione un artículo';
    return;
  }
  components.value.push({
    key: `${art.id}-${Date.now()}`,
    articleId: art.id,
    sku: art.sku,
    barcode: art.barcode,
    name: art.name,
    qty
  });
  componentForm.value = { code: '', qty: 1, resolved: null, error: null };
  showComponentModal.value = false;
}

// Validation flags
const validation = ref({ eanDuplicate: false, stockInvalid: false, uomInvalid: false, aliasDuplicate: false });

// Funciones para cargar rubros y subrubros
const loadRubros = async () => {
  loadingRubros.value = true;
  try {
    const response = await listRubros({ 
      page: 1, 
      size: 100, 
      status: 'active',
      level: 0 // Solo rubros padre (level 0)
    });
    rubros.value = response.items.filter(rubro => rubro.level === 0);
  } catch (error) {
    console.error('Error al cargar rubros:', error);
  } finally {
    loadingRubros.value = false;
  }
};

const loadSubrubros = async (parentId: string) => {
  if (!parentId) {
    subrubros.value = [];
    return;
  }
  
  try {
    const response = await listRubros({ 
      page: 1, 
      size: 100, 
      status: 'active',
      parentId: parentId // Filtrar por parentId
    });
    subrubros.value = response.items.filter(rubro => rubro.level === 1 && rubro.parentId === parentId);
  } catch (error) {
    console.error('Error al cargar subrubros:', error);
    subrubros.value = [];
  }
};

// Watch para detectar cambios en el rubro seleccionado
watch(() => form.value.categoryId, (newCategoryId) => {
  form.value.subCategoryId = ''; // Limpiar subrubro seleccionado
  if (newCategoryId) {
    loadSubrubros(newCategoryId);
  } else {
    subrubros.value = [];
  }
});

// Derived amounts
const effectiveInternalTax = computed(() => calc.value.internalTaxIsPct ? (calc.value.cost * calc.value.internalTax / 100) : calc.value.internalTax);
const ivaAmount = computed(() => {
  const base = calc.value.pricePublic / (1 + calc.value.ivaPct / 100);
  return calc.value.pricePublic - base;
});
const wholesaleBadge = computed(() => false); // placeholder

const ivaFactor = computed(() => 1 + (calc.value.ivaPct / 100));
const netPriceWithoutIva = computed(() => calc.value.pricePublic / ivaFactor.value);
const computedGainAmount = computed(() => {
  const neto = calc.value.cost + effectiveInternalTax.value;
  const gain = netPriceWithoutIva.value - neto;
  return roundHalfUp(Math.max(0, gain), 2);
});
const computedMarginPct = computed(() => {
  const neto = calc.value.cost + effectiveInternalTax.value;
  if (neto <= 0) return 0;
  return roundHalfUp(((netPriceWithoutIva.value / neto) - 1) * 100, 2);
});

function recalculate() {
  const cost = calc.value.cost;
  const internal = effectiveInternalTax.value;
  const marginFactor = 1 + (calc.value.marginPct / 100);
  const ivaFactor = 1 + (calc.value.ivaPct / 100);
  if (calc.value.mode === 'direct') {
    // precio público = (costo + interno) * margen * IVA
    const price = (cost + internal) * marginFactor * ivaFactor;
    calc.value.pricePublic = roundHalfUp(price, 2);
  } else {
    // inverso: dado precio público y margen, aproximar costo
    const baseWithoutIva = calc.value.pricePublic / ivaFactor;
    const costApprox = (baseWithoutIva / marginFactor) - internal;
    calc.value.cost = roundHalfUp(Math.max(0, costApprox), 2);
  }
}

function roundHalfUp(n: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor + Number.EPSILON) / factor;
}

function toCurrency(v: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0);
}

function computeL4Preview() {
  const base = Number(calc.value.pricePublic || 0)
  const qty = Number(l4Qty.value || 1)
  const minQty = Number(promoForm.value.minQty || 0)
  const offPct = Number(promoForm.value.offPct || 0)
  const has = !!hasPromo.value
  const apply = has && qty >= minQty && offPct > 0
  const result = apply ? base * (1 - offPct / 100) : base
  l4Preview.value = roundHalfUp(result, 2)
}

function addAlias() {
  const value = aliasInput.value.trim();
  if (!value) return;
  if (aliases.value.includes(value)) {
    validation.value.aliasDuplicate = true;
    return;
  }
  validation.value.aliasDuplicate = false;
  aliases.value.push(value);
  aliasInput.value = '';
}

function removeAlias(a: string) {
  aliases.value = aliases.value.filter(x => x !== a);
}

const goBack = () => {
  router.back();
};

const save = async () => {
  isSaving.value = true;
  try {
    const payload: any = {
      name: form.value.name?.trim(),
      type: form.value.type,
      active: !!form.value.active,
      sku: form.value.sku?.trim() || undefined,
      barcode: form.value.ean?.trim() || undefined,
      categoryId: form.value.categoryId || undefined,
      subCategoryId: form.value.subCategoryId || undefined,
      taxRate: Number(calc.value.ivaPct),
      cost: Number(calc.value.cost),
      gainPct: Number(calc.value.marginPct),
      pricePublic: Number(calc.value.pricePublic),
      internalTaxType: calc.value.internalTaxIsPct ? 'PERCENT' : 'AMOUNT',
      internalTaxValue: Number(calc.value.internalTax) || 0,
      stockMin: stock.value.min || undefined,
      stockMax: stock.value.max || undefined,
      pointsPerUnit: pointsPerUnit.value || undefined,
      bundleComponents: components.value.map(c => ({ articleId: c.articleId, qty: c.qty })),
      comboOwnPrice: false
    };

    const created = await createArticle(payload);
    const articleId = (created as any)?.id;
    lastCreatedArticleId.value = articleId || ''

    if (imageFile.value && articleId) {
      try {
        const { uploadArticleImage } = await import('@/services/articles');
        await uploadArticleImage(articleId, imageFile.value);
      } catch (err) {
        console.warn('No se pudo subir la imagen', err);
      }
    }

    if (hasPromo.value && articleId) {
      try {
        const convResp = await apiClient.post(`/articles/${articleId}/convert`, { uom: promoForm.value.uom, qty: promoForm.value.minQty });
        const minQtyUn = Number(convResp.data?.qtyUn ?? convResp.data?.convertedQty ?? promoForm.value.minQty);
        const existingPromo = await getPromotion(articleId);
        if (!existingPromo) {
          await createPromotion(articleId, { active: true, exclusive: false, priceListIds: [] });
        }
        await createTier(articleId, { minQtyUn, percentOff: Number(promoForm.value.offPct), pricePerUnit: null });
      } catch (err) {
        console.warn('No se pudo guardar la promoción por cantidad', err);
      }
    }

    isDirty.value = false;
    console.log('Guardado con éxito.', created);
  } catch (err) {
    console.error('Error guardando artículo', err);
  } finally {
    isSaving.value = false;
  }
};

const saveAndNew = async () => {
  await save();
  router.push('/articles/new'); 
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    goBack();
  }
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    save();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  // Marcar como 'dirty' cuando el usuario empiece a interactuar
  window.addEventListener('input', () => isDirty.value = true, { once: true });
  
  // Cargar rubros y proveedores al montar el componente
  loadRubros();
  try { fetchSuppliers({ limit: 500, status: 'active' }) } catch (_) {}
  computeL4Preview()
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('input', () => isDirty.value = true);
});


// Simple validations
watch([() => stock.value.min, () => stock.value.max], () => {
  validation.value.stockInvalid = stock.value.max < stock.value.min;
});
watch([() => uom.value.bu.factor, () => uom.value.kg.factor, () => uom.value.lt.factor], () => {
  validation.value.uomInvalid = [uom.value.bu.factor, uom.value.kg.factor, uom.value.lt.factor].some(f => f <= 0);
});

// --- UH-ART-26: Estado local L1–L3 y helpers ---
type FixedRow = { margin?: number, final?: number, locked: boolean }
const priceLists = ref<Record<number, FixedRow>>({
  1: { margin: 20, final: undefined, locked: false },
  2: { margin: 15, final: undefined, locked: false },
  3: { margin: 10, final: undefined, locked: false },
})
const lastEditedByRow: Record<number, 'margin' | 'final' | null> = { 1: null, 2: null, 3: null }
const lastCreatedArticleId = ref('')
const l4Qty = ref<number>(1)
const l4Preview = ref<number>(0)

function calcRow(row: number) {
  const r = priceLists.value[row]
  const ivaFactor = 1 + (calc.value.ivaPct / 100)
  const internal = effectiveInternalTax.value
  const neto = calc.value.cost + internal
  if (lastEditedByRow[row] === 'final') {
    const final = Number(r.final || 0)
    const precioNeto = final / ivaFactor
    const margen = ((precioNeto / neto) - 1) * 100
    r.margin = roundHalfUp(margen, 2)
  } else {
    const marginPct = Number(r.margin || 0)
    const precioNeto = neto * (1 + marginPct / 100)
    const final = precioNeto * ivaFactor
    r.final = roundHalfUp(final, 2)
  }
}

const recalcAllFixedRows = () => {
  ;[1,2,3].forEach((i) => calcRow(i))
}

watch([
  () => calc.value.cost,
  () => calc.value.internalTax,
  () => calc.value.internalTaxIsPct,
  () => calc.value.ivaPct
], () => {
  recalcAllFixedRows()
})

watch(() => priceLists.value[1].margin, () => { if (lastEditedByRow[1] === 'margin') calcRow(1) })
watch(() => priceLists.value[2].margin, () => { if (lastEditedByRow[2] === 'margin') calcRow(2) })
watch(() => priceLists.value[3].margin, () => { if (lastEditedByRow[3] === 'margin') calcRow(3) })
watch(() => priceLists.value[1].final, () => { if (lastEditedByRow[1] === 'final') calcRow(1) })
watch(() => priceLists.value[2].final, () => { if (lastEditedByRow[2] === 'final') calcRow(2) })
watch(() => priceLists.value[3].final, () => { if (lastEditedByRow[3] === 'final') calcRow(3) })

async function saveFixedPrices() {
  if (!lastCreatedArticleId.value) return
  // Validación: no permitir editar margen y precio a la vez
  for (const i of [1,2,3]) {
    const r = priceLists.value[i]
    if (r.margin != null && r.final != null) {
      alert('No se permite editar margen y precio a la vez (L'+i+')')
      return
    }
  }
  const payload: any = {
    l1MarginPct: priceLists.value[1].margin ?? null,
    l1FinalPrice: priceLists.value[1].final ?? null,
    l1Locked: !!priceLists.value[1].locked,
    l2MarginPct: priceLists.value[2].margin ?? null,
    l2FinalPrice: priceLists.value[2].final ?? null,
    l2Locked: !!priceLists.value[2].locked,
    l3MarginPct: priceLists.value[3].margin ?? null,
    l3FinalPrice: priceLists.value[3].final ?? null,
    l3Locked: !!priceLists.value[3].locked,
  }
  try {
    await apiClient.put(`/articles/${lastCreatedArticleId.value}/prices-fixed`, payload)
    alert('Listas fijas guardadas')
  } catch (err: any) {
    alert(err?.message || 'Error guardando listas fijas')
  }
}

async function refreshL4() {
  if (!lastCreatedArticleId.value) return
  // usar l1 por defecto para base
  const list = priceLists.value[1].final != null || priceLists.value[1].margin != null ? 'l1' : (priceLists.value[2].final != null || priceLists.value[2].margin != null ? 'l2' : 'l3')
  try {
    const resp = await apiClient.get(`/pricing/preview`, { params: { articleId: lastCreatedArticleId.value, qty: l4Qty.value, priceList: list } })
    l4Preview.value = Number(resp.data?.data?.finalUnitPrice || resp.data?.data?.baseUnitPrice || 0)
  } catch (err) {
    console.warn('No se pudo obtener preview L4', err)
    l4Preview.value = 0
  }
}
const dosStats = ref<any | null>(null)
async function refreshDos() {
  if (!lastCreatedArticleId.value) return
  try {
    const resp = await apiClient.get(`/stock/estimator/${lastCreatedArticleId.value}`, { params: { window: 'auto' } })
    dosStats.value = resp.data
  } catch (err) {
    dosStats.value = null
  }
}
watch(tab9, (v) => {
  if (v === 'dos') refreshDos()
})
watch(() => form.value.ean, (v) => {
  // placeholder para duplicado
  validation.value.eanDuplicate = v === '1234567890123';
});

// Recalcular L4 cuando cambian base/promo/qty (ubicado después de declarar l4Qty)
watch([
  () => calc.value.pricePublic,
  () => calc.value.cost,
  () => calc.value.marginPct,
  () => calc.value.ivaPct,
  () => calc.value.internalTax,
  () => l4Qty.value,
  () => promoForm.value.minQty,
  () => promoForm.value.offPct,
  () => hasPromo.value
], () => { computeL4Preview() })
</script>
<style scoped>
.compact-input { width: 6rem; padding: 0.25rem 0.5rem; font-size: 0.875rem; }
.compact-input--sm { width: 4.75rem; }
.compact-input--price { width: 6.75rem; }
</style>
