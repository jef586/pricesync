<template>
  <div class="ps-card" :class="customClass">
    <slot />
  </div>
</template>

<script setup>
defineProps({ customClass: { type: String, default: '' } })
</script>