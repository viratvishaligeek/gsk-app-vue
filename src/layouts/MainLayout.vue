<template>
  <div class="gsk-app-shell">
    <div v-if="isSidebarOpen" class="gsk-drawer-backdrop" @click="closeSidebar" aria-hidden="true"></div>
    <aside ref="sidebarElement" id="sidebar" class="gsk-drawer" :class="{ 'is-open':isSidebarOpen }"
      :aria-hidden="!isSidebarOpen" aria-label="Application menu">
      <div class="drawer-top">
        <div class="drawer-user">
          <div class="drawer-avatar">👤</div>
          <div class="drawer-user-copy"><small>WELCOME BACK</small><strong>{{ authStore.name || 'Player' }}</strong>
            <router-link to="/profile" @click="closeSidebar">Manage account →</router-link></div>
        </div>
        <router-link to="/wallet" class="drawer-balance" @click="closeSidebar">
          <span>💰</span><span><small>Available balance</small><strong>₹ {{ formatWalletAmount }}</strong></span><b>→</b>
        </router-link>
      </div>
      <nav class="drawer-navigation">
        <p>PLAY & EXPLORE</p>
        <router-link to="/dashboard" @click="closeSidebar"><span>🏠</span>Home <b>›</b></router-link>
        <router-link to="/games" @click="closeSidebar"><span>🎮</span>Explore games <b>›</b></router-link>
        <router-link to="/play-history" @click="closeSidebar"><span>🎮</span>My plays & history <b>›</b></router-link>
        <router-link to="/monthly-chart" @click="closeSidebar"><span>📊</span>Monthly charts <b>›</b></router-link>
        <p>YOUR ACCOUNT</p>
        <router-link to="/wallet" @click="closeSidebar"><span>💳</span>Wallet transactions <b>›</b></router-link>
        <router-link to="/wallet/withdraw" @click="closeSidebar"><span>🏦</span>Withdraw money <b>›</b></router-link>
        <router-link to="/profile" @click="closeSidebar"><span>👤</span>Profile & settings <b>›</b></router-link>
        <router-link to="/notifications" @click="closeSidebar"><span>🔔</span>Notifications <b>›</b></router-link>
        <router-link to="/referrals" @click="closeSidebar"><span>🎁</span>Refer & earn <b>›</b></router-link>
        <router-link to="/live-support" @click="closeSidebar"><span>💬</span>Live support <b>›</b></router-link>
        <a v-if="whatsappUrl" :href="whatsappUrl" target="_blank" rel="noopener noreferrer" @click="closeSidebar"><span>🟢</span>WhatsApp support <b>↗</b></a>
        <p>HELP & INFORMATION</p>
        <router-link to="/page/how-to-play" @click="closeSidebar"><span>📖</span>How to play <b>›</b></router-link>
        <router-link to="/page/game-rates" @click="closeSidebar"><span>🧮</span>Game rates <b>›</b></router-link>
        <router-link to="/page/terms-conditions" @click="closeSidebar"><span>📄</span>Terms & conditions <b>›</b></router-link>
      </nav>
      <div class="drawer-footer"><button type="button" class="drawer-logout" :disabled="isLoggingOut" @click="handleLogout">
        <span v-if="isLoggingOut" class="spinner-border spinner-border-sm"></span><span v-else>🚪</span>
        {{ isLoggingOut ? 'Signing out…' : 'Sign out' }}</button><small>Play responsibly · 18+ only</small></div>
    </aside>

    <header class="gsk-topbar">
      <div class="topbar-leading">
        <button ref="menuButtonElement" class="menu-trigger" type="button" @click="toggleSidebar"
          :aria-label="isSidebarOpen?'Close menu':'Open menu'" :aria-expanded="isSidebarOpen" aria-controls="sidebar">
          <span>{{ isSidebarOpen ? '✕' : '☰' }}</span></button>
        <router-link to="/dashboard" class="gsk-wordmark"><span>🎮</span><span><strong>GSK Play</strong><small>GAME ZONE</small></span></router-link>
      </div>
      <div class="topbar-actions">
        <router-link to="/notifications" class="topbar-notifications" aria-label="Notifications">🔔</router-link>
        <router-link to="/wallet" class="topbar-wallet"><span>💰</span><b>₹{{ formatWalletAmount }}</b></router-link>
      </div>
    </header>

    <main class="gsk-main-content"><router-view /></main>

    <nav v-if="!hideBottomNav" class="gsk-bottom-navigation" aria-label="Primary navigation">
      <router-link to="/dashboard" active-class="is-active" exact-active-class="is-active"><span>🏠</span><small>Home</small></router-link>
      <router-link to="/games" active-class="is-active"><span>🎮</span><small>Games</small></router-link>
      <router-link to="/play-history" active-class="is-active"><span>📜</span><small>Plays</small></router-link>
      <router-link to="/wallet" active-class="is-active"><span>💰</span><small>Wallet</small></router-link>
      <router-link to="/profile" active-class="is-active"><span>👤</span><small>Profile</small></router-link>
    </nav>
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
</script><style scoped>
.app-layout{position:relative;min-height:100dvh;background:var(--gsk-paper);overflow-x:clip}.premium-shell{width:100%;max-width:560px;min-height:100dvh;margin:0 auto;background:var(--gsk-paper);box-shadow:0 0 36px #152e4b0a}
.sidebar{position:fixed;inset:0 auto 0 0;z-index:1091;display:flex;width:min(86vw,320px);height:100dvh;overflow:hidden;flex-direction:column;background:#fff;box-shadow:16px 0 42px #122b4b20;transform:translate3d(-105%,0,0);transition:transform .24s cubic-bezier(.2,.75,.25,1);will-change:transform}.sidebar.active{transform:translate3d(0,0,0)}.overlay{position:fixed;inset:0;z-index:1090;background:#10233d80;backdrop-filter:blur(3px)}
.premium-sidebar{display:flex;flex-direction:column;height:100dvh;padding-bottom:env(safe-area-inset-bottom)}.premium-sidebar-header{flex:0 0 auto;padding:22px 18px 16px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff}.premium-profile-panel{display:flex;align-items:center;gap:12px;margin-bottom:18px}.premium-avatar{display:grid;place-items:center;width:46px;height:46px;flex:0 0 46px;border-radius:15px;color:#244e83;background:#fff;font-size:23px}.premium-profile-copy{display:grid;gap:2px;min-width:0}.premium-profile-copy small{color:#d1deef;font-size:9px;font-weight:850;letter-spacing:.12em}.premium-profile-copy strong{overflow:hidden;color:#fff;font-size:15px;text-overflow:ellipsis;white-space:nowrap}.premium-profile-copy a{color:#e0e9f5;font-size:11px}.premium-sidebar-wallet{display:flex;align-items:center;gap:10px;min-height:62px;padding:10px 12px;border:1px solid #ffffff26;border-radius:13px;background:#ffffff14;color:#fff}.premium-sidebar-wallet .sidebar-wallet-symbol{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;color:#fff;background:#ffffff20}.premium-sidebar-wallet .sidebar-wallet-copy{display:grid;gap:2px}.premium-sidebar-wallet small{color:#d4e0f0;font-size:10px}.premium-sidebar-wallet .sidebar-wallet-amount{color:#fff;font-size:16px}.premium-sidebar-menu{flex:1 1 auto;min-height:0;overflow-y:auto;padding:14px 10px;overscroll-behavior:contain;background:#fff}.premium-menu-caption{margin:8px 12px;color:#8b97aa;font-size:9px;font-weight:850;letter-spacing:.13em}.premium-sidebar-menu .sidebar-menu-item{display:flex;align-items:center;gap:11px;min-height:47px;margin:3px 0;padding:9px 11px;border-radius:11px;color:#53647c;font-size:11px;font-weight:750;transition:background .15s,color .15s}.premium-sidebar-menu .sidebar-menu-item.router-link-active,.premium-sidebar-menu .sidebar-menu-item.active{background:#edf3fc;color:#244e83}.premium-sidebar-menu .sidebar-menu-item .icon-3d{display:grid;place-items:center;width:30px;height:30px;flex:0 0 30px;border-radius:9px;background:#f1f4f8;font-size:18px}.premium-sidebar-menu .sidebar-menu-item.router-link-active .icon-3d{background:#dfeafb}.premium-sidebar-footer{flex:0 0 auto;padding:14px 16px max(14px,env(safe-area-inset-bottom));border-top:1px solid #e5ebf3;background:#fff}.premium-sidebar-footer .btn{min-height:43px;border-radius:11px;font-size:11px;font-weight:850}.premium-sidebar-footer small{display:block;margin-top:10px;color:#8996a8;text-align:center;font-size:10px}
.app-header{position:sticky;top:0;z-index:1030;width:100%;padding:env(safe-area-inset-top) 12px 0;border-bottom:1px solid #e6ebf2;background:#ffffffed;backdrop-filter:blur(16px)}.premium-header-inner{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:61px}.header-menu-btn{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border:1px solid #e3eaf3;border-radius:12px;background:#fff;color:#244e83;font-size:23px}.premium-header-brand{display:flex;align-items:center;gap:9px;min-width:0;color:#203550}.premium-brand-mark{display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:12px;background:#eaf1fc;font-size:21px}.premium-header-brand>span:last-child{display:grid;min-width:0}.premium-header-brand strong{font-size:13px;font-weight:950;line-height:1.2}.premium-header-brand small{color:#8996a8;font-size:8px}.premium-header-actions{display:flex;align-items:center;gap:7px}.premium-notification{display:grid;place-items:center;width:39px;height:39px;border:1px solid #e4eaf2;border-radius:12px;background:#fff;font-size:20px}.premium-header-wallet{display:flex;align-items:center;gap:5px;min-height:38px;padding:0 10px;border:1px solid #dce6f2;border-radius:12px;background:#edf3fc;color:#244e83;font-size:10px;font-weight:900;white-space:nowrap}
.main-body-content{min-height:calc(100dvh - 62px);padding:0 0 calc(88px + env(safe-area-inset-bottom));overflow-x:clip}.premium-bottom-nav{position:fixed;right:auto;bottom:0;left:50%;z-index:1020;display:flex;width:min(100%,560px);min-height:62px;align-items:center;justify-content:space-around;gap:2px;padding:7px 5px calc(7px + env(safe-area-inset-bottom));border-top:1px solid #e4eaf2;background:#ffffffed;box-shadow:0 -7px 22px #1836570c;backdrop-filter:blur(15px);transform:translateX(-50%)}.premium-bottom-nav .nav-item{display:grid;flex:1;justify-items:center;align-content:center;gap:3px;min-width:0;min-height:48px;border-radius:11px;color:#8491a4;font-size:8px;font-weight:800;line-height:1.1}.premium-bottom-nav .nav-icon{font-size:21px;line-height:1.15}.premium-bottom-nav .nav-item.active,.premium-bottom-nav .nav-item.router-link-active{background:#edf3fc;color:#244e83}
@media(min-width:561px){.premium-shell{border-right:1px solid #e5ebf3;border-left:1px solid #e5ebf3}.premium-bottom-nav{border-right:1px solid #e5ebf3;border-left:1px solid #e5ebf3}}
@media(max-width:360px){.premium-header-inner{min-height:57px}.premium-header-brand small{display:none}.premium-header-wallet{padding:0 7px;font-size:9px}.premium-bottom-nav .nav-label{font-size:7px}}
@media(prefers-reduced-motion:reduce){.sidebar,.premium-sidebar-menu .sidebar-menu-item{transition:none}}
</style>