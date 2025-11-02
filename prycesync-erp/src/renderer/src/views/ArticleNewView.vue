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
              <!-- Fila 1: 50% / 25% / 25% -->
              <div class="col-span-6">
                <label class="text-xs font-semibold">Nombre *</label>
                <input v-model="form.name" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Nombre del artículo" />
              </div>
              <div class="col-span-3">
                <label class="text-xs font-semibold">EAN / PLU</label>
                <input v-model="form.ean" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Código de barras" />
                <p v-if="validation.eanDuplicate" class="mt-1 text-[10px] text-red-600">EAN duplicado</p>
              </div>
              <div class="col-span-3">
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
                <select v-model="form.categoryId" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default">
                  <option value="">Seleccionar</option>
                  <option value="alimentos">Alimentos</option>
                  <option value="hogar">Hogar</option>
                </select>
              </div>
              <div class="col-span-4">
                <label class="text-xs font-semibold">Sub-rubro *</label>
                <select v-model="form.subCategoryId" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default">
                  <option value="">Seleccionar</option>
                  <option value="enlatados">Enlatados</option>
                  <option value="limpieza">Limpieza</option>
                </select>
              </div>
              <div class="col-span-4">
                <label class="text-xs font-semibold">SKU</label>
                <input v-model="form.sku" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Opcional" />
              </div>

              <!-- Fila 3: 33% / 33% / 33% -->
              <div class="col-span-4">
                <label class="text-xs font-semibold">Proveedor 1 *</label>
                <input v-model="form.supplier1" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Buscar proveedor" />
              </div>
              <div class="col-span-4">
                <label class="text-xs font-semibold">Proveedor 2</label>
                <input v-model="form.supplier2" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" placeholder="Opcional" />
              </div>
              <div class="col-span-4">
                <label class="text-sm font-semibold opacity-0">Acción</label>
                <div class="mt-1">
                  <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click.prevent>+ Nuevo proveedor</button>
                </div>
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

        <!-- Columna 2: Precios, Stock -->
        <div class="col-span-1 grid grid-rows-[1fr_1fr] gap-4 h-full">
          <!-- Precios -->
          <div class="ps-card p-4 h-full">
            <h2 class="text-base font-bold mb-2">Precios (directo ↔ inverso)</h2>
            <div class="flex items-center gap-4 mb-2">
              <label class="flex items-center gap-1.5 text-xs"><input type="radio" value="direct" v-model="calc.mode" /> Directo (costo→precio)</label>
              <label class="flex items-center gap-1.5 text-xs"><input type="radio" value="inverse" v-model="calc.mode" /> Inverso (precio→margen)</label>
            </div>
            <div class="grid grid-cols-2 gap-2">
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
                <p class="mt-1 text-[10px] text-secondary">Nota de redondeo (2 dec, HALF_UP).</p>
              </div>
            </div>

            <!-- Checks fiscales al final de la card de Precios -->
            <div class="mt-4 grid grid-cols-3 gap-2 text-xs">
              <label class="flex items-center gap-1.5"><input type="checkbox" v-model="fiscal.iibbRetPerc" /> IIBB (ret/perc)</label>
              <label class="flex items-center gap-1.5"><input type="checkbox" v-model="fiscal.gananciasRet" /> Ganancias (ret)</label>
              <label class="flex items-center gap-1.5"><input type="checkbox" v-model="fiscal.percIva" /> Percepción IVA</label>
            </div>
          </div>
          <!-- Stock & UoM -->
          <div class="ps-card p-4 h-full">
            <h2 class="text-base font-bold mb-2">Stock & UoM</h2>
            <div class="grid grid-cols-2 gap-2">
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
            <div class="mt-4">
              <label class="text-xs font-semibold">UoM base: UN</label>
            </div>
            <div class="mt-4">
              <div class="text-xs font-semibold mb-1.5">Conversiones</div>
              <div class="grid grid-cols-3 gap-1.5 text-xs">
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
            <div class="mt-4">
              <label class="flex items-center gap-1.5 text-xs"><input type="checkbox" v-model="stock.byWeight" /> (Opcional) Venta por peso</label>
            </div>
          </div>
        </div>
        <!-- Columna 3: Combos, Reglas, Resumen -->
        <div class="col-span-1 grid grid-rows-[1fr_1fr_1fr] gap-4 h-full">
          <!-- Combos/Kits -->
          <div class="ps-card p-4 h-full">
            <h2 class="text-base font-bold mb-2">Combos/Kits</h2>
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
                  <tr>
                    <td class="px-2 py-1">ART-001</td>
                    <td class="px-2 py-1 break-words">Item A</td>
                    <td class="px-2 py-1">2</td>
                    <td class="px-2 py-1">UN</td>
                    <td class="px-2 py-1">10</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3">
              <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1">+ Agregar componente</button>
              <p class="mt-2 text-xs text-secondary">Al vender combo descuenta stock de componentes.</p>
            </div>
          </div>

          <!-- Reglas -->
          <div class="ps-card p-4 h-full">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-bold">Reglas</h2>
              <div class="flex items-center gap-2">
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="tab9 = 'mayorista'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'mayorista' }">Mayorista & Promos</button>
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="tab9 = 'puntos'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'puntos' }">Puntos</button>
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="tab9 = 'dos'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'dos' }">Días de stock</button>
                <button class="ps-btn ps-btn--secondary ps-btn--compact text-xs px-3 py-1" @click="tab9 = 'auditoria'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'auditoria' }">Auditoría</button>
              </div>
            </div>
            <div v-show="tab9 === 'mayorista'" class="space-y-3">
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
                      <td class="px-2 py-1">UN</td>
                      <td class="px-2 py-1">10</td>
                      <td class="px-2 py-1 break-words">%OFF 5</td>
                      <td class="px-2 py-1 break-words">2025-01-01→2025-12-31</td>
                      <td class="px-2 py-1">✔</td>
                      <td class="px-2 py-1">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-show="tab9 === 'puntos'" class="text-xs">
              <label class="text-sm font-semibold">pointsPerUnit</label>
              <input type="number" v-model.number="pointsPerUnit" class="w-full mt-1 px-2 py-1 text-xs rounded-md border-default" />
              <p class="mt-1 text-[10px] text-secondary">0 = no otorga.</p>
            </div>
            <div v-show="tab9 === 'dos'" class="text-xs space-y-2">
              <div>avg 7/30/90: — / — / —</div>
              <div>ventana usada: 90d</div>
              <div>DoS, ROP, Sugerida: —</div>
              <button class="ps-btn ps-btn--primary ps-btn--compact text-xs px-3 py-1">Crear orden sugerida</button>
            </div>
            <div v-show="tab9 === 'auditoria'" class="text-sm space-y-2">
              <div>Creado por: — / fecha: —</div>
              <div>Actualizado por: — / fecha: —</div>
              <div>Ver Kardex del artículo</div>
            </div>
          </div>

          <!-- Resumen de precio -->
          <div class="ps-card p-4 h-full">
            <h2 class="text-base font-bold mb-2">Resumen de precio</h2>
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <div>Costo: <strong>{{ toCurrency(calc.cost) }}</strong></div>
              <div>Imp. Interno: <strong>{{ toCurrency(effectiveInternalTax) }}</strong></div>
              <div>IVA: <strong>{{ toCurrency(ivaAmount) }}</strong></div>
              <div class="col-span-2">= Precio público: <strong class="text-emerald-700">{{ toCurrency(calc.pricePublic) }}</strong></div>
            </div>
            <div class="mt-2">
              <span v-if="wholesaleBadge" class="inline-block px-2 py-1 text-xs rounded-md bg-emerald-100 text-emerald-800">Precio x Mayor</span>
            </div>
          </div>
        </div>
      </div>
    </main>
    </div>
  </DashboardLayout>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import DashboardLayout from '@/components/organisms/DashboardLayout.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isDirty = ref(false);
const isSaving = ref(false);

// Header state integrado al formulario

// Form basics
const form = ref({
  name: '',
  categoryId: '',
  subCategoryId: '',
  sku: '',
  ean: '',
  active: true,
  autoCode: false,
  supplier1: '',
  supplier2: ''
});
  const imagePreview = ref('');
  const imageInput = ref<HTMLInputElement | null>(null);
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
  }

  function removeImage() {
    if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
    imagePreview.value = '';
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
const stock = ref({ min: 0, max: 0, byWeight: false });
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

// Validation flags
const validation = ref({ eanDuplicate: false, stockInvalid: false, uomInvalid: false, aliasDuplicate: false });

// Derived amounts
const effectiveInternalTax = computed(() => calc.value.internalTaxIsPct ? (calc.value.cost * calc.value.internalTax / 100) : calc.value.internalTax);
const ivaAmount = computed(() => {
  const base = calc.value.pricePublic / (1 + calc.value.ivaPct / 100);
  return calc.value.pricePublic - base;
});
const wholesaleBadge = computed(() => false); // placeholder

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
  console.log('Guardando...');
  // Simular llamada a API
  await new Promise(resolve => setTimeout(resolve, 1500));
  isSaving.value = false;
  isDirty.value = false;
  console.log('Guardado con éxito.');
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
watch(() => form.value.ean, (v) => {
  // placeholder para duplicado
  validation.value.eanDuplicate = v === '1234567890123';
});
</script>
