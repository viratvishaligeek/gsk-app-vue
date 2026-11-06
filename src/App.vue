<script setup>
import { onMounted, ref } from 'vue'
import gskLogo from '@/assets/img/logo.png'
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
    await StatusBar.setStyle({ style: Style.Light })
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
      <div v-if="showSplash" class="launch-splash" role="status" aria-label="Loading GSK Play">
        <div class="launch-splash__glow launch-splash__glow--one"></div>
        <div class="launch-splash__glow launch-splash__glow--two"></div>
        <div class="launch-splash__content">
          <div class="launch-splash__logo" aria-hidden="true">
            <img :src="gskLogo" alt="">
          </div>
          <p class="launch-splash__eyebrow">WELCOME TO</p>
          <h1>GSK Play</h1>
          <p class="launch-splash__tagline">Fast results. Smooth play.</p>
          <div class="launch-splash__loader" aria-hidden="true"><span></span><span></span><span></span></div>
          <p class="launch-splash__status">Preparing your experience…</p>
        </div>
      </div>
    </Transition>
  </div>
</template>


