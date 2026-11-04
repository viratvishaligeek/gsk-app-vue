<template>
  <div class="app-layout premium-shell">
    <div v-if="isSidebarOpen" class="overlay active" @click="closeSidebar" aria-hidden="true"></div>

    <aside ref="sidebarElement" id="sidebar" class="sidebar premium-sidebar"
      :class="{ active: isSidebarOpen }" :aria-hidden="!isSidebarOpen" aria-label="Main navigation">
      <div class="sidebar-header premium-sidebar-header">
        <div class="premium-profile-panel">
          <div class="user-avatar premium-avatar"><i class="bi bi-person-fill"></i></div>
          <div class="premium-profile-copy">
            <small>WELCOME BACK</small>
            <strong>{{ authStore.name || 'Player' }}</strong>
            <router-link to="/profile" @click="closeSidebar">Manage profile <i class="bi bi-arrow-up-right"></i></router-link>
          </div>
        </div>
        <router-link to="/wallet" class="sidebar-wallet-card premium-sidebar-wallet" @click="closeSidebar">
          <span class="sidebar-wallet-symbol"><i class="bi bi-wallet2"></i></span>
          <span class="sidebar-wallet-copy">
            <small>Available balance</small>
            <strong class="sidebar-wallet-amount">₹ {{ formatWalletAmount }}</strong>
          </span>
          <i class="bi bi-arrow-up-right ms-auto"></i>
        </router-link>
      </div>

      <nav class="sidebar-menu premium-sidebar-menu" aria-label="App sections">
        <p class="premium-menu-caption">PLAY</p>
        <router-link to="/dashboard" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-house-door"></i></span><span>Home</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/play-history" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-controller"></i></span><span>My plays & history</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/monthly-chart" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-bar-chart-line"></i></span><span>Monthly charts</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>

        <p class="premium-menu-caption mt-3">YOUR ACCOUNT</p>
        <router-link to="/wallet" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-wallet2"></i></span><span>Wallet transactions</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/wallet/withdraw" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-arrow-down-circle"></i></span><span>Withdraw money</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/profile" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-person-gear"></i></span><span>Profile & settings</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/notifications" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-bell"></i></span><span>Notifications</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/referrals" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-gift"></i></span><span>Refer & earn</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/live-support" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-headset"></i></span><span>Live support</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <a v-if="whatsappUrl" :href="whatsappUrl" class="sidebar-menu-item" target="_blank"
          rel="noopener noreferrer" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-whatsapp"></i></span><span>WhatsApp support</span><i class="bi bi-box-arrow-up-right ms-auto"></i>
        </a>

        <p class="premium-menu-caption mt-3">INFORMATION</p>
        <router-link to="/page/how-to-play" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-book"></i></span><span>How to play</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/page/game-rates" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-percent"></i></span><span>Game rates</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
        <router-link to="/page/terms-conditions" class="sidebar-menu-item" @click="closeSidebar">
          <span class="icon-3d"><i class="bi bi-file-earmark-text"></i></span><span>Terms & conditions</span><i class="bi bi-chevron-right ms-auto"></i>
        </router-link>
      </nav>

      <div class="premium-sidebar-footer">
        <button :disabled="isLoggingOut" @click="handleLogout" class="btn btn-outline-danger w-100">
          <span v-if="isLoggingOut" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-box-arrow-right me-2"></i>
          {{ isLoggingOut ? 'Signing out…' : 'Sign out' }}
        </button>
        <small>Play responsibly · 18+ only</small>
      </div>
    </aside>

    <header class="app-header premium-app-header">
      <div class="premium-header-inner">
        <div class="d-flex align-items-center gap-2 min-width-0">
          <button id="menuBtn" ref="menuButtonElement" type="button"
            class="header-menu-btn premium-menu-trigger" @click="toggleSidebar"
            :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="isSidebarOpen" aria-controls="sidebar">
            <i class="bi" :class="isSidebarOpen ? 'bi-x-lg' : 'bi-list'"></i>
          </button>
          <router-link to="/dashboard" class="premium-header-brand">
            <span class="premium-brand-mark"><i class="bi bi-controller"></i></span>
            <span class="min-width-0">
              <strong>GSK Play</strong>
              <small>Official mobile application</small>
            </span>
          </router-link>
        </div>
        <div class="premium-header-actions">
          <router-link to="/notifications" class="premium-notification" aria-label="Notifications">
            <i class="bi bi-bell"></i>
          </router-link>
          <router-link to="/wallet" class="premium-header-wallet" :aria-label="'Wallet balance ₹ ' + formatWalletAmount">
            <i class="bi bi-wallet2" aria-hidden="true"></i><span>₹ {{ formatWalletAmount }}</span>
          </router-link>
        </div>
      </div>
    </header>

    <main class="main-body-content">
      <router-view />
    </main>

    <footer v-if="!hideBottomNav" class="bottom-nav premium-bottom-nav" aria-label="Primary navigation">
      <router-link to="/dashboard" class="nav-item" active-class="active">
        <span class="nav-icon"><i class="bi bi-house-door-fill"></i></span><span class="nav-label">Home</span>
      </router-link>
      <router-link to="/play-history" class="nav-item" active-class="active">
        <span class="nav-icon"><i class="bi bi-controller"></i></span><span class="nav-label">Plays</span>
      </router-link>
      <router-link to="/monthly-chart" class="nav-item" active-class="active">
        <span class="nav-icon"><i class="bi bi-bar-chart-line"></i></span><span class="nav-label">Charts</span>
      </router-link>
      <router-link to="/wallet" class="nav-item" active-class="active">
        <span class="nav-icon"><i class="bi bi-wallet2"></i></span><span class="nav-label">Wallet</span>
      </router-link>
      <router-link to="/profile" class="nav-item" active-class="active">
        <span class="nav-icon"><i class="bi bi-person"></i></span><span class="nav-label">Profile</span>
      </router-link>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/utils/auth'
import { useSettings } from '@/composables/useSettings'
import { usePresence } from '@/composables/usePresence'

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
const hideBottomNav = computed(() => {
  const path = route.path
  return path === '/wallet/add'
    || path === '/wallet/withdraw'
    || path === '/monthly-chart'
    || path === '/live-support'
    || path.startsWith('/play-game/')
})
const authStore = useAuthStore()
const { disconnect: disconnectPresence } = usePresence()

const isSidebarOpen = ref(false)
const shareMenuOpen = ref(false)
const isLoggingOut = ref(false)
const sidebarElement = ref(null)
const menuButtonElement = ref(null)
const formatWalletAmount = computed(() => new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
}).format(Number(authStore.amount) || 0))

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
    // End this device's server-side presence lease before auth storage is cleared.
    await disconnectPresence()
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
.premium-shell { min-height:100dvh; }
.premium-sidebar { display:flex; flex-direction:column; height:100dvh; padding-bottom:env(safe-area-inset-bottom); }
.premium-sidebar-header { flex:0 0 auto; padding:22px 18px 16px; }
.premium-profile-panel { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.premium-avatar { display:grid; place-items:center; width:46px; height:46px; flex:0 0 46px; border-radius:15px; color:var(--gsk-brand); background:#fff; font-size:21px; }
.premium-profile-copy { display:grid; gap:2px; min-width:0; }
.premium-profile-copy small { color:rgba(255,255,255,.7); font-size:9px; font-weight:850; letter-spacing:.12em; }
.premium-profile-copy strong { overflow:hidden; color:#fff; font-size:15px; text-overflow:ellipsis; white-space:nowrap; }
.premium-profile-copy a { color:rgba(255,255,255,.8); font-size:11px; }
.premium-sidebar-wallet { display:flex; align-items:center; gap:10px; min-height:62px; padding:10px 12px; color:#fff; }
.premium-sidebar-wallet .sidebar-wallet-symbol { display:grid; place-items:center; width:36px; height:36px; border-radius:11px; color:#fff; background:rgba(255,255,255,.14); }
.premium-sidebar-wallet .sidebar-wallet-copy { display:grid; gap:2px; }
.premium-sidebar-wallet small { color:rgba(255,255,255,.7); font-size:10px; }
.premium-sidebar-wallet .sidebar-wallet-amount { color:#fff; font-size:16px; }
.premium-sidebar-menu { flex:1 1 auto; min-height:0; overflow-y:auto; padding:14px 10px; overscroll-behavior:contain; }
.premium-menu-caption { margin:8px 12px; color:#8b97aa; font-size:9px; font-weight:850; letter-spacing:.13em; }
.premium-sidebar-footer { flex:0 0 auto; padding:14px 16px max(14px,env(safe-area-inset-bottom)); border-top:1px solid var(--gsk-line); background:#fff; }
.premium-sidebar-footer small { display:block; margin-top:10px; color:var(--gsk-muted); text-align:center; font-size:10px; }
@media (prefers-reduced-motion:reduce) { .premium-sidebar-menu .sidebar-menu-item .icon-3d { transition:none; } }
</style>
