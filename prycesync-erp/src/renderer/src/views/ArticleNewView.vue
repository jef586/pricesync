<template>
  <DashboardLayout>
    <div class="bg-gray-50 dark:bg-gray-900 min-h-screen">
    <!-- Header Fijo -->
    <header class="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 ps-header shadow-md px-6 z-10">
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
          <span class="text-sm text-gray-600 dark:text-gray-400">Activo</span>
          <!-- Toggle básico para wireframe -->
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" checked>
            <div class="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
          </label>

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
    <main class="pt-20 px-6">
      <div class="grid grid-cols-3 grid-rows-3 gap-6">
        <!-- .div1 – Básicos + Imagen -->
        <div class="col-span-1 row-span-1 space-y-6">
          <!-- Básicos -->
          <div class="ps-card p-6">
            <h2 class="text-lg font-bold mb-4">Básicos</h2>
            <div class="grid grid-cols-12 gap-2">
              <!-- Fila 1: 50% / 25% / 25% -->
              <div class="col-span-6">
                <label class="text-sm font-semibold">Nombre *</label>
                <input v-model="form.name" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default" placeholder="Nombre del artículo" />
              </div>
              <div class="col-span-3">
                <label class="text-sm font-semibold">EAN / PLU</label>
                <input v-model="form.ean" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default" placeholder="Código de barras" />
                <p v-if="validation.eanDuplicate" class="mt-1 text-xs text-red-600">EAN duplicado</p>
              </div>
              <div class="col-span-3">
                <div class="mt-6">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" v-model="form.autoCode" />
                    Código automático
                  </label>
                </div>
              </div>

              <!-- Fila 2: 33% / 33% / 33% -->
              <div class="col-span-4">
                <label class="text-sm font-semibold">Rubro *</label>
                <select v-model="form.categoryId" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default">
                  <option value="">Seleccionar</option>
                  <option value="alimentos">Alimentos</option>
                  <option value="hogar">Hogar</option>
                </select>
              </div>
              <div class="col-span-4">
                <label class="text-sm font-semibold">Sub-rubro *</label>
                <select v-model="form.subCategoryId" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default">
                  <option value="">Seleccionar</option>
                  <option value="enlatados">Enlatados</option>
                  <option value="limpieza">Limpieza</option>
                </select>
              </div>
              <div class="col-span-4">
                <label class="text-sm font-semibold">SKU</label>
                <input v-model="form.sku" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default" placeholder="Opcional" />
              </div>

              <!-- Fila 3: 33% / 33% / 33% -->
              <div class="col-span-4">
                <label class="text-sm font-semibold">Proveedor 1 *</label>
                <input v-model="form.supplier1" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default" placeholder="Buscar proveedor" />
              </div>
              <div class="col-span-4">
                <label class="text-sm font-semibold">Proveedor 2</label>
                <input v-model="form.supplier2" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default" placeholder="Opcional" />
              </div>
              <div class="col-span-4">
                <label class="text-sm font-semibold opacity-0">Acción</label>
                <div class="mt-1">
                  <button class="ps-btn ps-btn--secondary ps-btn--compact" @click.prevent>+ Nuevo proveedor</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Imagen -->
          <div class="ps-card p-6">
            <h2 class="text-lg font-bold mb-4">Imagen</h2>
            <div class="border-dashed border-2 rounded-md p-6 text-center text-sm text-secondary">
              Dropzone (jpg/png/webp, hasta 3 MB)
            </div>
            <div v-if="imagePreview" class="mt-4 flex items-center gap-4">
              <div class="w-20 h-20 rounded-md bg-slate-200"></div>
              <button class="ps-btn ps-btn--danger" @click="imagePreview = ''">Quitar</button>
            </div>
          </div>
        </div>

        <!-- .div2 – Precios + Fiscal -->
        <div class="col-span-1 row-span-1 space-y-6">
          <!-- Precios -->
          <div class="ps-card p-6">
            <h2 class="text-lg font-bold mb-4">Precios (directo ↔ inverso)</h2>
            <div class="flex items-center gap-6 mb-4">
              <label class="flex items-center gap-2 text-sm"><input type="radio" value="direct" v-model="calc.mode" /> Directo (costo→precio)</label>
              <label class="flex items-center gap-2 text-sm"><input type="radio" value="inverse" v-model="calc.mode" /> Inverso (precio→margen)</label>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold">Costo</label>
                <input type="number" v-model.number="calc.cost" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default" />
              </div>
              <div>
                <label class="text-sm font-semibold">Impuesto Interno</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="number" v-model.number="calc.internalTax" class="flex-1 px-2 py-1 text-sm rounded-md border-default" />
                  <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="calc.internalTaxIsPct" /> %</label>
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold">IVA %</label>
                <select v-model.number="calc.ivaPct" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default">
                  <option :value="0">0%</option>
                  <option :value="10.5">10.5%</option>
                  <option :value="21">21%</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-semibold">Margen %</label>
                <input type="number" v-model.number="calc.marginPct" class="w-full mt-1 px-2 py-1 text-sm rounded-md border-default" />
              </div>
              <div class="col-span-2">
                <label class="text-sm font-semibold">Precio público</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="number" v-model.number="calc.pricePublic" class="flex-1 px-2 py-1 text-sm rounded-md border-default" />
                  <button class="ps-btn ps-btn--secondary" @click="recalculate">↻ Recalcular según modo</button>
                </div>
                <p class="mt-1 text-xs text-secondary">Nota de redondeo (2 dec, HALF_UP).</p>
              </div>
            </div>

            <!-- Checks fiscales al final de la card de Precios -->
            <div class="mt-6 grid grid-cols-3 gap-4 text-sm">
              <label class="flex items-center gap-2"><input type="checkbox" v-model="fiscal.iibbRetPerc" /> IIBB (ret/perc)</label>
              <label class="flex items-center gap-2"><input type="checkbox" v-model="fiscal.gananciasRet" /> Ganancias (ret)</label>
              <label class="flex items-center gap-2"><input type="checkbox" v-model="fiscal.percIva" /> Percepción IVA</label>
            </div>
          </div>

          <!-- Se eliminó la card “Fiscal” separada -->
        </div>

        <!-- .div3 – Simulador de precios -->
        <div class="ps-card p-6 col-span-1 row-span-1">
          <h2 class="text-lg font-bold mb-4">Simulador</h2>
          <div class="flex items-center gap-6 mb-4">
            <label class="flex items-center gap-2 text-sm"><input type="radio" value="direct" v-model="sim.mode" /> Directo</label>
            <label class="flex items-center gap-2 text-sm"><input type="radio" value="inverse" v-model="sim.mode" /> Inverso</label>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-semibold">Costo</label>
              <input type="number" v-model.number="sim.cost" class="w-full mt-1 px-3 py-3 rounded-md border-default" />
            </div>
            <div>
              <label class="text-sm font-semibold">Margen %</label>
              <input type="number" v-model.number="sim.marginPct" class="w-full mt-1 px-3 py-3 rounded-md border-default" />
            </div>
            <div>
              <label class="text-sm font-semibold">Precio</label>
              <input type="number" v-model.number="sim.price" class="w-full mt-1 px-3 py-3 rounded-md border-default" />
            </div>
          </div>
          <div class="mt-3 text-sm">Resultado en vivo: <strong>{{ simResult }}</strong></div>
          <div class="mt-4">
            <button class="ps-btn ps-btn--primary" @click="applySimulation">Aplicar al formulario</button>
          </div>
        </div>

        <!-- .div4 – Stock & UoM -->
        <div class="ps-card p-6 col-span-1 row-span-1">
          <h2 class="text-lg font-bold mb-4">Stock & UoM</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold">Stock mín</label>
              <input type="number" v-model.number="stock.min" class="w-full mt-1 px-3 py-3 rounded-md border-default" />
            </div>
            <div>
              <label class="text-sm font-semibold">Stock máx</label>
              <input type="number" v-model.number="stock.max" class="w-full mt-1 px-3 py-3 rounded-md border-default" />
              <p v-if="validation.stockInvalid" class="mt-1 text-xs text-red-600">stock máximo menor que mínimo</p>
            </div>
          </div>
          <div class="mt-4">
            <label class="text-sm font-semibold">UoM base: UN</label>
          </div>
          <div class="mt-4">
            <div class="text-sm font-semibold mb-2">Conversiones</div>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div>BU</div>
              <div><input type="number" v-model.number="uom.bu.factor" class="w-full px-2 py-2 rounded-md border-default" /></div>
              <div><input type="number" v-model.number="uom.bu.decimals" class="w-full px-2 py-2 rounded-md border-default" /></div>
              <div>KG</div>
              <div><input type="number" v-model.number="uom.kg.factor" class="w-full px-2 py-2 rounded-md border-default" /></div>
              <div><input type="number" v-model.number="uom.kg.decimals" class="w-full px-2 py-2 rounded-md border-default" /></div>
              <div>LT</div>
              <div><input type="number" v-model.number="uom.lt.factor" class="w-full px-2 py-2 rounded-md border-default" /></div>
              <div><input type="number" v-model.number="uom.lt.decimals" class="w-full px-2 py-2 rounded-md border-default" /></div>
            </div>
            <p v-if="validation.uomInvalid" class="mt-2 text-xs text-blue-700">Info: factor UoM inválido / regla mayorista inconsistente</p>
          </div>
          <div class="mt-4">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="stock.byWeight" /> (Opcional) Venta por peso</label>
          </div>
        </div>

        <!-- .div5 – Códigos -->
        <div class="ps-card p-6 col-span-1 row-span-1">
          <h2 class="text-lg font-bold mb-4">Códigos</h2>
          <div>
            <div class="text-sm font-semibold mb-2">Códigos secundarios (alias)</div>
            <div class="flex items-center gap-2">
              <input v-model="aliasInput" class="flex-1 px-3 py-3 rounded-md border-default" placeholder="Agregar alias" />
              <button class="ps-btn ps-btn--secondary" @click="addAlias">Agregar</button>
            </div>
            <ul class="mt-2 text-sm list-disc ml-5">
              <li v-for="a in aliases" :key="a">{{ a }} <button class="text-red-600 ml-2" @click="removeAlias(a)">Eliminar</button></li>
            </ul>
            <p v-if="validation.aliasDuplicate" class="mt-1 text-xs text-red-600">Alias duplicado</p>
          </div>
          <div class="mt-6">
            <div class="text-sm font-semibold mb-2">Código proveedor (equivalencia)</div>
            <table class="ps-table w-full text-sm">
              <thead><tr><th>Proveedor</th><th>supplierSku</th><th>Notas</th></tr></thead>
              <tbody>
                <tr>
                  <td><input class="w-full px-2 py-2 rounded-md border-default" placeholder="Proveedor" /></td>
                  <td><input class="w-full px-2 py-2 rounded-md border-default" placeholder="SKU" /></td>
                  <td><input class="w-full px-2 py-2 rounded-md border-default" placeholder="Notas" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- .div6 – Alertas -->
        <div class="col-span-1 row-span-1 space-y-3">
          <div class="ps-alert ps-alert--warning">
            <div class="ps-alert__icon">⚠️</div>
            <div>
              <div class="font-semibold">Stock bajo vs mínimo</div>
              <div class="text-sm">El stock actual está por debajo del mínimo configurado.</div>
            </div>
          </div>
          <div class="ps-alert ps-alert--danger">
            <div class="ps-alert__icon">⛔</div>
            <div>
              <div class="font-semibold">EAN/PLU duplicado</div>
              <div class="text-sm">Ver artículo relacionado</div>
            </div>
          </div>
          <div class="ps-alert ps-alert--info">
            <div class="ps-alert__icon">ℹ️</div>
            <div>
              <div class="font-semibold">Regla mayorista inconsistente</div>
              <div class="text-sm">Revisar factores y vigencias.</div>
            </div>
          </div>
        </div>

        <!-- .div7 – Resumen de precio -->
        <div class="ps-card p-6 col-span-1 row-span-1">
          <h2 class="text-lg font-bold mb-4">Resumen de precio</h2>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>Costo: <strong>{{ toCurrency(calc.cost) }}</strong></div>
            <div>Imp. Interno: <strong>{{ toCurrency(effectiveInternalTax) }}</strong></div>
            <div>IVA: <strong>{{ toCurrency(ivaAmount) }}</strong></div>
            <div class="col-span-2">= Precio público: <strong class="text-emerald-700">{{ toCurrency(calc.pricePublic) }}</strong></div>
          </div>
          <div class="mt-2">
            <span v-if="wholesaleBadge" class="inline-block px-2 py-1 text-xs rounded-md bg-emerald-100 text-emerald-800">Precio x Mayor</span>
          </div>
        </div>

        <!-- .div8 – Combos/Kits -->
        <div class="ps-card p-6 col-span-1 row-span-1">
          <h2 class="text-lg font-bold mb-4">Combos/Kits</h2>
          <table class="ps-table text-sm">
            <thead><tr><th>Código</th><th>Nombre</th><th>Cantidad</th><th>UoM</th><th>Stock</th></tr></thead>
            <tbody>
              <tr><td>ART-001</td><td>Item A</td><td>2</td><td>UN</td><td>10</td></tr>
            </tbody>
          </table>
          <div class="mt-3">
            <button class="ps-btn ps-btn--secondary">+ Agregar componente</button>
            <p class="mt-2 text-xs text-secondary">Al vender combo descuenta stock de componentes.</p>
          </div>
        </div>

        <!-- .div9 – Mayorista & Promos + Puntos + Días de stock + Auditoría -->
        <div class="ps-card p-6 col-span-1 row-span-1">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold">Reglas y Auditoría</h2>
            <div class="flex items-center gap-2 text-sm">
              <button class="ps-btn ps-btn--secondary" @click="tab9 = 'mayorista'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'mayorista' }">Mayorista & Promos</button>
              <button class="ps-btn ps-btn--secondary" @click="tab9 = 'puntos'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'puntos' }">Puntos</button>
              <button class="ps-btn ps-btn--secondary" @click="tab9 = 'dos'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'dos' }">Días de stock</button>
              <button class="ps-btn ps-btn--secondary" @click="tab9 = 'auditoria'" :class="{ 'ring-2 ring-emerald-400': tab9 === 'auditoria' }">Auditoría</button>
            </div>
          </div>
          <div v-show="tab9 === 'mayorista'" class="space-y-3 text-sm">
            <div class="text-sm font-semibold">Reglas por cantidad</div>
            <table class="ps-table">
              <thead><tr><th>UoM</th><th>minQty</th><th>UNIT_PRICE/%OFF</th><th>Vigencia</th><th>Activo</th><th>Prioridad</th></tr></thead>
              <tbody><tr><td>UN</td><td>10</td><td>%OFF 5</td><td>2025-01-01→2025-12-31</td><td>✔</td><td>1</td></tr></tbody>
            </table>
          </div>
          <div v-show="tab9 === 'puntos'" class="text-sm">
            <label class="text-sm font-semibold">pointsPerUnit</label>
            <input type="number" v-model.number="pointsPerUnit" class="w-full mt-1 px-3 py-3 rounded-md border-default" />
            <p class="mt-1 text-xs text-secondary">0 = no otorga.</p>
          </div>
          <div v-show="tab9 === 'dos'" class="text-sm space-y-2">
            <div>avg 7/30/90: — / — / —</div>
            <div>ventana usada: 90d</div>
            <div>DoS, ROP, Sugerida: —</div>
            <button class="ps-btn ps-btn--primary">Crear orden sugerida</button>
          </div>
          <div v-show="tab9 === 'auditoria'" class="text-sm space-y-2">
            <div>Creado por: — / fecha: —</div>
            <div>Actualizado por: — / fecha: —</div>
            <div>Ver Kardex del artículo</div>
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

// Header state
const active = ref(true);

// Form basics
const form = ref({
  name: '',
  categoryId: '',
  subCategoryId: '',
  sku: '',
  ean: '',
  autoCode: false,
  supplier1: '',
  supplier2: ''
});
const imagePreview = ref('');

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

// Simulador
const sim = ref({ mode: 'direct', cost: 0, marginPct: 0, price: 0 });
const simResult = computed(() => {
  if (sim.value.mode === 'direct') {
    const base = sim.value.cost;
    return toCurrency(base * (1 + sim.value.marginPct / 100));
  } else {
    return toCurrency(Math.max(0, sim.value.price - (sim.value.price * sim.value.marginPct / 100)));
  }
});

function applySimulation() {
  if (sim.value.mode === 'direct') {
    calc.value.cost = sim.value.cost;
    calc.value.marginPct = sim.value.marginPct;
  } else {
    calc.value.pricePublic = sim.value.price;
    calc.value.marginPct = sim.value.marginPct;
  }
  recalculate();
}

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
