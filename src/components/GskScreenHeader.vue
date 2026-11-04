<template>
  <header class="gsk-screen-header" :class="{ 'is-compact': compact }">
    <span class="gsk-screen-header__emoji" aria-hidden="true">{{ emoji }}</span>
    <div class="gsk-screen-header__copy">
      <span class="gsk-screen-header__kicker">{{ kicker }}</span>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <slot name="action"></slot>
  </header>
</template>

<script setup>
defineProps({
  emoji: { type: String, default: '✨' },
  kicker: { type: String, default: 'GSK PLAY' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  compact: { type: Boolean, default: false },
})
</script>

<style scoped>
.gsk-screen-header{display:flex;align-items:center;gap:13px;min-width:0;margin:3px 0 13px;padding:18px;border-radius:18px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff;box-shadow:0 8px 22px #1b365d17}
.gsk-screen-header__emoji{display:grid;place-items:center;width:51px;height:51px;flex:0 0 51px;border:1px solid #ffffff25;border-radius:15px;background:#ffffff16;font-size:28px}
.gsk-screen-header__copy{display:grid;min-width:0;gap:1px}
.gsk-screen-header__kicker{color:#cbd9eb;font-size:9px;font-weight:900;letter-spacing:.13em}
.gsk-screen-header h1{margin:1px 0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-.025em;overflow-wrap:anywhere}
.gsk-screen-header p{margin:0;color:#d5e1f0;font-size:11px}
.gsk-screen-header.is-compact{padding:14px}
.gsk-screen-header.is-compact .gsk-screen-header__emoji{width:43px;height:43px;flex-basis:43px;font-size:24px}
.gsk-screen-header.is-compact h1{font-size:19px}
</style>
