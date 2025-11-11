<template>
  <div :class="['page-header', { 'page-header--dense': dense }]">
    <div class="page-header__content">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  dense?: boolean
}

withDefaults(defineProps<Props>(), { dense: false })
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-header--dense { margin-bottom: 1rem; }

.page-header__content {
  flex: 1;
}

.page-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ps-text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.page-header--dense .page-header__title { font-size: 1.25rem; margin-bottom: 0.25rem; }

.page-header__subtitle {
  font-size: 0.875rem;
  color: var(--ps-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.page-header--dense .page-header__subtitle { font-size: 0.75rem; }

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }
  
  .page-header__title {
    font-size: 1.375rem;
  }
  
  .page-header__actions {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .page-header__title {
    font-size: 1.25rem;
  }
  
  .page-header__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>