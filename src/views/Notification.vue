<template>
  <main class="gsk-screen">
    <GskScreenHeader emoji="🔔" kicker="STAY IN THE LOOP" title="Notifications" subtitle="Updates about your account and activity." />
    <nav class="notification-shortcuts" aria-label="Notification destinations"><router-link to="/wallet">🗃️ Wallet activity</router-link><router-link to="/play-history">🎟️ My plays</router-link></nav>
    <section class="push-preference-card">
      <div class="push-preference-copy"><span>🔔</span><div><strong>Push notifications</strong><small>{{ notificationsEnabled&&pushPermissionState==='granted'?'Notifications are enabled on this device.':'Enable alerts to receive important updates.' }}</small></div></div>
      <button type="button" class="push-toggle" :class="{enabled:notificationsEnabled&&pushPermissionState==='granted'}"
        :disabled="pushLoading||preferenceLoading||pushPermissionState==='checking'" @click="togglePushNotifications"
        :aria-pressed="notificationsEnabled&&pushPermissionState==='granted'"><span></span></button>
      <div v-if="pushLoading||preferenceLoading" class="small text-primary mt-2">⏳ Updating notification settings…</div>
      <p v-if="pushStatus" class="small mt-2 mb-0" role="status">{{ pushStatus }}</p>
      <p v-if="permissionMessage||preferenceMessage" class="small text-secondary mt-1 mb-0" role="status">{{ permissionMessage||preferenceMessage }}</p>
    </section>
    <section v-if="appUpdate.latest_url" class="app-update-card">
      <div class="app-update-symbol">📲</div><div class="app-update-copy"><span>NEW VERSION AVAILABLE</span><strong>Update GSK Play</strong><small v-if="appUpdate.latest_version">Version {{ appUpdate.latest_version }} · {{ formatAppUpdateDate(appUpdate.update_date) }}</small><small>Download the APK and follow Android's installation steps.</small></div>
      <button type="button" @click="openLatestApp">Update →</button>
    </section>
    <div class="notification-list-heading"><div><span class="gsk-page-kicker">YOUR ACTIVITY</span><h2>Recent updates</h2></div><small>{{ notifications.length }} updates</small></div>
    <div v-if="isInitialLoading" class="gsk-empty-state"><span>⏳</span><strong>Loading notifications…</strong></div>
    <div v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}<button class="btn btn-sm btn-outline-danger ms-2" @click="fetchNotifications(1)">Retry</button></div>
    <template v-else>
      <section v-for="group in groupedNotifications" :key="group.key" class="notification-group">
        <h3>{{ group.title }}</h3>
        <article v-for="notification in group.items" :key="notification.id" class="notification-row">
          <span class="notification-symbol">{{ notification.subject?.toLowerCase().includes('win')?'🏆':notification.subject?.toLowerCase().includes('wallet')||notification.subject?.toLowerCase().includes('payment')?'🗃️':notification.subject?.toLowerCase().includes('game')?'🎮':notification.subject?.toLowerCase().includes('security')?'🔐':'📣' }}</span>
          <div class="notification-copy"><strong>{{ notification.subject||'Notification' }}</strong><p v-if="notification.message">{{ notification.message }}</p><small>{{ formatNotificationTime(notification.created_at) }}</small></div>
        </article>
      </section>
      <div v-if="notifications.length===0" class="gsk-empty-state"><span>🔕</span><strong>You're all caught up</strong><p>New account and activity updates will appear here.</p></div>
      <div v-if="notifications.length" class="notification-more"><button v-if="hasMore" type="button" class="btn btn-outline-primary rounded-pill px-4" :disabled="isLoading" @click="loadMore">{{ isLoading?'Loading…':'Load more updates' }}</button><small v-else>You're up to date.</small></div>
    </template>
  </main>
</template>
<script setup>
import GskScreenHeader from '@/components/GskScreenHeader.vue'
import api from '@/plugins/axios'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { PushNotifications } from '@capacitor/push-notifications'
import { subscribeToPush, disablePush } from '@/services/pushNotifications'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { notificationEventFromText, playNotificationSound } from '@/services/notificationAudio'

const notifications = ref([])
const hasLoadedOnce = ref(false)
let notificationRefreshTimer = null
const isNativeApp = Capacitor.isNativePlatform()
const isAndroidApp = Capacitor.getPlatform() === 'android'
const pushLoading = ref(false)
const pushStatus = ref('')
const pushPermissionState = ref('checking')
const permissionMessage = ref('')
const notificationsEnabled = ref(true)
const preferenceLoading = ref(false)
const preferenceMessage = ref('')
const appUpdate = ref({ latest_url: '', latest_version: '', update_date: '2026-08-12' })

const loadNotificationPreference = async () => {
  try {
    const { data } = await api.get('/notifications/preference', { showGlobalLoader: false })
    notificationsEnabled.value = data?.notifications_enabled !== false
  } catch (error) {
    preferenceMessage.value = 'Unable to load your notification preference.'
    console.warn('Unable to load notification preference:', error?.message || error)
  }
}

const saveNotificationPreference = async (enabled) => {
  const { data } = await api.put('/notifications/preference', { enabled }, { showGlobalLoader: false })
  notificationsEnabled.value = data?.notifications_enabled === true
  return data
}

const togglePushNotifications = async () => {
  if (pushLoading.value || preferenceLoading.value) return
  pushStatus.value = ''
  permissionMessage.value = ''

  const shouldDisable = notificationsEnabled.value && pushPermissionState.value === 'granted'
  if (shouldDisable) {
    preferenceLoading.value = true
    try {
      await saveNotificationPreference(false)
      const result = await disablePush()
      pushStatus.value = result.message
      preferenceMessage.value = result.ok ? 'Push alerts are disabled.' : result.message
      await refreshPushPermission()
    } catch (error) {
      preferenceMessage.value = error?.response?.data?.message || 'Unable to save your notification preference.'
    } finally {
      preferenceLoading.value = false
    }
    return
  }

  pushLoading.value = true
  try {
    // Ask for OS/browser permission only through this single control.
    const result = await subscribeToPush()
    pushStatus.value = result.message
    if (result.ok) {
      preferenceLoading.value = true
      try {
        await saveNotificationPreference(true)
        preferenceMessage.value = ''
      } catch (error) {
        preferenceMessage.value = error?.response?.data?.message || ''
      } finally {
        preferenceLoading.value = false
      }
    }
    await refreshPushPermission()
  } finally {
    pushLoading.value = false
  }
}

const fetchAppUpdate = async () => {
  try {
    const { data } = await api.get('/app-update', { showGlobalLoader: false })
    let latestUrl = ''
    try {
      const parsedUrl = new URL(String(data?.latest_url || ''))
      if (parsedUrl.protocol === 'https:') latestUrl = parsedUrl.href
    } catch {
      latestUrl = ''
    }
    const updateDate = /^\d{4}-\d{2}-\d{2}$/.test(String(data?.update_date || ''))
      ? data.update_date
      : '2026-08-12'
    appUpdate.value = { latest_url: latestUrl, latest_version: String(data?.latest_version || '').trim().slice(0, 50), update_date: updateDate }
  } catch {
    // App updates remain optional when the API or URL has not been configured.
  }
}

const formatAppUpdateDate = (value) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const openLatestApp = async () => {
  if (!appUpdate.value.latest_url) return
  try {
    await Browser.open({ url: appUpdate.value.latest_url })
  } catch (error) {
    console.warn('Unable to open the latest APK URL:', error?.message || error)
  }
}

const refreshPushPermission = async () => {
  permissionMessage.value = ''
  try {
    if (isNativeApp) {
      const permission = await PushNotifications.checkPermissions()
      const receive = permission?.receive
      if (receive === 'granted') {
        pushPermissionState.value = 'granted'
        permissionMessage.value = 'Device notification permission is enabled.'
      } else if (receive === 'denied') {
        pushPermissionState.value = 'denied'
        permissionMessage.value = isAndroidApp ? 'Notifications are blocked. Open Android Settings → Apps → GSK Play → Notifications to enable them.' : 'Notifications are blocked by device settings. Open this app’s notification settings and allow notifications.'
      } else {
        pushPermissionState.value = 'prompt'
        permissionMessage.value = 'Permission will be requested only after you tap Enable.'
      }
      return
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      pushPermissionState.value = 'unsupported'
      permissionMessage.value = 'This browser does not support push notifications.'
      return
    }
    if (!window.isSecureContext) {
      pushPermissionState.value = 'unsupported'
      permissionMessage.value = 'Browser notifications require a secure HTTPS connection.'
      return
    }
    const permission = Notification.permission
    if (permission === 'granted') {
      pushPermissionState.value = 'granted'
      permissionMessage.value = 'Browser notification permission is enabled.'
    } else if (permission === 'denied') {
      pushPermissionState.value = 'denied'
      permissionMessage.value = 'Notifications are blocked by the browser.'
    } else {
      pushPermissionState.value = 'prompt'
      permissionMessage.value = 'Permission will be requested only after you tap Enable.'
    }
  } catch {
    pushPermissionState.value = 'unsupported'
    permissionMessage.value = 'Unable to check notification permission on this platform.'
  }
}

const enablePush = async () => {
  pushLoading.value = true
  pushStatus.value = ''
  try {
    const result = await subscribeToPush()
    pushStatus.value = result.message
    await refreshPushPermission()
  } finally {
    pushLoading.value = false
  }
}
const isLoading = ref(false)
const errorMessage = ref('')

const currentPage = ref(1)
const lastPage = ref(1)
const hasMore = ref(false)

const isInitialLoading = computed(() => {
  return isLoading.value && notifications.value.length === 0
})

const groupedNotifications = computed(() => {
  const groups = {
    today: {
      key: 'today',
      title: 'Today',
      items: [],
    },

    yesterday: {
      key: 'yesterday',
      title: 'Yesterday',
      items: [],
    },

    earlier: {
      key: 'earlier',
      title: 'Earlier',
      items: [],
    },
  }

  notifications.value.forEach((notification) => {
    const date = new Date(notification.created_at)

    if (Number.isNaN(date.getTime())) {
      return
    }

    const group = isToday(date)
      ? groups.today
      : isYesterday(date)
        ? groups.yesterday
        : groups.earlier

    group.items.push(notification)
  })

  return Object.values(groups).filter(
    group => group.items.length > 0
  )
})

const fetchNotifications = async (page = 1) => {
  if (isLoading.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/notifications', {
      params: {
        page,
        per_page: 20,
      },
    })

    if (!data?.success) {
      throw new Error(
        data?.message || 'Unable to load notifications.'
      )
    }

    const newNotifications = Array.isArray(data.data)
      ? data.data
      : []

    if (hasLoadedOnce.value && page === 1) {
      const previousIds = new Set(notifications.value.map(item => item.id))
      newNotifications.filter(item => !previousIds.has(item.id)).forEach(item => {
        void playNotificationSound(notificationEventFromText([item.subject, item.message].filter(Boolean).join(' ')), item.id)
      })
    }
    notifications.value = page === 1
      ? newNotifications
      : [
        ...notifications.value,
        ...newNotifications,
      ]

    currentPage.value = data.meta?.current_page ?? page
    lastPage.value = data.meta?.last_page ?? page

    hasMore.value =
      data.meta?.has_more === true ||
      currentPage.value < lastPage.value
    hasLoadedOnce.value = true

  } catch (error) {
    console.error('Notification API Error:', error)

    errorMessage.value =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong while loading notifications.'
  } finally {
    isLoading.value = false
  }
}

const loadMore = () => {
  if (!hasMore.value || isLoading.value) {
    return
  }

  fetchNotifications(currentPage.value + 1)
}

const isToday = (date) => {
  const today = new Date()

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const isYesterday = (date) => {
  const yesterday = new Date()

  yesterday.setDate(
    yesterday.getDate() - 1
  )

  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

const formatNotificationTime = (dateTime) => {
  if (!dateTime) {
    return ''
  }

  const date = new Date(dateTime)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  if (isToday(date)) {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (isYesterday(date)) {
    return `Yesterday, ${date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const handlePermissionVisibilityChange = () => {
  if (document.visibilityState === 'visible') void refreshPushPermission()
}

onMounted(() => {
  document.addEventListener('visibilitychange', handlePermissionVisibilityChange)
  void refreshPushPermission()
  void loadNotificationPreference()
  void fetchAppUpdate()
  fetchNotifications()
  // Push delivery handles immediate alerts; this is a low-frequency
  // recovery sync for missed notifications while the page stays visible.
  notificationRefreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible') fetchNotifications(1)
  }, 60000)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handlePermissionVisibilityChange)
  if (notificationRefreshTimer) clearInterval(notificationRefreshTimer)
})
</script><style scoped>
.gsk-screen{min-height:min-content;padding:14px 13px calc(100px + env(safe-area-inset-bottom));background:#f4f7fb;color:#1e2c42}.screen-banner{display:flex;align-items:center;gap:13px;padding:19px;border-radius:19px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff}.screen-banner-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#ffffff1b;font-size:28px}.screen-banner span{color:#cbd9eb;font-size:9px;font-weight:900;letter-spacing:.13em}.screen-banner h1{margin:2px 0;color:#fff;font-size:22px;font-weight:900}.screen-banner p{margin:0;color:#d5e1f0;font-size:11px}.push-preference-card,.app-update-card{margin-top:13px;padding:14px;border:1px solid #e5ebf3;border-radius:16px;background:#fff}.push-preference-copy{display:flex;align-items:center;gap:11px}.push-preference-copy>span{font-size:26px}.push-preference-copy div{display:grid;flex:1}.push-preference-copy strong{font-size:12px}.push-preference-copy small{color:#7b899d;font-size:10px}.push-toggle{position:relative;width:49px;height:28px;border:0;border-radius:30px;background:#cbd3df;transition:background .2s}.push-toggle span{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 4px #10274730;transition:transform .2s}.push-toggle.enabled{background:#2b9b6d}.push-toggle.enabled span{transform:translateX(21px)}.app-update-card{display:flex;align-items:center;gap:11px;background:#fff8e8;border-color:#f0dfb8}.app-update-symbol{font-size:29px}.app-update-copy{display:grid;flex:1;min-width:0}.app-update-copy span{font-size:8px;font-weight:900;color:#9a762e;letter-spacing:.1em}.app-update-copy strong{font-size:12px}.app-update-copy small{font-size:9px;color:#806e4c}.app-update-card button{border:0;border-radius:9px;padding:8px 10px;background:#315f9f;color:#fff;font-size:9px;font-weight:850}.notification-list-heading{display:flex;align-items:end;justify-content:space-between;margin:22px 1px 10px}.notification-list-heading h2{margin:2px 0 0;font-size:17px;font-weight:900}.notification-list-heading>small{color:#8592a4;font-size:9px}.notification-group{margin-bottom:13px}.notification-group h3{margin:0 0 7px;color:#8492a6;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.notification-row{display:flex;align-items:flex-start;gap:11px;padding:13px;margin-bottom:8px;border:1px solid #e5ebf3;border-radius:14px;background:#fff}.notification-symbol{display:grid;place-items:center;width:39px;height:39px;flex:0 0 39px;border-radius:12px;background:#edf3fc;font-size:21px}.notification-copy{min-width:0}.notification-copy strong{font-size:11px;font-weight:850}.notification-copy p{margin:3px 0;color:#63738a;font-size:10px;line-height:1.5;white-space:pre-line}.notification-copy small{color:#9aa5b3;font-size:8px}.notification-more{display:grid;justify-items:center;padding:12px}.notification-more small{color:#8794a5;font-size:10px}
</style>
<style scoped>
.notification-shortcuts{display:flex;gap:8px;margin:12px 0;overflow-x:auto;scrollbar-width:none}.notification-shortcuts::-webkit-scrollbar{display:none}.notification-shortcuts a{display:flex;align-items:center;justify-content:center;gap:7px;flex:1;min-height:38px;padding:0 10px;border:1px solid #e1e9f3;border-radius:12px;background:#fff;color:#3e5c7f;text-decoration:none;font-size:10px;font-weight:850;white-space:nowrap}.push-preference-card,.app-update-card{border-radius:17px}.notification-list-heading{display:flex;align-items:end;justify-content:space-between;margin:20px 2px 10px}.notification-list-heading h2{margin:3px 0 0;font-size:17px;font-weight:950}.notification-group{margin-bottom:15px}.notification-group h3{margin:0 2px 8px;color:#78889e;font-size:9px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}.notification-row{display:flex;gap:11px;padding:13px;margin-bottom:8px;border:1px solid #e5ebf3;border-radius:15px;background:#fff;box-shadow:0 5px 16px #1b365d08}.notification-symbol{display:grid;place-items:center;width:39px;height:39px;flex:0 0 39px;border-radius:12px;background:#edf3fc;font-size:21px}.notification-copy strong{font-size:11px}.notification-copy p{margin:4px 0;color:#66768d;font-size:10px;line-height:1.5}.notification-copy small{color:#91a0b2;font-size:9px}
</style>

<style scoped>
.gsk-screen{min-height:min-content;padding:15px 13px calc(13px + env(safe-area-inset-bottom));background:radial-gradient(circle at 100% 0, #ffffff 0, #384aff8f 10%), #028214;color:#f4f6ff}
.notification-shortcuts{display:flex;gap:8px;margin:13px 0}.notification-shortcuts a{flex:1;padding:10px 12px;border:1px solid #354363;border-radius:12px;background:#131e35;color:#c8c0ff;font-size:10px;font-weight:850}
.push-preference-card,.app-update-card,.notification-row{border:1px solid #2e3d5e;border-radius:17px;background:linear-gradient(155deg,#17223c,#101a2e);color:#f4f6ff;box-shadow:0 10px 24px #00000022}
.push-preference-copy strong,.app-update-copy strong{color:#fff}.push-preference-copy small,.app-update-copy small{color:#91a0bf}
.push-preference-copy>span,.app-update-symbol,.notification-symbol{background:#292650;color:#d0c7ff}
.push-toggle{border-color:#465779;background:#27334b}.push-toggle.enabled{border-color:#3bba91;background:#13785e}
.app-update-copy>span{color:#a99bff}.app-update-card>button{border:1px solid #a294ff;border-radius:11px;background:linear-gradient(110deg,#765cf5,#326ce5);color:#fff}
.notification-list-heading h2{color:#fff;font-size:17px;font-weight:950}.notification-list-heading small{color:#91a0bf}
.notification-group>h3{color:#a99bff}.notification-row{border-radius:15px}
.notification-copy strong{color:#f4f6ff}.notification-copy small,.notification-copy p{color:#91a0bf}
.notification-row.unread{border-color:#7166c5;background:linear-gradient(145deg,#201e43,#121d34)}
.notification-more{border-color:#465779;background:#1a2945;color:#c8c0ff}
.gsk-screen .gsk-empty-state{border-color:#34415f;background:#111a2e;color:#f4f6ff}
</style>
