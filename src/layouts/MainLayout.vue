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
          <span>🗃️</span><span><small>Available balance</small><strong>₹ {{ formatWalletAmount }}</strong></span><b>→</b>
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
        <router-link to="/wallet" class="topbar-wallet"><span>🗃️</span><b>₹{{ formatWalletAmount }}</b></router-link>
      </div>
    </header>

    <main class="gsk-main-content">
      <router-view v-slot="{ Component }">
        <Transition name="gsk-page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </main>

    <nav v-if="!hideBottomNav" class="gsk-bottom-navigation" aria-label="Primary navigation">
      <router-link to="/dashboard" active-class="is-active" exact-active-class="is-active"><span>🏠</span><small>Home</small></router-link>
      <router-link to="/games" active-class="is-active"><span>🎮</span><small>Games</small></router-link>
      <router-link to="/monthly-chart" active-class="is-active"><span>📊</span><small>Chart</small></router-link>
      <router-link to="/wallet" active-class="is-active"><span>🗃️</span><small>Wallet</small></router-link>
      <router-link to="/page/offers" active-class="is-active"><span>🎁</span><small>Offer</small></router-link>
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
.gsk-app-shell{position:relative;isolation:isolate;width:100%;max-width:680px;min-height:min-content;margin:0 auto;overflow-x:clip;background:#080d1b;color:#f4f6ff;box-shadow:0 0 70px #02061755}
.gsk-drawer-backdrop{position:fixed;inset:0;z-index:1090;background:#020617b8;backdrop-filter:blur(7px);animation:gsk-backdrop-in .2s ease both}
.gsk-drawer{position:fixed;inset:0 auto 0 0;z-index:1091;display:flex;width:min(88vw,350px);height:100dvh;flex-direction:column;overflow:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);border-right:1px solid #ffffff12;background:radial-gradient(circle at 8% 0,#243d79 0,transparent 37%),linear-gradient(160deg,#111a34,#080d1b 72%);color:#f7f8ff;box-shadow:22px 0 70px #02061780;transform:translate3d(-105%,0,0);transition:transform .32s cubic-bezier(.2,.8,.2,1);will-change:transform}
.gsk-drawer.is-open{transform:translate3d(0,0,0)}
.drawer-top{flex:0 0 auto;padding:23px 18px 15px;border-bottom:1px solid #ffffff12}
.drawer-user{display:flex;align-items:center;gap:12px;min-width:0;margin-bottom:17px}
.drawer-avatar{display:grid;place-items:center;width:49px;height:49px;flex:0 0 49px;border:1px solid #ffffff25;border-radius:16px;background:linear-gradient(145deg,#8b5cf6,#2563eb);box-shadow:0 9px 26px #6d5df633;font-size:24px}
.drawer-user-copy{display:grid;min-width:0;gap:2px}
.drawer-user-copy small{color:#9fb1d7;font-size:9px;font-weight:900;letter-spacing:.16em}
.drawer-user-copy strong{overflow:hidden;color:#fff;font-size:16px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}
.drawer-user-copy a{color:#a9c5ff;font-size:10px;font-weight:750}
.drawer-balance{display:flex;align-items:center;gap:11px;min-height:67px;padding:11px 13px;border:1px solid #8aa7ff35;border-radius:16px;background:linear-gradient(110deg,#263b70a8,#17264bc7);color:#fff;text-decoration:none;box-shadow:inset 0 1px #ffffff0c}
.drawer-balance>span:first-child{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#ffffff14;font-size:21px}
.drawer-balance>span:nth-child(2){display:grid;flex:1;gap:2px}
.drawer-balance small{color:#b7c7e6;font-size:9px}
.drawer-balance strong{color:#fff;font-size:17px;font-weight:950;font-variant-numeric:tabular-nums}
.drawer-balance>b{color:#9eb9ff;font-size:20px}
.drawer-navigation{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:13px 11px}
.drawer-navigation p{margin:13px 10px 7px;color:#7286b0;font-size:9px;font-weight:950;letter-spacing:.16em}
.drawer-navigation a{display:flex;align-items:center;gap:11px;min-height:46px;margin:3px 0;padding:8px 11px;border:1px solid transparent;border-radius:13px;color:#c2cce1;font-size:12px;font-weight:750;text-decoration:none;transition:background .18s,border-color .18s,color .18s,transform .18s}
.drawer-navigation a>span{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px;border-radius:10px;background:#ffffff0b;font-size:18px}
.drawer-navigation a>b{margin-left:auto;color:#7186b1;font-size:18px;font-weight:500}
.drawer-navigation a.router-link-active,.drawer-navigation a:focus-visible{border-color:#8b9fff35;background:linear-gradient(100deg,#6d5df52b,#2563eb12);color:#fff}
.drawer-navigation a.router-link-active>span{background:linear-gradient(145deg,#765cf5,#2769d8);box-shadow:0 5px 16px #4d5de644}
.drawer-navigation a:active{transform:scale(.985)}
.drawer-footer{flex:0 0 auto;padding:13px 16px max(14px,env(safe-area-inset-bottom));border-top:1px solid #ffffff12;background:#080d1b}
.drawer-logout{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;min-height:45px;border:1px solid #ff81912e;border-radius:13px;background:#ff647d12;color:#ff9eaa;font-size:12px;font-weight:850}
.drawer-logout:disabled{opacity:.65}
.drawer-footer>small{display:block;margin-top:10px;color:#7383a5;text-align:center;font-size:9px}
.gsk-topbar{position:sticky;top:0;z-index:1030;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:68px;padding:env(safe-area-inset-top) 14px 0;border-bottom:1px solid #ffffff12;background:#0b1223ed;backdrop-filter:blur(18px)}
.topbar-leading,.topbar-actions{display:flex;align-items:center;gap:10px;min-width:0}
.menu-trigger{display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;border:1px solid #ffffff1b;border-radius:14px;background:#ffffff09;color:#eaf0ff;font-size:22px;transition:background .18s,transform .18s}
.menu-trigger:active{transform:scale(.94);background:#765cf52c}
.gsk-wordmark{display:flex;align-items:center;gap:9px;min-width:0;color:#fff;text-decoration:none}
.gsk-wordmark>span:first-child{display:grid;place-items:center;width:39px;height:39px;flex:0 0 39px;border:1px solid #9a8cff50;border-radius:13px;background:linear-gradient(145deg,#765cf5,#2468db);box-shadow:0 7px 22px #5e5af544;font-size:21px}
.gsk-wordmark>span:last-child{display:grid;gap:0}
.gsk-wordmark strong{color:#fff;font-size:14px;font-weight:950;line-height:1.15;letter-spacing:-.02em}
.gsk-wordmark small{color:#8395bd;font-size:8px;font-weight:900;letter-spacing:.17em}
.topbar-actions{gap:8px}
.topbar-notifications{display:grid;place-items:center;width:40px;height:40px;border:1px solid #ffffff18;border-radius:13px;background:#ffffff08;font-size:19px;text-decoration:none}
.topbar-wallet{display:flex;align-items:center;gap:6px;min-height:40px;padding:0 11px;border:1px solid #8f9eff40;border-radius:13px;background:linear-gradient(110deg,#6d5df52a,#2563eb24);color:#e9edff;font-size:11px;text-decoration:none}
.topbar-wallet b{font-weight:950;font-variant-numeric:tabular-nums}
.gsk-main-content{min-height:calc(100dvh - 68px);padding-bottom:calc(94px + env(safe-area-inset-bottom));overflow-x:clip;background:#080d1b}
.gsk-bottom-navigation{position:fixed;right:auto;bottom:0;left:50%;z-index:1020;display:flex;width:min(100%,680px);min-height:70px;align-items:center;justify-content:space-around;gap:3px;padding:8px 7px calc(8px + env(safe-area-inset-bottom));border-top:1px solid #ffffff17;background:#0d1528f2;box-shadow:0 -12px 35px #02061766;backdrop-filter:blur(20px);transform:translateX(-50%)}
.gsk-bottom-navigation a{position:relative;display:grid;flex:1;justify-items:center;align-content:center;gap:3px;min-width:0;min-height:50px;padding:4px 2px;border-radius:13px;color:#7f8eae;font-size:9px;font-weight:800;text-decoration:none;transition:color .2s,background .2s,transform .2s}
.gsk-bottom-navigation a>span{display:grid;place-items:center;width:30px;height:27px;border-radius:9px;font-size:20px;transition:transform .2s,background .2s}
.gsk-bottom-navigation a>small{font-size:9px;line-height:1.1}
.gsk-bottom-navigation a.router-link-active,.gsk-bottom-navigation a.is-active{background:linear-gradient(145deg,#725cf52b,#2563eb18);color:#c8c4ff}
.gsk-bottom-navigation a.router-link-active>span,.gsk-bottom-navigation a.is-active>span{background:linear-gradient(145deg,#765cf5,#2563eb);box-shadow:0 5px 17px #5d5cf044;transform:translateY(-2px)}
.gsk-bottom-navigation a:active{transform:scale(.94)}
@media(min-width:681px){.gsk-app-shell{border-right:1px solid #ffffff0c;border-left:1px solid #ffffff0c}.gsk-bottom-navigation{border-right:1px solid #ffffff12;border-left:1px solid #ffffff12}}
@media(max-width:360px){.gsk-topbar{min-height:62px;padding-right:10px;padding-left:10px}.gsk-wordmark small{display:none}.topbar-actions{gap:5px}.topbar-wallet{padding:0 8px;font-size:10px}.gsk-bottom-navigation a>small{font-size:8px}}
@keyframes gsk-backdrop-in{from{opacity:0}to{opacity:1}}
.gsk-page-enter-active,.gsk-page-leave-active{transition:opacity .18s ease,transform .18s ease}
.gsk-page-enter-from{opacity:0;transform:translateY(7px)}
.gsk-page-leave-to{opacity:0;transform:translateY(-4px)}
@media(prefers-reduced-motion:reduce){.gsk-drawer,.drawer-navigation a,.menu-trigger,.gsk-bottom-navigation a,.gsk-bottom-navigation a>span,.gsk-page-enter-active,.gsk-page-leave-active{transition:none!important;animation:none!important}}
</style>
