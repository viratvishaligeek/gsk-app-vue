<script setup>
import { onMounted, ref } from 'vue'
import { isGlobalLoading } from '@/utils/requestLoader'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import router from '@/router'
import { initNativePushNotifications, restorePushSubscription, syncPushSubscription } from '@/services/pushNotifications'
import { disconnectActivePresence } from '@/composables/usePresence'

const showSplash = ref(true)
const pushPermissionNotice = ref('')

onMounted(async () => {
  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#102b56' })
    await StatusBar.setOverlaysWebView({ overlay: false })
  } catch (err) {
    console.log('Not on mobile native app:', err)
  }

  window.setTimeout(() => { showSplash.value = false }, 1150)
  void initNativePushNotifications().then((result) => {
    if (!result?.ok && result?.message && result.message !== 'Not running as a native app.') {
      pushPermissionNotice.value = result.message
    }
  })
  void restorePushSubscription()
  router.afterEach(() => { void syncPushSubscription() })

  // Handle verified HTTPS App Links when the payment provider returns to the app.
  // Only accept the production wallet return URL; never navigate to arbitrary incoming URLs.
  const handlePaymentReturnLink = async (url) => {
    if (!url) return

    try {
      const incoming = new URL(url)
      if (incoming.protocol !== 'https:' || incoming.hostname !== 'playonlinekhaiwal.com') return
      if (incoming.pathname !== '/wallet/add') return

      await router.replace({
        path: incoming.pathname,
        query: Object.fromEntries(incoming.searchParams.entries()),
      })
    } catch (error) {
      console.warn('Unable to handle payment return link:', error)
    }
  }

  void App.addListener('appUrlOpen', ({ url }) => handlePaymentReturnLink(url))
  // Also check the launch URL for the cold-start case (app was not already running).
  void App.getLaunchUrl().then((launch) => {
    if (launch?.url) return handlePaymentReturnLink(launch.url)
  }).catch((error) => {
    console.warn('Unable to read native app launch URL:', error)
  })

  let backButtonPressedOnce = false

  App.addListener('backButton', async ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      if (backButtonPressedOnce) {
        await disconnectActivePresence()
        await App.exitApp()
      } else {
        backButtonPressedOnce = true
        alert('Press back again to exit')
        setTimeout(() => {
          backButtonPressedOnce = false
        }, 2000)
      }
    }
  })
})
</script>

<template>
  <div class="app-root">
    <div v-if="isGlobalLoading" class="global-loading-indicator" role="status" aria-live="polite">
      <span class="global-loading-indicator__bar"></span>
      <span class="visually-hidden">Loading content…</span>
    </div>
    <router-view />
    <div v-if="pushPermissionNotice" class="push-permission-notice" role="alert">
      <span>{{ pushPermissionNotice }}</span>
      <button type="button" aria-label="Dismiss notification permission message"
        @click="pushPermissionNotice = ''">Dismiss</button>
    </div>
    <Transition name="launch-splash">
      <div v-if="showSplash" class="launch-splash" role="status" aria-label="Loading gali satta kings">
        <div class="launch-splash__glow launch-splash__glow--one"></div>
        <div class="launch-splash__glow launch-splash__glow--two"></div>
        <div class="launch-splash__content">
          <div class="launch-splash__logo">
            <img src="../assets/icon.png" style="height: 200px;" alt="">
          </div>
          <p class="launch-splash__eyebrow">WELCOME TO</p>
          <h1>gali satta kings</h1>
          <p class="launch-splash__tagline">Fast results. Smooth play.</p>
          <div class="launch-splash__loader" aria-hidden="true"><span></span><span></span><span></span></div>
          <p class="launch-splash__status">Preparing your experience…</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.push-permission-notice{position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:10001;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border:1px solid #f0dfb8;border-radius:13px;background:#fff8e8;color:#735a2b;box-shadow:0 8px 24px #142b4b20;font-size:11px}.push-permission-notice button{flex-shrink:0;border:0;border-radius:8px;padding:7px 10px;background:#244e83;color:#fff;font-size:10px;font-weight:800}
.launch-splash{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;overflow:hidden;padding:env(safe-area-inset-top) 18px env(safe-area-inset-bottom);color:#fff;background:radial-gradient(circle at 80% 15%,#426b9e 0,transparent 34%),linear-gradient(145deg,#142b4b,#315f9f)}
.launch-splash__content{position:relative;z-index:1;width:min(88vw,420px);text-align:center;animation:splash-rise .55s cubic-bezier(.2,.8,.2,1) both}.launch-splash__logo{display:grid;place-items:center;width:142px;height:142px;margin:0 auto 18px;overflow:hidden;border:1px solid #ffffff45;border-radius:30px;background:#fff;box-shadow:0 18px 40px #0b1e3c40}.launch-splash__logo img{width:100%;height:100%;object-fit:contain}.launch-splash__eyebrow{margin:0 0 7px;color:#d4e2f3;font-size:9px;font-weight:900;letter-spacing:.28em}.launch-splash h1{margin:0;color:#fff;font-size:clamp(23px,6vw,31px);font-weight:950;letter-spacing:-.025em}.launch-splash__tagline{margin:9px 0 25px;color:#d2dfef;font-size:12px}.launch-splash__loader{display:flex;align-items:center;justify-content:center;gap:7px;height:20px}.launch-splash__loader span{width:7px;height:7px;border-radius:50%;background:#f0bd58;animation:splash-dot .8s ease-in-out infinite alternate}.launch-splash__loader span:nth-child(2){animation-delay:.16s}.launch-splash__loader span:nth-child(3){animation-delay:.32s}.launch-splash__status{margin:9px 0 0;color:#b7c9df;font-size:10px}.launch-splash__glow{position:absolute;width:58vw;aspect-ratio:1;border-radius:50%;filter:blur(55px);opacity:.17;animation:splash-float 5s ease-in-out infinite alternate}.launch-splash__glow--one{top:-20%;left:-20%;background:#efb64e}.launch-splash__glow--two{right:-24%;bottom:-28%;background:#80b4ed;animation-delay:-2s}.launch-splash-enter-active,.launch-splash-leave-active{transition:opacity .3s ease,transform .3s ease}.launch-splash-leave-to{opacity:0;transform:scale(1.02)}
.global-loading-indicator{position:fixed;inset:0 0 auto;height:3px;overflow:hidden;z-index:2000;pointer-events:none;background:#244e8318}.global-loading-indicator__bar{display:block;width:38%;height:100%;border-radius:0 4px 4px 0;background:linear-gradient(90deg,#315f9f,#f0bd58);box-shadow:0 0 12px #315f9f45;animation:global-loading-progress 1.1s ease-in-out infinite;transform-origin:left center}
@keyframes global-loading-progress{0%{transform:translateX(-110%) scaleX(.55)}50%{transform:translateX(110%) scaleX(1)}100%{transform:translateX(300%) scaleX(.65)}}@keyframes splash-rise{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes splash-dot{from{opacity:.35;transform:translateY(0) scale(.8)}to{opacity:1;transform:translateY(-4px) scale(1.2)}}@keyframes splash-float{to{transform:translate3d(12%,8%,0) scale(1.12)}}
@media(prefers-reduced-motion:reduce){.global-loading-indicator__bar{animation:none;width:100%}.launch-splash,.launch-splash *{animation:none!important;transition:none!important}}
</style>
