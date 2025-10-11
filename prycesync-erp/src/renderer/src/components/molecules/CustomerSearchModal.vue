<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 w-[90%] max-w-lg">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">{{ title }}</h3>
      <div>
        <label class="block text-xs text-slate-600 dark:text-slate-300">Buscar</label>
        <input
          type="text"
          v-model="query"
          @input="debouncedSearch"
          :placeholder="placeholder"
          class="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
        <div v-if="isSearching" class="mt-2 text-xs text-slate-500 dark:text-slate-300">Buscando…</div>
        <div v-if="results.length > 0" class="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <ul>
            <li
              v-for="cust in results"
              :key="cust.id"
              class="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              @click="selectCustomer(cust)"
            >
              <div class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ cust.name }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-300">CUIT: {{ cust.taxId }}</div>
            </li>
          </ul>
        </div>
        <div v-else-if="query.length >= 2 && !isSearching" class="mt-2 text-xs text-slate-500 dark:text-slate-300">Sin resultados</div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button class="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100" @click="close">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCustomers, type Customer } from '@/composables/useCustomers'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: 'Seleccionar cliente' },
  placeholder: { type: String, default: 'Nombre, CUIT o email' },
  limit: { type: Number, default: 10 }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', customer: Customer): void
}>()

const { searchCustomers } = useCustomers()
const query = ref('')
const results = ref<Customer[]>([])
const isSearching = ref(false)
let timer: any = null

const debouncedSearch = () => {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    if (query.value.length < 2) {
      results.value = []
      return
    }
    isSearching.value = true
    try {
      const r = await searchCustomers(query.value, props.limit)
      results.value = r
    } finally {
      isSearching.value = false
    }
  }, 350)
}

const selectCustomer = (cust: Customer) => {
  emit('select', cust)
  emit('update:modelValue', false)
  query.value = ''
  results.value = []
}

const close = () => {
  emit('update:modelValue', false)
  query.value = ''
  results.value = []
}
</script>

<style scoped>
</style>