<template>
  <div v-if="!hasInitialLoadCompleted" class="content-area premium-page" aria-busy="true">
    <div class="premium-section">
      <LoadingState variant="featured" />
      <LoadingState variant="market-list" :count="3" />
    </div>
  </div>
  <div v-else-if="errorMessage && games.length === 0" class="content-area premium-page">
    <section class="premium-empty-state">
      <span class="premium-empty-icon">
        <i class="bi bi-wifi-off"> </i>
      </span>
      <h2>We couldn't load the markets</h2>
      <p>{{ errorMessage }}</p>
      <button class="btn btn-primary" @click="fetchGames">
        <i class="bi bi-arrow-clockwise me-2"> </i>Try again
      </button>
    </section>
  </div>
  <div v-else ref="dashboardRootElement" class="content-area premium-page">
    <section v-if="marqueeText" class="premium-announcement" aria-label="Announcement">
      <span class="premium-announcement-icon">
        <i class="bi bi-megaphone-fill"> </i>
      </span>
      <div class="premium-marquee-viewport">
        <div class="premium-marquee-track">
          <span>{{ marqueeText }}</span>
          <span aria-hidden="true">{{ marqueeText }}</span>
        </div>
      </div>
    </section>
    <section v-if="banners.length" class="premium-banner-wrap" aria-label="Featured promotions">
      <div id="heroCarousel" ref="heroCarouselElement" class="carousel slide premium-banner">
        <div class="carousel-indicators" v-if="banners.length > 1">
          <button v-for="(banner, index) in banners" :key="banner.id" type="button"
            :class="{ active: index === activeBannerIndex }" :aria-label="'Show banner ' + (index + 1)"
            :aria-current="index === activeBannerIndex ? 'true' : undefined" @click="goToBanner(index)"></button>
        </div>
        <div class="carousel-inner">
          <div v-for="(banner, index) in banners" :key="banner.id" class="carousel-item"
            :class="{ active: index === 0 }">
            <a v-if="banner.destinationUrl" :href="banner.destinationUrl"
              :target="isExternalBannerUrl(banner.destinationUrl) ? '_blank' : undefined"
              :rel="isExternalBannerUrl(banner.destinationUrl) ? 'noopener noreferrer' : undefined">
              <img :src="banner.imageUrl" class="d-block w-100" :alt="banner.title" width="1200" height="360"
                fetchpriority="high" />
            </a>
            <img v-else :src="banner.imageUrl" class="d-block w-100" :alt="banner.title" width="1200" height="360" />
          </div>
        </div>
      </div>
    </section>
    <section class="reference-wallet-card" aria-label="Wallet balance">
      <div class="reference-wallet-brand">
        <span>{{ authStore.name }}</span>
      </div>
      <div class="reference-wallet-body">
        <div>
          <strong class="reference-wallet-balance">₹{{ formatWalletAmount }}</strong>
          <span>My Balance</span>
        </div>
        <router-link to="/wallet/add" class="reference-add-money">
          <i class="bi bi-plus-lg"> </i>
          <span>Add Money</span>
        </router-link>
      </div>
    </section>

    <section v-if="featuredGame" class="featured-winner-card" aria-label="Featured latest market result">
      <div class="featured-winner-glow" aria-hidden="true"></div>
      <img class="featured-winner-trophy featured-winner-trophy-left" src="https://img.icons8.com/color/96/trophy.png"
        alt="" width="100" height="100" loading="lazy" />
      <div class="featured-winner-content">
        <h2 class="fs-1">{{ featuredGame.name }}</h2>
        <p class="featured-winner-time">Result Time <span>{{ formatTime(featuredGame.result_time) }}</span></p>
        <div class="featured-winner-number" :class="{ 'is-pending': featuredGame.today_result?.date !== todayDate }"
          aria-label="Today's result">
          {{ featuredGame.today_result?.date === todayDate ? (featuredGame.today_result?.number ?? '--') : '--' }}
        </div>
        <span v-if="featuredGame.today_result?.date === todayDate"
          class="featured-winner-live featured-winner-live-dot">
          🔴 Live Result</span>
        <span v-else class="featured-winner-pending">TODAY'S RESULT AWAITED</span>
      </div>
      <img class="featured-winner-trophy featured-winner-trophy-right" src="https://img.icons8.com/color/96/trophy.png"
        alt="" width="100" height="100" loading="lazy" />
    </section>
    <section v-if="noticeEnabled && noticeText" class="premium-notice">
      <div class="premium-notice-title">
        <i class="bi bi-info-circle-fill"></i>
        <strong>Important notice</strong>
      </div>
      <p v-for="(line, index) in noticeLines" :key="index">{{ line }}</p>
    </section>
    <section class="premium-section premium-games-section">
      <div class="premium-section-heading">
        <div>
          <span class="premium-eyebrow">LATEST RESULTS</span>
          <h2>Markets</h2>
          <p>{{ marketCount }} markets · swipe to explore</p>
        </div>
        <router-link to="/market-games" class="btn btn-primary animate">Play Game <i class="bi bi-arrow-up-right"> </i>
        </router-link>
      </div>
      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="fetchGames">Retry</button>
      </div>
      <div v-else-if="isLoading" class="premium-loading-row">
        <LoadingState variant="market-list" :count="3" />
      </div>
      <div v-else-if="games.length === 0" class="premium-empty-inline">
        <i class="bi bi-grid"> </i>
        <strong>No markets available right now</strong>
        <span>Please check back soon.</span>
      </div>
      <div v-else class="premium-game-scroller" aria-label="Available market games">
        <article v-for="(game, index) in games" :key="game.id" v-memo="[game, isGamePlayable(game), serverOffset]"
          class="premium-game-card" :class="{ 'premium-game-card-closed': !isGamePlayable(game) }">
          <div class="premium-game-card-top">
            <h3>{{ game.name }}</h3>
            <span class="premium-market-status" :class="isGamePlayable(game) ? 'is-open' : 'is-closed'">
              {{ game.monthly_closure ? 'Month-end closed' : getGameStatus(game) }}
            </span>
          </div>
          <span class="small"><i class="bi bi-clock me-1"></i>{{ formatTime(game.result_time) }}</span>
          <div class="row position-relative align-items-center">
            <div class="col-6 text-center">
              <div class="m-0 py-0 fw-bold text- btn btn-outline-danger premium-game-result-large">
                {{ game.previous_result?.number }}
              </div>
              <p class="m-0 text-danger">( कल )</p>
            </div>
            <span class="result-center-dot" aria-label="Live" role="status"></span>

            <div class="col-6 text-center">
              <div class="m-0 py-0 fw-bold text-success btn btn-outline-success premium-game-result-large">
                {{ game.today_result?.date === todayDate ? (game.today_result?.number ?? '--') : '--' }}
              </div>
              <p class="m-0 text-success">( आज )</p>
            </div>
          </div>
          <p v-if="game.monthly_closure" class="premium-closed-note">
            {{ game.play_status_message || 'Market closed for month-end.' }}
          </p>
        </article>
      </div>
      <div v-if="games.length > 1" class="premium-scroll-hint">
        <i class="bi bi-arrow-left-right"> </i> Swipe to explore more markets
      </div>
    </section>
    <section v-if="bottomBanners.length" class="premium-banner-wrap premium-bottom-banner-wrap"
      aria-label="More promotions">
      <div id="bottomBannerCarousel" ref="bottomCarouselElement" class="carousel slide premium-banner">
        <div class="carousel-indicators" v-if="bottomBanners.length > 1">
          <button v-for="(banner, index) in bottomBanners" :key="banner.id" type="button"
            :class="{ active: index === activeBottomBannerIndex }" :aria-label="'Show bottom banner ' + (index + 1)"
            :aria-current="index === activeBottomBannerIndex ? 'true' : undefined"
            @click="goToBottomBanner(index)"></button>
        </div>
        <div class="carousel-inner">
          <div v-for="(banner, index) in bottomBanners" :key="banner.id" class="carousel-item"
            :class="{ active: index === 0 }">
            <a v-if="banner.destinationUrl" :href="banner.destinationUrl"
              :target="isExternalBannerUrl(banner.destinationUrl) ? '_blank' : undefined"
              :rel="isExternalBannerUrl(banner.destinationUrl) ? 'noopener noreferrer' : undefined">
              <img :src="banner.imageUrl" class="d-block w-100" :alt="banner.title" width="1200" height="360"
                loading="lazy" />
            </a>
            <img v-else :src="banner.imageUrl" class="d-block w-100" :alt="banner.title" width="1200" height="360"
              loading="lazy" />
          </div>
        </div>
      </div>
      <footer class="premium-page-footer mb-2">
        Play responsibly · 18+ only <span>•</span>
        <router-link to="/page/terms-conditions">Terms & conditions</router-link>
      </footer>
    </section>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Carousel } from 'bootstrap'
import api from '../plugins/axios'
import LoadingState from '@/components/LoadingState.vue'
import GameCountdown from '@/components/GameCountdown.vue'
import { useAuthStore } from '@/utils/auth'

const authStore = useAuthStore()
const formatWalletAmount = computed(() =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(
    Number(authStore.amount) || 0,
  ),
)

const games = ref([])
const featuredGame = ref(null)
const banners = ref([])
const bottomBanners = ref([])
const heroCarouselElement = ref(null)
const bottomCarouselElement = ref(null)
const dashboardRootElement = ref(null)
const activeBannerIndex = ref(0)
const activeBottomBannerIndex = ref(0)
let heroCarouselInstance = null
let bottomCarouselInstance = null
let dashboardAnimationObserver = null

const isLoading = ref(false)
const hasInitialLoadCompleted = ref(false)
const errorMessage = ref('')

const marqueeText = ref('')
const noticeText = ref('')
const noticeEnabled = ref(false)

/*
|--------------------------------------------------------------------------
| Server Clock
|--------------------------------------------------------------------------
*/

const currentTime = ref(Date.now())
const serverOffset = ref(0)
const serverTimezone = ref('Asia/Kolkata')

let clockTimer = null
let refreshTimer = null

const serverNow = computed(() => {
  return new Date(currentTime.value + serverOffset.value)
})

// Derive the calendar date from the server-synchronized clock. The API's
// result date must match this date before the featured card can show a number.
const todayDate = computed(() => {
  const now = serverNow.value
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: serverTimezone.value,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const value = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
})

/*
|--------------------------------------------------------------------------
| Market Count
|--------------------------------------------------------------------------
*/

const marketCount = computed(() => {
  return games.value.length
})

/*
|--------------------------------------------------------------------------
| Sync Server Time
|--------------------------------------------------------------------------
*/
const noticeLines = computed(() => {
  if (!noticeText.value) {
    return []
  }
  return noticeText.value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
})

const syncServerTime = (serverTime, timezone) => {
  if (typeof timezone === 'string' && timezone.trim()) serverTimezone.value = timezone
  if (!serverTime) {
    return
  }
  const timestamp = new Date(serverTime).getTime()
  if (Number.isNaN(timestamp)) {
    return
  }
  /*
   * Browser clock is only used for ticking.
   * Server time remains the authority.
   */
  serverOffset.value = timestamp - Date.now()
}

/*
|--------------------------------------------------------------------------
| Parse API timestamp
|--------------------------------------------------------------------------
*/

const getTimestamp = (value) => {
  if (!value) {
    return null
  }
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

/*
|--------------------------------------------------------------------------
| Game Playability
|--------------------------------------------------------------------------
|
| Backend sends absolute start/end timestamps.
| No need to reconstruct H:i:s on frontend.
|
*/

const isGamePlayable = (game) => {
  // The API's monthly-closure flag overrides client-side countdown math.
  if (!game || game.status !== 'active' || game.monthly_closure) {
    return false
  }
  const start = getTimestamp(game.play_window_start_at)
  const end = getTimestamp(game.play_window_end_at)
  if (!start || !end) {
    return false
  }
  const now = serverNow.value.getTime()
  return now >= start && now < end
}

/*
|--------------------------------------------------------------------------
| Game Status
|--------------------------------------------------------------------------
*/

const getGameStatus = (game) => {
  if (!game || game.status !== 'active') {
    return 'CLOSED'
  }
  return isGamePlayable(game) ? 'RUNNING' : 'CLOSED'
}

/*
|--------------------------------------------------------------------------
| Format Time
|--------------------------------------------------------------------------
*/

const formatTime = (time) => {
  if (!time) {
    return '--'
  }
  /*
   * API normally returns H:i:s.
   */
  const parts = String(time).split(':').map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) {
    return '--'
  }
  const hours = parts[0]
  const minutes = parts[1]
  const seconds = parts[2] || 0
  const date = new Date()
  date.setHours(hours, minutes, seconds, 0)
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/*
|--------------------------------------------------------------------------
| Normalize Game
|--------------------------------------------------------------------------
|
| Keeps frontend safe even if an older API response is received.
|
*/

const normalizeGame = (game) => {
  return {
    ...game,
    // Ignore legacy/stale latest_result values unless the date proves they
    // belong to the server's current calendar day.
    latest_result:
      game.today_result ??
      (game.latest_result?.date === todayDate.value ? game.latest_result : null),
    previous_result: game.previous_result ?? null,
    is_playable: Boolean(game.is_playable),
    remaining_seconds: Number(game.remaining_seconds ?? 0),
  }
}

/*
|--------------------------------------------------------------------------
| Fetch Games
|--------------------------------------------------------------------------
*/

const fetchGames = async () => {
  /*
   * Don't clear existing games during refresh.
   * This prevents UI flickering every 30 seconds.
   */
  if (games.value.length === 0) {
    isLoading.value = true
    hasInitialLoadCompleted.value = false
  }
  errorMessage.value = ''
  try {
    const response = await api.get('/games/list', {
      params: { _ts: Date.now() },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    })
    const data = response.data
    if (!data?.status) {
      throw new Error(data?.message || 'Unable to load games.')
    }
    /*
    |--------------------------------------------------------------------------
    | Server Clock
    |--------------------------------------------------------------------------
    */
    syncServerTime(data.server_time, data.timezone)
    /*
    |--------------------------------------------------------------------------
    | Banners
    |--------------------------------------------------------------------------
    */
    const rawBanners = [...(Array.isArray(data.banners) ? data.banners : []), ...(Array.isArray(data.bottom_banners) ? data.bottom_banners : [])]

    const normalizeBanner = (banner, placement) => {
      const rawUrl = String(
        banner.destination_url || banner.link_url || banner.url || '',
      ).trim()

      return {
        id: banner.id ?? `${placement}-${banner.image_url || banner.image || ''}`,
        title: banner.title || banner.name || 'Banner',
        imageUrl: banner.image_url || banner.image || '',
        destinationUrl: isSafeBannerUrl(rawUrl) ? rawUrl : '',
      }
    }

    const topSource = Array.isArray(data.banners) ? data.banners : []
    const bottomSource = Array.isArray(data.bottom_banners)
      ? data.bottom_banners
      : []

    // Records with no app_screen retain the legacy top-banner behavior.
    const nextBanners = topSource
      .filter((banner) => !banner.app_screen || banner.app_screen === 'top')
      .map((banner) => normalizeBanner(banner, 'top'))
      .filter((banner) => banner.imageUrl)

    // Bottom banners can come from either API collection.
    const nextBottomBanners = [
      ...topSource.filter((banner) => banner.app_screen === 'bottom'),
      ...bottomSource,
    ]
      .map((banner) => normalizeBanner(banner, 'bottom'))
      .filter((banner) => banner.imageUrl)

    // Prevent duplicate records if the API returns them in both collections.
    const uniqueBanners = (items) => [
      ...new Map(items.map((banner) => [String(banner.id), banner])).values(),
    ]

    const finalTopBanners = uniqueBanners(nextBanners)
    const finalBottomBanners = uniqueBanners(nextBottomBanners)

    const signature = (items) =>
      items
        .map((banner) =>
          `${banner.id}:${banner.imageUrl}:${banner.destinationUrl}`,
        )
        .join('|')

    const topChanged = signature(banners.value) !== signature(finalTopBanners)
    const bottomChanged =
      signature(bottomBanners.value) !== signature(finalBottomBanners)

    if (topChanged) {
      banners.value = finalTopBanners
      activeBannerIndex.value = 0
    }

    if (bottomChanged) {
      bottomBanners.value = finalBottomBanners
      activeBottomBannerIndex.value = 0
    }

    if (topChanged || bottomChanged) {
      await nextTick()

      if (topChanged) initializeBannerCarousel()
      if (bottomChanged) initializeBottomBannerCarousel()
    }    /*
    |--------------------------------------------------------------------------
    | Marquee
    |--------------------------------------------------------------------------
    */
    marqueeText.value = typeof data.marquee?.content === 'string' ? data.marquee.content.trim() : ''
    /*
|--------------------------------------------------------------------------
| Notice
|--------------------------------------------------------------------------
*/
    noticeEnabled.value = Boolean(data.notice?.status)
    noticeText.value = typeof data.notice?.content === 'string' ? data.notice.content.trim() : ''
    /*
|--------------------------------------------------------------------------
| Featured Game
|--------------------------------------------------------------------------
*/
    featuredGame.value = data.featured_game ? normalizeGame(data.featured_game) : null
    /*
  |--------------------------------------------------------------------------
  | Games
  |--------------------------------------------------------------------------
  */
    games.value = Array.isArray(data.games) ? data.games.map(normalizeGame) : []
  } catch (error) {
    console.error('Games API Error:', error)
    errorMessage.value = error.response?.data?.message || error.message || 'Unable to load games.'
  } finally {
    isLoading.value = false
    hasInitialLoadCompleted.value = true
    await nextTick()
    observeDashboardAnimations()
  }
}

/*
|--------------------------------------------------------------------------
| Banner carousel
|--------------------------------------------------------------------------
*/

const isSafeBannerUrl = (value) => {
  if (!value) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try { return ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false }
}
const isExternalBannerUrl = (value) => /^https?:\/\//i.test(value || '')


const initializeBannerCarousel = () => {
  setupBannerCarousel(
    heroCarouselElement.value,
    'hero',
    handleBannerSlid,
    (index) => {
      activeBannerIndex.value = index
    },
  )
}

const initializeBottomBannerCarousel = () => {
  setupBannerCarousel(
    bottomCarouselElement.value,
    'bottom',
    handleBottomBannerSlid,
    (index) => {
      activeBottomBannerIndex.value = index
    },
  )
}

const carouselInstances = {
  hero: null,
  bottom: null,
}

const dragCleanups = {
  hero: null,
  bottom: null,
}

const setupBannerCarousel = (element, key, slideHandler, updateIndex) => {
  if (!element) return

  // Clean up the previous instance and drag listeners.
  if (carouselInstances[key]) {
    element.removeEventListener('slid.bs.carousel', slideHandler)
    carouselInstances[key].dispose()
    carouselInstances[key] = null
  }

  dragCleanups[key]?.()
  dragCleanups[key] = null

  updateIndex(0)

  const items = element.querySelectorAll('.carousel-item')
  if (items.length < 2) return

  const reduceMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  const instance = new Carousel(element, {
    interval: reduceMotion ? false : 4500,
    ride: false,
    pause: 'hover',
    wrap: true,
    touch: true,
    keyboard: true,
  })

  carouselInstances[key] = instance

  element.addEventListener('slid.bs.carousel', slideHandler)

  // Desktop mouse dragging.
  let startX = 0
  let startY = 0
  let dragging = false

  const onPointerDown = (event) => {
    if (event.pointerType === 'touch') return
    if (event.button !== 0) return
    if (event.target.closest('a, button')) return

    startX = event.clientX
    startY = event.clientY
    dragging = true
  }

  const onPointerUp = (event) => {
    if (!dragging) return
    dragging = false

    const deltaX = event.clientX - startX
    const deltaY = event.clientY - startY

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return
    }

    if (deltaX < 0) instance.next()
    else instance.prev()
  }

  const onPointerCancel = () => {
    dragging = false
  }

  element.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)

  dragCleanups[key] = () => {
    element.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerCancel)
  }

  // Start autoplay only after the instance and listeners are ready.
  if (!reduceMotion) instance.cycle()
}


const observeDashboardAnimations = () => {
  if (dashboardAnimationObserver) {
    dashboardAnimationObserver.disconnect()
    dashboardAnimationObserver = null
  }

  const root = dashboardRootElement.value
  if (!root || typeof IntersectionObserver === 'undefined') return

  dashboardAnimationObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('dashboard-animation-paused', !entry.isIntersecting)
      }
    },
    { rootMargin: '100px 0px', threshold: 0.01 },
  )

  root
    .querySelectorAll(
      '.marquee-wrapper, .notice-card, .live-result-box, .custom-card, .row.g-2.mb-4.ms-2.me-2 .btn',
    )
    .forEach((element) => dashboardAnimationObserver.observe(element))
}

const handleBannerSlid = (event) => {
  activeBannerIndex.value = event.to
}

const handleBottomBannerSlid = (event) => { activeBottomBannerIndex.value = event.to }

const goToBanner = (index) => {
  activeBannerIndex.value = index
  heroCarouselInstance?.to(index)
}
const goToBottomBanner = (index) => {
  activeBottomBannerIndex.value = index
  bottomCarouselInstance?.to(index)
}

/*
|--------------------------------------------------------------------------
| Refresh
|--------------------------------------------------------------------------
*/

const startRefreshTimer = () => {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = setInterval(() => {
    // Avoid network work and reactive updates while the page is backgrounded.
    if (document.visibilityState === 'visible') fetchGames()
  }, 30000)
}

/*
|--------------------------------------------------------------------------
| Lifecycle
|--------------------------------------------------------------------------
*/

onMounted(async () => {
  await fetchGames()

  clockTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 5000)

  startRefreshTimer()
})


onUnmounted(() => {
  for (const key of ['hero', 'bottom']) {
    const instance = carouselInstances[key]
    const element =
      key === 'hero'
        ? heroCarouselElement.value
        : bottomCarouselElement.value

    const handler =
      key === 'hero'
        ? handleBannerSlid
        : handleBottomBannerSlid

    if (instance) {
      if (element) {
        element.removeEventListener('slid.bs.carousel', handler)
      }
      instance.dispose()
      carouselInstances[key] = null
    }

    dragCleanups[key]?.()
    dragCleanups[key] = null
  }

  if (dashboardAnimationObserver) {
    dashboardAnimationObserver.disconnect()
    dashboardAnimationObserver = null
  }

  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }

  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

</script>

<style scoped>
.result-center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 9px;
  height: 9px;
  padding: 0;
  border-radius: 50%;
  background: #033c07;
  box-shadow: 0 0 0 4px rgba(173, 33, 8, 0.12);
  transform: translate(-50%, -50%);
  animation: center-dot-blink 1s ease-in-out infinite;
  pointer-events: none;
}

@keyframes center-dot-blink {

  0%,
  100% {
    opacity: 1;
    scale: 1;
    box-shadow: 0 0 0 3px rgba(173, 33, 8, 0.18);
  }

  50% {
    opacity: 0.35;
    scale: 1.4;
    box-shadow: 0 0 0 6px rgba(173, 33, 8, 0.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .result-center-dot {
    animation: none;
  }
}


/* Animated live-result indicator */
.animate {
  animation: live-result-blink 3s ease-in-out infinite;
}

@keyframes live-result-blink {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 184, 144, 0.5);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.15);
    box-shadow: 0 0 0 5px rgba(23, 184, 144, 0.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate {
    animation: none;
    opacity: 1;
    transform: none;
  }
}


/* Featured result card */
.featured-winner-card {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: clamp(42px, 15vw, 76px) minmax(0, 1fr) clamp(42px, 15vw, 76px);
  align-items: center;
  gap: clamp(5px, 2vw, 14px);
  overflow: hidden;
  padding: 5px 5px;
  border: 1px solid rgba(173, 33, 8, .09);
  border-radius: 22px;
  background: linear-gradient(135deg, #fff 0%, #fffdf8 58%, #fff3df 100%);
  box-shadow: 0 8px 24px rgba(83, 35, 15, .10);
  text-align: center
}

.featured-winner-glow {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0, rgba(217, 131, 0, .14), transparent 64%)
}

.featured-winner-content {
  min-width: 0
}

.featured-winner-trophy {
  display: block;
  width: 100%;
  max-width: 76px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 5px 4px rgba(120, 69, 12, .15));
  animation: featured-trophy-float 3s ease-in-out infinite
}

.featured-winner-trophy-right {
  animation-delay: 1.5s;
  transform: scaleX(-1)
}

.featured-winner-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-bottom: 8px;
  color: #b96b00;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .12em
}

.featured-winner-content h2 {
  margin: 0;
  color: #a8240b;
  font-size: clamp(16px, 4.4vw, 23px);
  font-weight: 900;
  line-height: 1.2;
  overflow-wrap: anywhere
}

.featured-winner-time {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin: 7px 0 12px;
  color: #858585;
  font-size: 11px
}

.featured-winner-time span {
  color: #555;
  font-weight: 750
}

.featured-winner-number {
  display: grid;
  place-items: center;
  width: clamp(62px, 18vw, 82px);
  height: clamp(62px, 18vw, 82px);
  margin: 0 auto 9px;
  border: 4px solid #fff;
  border-radius: 50%;
  background: #033c07;
  box-shadow: 0 5px 14px rgba(173, 33, 8, .2);
  color: #fff;
  font-size: clamp(23px, 6vw, 31px);
  font-weight: 900;
  font-variant-numeric: tabular-nums
}

.featured-winner-number.is-pending {
  background: #c98077;
  box-shadow: 0 5px 14px rgba(201, 128, 119, .2)
}

.featured-winner-live,
.featured-winner-pending {
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .035em
}

.featured-winner-live-dot {
  border-radius: 50%;
  animation: featured-live-pulse 2s ease-in-out infinite
}

@keyframes featured-trophy-float {

  0%,
  100% {
    translate: 0 0
  }

  50% {
    translate: 0 -5px
  }
}

@keyframes featured-live-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.0;
  }
}

@media(max-width:380px) {
  .featured-winner-card {
    padding: 16px 8px;
    grid-template-columns: 42px minmax(0, 1fr) 42px;
    border-radius: 18px
  }

  .featured-winner-trophy {
    width: 42px
  }

  .featured-winner-kicker {
    font-size: 8px
  }

  .featured-winner-time {
    font-size: 10px
  }
}

@media(prefers-reduced-motion:reduce) {

  .featured-winner-trophy,
  .featured-winner-live-dot {
    animation: none
  }
}

.reference-wallet-card {
  margin: 16px 0 26px;
  overflow: hidden;
  border-radius: 22px;
  background: #29432a;
  box-shadow: 0 8px 20px rgba(86, 42, 12, 0.14);
}

.reference-wallet-brand {
  display: grid;
  gap: 2px;
  padding: 15px 10px;
  text-align: center;
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.reference-wallet-brand small {
  font-size: 9px;
  letter-spacing: 0.18em;
  opacity: 0.8;
}

.reference-wallet-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: -1px;
  padding: 10px 30px;
  border-radius: 18px;
  background: #fff;
}

.reference-wallet-body>div {
  display: grid;
  gap: 1px;
}

.reference-wallet-balance {
  color: #111;
  font-size: clamp(30px, 8vw, 42px);
  font-weight: 850;
  letter-spacing: -0.05em;
}

.reference-wallet-body>div>span {
  color: #8a8a8a;
  font-size: 14px;
}

.reference-add-money {
  display: grid;
  justify-items: center;
  gap: 7px;
  color: #a91f08;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.reference-add-money i {
  display: grid;
  place-items: center;
  width: 45px;
  height: 45px;
  border-radius: 12px;
  background: #033c07;
  color: white;
  font-size: 30px;
  box-shadow: 0 5px 12px #033c072b;
}

.premium-game-result-large {
  font-size: clamp(32px, 9vw, 42px) !important;
}

.premium-market-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0e7e3;
  color: #b52a15;
  font-size: 11px;
  font-weight: 850;
}

.premium-market-card-foot i {
  font-size: 18px;
}

.premium-page {
  min-height: calc(100vh - 70px);
  max-width: 1160px;
  margin: 0 auto;
  padding: 10px 14px 15px;
  background: #f5f7fb;
  color: #033c07;
  overflow: hidden;
}

.premium-welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 7px 2px 20px;
}

.premium-eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #7b8799;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.13em;
}

.premium-live-pip,
.premium-result-status>span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #17b890;
  box-shadow: 0 0 0 4px rgba(23, 184, 144, 0.12);
}

.premium-welcome h1 {
  margin: 8px 0 5px;
  font-size: clamp(27px, 7vw, 39px);
  font-weight: 800;
  letter-spacing: -0.06em;
}

.premium-welcome h1 em {
  color: #0ca17c;
  font-style: normal;
}

.premium-welcome p {
  margin: 0;
  max-width: 300px;
  color: #748096;
  font-size: 12px;
  line-height: 1.6;
}

.premium-welcome-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 12px;
  border: 1px solid #e5eaf2;
  border-radius: 15px;
  background: #fff;
  color: #e1a527;
  box-shadow: 0 4px 14px rgba(23, 27, 53, 0.04);
}

.premium-welcome-chip>i {
  font-size: 20px;
}

.premium-welcome-chip span {
  display: grid;
  color: #033c07;
  font-size: 11px;
  font-weight: 900;
}

.premium-welcome-chip small {
  color: #8995a7;
  font-size: 8px;
  font-weight: 700;
}

.premium-banner-wrap {
  margin: 0 0 10px;
}

.premium-bottom-banner-wrap {
  padding: 10px 0px;
  padding-bottom: 30px;
}

.premium-banner {
  border-radius: 13px;
}

.premium-banner .carousel-inner,
.premium-banner .carousel-item {
  border-radius: 13px;
}

.premium-banner a {
  display: block;
}

.premium-banner img {
  display: block;
  width: 100%;
  max-height: max-content;
  object-fit: contain;
}

.premium-banner .carousel-indicators {
  margin-bottom: 5px;
}

.premium-banner .carousel-indicators button {
  width: 6px;
  height: 6px;
}

.premium-banner {
  overflow: hidden;
  border-radius: 20px;
  background: #033c07;
  box-shadow: 0 12px 30px rgba(23, 27, 53, 0.12);
}

.premium-banner .carousel-inner,
.premium-banner .carousel-item {
  border-radius: 20px;
}

.premium-banner img {
  width: 100%;
  max-height: max-content;
  object-fit: contain;
}

.premium-banner .carousel-indicators {
  z-index: 2;
  margin-bottom: 9px;
}

.premium-banner .carousel-indicators button {
  width: 7px;
  height: 7px;
  border: 0;
  border-radius: 99px;
}

.premium-announcement {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 0px 0;
  padding: 5px 5px;
  border: 1px solid #f1dfb7;
  border-radius: 12px;
  background: #fff9eb;
  overflow: hidden;
}

.premium-marquee-viewport {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.premium-marquee-track {
  display: flex;
  width: max-content;
  gap: 44px;
  animation: reference-marquee 22s linear infinite;
}

.premium-marquee-track span {
  flex: 0 0 auto;
  color: #705c34;
  font-size: 12px;
  font-weight: 750;
}

.premium-announcement:hover .premium-marquee-track {
  animation-play-state: paused;
}

@keyframes reference-marquee {
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .premium-marquee-track {
    animation: none;
    white-space: normal;
    width: auto;
    display: block;
  }

  .premium-marquee-track span+span {
    display: none;
  }
}

.premium-announcement-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 12px;
  background: #ffedc3;
  color: #98680a;
}

.premium-announcement small {
  color: #9a7933;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.premium-announcement p {
  margin: 3px 0 0;
  color: #705c34;
  font-size: 12px;
  font-weight: 650;
}

.premium-notice {
  margin: 12px 0;
  padding: 15px;
  border: 1px solid #f0dfb9;
  border-radius: 17px;
  background: #fff;
}

.premium-notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #8b681a;
}

.premium-notice-title strong {
  font-size: 12px;
}

.premium-notice p {
  margin: 5px 0;
  color: #6d7583;
  font-size: 11px;
}

.premium-quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  margin: 14px 0 20px;
}

.premium-quick-action {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 12px 10px;
  border: 1px solid #e6eaf2;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(23, 27, 53, 0.035);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease;
}

.premium-quick-action:active {
  transform: scale(0.98);
}

.premium-quick-action>span {
  display: grid;
  place-items: center;
  width: 33px;
  height: 33px;
  margin-bottom: 10px;
  border-radius: 11px;
  background: #edf2ff;
  color: #252b4c;
  font-size: 16px;
}

.premium-quick-add>span {
  background: #e0f9f0;
  color: #0b9a75;
}

.premium-quick-action strong {
  color: #202641;
  font-size: 11px;
  font-weight: 900;
}

.premium-quick-action small {
  margin-top: 3px;
  color: #8c97a9;
  font-size: 9px;
  line-height: 1.4;
}

.premium-featured-result {
  position: relative;
  overflow: hidden;
  margin: 18px 0 25px;
  padding: 18px;
  border-radius: 21px;
  background:
    radial-gradient(circle at 100% 0, rgba(23, 184, 144, 0.26), transparent 42%),
    linear-gradient(130deg, #033c07, #282e50);
  box-shadow: 0 14px 34px rgba(23, 27, 53, 0.16);
  color: #fff;
}

.premium-featured-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.premium-featured-top .premium-eyebrow {
  color: #aebbd1;
}

.premium-result-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #a7eedc;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.premium-result-status>span {
  width: 6px;
  height: 6px;
}

.premium-featured-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin: 20px 0;
}

.premium-featured-main h2 {
  margin: 0;
  color: #fff;
  font-size: 21px;
  font-weight: 800;
}

.premium-featured-main p {
  margin: 5px 0 0;
  color: #b7c2d6;
  font-size: 11px;
}

.premium-featured-number {
  display: grid;
  place-items: center;
  width: 80px;
  height: 80px;
  flex: 0 0 80px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 23px;
  background: rgba(255, 255, 255, 0.09);
  color: #f7c95d;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.premium-featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: #b5c1d6;
  font-size: 9px;
}

.premium-featured-footer a {
  color: #83e4ca;
  font-weight: 850;
}

.premium-section {
  margin: 24px 0;
}

.premium-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.premium-section-heading h2 {
  margin: 5px 0 3px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.045em;
}

.premium-section-heading p {
  margin: 0;
  color: #8792a4;
  font-size: 11px;
}

.premium-text-link {
  flex: 0 0 auto;
  color: #0d9c78;
  font-size: 11px;
  font-weight: 900;
}

.premium-game-scroller {
  display: grid;
  grid-auto-columns: minmax(235px, 76%);
  grid-auto-flow: column;
  gap: 12px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 2px 2px 12px;
}

.premium-game-scroller::-webkit-scrollbar {
  display: none;
}

.premium-game-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 5px 15px;
  border: 1px solid #e3e9f2;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(23, 27, 53, 0.045);
  scroll-snap-align: start;
}

.premium-game-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.premium-game-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 13px;
  background: #edf2ff;
  color: #353d68;
  font-size: 18px;
}

.premium-market-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 9px;
  font-size: 8px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.035em;
}

.premium-market-status>span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.premium-market-status.is-open {
  background: #e5faf2;
  color: #0b926d;
}

.premium-market-status.is-open>span {
  background: #17b890;
}

.premium-market-status.is-closed {
  background: #f1f3f7;
  color: #7f899a;
}

.premium-market-status.is-closed>span {
  background: #9ca6b5;
}

.premium-game-card h3 {
  margin: 15px 0 4px;
  color: #033c07;
  font-size: 20px;
  font-weight: 850;
}

.premium-game-result-label {
  color: #8a96a9;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.premium-game-result {
  margin: 2px 0 0px;
  color: #222947;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.premium-game-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 30px;
  color: #8b96a7;
  font-size: 9px;
}

.premium-game-meta>span:last-child {
  color: #0c9c78;
  font-weight: 800;
}

.premium-closed-note {
  margin: 5px 0;
  color: #a05b29;
  font-size: 9px;
}

.premium-game-play {
  width: 100%;
  margin-top: auto;
  min-height: 42px;
  border-radius: 12px;
  font-size: 11px;
}

.premium-game-card-closed {
  background: #fbfcfe;
}

.premium-game-card-closed .premium-game-result {
  color: #a6afbe;
}

.premium-scroll-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 1px;
  color: #9aa4b4;
  font-size: 9px;
  font-weight: 700;
}

.premium-empty-inline {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 30px 15px;
  border: 1px dashed #dbe2ed;
  border-radius: 18px;
  background: #fff;
  color: #8792a4;
  font-size: 11px;
}

.premium-empty-inline i {
  font-size: 26px;
  color: #aeb9c8;
}

.premium-empty-inline strong {
  color: #333c56;
  font-size: 12px;
}

.premium-loading-row {
  padding: 4px;
}

.premium-journey-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  padding: 15px;
  border: 1px solid #e2e8f1;
  border-radius: 18px;
  background: #fff;
}

.premium-journey-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 13px;
  background: #fff4d8;
  color: #b7831c;
  font-size: 18px;
}

.premium-journey-card>div:nth-child(2) {
  flex: 1;
  min-width: 0;
}

.premium-journey-card strong {
  color: #252b4c;
  font-size: 12px;
}

.premium-journey-card p {
  margin: 3px 0 0;
  color: #8b96a7;
  font-size: 10px;
}

.premium-journey-card>a {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #f2f5fa;
  color: #333c59;
}

.premium-page-footer {
  padding: 10px 0 8px;
  color: #9aa4b3;
  text-align: center;
  font-size: 9px;
}

.premium-page-footer span {
  padding: 0 4px;
}

.premium-page-footer a {
  color: #77849a;
  font-weight: 800;
}

.premium-empty-state {
  display: grid;
  justify-items: center;
  text-align: center;
  padding: 70px 20px;
}

.premium-empty-icon {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 20px;
  background: #fff0f2;
  color: #d9485b;
  font-size: 24px;
}

.premium-empty-state h2 {
  margin: 18px 0 5px;
  font-size: 20px;
}

.premium-empty-state p {
  color: #7b8799;
  font-size: 12px;
}

@media (min-width: 640px) {
  .premium-page {
    padding: 10px 24px 20px;
  }

  .premium-game-scroller {
    grid-auto-columns: minmax(250px, 31%);
  }

  .premium-quick-action {
    padding: 15px;
  }

  .premium-welcome {
    padding-bottom: 24px;
  }
}

@media (min-width: 900px) {
  .premium-page {
    padding: 10px 30px 15px;
  }

  .premium-game-scroller {
    grid-auto-columns: minmax(250px, calc(25% - 9px));
  }

  .premium-welcome h1 {
    font-size: 42px;
  }

  .premium-featured-result {
    padding: 23px;
  }
}

@media (max-width: 380px) {
  .premium-page {
    padding: 15px 10px 20px;
  }

  .premium-welcome-chip {
    padding: 8px;
  }

  .premium-welcome-chip>i {
    font-size: 17px;
  }

  .premium-quick-actions {
    gap: 6px;
  }

  .premium-quick-action {
    padding: 10px 8px;
  }

  .premium-quick-action strong {
    font-size: 10px;
  }

  .premium-game-scroller {
    grid-auto-columns: minmax(225px, 83%);
  }

  .premium-featured-result {
    padding: 14px;
  }

  .premium-featured-number {
    width: 65px;
    height: 65px;
    flex-basis: 65px;
    font-size: 25px;
  }
}

@media (prefers-reduced-motion: reduce) {

  .premium-game-card,
  .premium-quick-action {
    transition: none;
  }
}
</style>
