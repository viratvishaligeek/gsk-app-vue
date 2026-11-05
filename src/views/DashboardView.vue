<template>
  <main ref="dashboardRootElement" class="gsk-dashboard">
    <section v-if="!hasInitialLoadCompleted" class="dashboard-loading" aria-busy="true">
      <LoadingState variant="featured" />
      <LoadingState variant="market-list" :count="3" />
    </section>

    <section v-else-if="errorMessage && games.length === 0" class="dashboard-empty">
      <span class="dashboard-empty-emoji">📡</span>
      <h1>We couldn't load the game board</h1>
      <p>{{ errorMessage }}</p>
      <button class="btn btn-primary rounded-pill px-4" @click="fetchGames">↻ Try again</button>
    </section>

    <template v-else>
      <section v-if="marqueeText" class="dashboard-announcement" aria-label="Announcement">
        <span class="announcement-emoji">📢</span>
        <div class="announcement-window">
          <div class="announcement-track">
            <span>{{ marqueeText }}</span
            ><span aria-hidden="true">{{ marqueeText }}</span>
          </div>
        </div>
      </section>

      <section v-if="noticeEnabled && noticeLines.length" class="dashboard-notice">
        <div class="notice-heading">
          <span>⚠️</span>
          <div><strong>Important notice</strong><small>Updates from the GSK team</small></div>
        </div>
        <ul>
          <li v-for="(line, index) in noticeLines" :key="index">{{ line }}</li>
        </ul>
      </section>

      <section class="dashboard-hero-v3">
        <div class="dashboard-hero-copy">
          <span class="dashboard-hero-kicker"
            >YOUR GAME ZONE ·
            {{ serverNow.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }}</span
          >
          <h1>
            Welcome, <em>{{ authStore.name || 'Player' }}</em>
          </h1>
          <p>🚀 आपकी पसंद, आपकी कमाई और मार्केट की हर खबर!</p>
        </div>
        <div class="dashboard-wallet-glance">
          <div>
            <small>🗃️ WALLET BALANCE</small
            ><strong>₹{{ Number(authStore.amount || 0).toLocaleString('en-IN') }}</strong>
          </div>
          <router-link to="/wallet" aria-label="Open wallet">↗</router-link>
        </div>
      </section>

      <section
        v-if="banners.length"
        class="dashboard-promotions-v3"
        aria-label="Featured promotions"
      >
        <div id="heroCarousel" ref="heroCarouselElement" class="carousel slide">
          <div class="carousel-indicators" v-if="banners.length > 1">
            <button
              v-for="(banner, index) in banners"
              :key="banner.id"
              type="button"
              :class="{ active: index === activeBannerIndex }"
              :aria-label="'Show promotion ' + (index + 1)"
              :aria-current="index === activeBannerIndex ? 'true' : undefined"
              @click="goToBanner(index)"
            ></button>
          </div>
          <div class="carousel-inner">
            <div
              v-for="(banner, index) in banners"
              :key="banner.id"
              class="carousel-item"
              :class="{ active: index === 0 }"
            >
              <a
                v-if="banner.url"
                href="#"
                class="d-block"
                @click.prevent="openBanner(banner)"
                :aria-label="banner.title ? 'Open ' + banner.title : 'Open promotion'"
              >
                <img
                  :src="banner.imageUrl"
                  class="d-block w-100"
                  :alt="banner.title || 'GSK promotion'"
                />
              </a>
              <img
                v-else
                :src="banner.imageUrl"
                class="d-block w-100"
                :alt="banner.title || 'GSK promotion'"
              />
            </div>
          </div>
          <template v-if="banners.length > 1">
            <button
              class="carousel-control-prev gsk-banner-control"
              type="button"
              aria-label="Previous promotion"
              @click="goToBanner((activeBannerIndex + banners.length - 1) % banners.length)"
            >
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            </button>
            <button
              class="carousel-control-next gsk-banner-control"
              type="button"
              aria-label="Next promotion"
              @click="goToBanner((activeBannerIndex + 1) % banners.length)"
            >
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
            </button>
          </template>
        </div>
      </section>

      <nav class="dashboard-action-grid-v3" aria-label="Quick actions">
        <router-link to="/games"
          ><span>🎮</span><strong>Play games</strong><small>Explore markets</small></router-link
        >
        <router-link to="/wallet/add"
          ><span>➕</span><strong>Add money</strong><small>Top up wallet</small></router-link
        >
        <router-link to="/wallet/withdraw"
          ><span>🏦</span><strong>Withdraw</strong><small>Request payout</small></router-link
        >
        <router-link to="/live-support"
          ><span>💬</span><strong>Live Chat</strong><small>Get help anytime</small></router-link
        >
      </nav>

      <section class="featured-result-section-v3">
        <div class="section-heading">
          <div>
            <span class="eyebrow">LATEST MARKET UPDATE</span>
            <h2>🏆 Live Result</h2>
          </div>
          <span class="market-count">{{ marketCount }} markets</span>
        </div>
        <div v-if="isLoading && !featuredGame" class="py-2">
          <LoadingState variant="featured" />
        </div>
        <article v-else-if="featuredGame" class="featured-result-card-v3">
          <div class="featured-result-top">
            <span>⭐ MOST RECENT MARKET</span
            ><span>🕒 {{ formatTime(featuredGame.result_time) }}</span>
          </div>
          <h3>{{ featuredGame.name }}</h3>
          <div class="featured-result-bottom">
            <div>
              <small>Today's result</small
              ><strong>{{
                featuredGame.latest_result?.date === todayDate
                  ? (featuredGame.latest_result?.number ?? '--')
                  : '--'
              }}</strong>
            </div>
            <span v-if="featuredGame.latest_result?.date === todayDate" class="result-live"
              >● Published</span
            >
            <span v-else class="result-pending">⌛ Awaiting result</span>
          </div>
          <router-link :to="{ name: 'monthly-chart', query: { game: featuredGame.id } }"
            >Open result history <b>→</b></router-link
          >
        </article>
        <div v-else class="dashboard-inline-empty">
          <span>🗓️</span>
          <p>No featured result is available yet.</p>
        </div>
      </section>

      <section class="market-section lobby-preview-v3">
        <div class="section-heading">
          <div>
            <span class="eyebrow">आज और कल के सभी गेम्स</span>
            <h2><span class="live-dot"></span> Latest Result</h2>
          </div>
          <router-link to="/games" class="section-link">Full game lobby →</router-link>
        </div>
        <div v-if="errorMessage" class="alert alert-danger rounded-4">
          {{ errorMessage }}
          <button class="btn btn-sm btn-outline-danger ms-2" @click="fetchGames">Retry</button>
        </div>
        <div v-else-if="isLoading" class="py-2">
          <LoadingState variant="market-list" :count="2" />
        </div>
        <div v-else-if="games.length === 0" class="dashboard-inline-empty">
          <span>🎲</span>
          <h3>No markets available</h3>
          <p>Please check again later.</p>
        </div>
        <div v-else class="lobby-preview-track" aria-label="Featured markets">
          <article
            v-for="game in games.slice(0, 6)"
            :key="game.id"
            class="lobby-preview-card-v3"
            :class="{ 'is-closed': !isGamePlayable(game) }"
          >
            <div class="lobby-preview-top">
              <span>🎲</span
              ><small :class="isGamePlayable(game) ? 'is-open' : 'is-closed-label'">{{
                isGamePlayable(game) ? 'OPEN NOW' : 'CLOSED'
              }}</small>
            </div>
            <h3>{{ game.name }}</h3>
            <div class="lobby-preview-result">
              <small>Today's result</small
              ><strong>{{
                game.latest_result?.date === todayDate ? (game.latest_result?.number ?? '--') : '--'
              }}</strong>
            </div>
            <router-link
              v-if="isGamePlayable(game)"
              :to="{ name: 'play-game', params: { id: game.id } }"
              >Enter game <b>→</b></router-link
            >
            <router-link v-else :to="{ name: 'monthly-chart', query: { game: game.id } }"
              >View history <b>→</b></router-link
            >
          </article>
        </div>
      </section>

      <section class="dashboard-service-grid-v3">
        <router-link to="/play-history"
          ><span>📜</span>
          <div><strong>My play history</strong><small>Review your entries</small></div>
          <b>→</b></router-link
        >
        <router-link to="/monthly-chart"
          ><span>📊</span>
          <div><strong>Monthly charts</strong><small>Explore saved results</small></div>
          <b>→</b></router-link
        >
        <router-link to="/live-support"
          ><span>💬</span>
          <div><strong>Need a hand?</strong><small>Contact live support</small></div>
          <b>→</b></router-link
        >
      </section>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Carousel } from 'bootstrap'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import api from '../plugins/axios'
import LoadingState from '@/components/LoadingState.vue'
import { useAuthStore } from '@/utils/auth'
import GameCountdown from '@/components/GameCountdown.vue'

const authStore = useAuthStore()
const games = ref([])
const featuredGame = ref(null)
const banners = ref([])
const heroCarouselElement = ref(null)
const dashboardRootElement = ref(null)
const activeBannerIndex = ref(0)
let heroCarouselInstance = null
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
    const nextBanners = Array.isArray(data.banners)
      ? data.banners.map((banner) => {
          const rawUrl = String(banner.url || banner.link || banner.target_url || '').trim()
          let safeUrl = ''
          let externalUrl = false
          if (rawUrl) {
            try {
              const parsed = new URL(rawUrl, window.location.origin)
              if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
                safeUrl = parsed.href
                externalUrl = parsed.origin !== window.location.origin
              }
            } catch {
              safeUrl = ''
            }
          }
          return {
            id: banner.id,
            title: banner.title || banner.name || 'Banner',
            imageUrl: banner.image_url || banner.image,
            url: safeUrl,
            externalUrl,
          }
        })
      : []
    const previousBannerSignature = banners.value
      .map((banner) => `${banner.id}:${banner.imageUrl}:${banner.url || ''}`)
      .join('|')
    const nextBannerSignature = nextBanners
      .map((banner) => `${banner.id}:${banner.imageUrl}:${banner.url || ''}`)
      .join('|')
    if (previousBannerSignature !== nextBannerSignature) {
      banners.value = nextBanners
      activeBannerIndex.value = 0
      await nextTick()
      initializeBannerCarousel()
    }
    /*
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

const initializeBannerCarousel = () => {
  if (!heroCarouselElement.value || banners.value.length < 2) {
    if (heroCarouselInstance && heroCarouselElement.value) {
      heroCarouselElement.value.removeEventListener('slid.bs.carousel', handleBannerSlid)
      heroCarouselInstance.dispose()
    }
    heroCarouselInstance = null
    activeBannerIndex.value = 0
    return
  }
  if (heroCarouselInstance) {
    heroCarouselElement.value.removeEventListener('slid.bs.carousel', handleBannerSlid)
    heroCarouselInstance.dispose()
  }
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  heroCarouselInstance = new Carousel(heroCarouselElement.value, {
    interval: reduceMotion ? false : 4000,
    ride: reduceMotion ? false : 'carousel',
    pause: 'hover',
    wrap: true,
    touch: true,
  })
  heroCarouselElement.value.addEventListener('slid.bs.carousel', handleBannerSlid)
  heroCarouselInstance.to(activeBannerIndex.value)
  heroCarouselInstance.cycle()
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

const goToBanner = (index) => {
  activeBannerIndex.value = index
  heroCarouselInstance?.to(index)
}

const openBanner = async (banner) => {
  if (!banner?.url) return

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: banner.url })
      return
    }

    if (banner.externalUrl) {
      window.open(banner.url, '_blank', 'noopener,noreferrer')
      return
    }

    window.location.assign(banner.url)
  } catch (error) {
    console.error('Unable to open promotion URL:', error)
    window.location.assign(banner.url)
  }
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
  if (heroCarouselInstance && heroCarouselElement.value) {
    heroCarouselElement.value.removeEventListener('slid.bs.carousel', handleBannerSlid)
    heroCarouselInstance.dispose()
  }
  heroCarouselInstance = null
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
.live-dot {
  display: inline-block;
  width: 11px;
  height: 11px;
  background: green;
  border-radius: 50%;
  margin-right: 6px;
  box-shadow: 0 0 6px #01bc4f;
  animation: livePulse 1.2s infinite ease-in-out;
}

@keyframes livePulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 7px rgba(0, 230, 118, 0);
    transform: scale(1.2);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 230, 118, 0);
    transform: scale(1);
  }
}
.gsk-dashboard {
  --gsk-navy: #182d4d;
  --gsk-blue: #315f9f;
  --gsk-sky: #eaf2ff;
  --gsk-ink: #1d2b40;
  --gsk-muted: #78869a;
  min-height: 100dvh;
  padding: 14px 14px calc(104px + env(safe-area-inset-bottom));
  background: #f5f7fb;
  color: var(--gsk-ink);
  overflow-x: clip;
}
.dashboard-loading {
  display: grid;
  gap: 14px;
}
.dashboard-announcement {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e5ebf3;
  overflow: hidden;
}
.announcement-emoji {
  font-size: 21px;
}
.announcement-window {
  overflow: hidden;
  flex: 1;
}
.announcement-track {
  display: flex;
  width: max-content;
  gap: 64px;
  white-space: nowrap;
  animation: announcement-scroll 28s linear infinite;
}
.announcement-track span {
  font-size: 12px;
  font-weight: 650;
  color: #4c5b70;
}
@keyframes announcement-scroll {
  to {
    transform: translateX(-50%);
  }
}
.dashboard-notice {
  margin-top: 12px;
  padding: 14px;
  border-radius: 17px;
  background: #fff8e9;
  border: 1px solid #f2dfb7;
}
.notice-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.notice-heading > span {
  font-size: 25px;
}
.notice-heading div {
  display: grid;
}
.notice-heading strong {
  font-size: 14px;
}
.notice-heading small {
  font-size: 11px;
  color: #8a795d;
}
.dashboard-notice ul {
  padding-left: 23px;
  margin: 12px 0 0;
  color: #6f6048;
  font-size: 12px;
  line-height: 1.6;
}
.dashboard-promotions {
  margin: 14px 0;
}
.dashboard-promotions .carousel,
.dashboard-promotions .carousel-inner,
.dashboard-promotions img {
  border-radius: 18px;
  overflow: hidden;
}
.dashboard-promotions img {
  width: 100%;
  aspect-ratio: 16/6;
  object-fit: cover;
}
.dashboard-welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0;
  padding: 19px;
  border-radius: 20px;
  background: linear-gradient(125deg, #18365e, #315f9f);
  color: #fff;
}
.dashboard-welcome .eyebrow,
.eyebrow {
  font-size: 9px;
  letter-spacing: 0.13em;
  font-weight: 850;
  color: #93acd0;
}
.dashboard-welcome h1 {
  margin: 5px 0;
  font-size: 19px;
  font-weight: 850;
  line-height: 1.2;
}
.dashboard-welcome p {
  margin: 0;
  color: #d4e1f3;
  font-size: 11px;
}
.welcome-emoji {
  font-size: 44px;
  filter: drop-shadow(0 5px 8px #102746);
}
.dashboard-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  margin: 14px 0 22px;
}
.dashboard-action {
  display: grid;
  justify-items: start;
  gap: 4px;
  min-width: 0;
  padding: 13px 10px;
  border: 1px solid #e5ebf3;
  border-radius: 16px;
  background: #fff;
  color: var(--gsk-ink);
  text-decoration: none;
  box-shadow: 0 5px 14px #213b5b0b;
}
.dashboard-action > span {
  font-size: 24px;
}
.dashboard-action b {
  font-size: 11px;
  white-space: nowrap;
}
.dashboard-action small {
  font-size: 9px;
  color: var(--gsk-muted);
}
.action-add {
  border-bottom: 3px solid #38a879;
}
.action-withdraw {
  border-bottom: 3px solid #e4a34b;
}
.action-support {
  border-bottom: 3px solid #648ac5;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 10px;
  margin: 20px 1px 12px;
}
.section-heading .eyebrow {
  color: #8090a6;
}
.section-heading h2 {
  margin: 3px 0 0;
  font-size: 17px;
  font-weight: 850;
  color: var(--gsk-ink);
}
.market-count {
  padding: 6px 9px;
  border-radius: 30px;
  background: #e8eff9;
  color: #315f9f;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}
.featured-result-card {
  padding: 17px;
  border-radius: 19px;
  background: linear-gradient(135deg, #213f69, #315f9f);
  color: #fff;
  box-shadow: 0 10px 25px #1c3c681f;
}
.featured-result-top,
.featured-result-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.featured-result-top {
  font-size: 9px;
  font-weight: 800;
  color: #c5d7f0;
}
.featured-result-card h3 {
  margin: 13px 0;
  font-size: 19px;
  font-weight: 850;
}
.featured-result-bottom small {
  display: block;
  color: #d2e0f2;
  font-size: 10px;
}
.featured-result-bottom strong {
  display: block;
  font-size: 34px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.result-live,
.result-pending {
  padding: 6px 9px;
  border-radius: 30px;
  background: #ffffff20;
  font-size: 10px;
  font-weight: 800;
}
.result-live {
  color: #baf5d7;
}
.result-pending {
  color: #ffe1a5;
}
.market-list {
  display: grid;
  gap: 11px;
}
.market-item {
  padding: 14px;
  border: 1px solid #e5ebf3;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 5px 15px #213b5b09;
}
.market-item-main {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}
.market-symbol {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: #edf3fc;
  font-size: 21px;
}
.market-info {
  min-width: 0;
}
.market-info h3 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 850;
  text-transform: capitalize;
  overflow-wrap: anywhere;
}
.market-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  font-weight: 850;
  text-transform: uppercase;
}
.market-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status-open {
  color: #239667;
}
.status-closed {
  color: #d16a6a;
}
.closure-note {
  display: block;
  margin-top: 5px;
  color: #bd5b55;
  font-size: 10px;
}
.market-result {
  text-align: right;
}
.market-result small {
  display: block;
  color: var(--gsk-muted);
  font-size: 9px;
}
.market-result strong {
  display: block;
  font-size: 22px;
  font-weight: 900;
  color: var(--gsk-navy);
}
.market-result .countdown {
  color: #b66b29;
  font-weight: 750;
}
.market-item-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #edf0f5;
  color: #718096;
  font-size: 10px;
}
.market-item-footer b {
  color: #273c59;
}
.market-play {
  margin-left: auto;
  padding: 7px 11px;
  border-radius: 9px;
  background: #eaf2ff;
  color: #28558f;
  font-size: 10px;
  font-weight: 850;
  text-decoration: none;
}
.market-closed-label {
  margin-left: auto;
  color: #b66a6a;
  font-weight: 800;
}
.market-item-closed {
  background: #fcfcfd;
}
.dashboard-inline-empty,
.dashboard-empty {
  display: grid;
  justify-items: center;
  text-align: center;
  padding: 28px 18px;
  border: 1px dashed #d8e0eb;
  border-radius: 17px;
  background: #fff;
}
.dashboard-inline-empty > span,
.dashboard-empty-emoji {
  font-size: 35px;
}
.dashboard-inline-empty h3,
.dashboard-empty h1 {
  margin: 8px 0 4px;
  font-size: 15px;
  font-weight: 850;
}
.dashboard-inline-empty p,
.dashboard-empty p {
  margin: 0;
  color: var(--gsk-muted);
  font-size: 12px;
}
.dashboard-empty {
  min-height: 50vh;
  align-content: center;
  gap: 10px;
}
.dashboard-empty-emoji {
  font-size: 46px;
}
.dashboard-bottom-link {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 14px;
  border: 1px solid #e4eaf2;
  border-radius: 16px;
  background: #fff;
}
.dashboard-bottom-link > span {
  font-size: 28px;
}
.dashboard-bottom-link div {
  display: grid;
  flex: 1;
}
.dashboard-bottom-link strong {
  font-size: 12px;
}
.dashboard-bottom-link small {
  font-size: 10px;
  color: var(--gsk-muted);
}
.dashboard-bottom-link > a {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #eaf2ff;
  color: #315f9f;
  text-decoration: none;
  font-size: 20px;
}
@media (min-width: 700px) {
  .gsk-dashboard {
    max-width: 760px;
    margin: 0 auto;
    padding-top: 24px;
  }
  .dashboard-actions {
    gap: 14px;
  }
  .dashboard-action {
    padding: 17px;
  }
  .market-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .market-item-footer {
    font-size: 11px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .announcement-track {
    animation: none;
  }
}
.lobby-preview-track {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 2px 12px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.lobby-preview-track::-webkit-scrollbar {
  display: none;
}
.lobby-preview-card {
  display: flex;
  flex: 0 0 min(68vw, 220px);
  flex-direction: column;
  gap: 9px;
  padding: 13px;
  border: 1px solid #e3eaf3;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 5px 15px #213b5b09;
  scroll-snap-align: start;
}
.lobby-preview-card.is-closed {
  background: #fafbfd;
}
.lobby-preview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lobby-preview-top > span {
  font-size: 22px;
}
.lobby-preview-top small {
  font-size: 8px;
  font-weight: 900;
  color: #239667;
}
.lobby-preview-top small.is-closed-label {
  color: #8b96a7;
}
.lobby-preview-card h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 900;
}
.lobby-preview-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 10px;
  border-radius: 10px;
  background: #f1f5fa;
}
.lobby-preview-result small {
  color: #78869a;
  font-size: 9px;
}
.lobby-preview-result strong {
  font-size: 21px;
  font-weight: 950;
  color: #182d4d;
}
.lobby-preview-card > a {
  margin-top: auto;
  color: #315f9f;
  font-size: 10px;
  font-weight: 900;
}
.lobby-preview-all {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 3px;
  padding: 13px 14px;
  border: 1px solid #dce6f2;
  border-radius: 13px;
  background: #edf3fc;
  color: #244e83;
  font-size: 11px;
  font-weight: 900;
  text-decoration: none;
}
.dashboard-promotions .carousel {
  position: relative;
}
.gsk-banner-control {
  width: 38px;
  height: 38px;
  top: 50%;
  bottom: auto;
  transform: translateY(-50%);
  border: 1px solid #ffffff80;
  border-radius: 50%;
  background: #142b4b80;
  opacity: 0.95;
}
.gsk-banner-control.carousel-control-prev {
  left: 10px;
}
.gsk-banner-control.carousel-control-next {
  right: 10px;
}
.gsk-banner-control .carousel-control-prev-icon,
.gsk-banner-control .carousel-control-next-icon {
  width: 14px;
  height: 14px;
}

/* Preserved responsive/theme overrides */

.gsk-dashboard {
  --gsk-navy: #e9edff;
  --gsk-blue: #a99bff;
  --gsk-sky: #24244b;
  --gsk-ink: #f4f6ff;
  --gsk-muted: #9ba9c8;
  min-height: 100dvh;
  padding: 13px 13px calc(13px + env(safe-area-inset-bottom));
  background: radial-gradient(circle at 100% 0, #08051c 0, #7171718a 20%), #213774;
  color: #f4f6ff;
  overflow-x: clip;
}
.dashboard-announcement {
  border-color: #34415f;
  background: #111a2e;
  color: #d9e2f7;
}
.announcement-track span {
  color: #c6d1e8;
}
.dashboard-notice {
  border-color: #66502b;
  background: #2c251a;
  color: #f8e6bc;
}
.notice-heading strong {
  color: #ffe4a2;
}
.notice-heading small,
.dashboard-notice ul {
  color: #cbb98e;
}
.dashboard-hero-v3 {
  position: relative;
  overflow: hidden;
  margin: 7px 0 14px;
  padding: 19px;
  border: 1px solid #7166c35c;
  border-radius: 22px;
  background:
    radial-gradient(circle at 100% 0, #7b66ff54 0, transparent 40%),
    linear-gradient(135deg, #211e4b, #152c52 72%, #12405b);
  box-shadow: 0 17px 40px #00000040;
}
.dashboard-hero-v3:after {
  position: absolute;
  right: -44px;
  bottom: -100px;
  width: 210px;
  height: 210px;
  border: 1px solid #ffffff15;
  border-radius: 50%;
  content: '';
  box-shadow:
    0 0 0 25px #ffffff08,
    0 0 0 50px #ffffff05;
}
.dashboard-hero-copy {
  position: relative;
  z-index: 1;
}
.dashboard-hero-kicker {
  color: #b9b2ff;
  font-size: 8px;
  font-weight: 950;
  letter-spacing: 0.16em;
}
.dashboard-hero-copy h1 {
  margin: 7px 0;
  color: #fff;
  font-size: clamp(23px, 6vw, 30px);
  font-weight: 950;
  letter-spacing: -0.045em;
  line-height: 1.12;
}
.dashboard-hero-copy h1 em {
  color: #ffc96d;
  font-style: normal;
}
.dashboard-hero-copy p {
  max-width: 330px;
  margin: 0;
  color: #c2cde6;
  font-size: 11px;
}
.dashboard-wallet-glance {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
  padding: 12px 13px;
  border: 1px solid #ffffff26;
  border-radius: 15px;
  background: #ffffff10;
  backdrop-filter: blur(8px);
}
.dashboard-wallet-glance > div {
  display: grid;
  gap: 3px;
}
.dashboard-wallet-glance small {
  color: #c5c7ee;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.12em;
}
.dashboard-wallet-glance strong {
  color: #fff;
  font-size: 22px;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
}
.dashboard-wallet-glance > a {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  border-radius: 12px;
  background: linear-gradient(145deg, #8a72ff, #326fe8);
  color: #fff;
  font-size: 21px;
}
.dashboard-promotions-v3 {
  margin: 14px 0 16px;
  overflow: hidden;
  border: 1px solid #46517c;
  border-radius: 19px;
  background: #111a2e;
  box-shadow: 0 13px 30px #00000035;
}
.dashboard-promotions-v3 .carousel,
.dashboard-promotions-v3 .carousel-inner,
.dashboard-promotions-v3 img {
  overflow: hidden;
  border-radius: 18px;
}
.dashboard-promotions-v3 img {
  display: block;
  width: 100%;
  aspect-ratio: 16/6;
  object-fit: cover;
}
.dashboard-promotions-v3 .carousel-indicators {
  z-index: 4;
  margin-bottom: 8px;
}
.dashboard-promotions-v3 .carousel-indicators button {
  width: 7px;
  height: 7px;
  border: 0;
  border-radius: 30px;
  background: #ffffff9c;
}
.dashboard-promotions-v3 .carousel-indicators button.active {
  width: 22px;
  background: #ffc96d;
}
.dashboard-action-grid-v3 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 14px 0 20px;
}
.dashboard-action-grid-v3 > a {
  display: grid;
  justify-items: center;
  gap: 5px;
  min-width: 0;
  padding: 12px 5px;
  border: 1px solid #2c3b5b;
  border-radius: 15px;
  background: linear-gradient(155deg, #17223c, #111a2e);
  color: #e8edff;
  text-align: center;
  box-shadow: 0 8px 20px #00000022;
}
.dashboard-action-grid-v3 > a > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #28264f;
  font-size: 20px;
}
.dashboard-action-grid-v3 > a strong {
  font-size: 9px;
  font-weight: 900;
}
.dashboard-action-grid-v3 > a small {
  color: #8e9fbe;
  font-size: 8px;
}
.dashboard-action-grid-v3 > a:active,
.lobby-preview-card-v3:active {
  transform: scale(0.97);
}
.featured-result-section-v3,
.lobby-preview-v3 {
  margin: 17px 0 19px;
}
.featured-result-section-v3 .section-heading h2,
.lobby-preview-v3 .section-heading h2 {
  color: #f4f6ff;
  font-size: 18px;
  font-weight: 950;
}
.featured-result-section-v3 .eyebrow,
.lobby-preview-v3 .eyebrow {
  color: #9a8cff;
}
.featured-result-section-v3 .market-count {
  border: 1px solid #34415f;
  border-radius: 30px;
  background: #151f38;
  color: #b7c6e4;
}
.featured-result-card-v3 {
  position: relative;
  overflow: hidden;
  padding: 17px;
  border: 1px solid #6c61b75c;
  border-radius: 20px;
  background:
    radial-gradient(circle at 100% 0, #765cf533 0, transparent 40%),
    linear-gradient(145deg, #18284a, #111b31);
  box-shadow: 0 14px 32px #00000030;
}
.featured-result-card-v3 .featured-result-top {
  color: #a99bff;
}
.featured-result-card-v3 h3 {
  margin: 10px 0;
  color: #fff;
  font-size: 17px;
  font-weight: 950;
}
.featured-result-card-v3 .featured-result-bottom {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  border: 1px solid #ffffff12;
  border-radius: 14px;
  background: #080f20;
}
.featured-result-card-v3 .featured-result-bottom small {
  color: #8e9fbe;
}
.featured-result-card-v3 .featured-result-bottom strong {
  color: #fff;
  font-size: 36px;
  font-weight: 950;
  letter-spacing: 0.04em;
}
.featured-result-card-v3 .result-live {
  border: 1px solid #286b5a;
  border-radius: 30px;
  background: #123a34;
  color: #76e4bf;
}
.featured-result-card-v3 .result-pending {
  border: 1px solid #806333;
  border-radius: 30px;
  background: #3b301d;
  color: #ffd17b;
}
.featured-result-card-v3 > a {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  color: #b8adff;
  font-size: 10px;
  font-weight: 900;
}
.lobby-preview-v3 .section-heading {
  align-items: center;
}
.lobby-preview-v3 .section-link {
  color: #b6aaff;
  font-size: 10px;
  font-weight: 850;
}
.lobby-preview-v3 .lobby-preview-track {
  gap: 10px;
  padding-bottom: 12px;
  scroll-snap-type: x mandatory;
}
.lobby-preview-card-v3 {
  display: flex;
  flex: 0 0 min(66vw, 225px);
  flex-direction: column;
  gap: 9px;
  padding: 13px;
  border: 1px solid #2e3d5e;
  border-radius: 17px;
  background: linear-gradient(155deg, #18233d, #101a2e);
  box-shadow: 0 10px 25px #00000024;
  scroll-snap-align: start;
  transition:
    transform 0.18s,
    border-color 0.18s;
}
.lobby-preview-card-v3.is-closed {
  background: linear-gradient(155deg, #151d31, #101827);
  opacity: 0.88;
}
.lobby-preview-card-v3 .lobby-preview-top > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #292650;
}
.lobby-preview-card-v3 h3 {
  margin: 0;
  color: #f4f6ff;
  font-size: 13px;
  font-weight: 950;
}
.lobby-preview-card-v3 .lobby-preview-result {
  border: 1px solid #2d3c5b;
  background: #0b1428;
}
.lobby-preview-card-v3 .lobby-preview-result small {
  color: #8d9dbd;
}
.lobby-preview-card-v3 .lobby-preview-result strong {
  color: #fff;
}
.lobby-preview-card-v3 > a {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  color: #b7aaff;
  font-size: 10px;
  font-weight: 900;
}
.dashboard-service-grid-v3 {
  display: grid;
  gap: 8px;
  margin: 17px 0 6px;
}
.dashboard-service-grid-v3 > a {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 62px;
  padding: 11px 13px;
  border: 1px solid #293754;
  border-radius: 15px;
  background: #121b31;
  color: #f4f6ff;
}
.dashboard-service-grid-v3 > a > span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #25264c;
  font-size: 21px;
}
.dashboard-service-grid-v3 > a > div {
  display: grid;
  flex: 1;
  gap: 2px;
}
.dashboard-service-grid-v3 strong {
  font-size: 11px;
  font-weight: 900;
}
.dashboard-service-grid-v3 small {
  color: #91a0bf;
  font-size: 9px;
}
.dashboard-service-grid-v3 > a > b {
  color: #a99bff;
  font-size: 19px;
}
.dashboard-empty,
.dashboard-inline-empty {
  border-color: #34415f;
  background: #111a2e;
  color: #c3cde1;
}
.dashboard-empty h1,
.dashboard-inline-empty h3 {
  color: #f4f6ff;
}
.dashboard-empty p,
.dashboard-inline-empty p {
  color: #9ba9c8;
}
@media (max-width: 360px) {
  .dashboard-hero-v3 {
    padding: 15px;
  }
  .dashboard-action-grid-v3 {
    gap: 6px;
  }
  .dashboard-action-grid-v3 > a {
    padding: 10px 3px;
  }
  .dashboard-action-grid-v3 > a strong {
    font-size: 8px;
  }
  .lobby-preview-card-v3 {
    flex-basis: 72vw;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dashboard-action-grid-v3 > a,
  .lobby-preview-card-v3 {
    transition: none;
  }
}
</style>
