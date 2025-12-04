<template>
  <DashboardLayout>
    <div class="home-view w-full">
      <PageHeader
        title="Inicio"
        subtitle="Configura PryceSync ERP paso a paso"
      />

      <div class="home-cards">
        <BaseCard variant="elevated" class="home-card">
          <div class="home-card__progress" aria-live="polite">
            <template v-if="progress.company">
              <span class="home-card__progress-icon home-card__progress-icon--ok" aria-label="Completado">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 4.9-4.9 1.4 1.4-6.3 6.3z" fill="currentColor"/>
                </svg>
              </span>
              <span class="home-card__progress-text">Completado</span>
            </template>
            <template v-else>
              <span class="home-card__progress-icon home-card__progress-icon--pending" aria-label="Pendiente">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </span>
            </template>
          </div>
          <div class="home-card__body">
            <div class="home-card__illustration">
              <img v-if="illustrations.company" :src="illustrations.company" alt="Configura tu empresa" class="home-card__image" />
              <svg v-else viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="home-card__placeholder">
                <rect x="10" y="20" width="100" height="50" rx="8" fill="#E6F4F1" />
                <rect x="20" y="30" width="50" height="8" rx="4" fill="#3FB9A3" />
                <rect x="20" y="44" width="40" height="8" rx="4" fill="#93D9CC" />
                <circle cx="85" cy="45" r="10" fill="#3FB9A3" />
              </svg>
            </div>
            <div class="home-card__content">
              <h2 class="home-card__title text-xl">Configura tu empresa</h2>
              <p class="home-card__subtitle text-base">Define datos fiscales, punto de venta y preferencias para comenzar a facturar correctamente.</p>
              <div class="home-card__actions">
                <BaseButton variant="primary" @click="$router.push('/company')">Configurar</BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard variant="elevated" class="home-card">
          <div class="home-card__progress" aria-live="polite">
            <template v-if="progress.import">
              <span class="home-card__progress-icon home-card__progress-icon--ok" aria-label="Completado">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 4.9-4.9 1.4 1.4-6.3 6.3z" fill="currentColor"/>
                </svg>
              </span>
              <span class="home-card__progress-text">Completado</span>
            </template>
            <template v-else>
              <span class="home-card__progress-icon home-card__progress-icon--pending" aria-label="Pendiente">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </span>
            </template>
          </div>
          <div class="home-card__body">
            <div class="home-card__illustration">
              <img v-if="illustrations.suppliers" :src="illustrations.suppliers" alt="Importa tu lista de artículos" class="home-card__image" />
              <svg v-else viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="home-card__placeholder">
                <rect x="10" y="20" width="100" height="50" rx="8" fill="#EAF8F3" />
                <path d="M40 48 l10 10 l20 -26" stroke="#10B981" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="home-card__content">
              <div class="home-card__header">
                <h2 class="home-card__title text-xl">Importa tu lista de artículos</h2>
              </div>
              <p class="home-card__subtitle text-base">Sube tu Excel de artículos por proveedor para cargar precios y SKUs.</p>
              <div class="home-card__actions">
                <BaseButton variant="primary" @click="$router.push({ path: '/suppliers', query: { import: 'excel' } })">Importar Excel</BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard variant="elevated" class="home-card">
          <div class="home-card__progress" aria-live="polite">
            <template v-if="progress.pricing">
              <span class="home-card__progress-icon home-card__progress-icon--ok" aria-label="Completado">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 4.9-4.9 1.4 1.4-6.3 6.3z" fill="currentColor"/>
                </svg>
              </span>
              <span class="home-card__progress-text">Completado</span>
            </template>
            <template v-else>
              <span class="home-card__progress-icon home-card__progress-icon--pending" aria-label="Pendiente">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </span>
            </template>
          </div>
          <div class="home-card__body">
            <div class="home-card__illustration">
              <img v-if="illustrations.pricing" :src="illustrations.pricing" alt="Configura tu lista de precios" class="home-card__image" />
              <svg v-else viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="home-card__placeholder">
                <rect x="12" y="22" width="96" height="46" rx="8" fill="#EEF9F6" />
                <rect x="20" y="32" width="60" height="8" rx="4" fill="#3FB9A3" />
                <rect x="20" y="46" width="72" height="8" rx="4" fill="#93D9CC" />
              </svg>
            </div>
            <div class="home-card__content">
              <h2 class="home-card__title text-xl">Configura tu lista de precios</h2>
              <p class="home-card__subtitle text-base">Ajusta márgenes e impuestos para precios consistentes y competitivos.</p>
              <div class="home-card__actions">
                <BaseButton variant="primary" @click="$router.push('/company/pricing')">Configurar listas</BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard variant="elevated" class="home-card">
          <div class="home-card__progress" aria-live="polite">
            <template v-if="progress.product">
              <span class="home-card__progress-icon home-card__progress-icon--ok" aria-label="Completado">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 4.9-4.9 1.4 1.4-6.3 6.3z" fill="currentColor"/>
                </svg>
              </span>
              <span class="home-card__progress-text">Completado</span>
            </template>
            <template v-else>
              <span class="home-card__progress-icon home-card__progress-icon--pending" aria-label="Pendiente">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </span>
            </template>
          </div>
          <div class="home-card__body">
            <div class="home-card__illustration">
              <img v-if="illustrations.product" :src="illustrations.product" alt="Crea tu primer producto" class="home-card__image" />
              <svg v-else viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="home-card__placeholder">
                <rect x="12" y="22" width="96" height="46" rx="8" fill="#EEF9F6" />
                <rect x="20" y="32" width="28" height="8" rx="4" fill="#3FB9A3" />
                <rect x="52" y="32" width="40" height="8" rx="4" fill="#93D9CC" />
                <rect x="20" y="46" width="72" height="8" rx="4" fill="#C7ECE4" />
              </svg>
            </div>
            <div class="home-card__content">
              <h2 class="home-card__title text-xl">Crea tu primer producto</h2>
              <p class="home-card__subtitle text-base">Agrega un producto con precio y stock para comenzar a vender.</p>
              <div class="home-card__actions">
                <BaseButton variant="primary" @click="$router.push('/articles/new')">Crear producto</BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard variant="elevated" class="home-card">
          <div class="home-card__progress" aria-live="polite">
            <template v-if="progress.sale">
              <span class="home-card__progress-icon home-card__progress-icon--ok" aria-label="Completado">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 4.9-4.9 1.4 1.4-6.3 6.3z" fill="currentColor"/>
                </svg>
              </span>
              <span class="home-card__progress-text">Completado</span>
            </template>
            <template v-else>
              <span class="home-card__progress-icon home-card__progress-icon--pending" aria-label="Pendiente">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </span>
            </template>
          </div>
          <div class="home-card__body">
            <div class="home-card__illustration">
              <img v-if="illustrations.sale" :src="illustrations.sale" alt="Registra tu primera venta" class="home-card__image" />
              <svg v-else viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="home-card__placeholder">
                <rect x="10" y="18" width="100" height="52" rx="8" fill="#EAF8F3" />
                <rect x="20" y="30" width="24" height="8" rx="4" fill="#3FB9A3" />
                <rect x="48" y="30" width="24" height="8" rx="4" fill="#93D9CC" />
                <rect x="76" y="30" width="24" height="8" rx="4" fill="#C7ECE4" />
                <rect x="20" y="46" width="80" height="8" rx="4" fill="#93D9CC" />
              </svg>
            </div>
            <div class="home-card__content">
              <h2 class="home-card__title text-xl">Registra tu primera venta</h2>
              <p class="home-card__subtitle text-base">Crea una venta en el punto de venta y genera tu primera factura.</p>
              <div class="home-card__actions">
                <BaseButton variant="primary" @click="$router.push('/sales/new')">Registrar venta</BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard variant="elevated" class="home-card">
          <div class="home-card__progress" aria-live="polite">
            <template v-if="progress.help">
              <span class="home-card__progress-icon home-card__progress-icon--ok" aria-label="Completado">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 4.9-4.9 1.4 1.4-6.3 6.3z" fill="currentColor"/>
                </svg>
              </span>
              <span class="home-card__progress-text">Completado</span>
            </template>
            <template v-else>
              <span class="home-card__progress-icon home-card__progress-icon--pending" aria-label="Pendiente">
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </span>
            </template>
          </div>
          <div class="home-card__body">
            <div class="home-card__illustration">
              <img v-if="illustrations.help" :src="illustrations.help" alt="Solicitar ayuda" class="home-card__image" />
              <svg v-else viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="home-card__placeholder">
                <rect x="12" y="22" width="96" height="46" rx="8" fill="#EEF9F6" />
                <rect x="20" y="32" width="72" height="8" rx="4" fill="#93D9CC" />
                <rect x="20" y="46" width="48" height="8" rx="4" fill="#3FB9A3" />
              </svg>
            </div>
            <div class="home-card__content">
              <h2 class="home-card__title text-xl">Solicitar ayuda</h2>
              <p class="home-card__subtitle text-base">Accede a guías y soporte para completar la configuración y resolver dudas.</p>
              <div class="home-card__actions">
                <BaseButton variant="primary" @click="$router.push('/help')">Solicitar ayuda</BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </DashboardLayout>
  
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import companySetupPng from '@/assets/illustrations/configCompany.png'
import articlesPng from '@/assets/illustrations/articles.png'
import cajaPng from '@/assets/illustrations/caja.png'
import precioPng from '@/assets/illustrations/precio.png'
import firstArticlePng from '@/assets/illustrations/firstArticle.png'
import helpPng from '@/assets/illustrations/help.png'
import { listArticles } from '@/services/articles'
import { getPricingSettings } from '@/services/settingsService'
import { useSuppliers } from '@/composables/useSuppliers'
import { useInvoices } from '@/composables/useInvoices'

const illustrations = {
  company: companySetupPng,
  suppliers: articlesPng,
  pricing: precioPng,
  product: firstArticlePng,
  sale: cajaPng,
  help: helpPng
}

const progress = ref({
  company: false,
  import: false,
  pricing: false,
  product: false,
  sale: false,
  help: false
})

onMounted(() => {
  const gsap = (window as any).gsap
  if (!gsap) return
  const cards = document.querySelectorAll('.home-card')
  gsap.set(cards, { opacity: 0, y: 16 })
  gsap.to(cards, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
    stagger: 0.08
  })
})

onMounted(async () => {
  const auth = useAuthStore()
  progress.value.company = Boolean(auth.user?.company?.taxId)

  try {
    const res = await listArticles({ pageSize: 1 })
    progress.value.product = (res.total || 0) > 0
  } catch {}

  try {
    const settings = await getPricingSettings()
    progress.value.pricing = Boolean(settings && (settings.defaultMarginPercent ?? 0) > 0)
  } catch {}

  try {
    const { fetchSuppliers, suppliers } = useSuppliers()
    await fetchSuppliers({ limit: 5 })
    progress.value.import = suppliers.value.some(s => (s.importedProductsCount ?? 0) > 0 || !!s.lastImportDate)
    if (!progress.value.import) progress.value.import = progress.value.product
  } catch {
    progress.value.import = progress.value.product
  }

  try {
    const { fetchInvoices, pagination } = useInvoices()
    await fetchInvoices({ limit: 1 })
    progress.value.sale = (pagination.value.total || 0) > 0
  } catch {}

  try {
    const flag = localStorage.getItem('ps_help_completed')
    progress.value.help = flag === 'true'
  } catch {}
})
</script>

<style scoped>
.home-view { padding-bottom: 2rem; }
.home-card { overflow: hidden; position: relative; }
.home-card { will-change: transform, opacity; }
.home-cards { display:grid; grid-template-columns: 1fr; gap: 1.25rem; }
.home-card__body { display:flex; align-items:flex-start; gap:1.5rem; padding:1.25rem 1.5rem; }
.home-card__illustration { flex-shrink:0; width:240px; height:160px; display:flex; align-items:center; justify-content:center; background: var(--ps-card); border-radius: var(--ps-radius-lg); }
.home-card__image { width:100%; height:100%; object-fit: contain; border-radius: var(--ps-radius-lg); }
.home-card__placeholder { width:100%; height:100%; }
.home-card__content { flex:1; }
.home-card__header { display:flex; align-items:center; justify-content:space-between; gap:.75rem; }
.home-card__title { font-weight:600; color: var(--ps-text-primary); }
.home-card__subtitle { margin-top:.25rem; color: var(--ps-text-secondary); }
.home-card__actions { margin-top:.75rem; }

.home-card:hover { transform: translateY(-2px); transition: transform .18s ease-out; }

.home-card__progress { position:absolute; top:8px; right:8px; display:flex; align-items:center; gap:6px; pointer-events:none; }
.home-card__progress-icon { display:inline-flex; align-items:center; justify-content:center; color:#9CA3AF; }
.home-card__progress-icon--ok { color:#10B981; }
.home-card__progress-icon--pending { color:#9CA3AF; }
.home-card__progress-text { font-size:12px; color: var(--ps-text-secondary); }

@media (max-width: 768px) {
  .home-card__body { flex-direction: column; }
  .home-card__illustration { width:100%; height:200px; }
}

@media (min-width: 1024px) {
  .home-cards { grid-template-columns: 1fr 1fr; }
}
</style>
