<template>
  <div class="preloader" v-if="visible">
    <div class="card" role="status" aria-live="polite">
      <div class="logo-wrap">
        <img class="logo" src="@/assets/punto_de_venta_2026_optimized.png" alt="Punto de Venta 2026">
      </div>
      <p class="caption">Cargando Punto de Venta 2026…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props { visible: boolean }
defineProps<Props>()
</script>

<style scoped>
.preloader { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; background:
  radial-gradient(1000px 800px at 50% 30%, rgba(124,58,237,.30) 0%, rgba(124,58,237,0) 45%),
  linear-gradient(135deg, #0b1020 0%, #0e1426 60%, #121a2f 100%);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }

.card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 40px 48px; border-radius: 16px; backdrop-filter: blur(10px) saturate(120%); -webkit-backdrop-filter: blur(10px) saturate(120%); background: rgba(15, 23, 42, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }

.logo-wrap { position: relative; width: min(320px, 60vw); aspect-ratio: 1/1; display: grid; place-items: center; animation: breathe 2.8s ease-in-out infinite; }

.logo-wrap::before { content: ""; position: absolute; inset: 6% 10%; border-radius: 40%; background:
  radial-gradient(200px 200px at 35% 60%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 70%),
  radial-gradient(300px 200px at 65% 25%, rgba(255,159,63,.25) 0%, rgba(255,159,63,0) 70%);
  filter: blur(16px); opacity: .6; animation: glowPulse 3.2s ease-in-out infinite; }

.logo { width: 88%; height: auto; display: block; filter: drop-shadow(0 8px 22px rgba(0, 0, 0, 0.25)) drop-shadow(0 0 18px rgba(255, 255, 255, 0.22)); }

.caption { font-size: 14px; letter-spacing: 0.3px; color: #cbd5e1; user-select: none; margin: 0; font-weight: 500; }

@keyframes breathe { 0% { transform: scale(0.92); } 50% { transform: scale(1.06); } 100% { transform: scale(0.92); } }
@keyframes glowPulse { 0%, 100% { opacity: 0.38; } 50% { opacity: 0.65; } }

@media (prefers-reduced-motion: reduce) { .logo-wrap, .logo-wrap::before { animation: none; } }
</style>