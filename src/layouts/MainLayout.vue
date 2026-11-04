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
      <router-link to="/dashboard" active-class="is-active"><span>🏠</span><small>Home</small></router-link>
      <router-link to="/play-history" active-class="is-active"><span>🎮</span><small>Plays</small></router-link>
      <router-link to="/monthly-chart" active-class="is-active"><span>📊</span><small>Charts</small></router-link>
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
</script><style>
.gsk-app-shell{--app-ink:#1e2c42;--app-muted:#7b899d;--app-navy:#1b365d;min-height:100dvh;background:#f5f7fb;color:var(--app-ink)}
.gsk-topbar{position:sticky;top:0;z-index:1030;display:flex;align-items:center;justify-content:space-between;min-height:66px;padding:9px 15px;padding-top:max(9px,env(safe-area-inset-top));background:#fff;border-bottom:1px solid #e8edf4;box-shadow:0 3px 12px #172e4d09}
.topbar-leading,.topbar-actions,.gsk-wordmark{display:flex;align-items:center;gap:10px}.menu-trigger{display:grid;place-items:center;width:42px;height:42px;border:1px solid #e6ebf2;border-radius:13px;background:#f7f9fc;color:var(--app-ink);font-size:20px}
.gsk-wordmark{text-decoration:none;color:var(--app-ink)}.gsk-wordmark>span:first-child{display:grid;place-items:center;width:39px;height:39px;border-radius:13px;background:#eaf1fc;font-size:23px}.gsk-wordmark>span:last-child{display:grid;gap:0}.gsk-wordmark strong{font-size:15px;font-weight:900;line-height:1.1}.gsk-wordmark small{font-size:8px;font-weight:850;letter-spacing:.14em;color:#7d8da5}
.topbar-actions{gap:8px}.topbar-notifications{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#f3f6fb;text-decoration:none;font-size:19px}.topbar-wallet{display:flex;align-items:center;gap:6px;padding:10px 11px;border-radius:12px;background:#eaf2ff;color:#244f87;text-decoration:none;font-size:12px}
.gsk-main-content{min-height:calc(100dvh - 66px);padding-bottom:calc(12px + env(safe-area-inset-bottom))}
.gsk-bottom-navigation{position:fixed;z-index:1020;right:0;bottom:0;left:0;display:grid;grid-template-columns:repeat(5,1fr);gap:2px;padding:8px 8px max(8px,env(safe-area-inset-bottom));border-top:1px solid #e7edf4;background:#ffffffed;backdrop-filter:blur(14px)}
.gsk-bottom-navigation a{display:grid;justify-items:center;gap:3px;padding:4px 2px;color:#8290a3;text-decoration:none}.gsk-bottom-navigation a>span{font-size:21px;line-height:1.2}.gsk-bottom-navigation small{font-size:9px;font-weight:750}.gsk-bottom-navigation a.is-active{color:#28558f}.gsk-bottom-navigation a.is-active>span{transform:translateY(-2px)}
.gsk-drawer-backdrop{position:fixed;inset:0;z-index:1090;background:#14243c80;backdrop-filter:blur(3px)}.gsk-drawer{position:fixed;inset:0 auto 0 0;z-index:1091;display:flex;flex-direction:column;width:min(86vw,340px);padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);background:#fff;box-shadow:18px 0 55px #10274726;transform:translateX(-105%);transition:transform .25s ease}.gsk-drawer.is-open{transform:translateX(0)}
.drawer-top{padding:20px 17px 15px;background:linear-gradient(135deg,#1b365d,#315f9f);color:#fff}.drawer-user{display:flex;align-items:center;gap:12px;margin-bottom:17px}.drawer-avatar{display:grid;place-items:center;width:46px;height:46px;border-radius:15px;background:#ffffff20;font-size:24px}.drawer-user-copy{display:grid;min-width:0}.drawer-user-copy small{font-size:9px;letter-spacing:.12em;color:#c9d8ec}.drawer-user-copy strong{font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.drawer-user-copy a{font-size:10px;color:#e1eaf6;text-decoration:none}.drawer-balance{display:flex;align-items:center;gap:11px;padding:11px 12px;border:1px solid #ffffff26;border-radius:13px;background:#ffffff14;color:#fff;text-decoration:none}.drawer-balance>span:first-child{font-size:25px}.drawer-balance>span:nth-child(2){display:grid;flex:1}.drawer-balance small{font-size:10px;color:#d1def0}.drawer-balance strong{font-size:17px}.drawer-balance>b{font-size:20px}
.drawer-navigation{flex:1;overflow:auto;padding:13px 11px;overscroll-behavior:contain}.drawer-navigation p{margin:12px 10px 7px;color:#91a0b4;font-size:9px;font-weight:900;letter-spacing:.13em}.drawer-navigation a{display:flex;align-items:center;gap:12px;min-height:45px;padding:8px 10px;border-radius:11px;color:#34445c;text-decoration:none;font-size:12px;font-weight:700}.drawer-navigation a.router-link-active{background:#edf3fc;color:#28558f}.drawer-navigation a>span{display:grid;place-items:center;width:28px;font-size:20px}.drawer-navigation a>b{margin-left:auto;color:#a3afbf;font-size:19px}
.drawer-footer{padding:13px 16px max(13px,env(safe-area-inset-bottom));border-top:1px solid #e9edf3}.drawer-logout{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;min-height:45px;border:1px solid #f0d5d5;border-radius:12px;background:#fff7f7;color:#bd4e4e;font-size:12px;font-weight:800}.drawer-footer>small{display:block;margin-top:9px;text-align:center;color:#96a1b0;font-size:9px}
@media(min-width:800px){.gsk-app-shell{max-width:520px;margin:0 auto;min-height:100dvh;box-shadow:0 0 55px #10274712}.gsk-topbar{border-radius:0}.gsk-drawer{width:340px}.gsk-bottom-navigation{right:auto;left:50%;width:min(520px,100%);transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.gsk-drawer{transition:none}.gsk-bottom-navigation a>span{transform:none!important}}

 .app-layout{position:relative;min-height:100dvh;background:var(--gsk-paper);overflow-x:clip}.premium-shell{width:100%;max-width:560px;min-height:100dvh;margin:0 auto;background:var(--gsk-paper);box-shadow:0 0 36px #152e4b0a}
.sidebar{position:fixed;inset:0 auto 0 0;z-index:1091;display:flex;width:min(86vw,320px);height:100dvh;overflow:hidden;flex-direction:column;background:#fff;box-shadow:16px 0 42px #122b4b20;transform:translate3d(-105%,0,0);transition:transform .24s cubic-bezier(.2,.75,.25,1);will-change:transform}.sidebar.active{transform:translate3d(0,0,0)}.overlay{position:fixed;inset:0;z-index:1090;background:#10233d80;backdrop-filter:blur(3px)}
.premium-sidebar-header{background:linear-gradient(130deg,#19365e,#315f9f);color:#fff}.premium-sidebar-wallet{border:1px solid #ffffff26;border-radius:13px;background:#ffffff14}.premium-sidebar-menu .sidebar-menu-item{display:flex;align-items:center;gap:11px;min-height:47px;margin:3px 0;padding:9px 11px;border-radius:11px;color:#53647c;font-size:11px;font-weight:750;transition:background .15s,color .15s}.premium-sidebar-menu .sidebar-menu-item.router-link-active,.premium-sidebar-menu .sidebar-menu-item.active{background:#edf3fc;color:#244e83}.premium-sidebar-menu .sidebar-menu-item .icon-3d{display:grid;place-items:center;width:30px;height:30px;flex:0 0 30px;border-radius:9px;background:#f1f4f8;font-size:18px}.premium-sidebar-menu .sidebar-menu-item.router-link-active .icon-3d{background:#dfeafb}.premium-sidebar-footer .btn{min-height:43px;border-radius:11px;font-size:11px;font-weight:850}
.app-header{position:sticky;top:0;z-index:1030;width:100%;padding:env(safe-area-inset-top) 12px 0;border-bottom:1px solid #e6ebf2;background:#ffffffed;backdrop-filter:blur(16px)}.premium-header-inner{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:61px}.header-menu-btn{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border:1px solid #e3eaf3;border-radius:12px;background:#fff;color:#244e83;font-size:23px}.premium-header-brand{display:flex;align-items:center;gap:9px;min-width:0;color:#203550}.premium-brand-mark{display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:12px;background:#eaf1fc;font-size:21px}.premium-header-brand>span:last-child{display:grid;min-width:0}.premium-header-brand strong{font-size:13px;font-weight:950;line-height:1.2}.premium-header-brand small{color:#8996a8;font-size:8px}.premium-header-actions{display:flex;align-items:center;gap:7px}.premium-notification{display:grid;place-items:center;width:39px;height:39px;border:1px solid #e4eaf2;border-radius:12px;background:#fff;font-size:20px}.premium-header-wallet{display:flex;align-items:center;gap:5px;min-height:38px;padding:0 10px;border:1px solid #dce6f2;border-radius:12px;background:#edf3fc;color:#244e83;font-size:10px;font-weight:900;white-space:nowrap}
.main-body-content{min-height:calc(100dvh - 62px);padding:0 0 calc(88px + env(safe-area-inset-bottom));overflow-x:clip}.premium-bottom-nav{position:fixed;right:auto;bottom:0;left:50%;z-index:1020;display:flex;width:min(100%,560px);min-height:62px;align-items:center;justify-content:space-around;gap:2px;padding:7px 5px calc(7px + env(safe-area-inset-bottom));border-top:1px solid #e4eaf2;background:#ffffffed;box-shadow:0 -7px 22px #1836570c;backdrop-filter:blur(15px);transform:translateX(-50%)}.premium-bottom-nav .nav-item{display:grid;flex:1;justify-items:center;align-content:center;gap:3px;min-width:0;min-height:48px;border-radius:11px;color:#8491a4;font-size:8px;font-weight:800;line-height:1.1}.premium-bottom-nav .nav-icon{font-size:21px;line-height:1.15}.premium-bottom-nav .nav-item.active,.premium-bottom-nav .nav-item.router-link-active{background:#edf3fc;color:#244e83}
@media(min-width:561px){.premium-shell{border-right:1px solid #e5ebf3;border-left:1px solid #e5ebf3}.premium-bottom-nav{border-right:1px solid #e5ebf3;border-left:1px solid #e5ebf3}}
@media(max-width:360px){.premium-header-inner{min-height:57px}.premium-header-brand small{display:none}.premium-header-wallet{padding:0 7px;font-size:9px}.premium-bottom-nav .nav-label{font-size:7px}}
@media(prefers-reduced-motion:reduce){.sidebar,.premium-sidebar-menu .sidebar-menu-item{transition:none}}
</style></style>
