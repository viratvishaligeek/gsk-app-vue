<template>
  <div class="app-layout premium-shell">
    <div v-if="isSidebarOpen" class="overlay active" @click="closeSidebar" aria-hidden="true"></div>
    <aside ref="sidebarElement" id="sidebar" class="sidebar premium-sidebar" :class="{ active: isSidebarOpen }"
      aria-label="Main navigation" :aria-hidden="!isSidebarOpen">
      <div class="sidebar-header premium-sidebar-header">
        <div class="premium-profile-panel">
          <div class="user-avatar premium-avatar"><i class="bi bi-person-fill"></i></div>
          <div class="premium-profile-copy">
            <small>WELCOME BACK</small><strong>{{ authStore.name || 'Player' }}</strong><router-link to="/profile"
              @click="closeSidebar">Manage profile <i class="bi bi-arrow-up-right"></i></router-link>
          </div>
          <router-link to="/wallet" class="sidebar-wallet-card premium-sidebar-wallet" @click="closeSidebar">
            <span class="sidebar-wallet-symbol"><i class="bi bi-wallet2"></i></span>
            <strong class="sidebar-wallet-amount">₹ {{
              formatWalletAmount }}</strong>
          </router-link>
        </div>
      </div>
      <nav class="sidebar-menu premium-sidebar-menu" aria-label="App sections">
        <router-link to="/dashboard" class="sidebar-menu-item" @click="closeSidebar"><span class="icon-3d"><i
              class="bi bi-house-door"></i></span><span>Home</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <router-link :to="{ name: 'market-games' }" class="sidebar-menu-item" @click="closeSidebar"><span
            class="icon-3d"><i class="bi bi-grid-1x2"></i></span><span>Market Games</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <router-link to="/play-history" class="sidebar-menu-item" @click="closeSidebar"><span class="icon-3d"><i
              class="bi bi-controller"></i></span><span>My Plays & History</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <router-link to="/monthly-chart" class="sidebar-menu-item" @click="closeSidebar"><span class="icon-3d"><i
              class="bi bi-bar-chart-line"></i></span><span>Result Charts</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <p class="premium-menu-caption mt-3">YOUR ACCOUNT</p>
        <router-link to="/profile" class="sidebar-menu-item" @click="closeSidebar"><span class="icon-3d"><i
              class="bi bi-person-gear"></i></span><span>Profile & Settings</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <router-link to="/notifications" class="sidebar-menu-item" @click="closeSidebar"><span class="icon-3d"><i
              class="bi bi-bell"></i></span><span>Notifications</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <router-link to="/referrals" class="sidebar-menu-item" @click="closeSidebar"><span class="icon-3d"><i
              class="bi bi-gift"></i></span><span>Refer & Earn</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <router-link :to="{ path: '/live-support', query: { chat: '1' } }" class="sidebar-menu-item"
          @click="closeSidebar"><span class="icon-3d"><i class="bi bi-headset"></i></span><span>Live Support</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <a v-if="whatsappUrl" :href="whatsappUrl" class="sidebar-menu-item" target="_blank" rel="noopener noreferrer"
          @click="closeSidebar"><span class="icon-3d"><i class="bi bi-whatsapp"></i></span><span>WhatsApp
            Support</span><i class="bi bi-box-arrow-up-right ms-auto"></i></a>
        <router-link to="/page/how-to-play" class="sidebar-menu-item" @click="closeSidebar"><span class="icon-3d"><i
              class="bi bi-book"></i></span><span>How to Play</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <router-link to="/page/game-rates" class="sidebar-menu-item" @click="closeSidebar"><span class="icon-3d"><i
              class="bi bi-percent"></i></span><span>Game Rates</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
        <router-link to="/page/terms-conditions" class="sidebar-menu-item" @click="closeSidebar"><span
            class="icon-3d"><i class="bi bi-file-earmark-text"></i></span><span>Terms & Conditions</span><i
            class="bi bi-chevron-right ms-auto"></i></router-link>
      </nav>
      <div class="premium-sidebar-footer">
        <button :disabled="isLoggingOut" @click="handleLogout" class="btn btn-outline-danger w-100">
          <span v-if="isLoggingOut" class="spinner-border spinner-border-sm me-2"></span><i v-else
            class="bi bi-box-arrow-right me-2"></i>{{ isLoggingOut ? 'Signing out…' : 'Sign out' }}
        </button>
        <small>Play responsibly · 18+ only</small>
      </div>
    </aside>

    <header class="app-header premium-app-header">
      <div class="premium-header-inner">
        <div class="d-flex align-items-center gap-2 min-width-0">
          <button id="menuBtn" ref="menuButtonElement" type="button" class="header-menu-btn premium-menu-trigger"
            @click="toggleSidebar" :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="isSidebarOpen" aria-controls="sidebar">
            <i class="bi bi-list"></i>
          </button>
          <router-link to="/dashboard" class="premium-header-brand">
            <span class="premium-brand-mark"><i class="bi bi-controller"></i></span>
            <span><strong>Gali Satta Kings</strong><small>Official Application</small></span>
          </router-link>
        </div>
        <div class="premium-header-actions">
          <router-link to="/notifications" class="premium-notification" aria-label="Notifications"><i
              class="bi bi-bell"></i></router-link>
          <router-link to="/wallet" class="premium-header-wallet"
            :aria-label="'Wallet balance ₹ ' + formatWalletAmount">
            <i class="bi bi-wallet2" aria-hidden="true"></i><span>₹ {{ formatWalletAmount }}</span>
          </router-link>
        </div>
      </div>
    </header>

    <main class="main-body-content"><router-view /></main>

    <footer v-if="!hideBottomNav" class="bottom-nav premium-bottom-nav" aria-label="Primary navigation">
      <router-link to="/dashboard" class="nav-item" active-class="active"><span class="nav-icon"><i
            class="bi bi-house-door-fill"></i></span><span class="nav-label">Home</span></router-link>
      <router-link :to="{ name: 'market-games' }" class="nav-item" active-class="active"><span class="nav-icon"><i
            class="bi bi-dice-6"></i></span><span class="nav-label">Games</span></router-link>
      <router-link to="/play-history" class="nav-item" active-class="active"><span class="nav-icon"><i
            class="bi bi-hourglass-split"></i></span><span class="nav-label">History</span></router-link>
      <router-link to="/wallet" class="nav-item" active-class="active"><span class="nav-icon"><i
            class="bi bi-wallet2"></i></span><span class="nav-label">Wallet</span></router-link>
      <router-link to="/page/offers" class="nav-item" active-class="active"><span class="nav-icon"><i
            class="bi bi-percent"></i></span><span class="nav-label">Offers</span></router-link>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/utils/auth'
import { useSettings } from '@/composables/useSettings'

const router = useRouter()
const route = useRoute()
const { loadSettings, getSetting } = useSettings()
const whatsappUrl = computed(() => {
  const value = String(getSetting('social_whatsapp', '') || '').trim()
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
})
const hideBottomNav = computed(() => route.path.startsWith('/play-game/'))
const authStore = useAuthStore()

const isSidebarOpen = ref(false)
const isLoggingOut = ref(false)
const sidebarElement = ref(null)
const menuButtonElement = ref(null)
const formatWalletAmount = computed(() =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(Number(authStore.amount) || 0),
)

const setSidebarOpen = (open) => {
  isSidebarOpen.value = open
  document.body.classList.toggle('sidebar-open', open)
}

const toggleSidebar = () => setSidebarOpen(!isSidebarOpen.value)
const closeSidebar = () => setSidebarOpen(false)

const handleOutsidePointerDown = (event) => {
  if (!isSidebarOpen.value) return
  if (sidebarElement.value?.contains(event.target)) return
  // Do not close on pointerdown before the menu button's click toggles the panel.
  if (menuButtonElement.value?.contains(event.target)) return
  closeSidebar()
}

const handleEscapeKey = (event) => {
  if (event.key === 'Escape') closeSidebar()
}

onMounted(() => {
  void loadSettings()
  document.addEventListener('pointerdown', handleOutsidePointerDown)
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutsidePointerDown)
  document.removeEventListener('keydown', handleEscapeKey)
  document.body.classList.remove('sidebar-open')
})

const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await authStore.performLogout()
    closeSidebar()
    await router.replace({ name: 'login' })
  } finally {
    isLoggingOut.value = false
  }
}
// -------------
</script>

<style scoped>
.premium-shell {
  min-height: 100vh;
  background: #ededed;
  color: #033c07;
}

.premium-bottom-nav {
  min-height: calc(76px + env(safe-area-inset-bottom));
  padding: 9px 5px calc(10px + env(safe-area-inset-bottom));
  border-radius: 25px 25px 0 0;
  background: #033c07;
  box-shadow: 0 -8px 25px rgba(125, 35, 13, 0.18);
}

.premium-bottom-nav .nav-item {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 3px;
  min-width: 0;
  flex: 1;
  color: rgba(255, 255, 255, 0.8);
  transition:
    transform 0.22s ease,
    color 0.22s ease;
}

.premium-bottom-nav .nav-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  font-size: 21px;
  transition:
    transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
    background 0.25s ease,
    box-shadow 0.25s ease;
}

.premium-bottom-nav .nav-label {
  font-size: 9px;
  font-weight: 800;
}

.premium-bottom-nav .nav-item.active {
  color: #fff;
  transform: translateY(-9px);
}

.premium-bottom-nav .nav-item.active .nav-icon {
  width: 54px;
  height: 54px;
  margin-top: -13px;
  border: 4px solid #ededed;
  background: #29432a;
  color: #fff;
  box-shadow: 0 5px 14px #0002;
  animation: nav-pop 0.28s ease-out;
}

.premium-bottom-nav .nav-item.active .nav-label {
  color: #fff;
}

@keyframes nav-pop {
  from {
    transform: scale(0.78);
  }

  to {
    transform: scale(1);
  }
}

.premium-sidebar {
  background: #fff;
  border: 0;
  border-radius: 0 26px 26px 0;
  box-shadow: 24px 0 60px rgba(13, 20, 42, 0.2);
}

.premium-sidebar-header {
  background: #fff7e8 !important;
}

.premium-brand,
.premium-header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: inherit;
}

.premium-brand-mark {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(140deg, #20c997, #0e9e7a);
  color: #fff;
  font-size: 21px;
  box-shadow: 0 7px 18px rgba(23, 184, 144, 0.25);
}

.premium-brand strong,
.premium-header-brand strong {
  display: block;
  font-size: 14px;
  letter-spacing: 0.12em;
  color: inherit;
}

.premium-brand small,
.premium-header-brand small {
  display: block;
  margin-top: 2px;
  color: #aebbd1;
  font-size: 8px;
  letter-spacing: 0.08em;
}

.premium-close-menu {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.premium-profile-panel {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 1px 0 15px;
}

.premium-avatar {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.12);
  color: #9debd7;
  font-size: 21px;
}

.premium-profile-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.premium-profile-copy small {
  color: #98a7c1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.premium-profile-copy strong {
  overflow: hidden;
  color: #fff;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.premium-profile-copy a {
  color: #79dfc3;
  font-size: 10px;
  font-weight: 750;
}

.premium-sidebar-wallet {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.premium-sidebar-wallet .sidebar-wallet-symbol {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 12px;
  background: rgba(23, 184, 144, 0.2);
  color: #74e7c8;
}

.premium-sidebar-wallet .sidebar-wallet-copy {
  display: grid;
  gap: 2px;
}

.premium-sidebar-wallet .sidebar-wallet-copy small {
  color: #b7c2d5;
  font-size: 10px;
}

.premium-sidebar-wallet .sidebar-wallet-amount {
  color: #fff;
  font-size: 15px;
}

.premium-sidebar-wallet>i {
  color: #aebbd1;
}

.premium-sidebar-menu {
  padding: 14px 12px;
}

.premium-menu-caption {
  margin: 9px 12px 5px;
  color: #9aa5b7;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.premium-sidebar-menu .sidebar-menu-item {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 46px;
  margin: 3px 0;
  padding: 10px 12px;
  border-radius: 13px;
  color: #596579;
  font-size: 12px;
  font-weight: 800;
}

.premium-sidebar-menu .sidebar-menu-item .icon-3d {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin: 0;
  border-radius: 10px;
  background: #f1f4f9;
  color: #63728a;
  font-size: 15px;
  filter: none;
}

.premium-sidebar-menu .sidebar-menu-item>i {
  font-size: 10px;
  color: #a7b0bf;
}

.premium-sidebar-menu .sidebar-menu-item.router-link-active {
  background: #eafaf5;
  color: #107e64;
  box-shadow: inset 3px 0 #17b890;
}

.premium-sidebar-menu .sidebar-menu-item.router-link-active .icon-3d {
  background: #d5f7ec;
  color: #0d9c78;
}

.premium-sidebar-footer {
  padding: 13px 16px 16px;
  border-top: 1px solid #edf0f5;
  background: #fff;
}

.premium-sidebar-footer small {
  display: block;
  margin-top: 10px;
  color: #9aa4b3;
  text-align: center;
  font-size: 9px;
}

.premium-app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 70px;
  padding: 10px 15px !important;
  border: 0 !important;
  border-bottom: 1px solid #d32b0b !important;
  background: #033c07 !important;
  box-shadow: 0 4px 12px rgba(83, 25, 8, 0.16) !important;
}

.premium-app-header .premium-header-brand,
.premium-app-header .premium-header-brand strong,
.premium-app-header .premium-header-brand small {
  color: #fff !important;
}

.premium-app-header .premium-brand-mark {
  display: none;
}

.premium-menu-trigger {
  border: 0 !important;
  background: transparent !important;
  color: #fff !important;
}


.premium-notification {
  color: #fff !important;
}

.premium-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
}

.premium-header-brand {
  color: #033c07;
}

.premium-header-brand .premium-brand-mark {
  width: 38px;
  height: 38px;
  flex-basis: 38px;
  border-radius: 13px;
  font-size: 19px;
}

.premium-header-brand strong {
  font-size: 12px;
}

.premium-header-brand small {
  color: #8995a8;
  font-size: 8px;
}

.premium-menu-trigger {
  /* width: 39px;
  height: 39px; */
  border: 1px solid #e4e9f1;
  background: #f7f9fc;
  color: #252b4c;
  box-shadow: none;
  font-size: 40px;
}

.premium-notification {
  width: 39px;
  height: 39px;
  border: 1px solid #e5eaf2;
  background: #fff;
  color: #252b4c;
  box-shadow: none;
}

.premium-notification .notification-dot {
  border-color: #fff;
}

.premium-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  transform: none;
  width: 100%;
  max-width: none;
  height: auto;
  min-height: 76px;
  padding: 9px 5px calc(10px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  border: 0;
  border-radius: 25px 25px 0 0;
  background: #033c07;
  box-shadow: 0 -8px 25px rgba(125, 35, 13, 0.18);
  backdrop-filter: none;
}

.premium-bottom-nav:before,
.premium-bottom-nav:after {
  display: none;
}

.premium-bottom-nav .nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  height: 52px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.8);
  transition:
    transform 0.22s ease,
    color 0.22s ease;
}

.premium-bottom-nav .nav-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  font-size: 21px;
  line-height: 1.1;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease;
}

.premium-bottom-nav .nav-label {
  font-size: 9px;
  font-weight: 850;
}

.premium-bottom-nav .nav-item.active,
.premium-bottom-nav .nav-item.router-link-active {
  background: transparent;
  color: #fff;
  transform: translateY(-9px);
}

.premium-bottom-nav .nav-item.active .nav-icon,
.premium-bottom-nav .nav-item.router-link-active .nav-icon {
  width: 54px;
  height: 54px;
  margin-top: -13px;
  border: 4px solid #ededed;
  background: #29432a;
  color: #fff;
  box-shadow: 0 5px 14px #0002;
  animation: nav-pop 0.28s ease-out;
}

.premium-bottom-nav .nav-item {
  position: relative;
  overflow: visible;
  -webkit-tap-highlight-color: transparent;
}

.premium-bottom-nav .nav-item:active .nav-icon {
  transform: scale(.88);
}

.premium-bottom-nav .nav-item .nav-icon {
  transition: transform .24s cubic-bezier(.2, .8, .2, 1), background .24s ease, box-shadow .24s ease;
}

.premium-bottom-nav .nav-item.router-link-active .nav-icon {
  animation: nav-selection-bounce .38s cubic-bezier(.2, .85, .25, 1.3);
}

.premium-bottom-nav .nav-item.router-link-active:after {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff;
  transform: translateX(-50%);
  animation: nav-selection-spark .38s ease-out both;
  pointer-events: none;
}

@keyframes nav-selection-bounce {
  0% {
    transform: scale(.72) translateY(4px)
  }

  65% {
    transform: scale(1.1) translateY(-2px)
  }

  100% {
    transform: scale(1) translateY(0)
  }
}

@keyframes nav-selection-spark {
  0% {
    opacity: 0;
    transform: translate(-50%, 7px) scale(.4)
  }

  60% {
    opacity: 1;
    transform: translate(-50%, -5px) scale(1.3)
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -10px) scale(.6)
  }
}

@media(prefers-reduced-motion:reduce) {

  .premium-bottom-nav .nav-item.router-link-active .nav-icon,
  .premium-bottom-nav .nav-item.router-link-active:after {
    animation: none !important
  }
}


.premium-bottom-nav .nav-item.active .nav-label,
.premium-bottom-nav .nav-item.router-link-active .nav-label {
  color: #fff;
}

@media (min-width: 768px) {
  .premium-app-header {
    padding-inline: 28px !important;
  }
}

@media (max-width: 380px) {
  .premium-app-header {
    padding-inline: 9px !important;
  }

  .premium-header-brand {
    gap: 7px;
  }

  .premium-header-brand .premium-brand-mark {
    width: 34px;
    height: 34px;
    flex-basis: 34px;
  }


  .premium-bottom-nav {
    min-height: 70px;
    border-radius: 22px 22px 0 0;
  }

  .premium-bottom-nav .nav-label {
    font-size: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {

  .premium-sidebar,
  .premium-bottom-nav,
  .premium-sidebar-menu .sidebar-menu-item {
    transition: none !important;
  }
}

/* Compact mobile app controls */
.premium-app-header {
  min-height: 56px;
  padding: 7px 10px !important;
}

.premium-header-inner {
  gap: 7px;
}

.premium-menu-trigger {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0 !important;
  font-size: 25px !important;
}

.premium-header-brand {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.premium-header-brand strong {
  display: block;
  max-width: min(42vw, 190px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.premium-header-brand small {
  display: block;
  font-size: 8px;
  line-height: 1.2;
}

.premium-header-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.premium-app-header .premium-notification {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, .35);
  border-radius: 10px;
  background: transparent;
  color: #fff;
  font-size: 17px;
}

.premium-header-wallet {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 124px;
  padding: 7px 8px;
  border: 1px solid rgba(255, 255, 255, .48);
  border-radius: 10px;
  color: #fff !important;
  font-size: 11px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.premium-header-wallet i {
  flex: 0 0 auto;
  font-size: 13px;
}

.premium-header-wallet span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.premium-sidebar {
  width: min(290px, 84vw);
}

.premium-profile-panel {
  gap: 9px;
  margin: 0 0 10px;
}

.premium-avatar {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 11px;
  font-size: 17px;
  background: #fae9e4;
  color: #033c07;
}

.premium-profile-copy strong {
  color: #27201d;
  font-size: 12px;
  max-width: 180px;
}

.premium-profile-copy small {
  color: #8a6c60;
  font-size: 8px;
}

.premium-profile-copy a {
  color: #033c07;
  font-size: 10px;
}

.premium-sidebar-wallet {
  gap: 8px;
  padding: 0px;
  border-color: #e9d8c9;
  border-radius: 11px;
  background: #fff;
  color: #29211d;
}

.premium-sidebar-wallet .sidebar-wallet-symbol {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #fae9e4;
  color: #033c07;
}

.premium-sidebar-wallet .sidebar-wallet-copy small {
  color: #8a7b73;
  font-size: 9px;
}

.premium-sidebar-wallet .sidebar-wallet-amount {
  color: #29211d;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.premium-sidebar-menu {
  padding: 10px 9px;
}

.premium-sidebar-menu .sidebar-menu-item {
  gap: 9px;
  min-height: 40px;
  margin: 2px 0;
  padding: 7px 9px;
  border-radius: 10px;
  font-size: 11px;
}

.premium-sidebar-menu .sidebar-menu-item .icon-3d {
  width: 27px;
  height: 27px;
  border-radius: 8px;
  font-size: 13px;
}

.premium-menu-caption {
  margin: 8px 9px 4px;
  font-size: 8px;
}

.premium-bottom-nav {
  min-height: 64px;
  padding: 5px 5px calc(6px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
}

.premium-bottom-nav .nav-item {
  height: 44px;
  gap: 2px;
}

.premium-bottom-nav .nav-icon {
  width: 30px;
  height: 30px;
  font-size: 17px;
}

.premium-bottom-nav .nav-label {
  font-size: 9px;
}

.premium-bottom-nav .nav-item.active .nav-icon,
.premium-bottom-nav .nav-item.router-link-active .nav-icon {
  width: 38px;
  height: 38px;
  margin-top: -5px;
  border-width: 2px;
}

@media(max-width:380px) {
  .premium-header-brand small {
    display: none;
  }

  .premium-header-brand strong {
    max-width: 31vw;
    font-size: 11px;
  }

  .premium-header-actions {
    gap: 5px;
  }

  .premium-header-wallet {
    max-width: 92px;
    padding: 6px;
    font-size: 10px;
  }

  .premium-app-header {
    padding-inline: 7px !important;
  }

  .premium-bottom-nav {
    min-height: 60px;
  }
}
</style>
