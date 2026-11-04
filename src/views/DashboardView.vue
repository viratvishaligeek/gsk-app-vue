<template>
  <main ref="dashboardRootElement" class="gsk-dashboard">
    <section v-if="!hasInitialLoadCompleted" class="dashboard-loading" aria-busy="true">
      <LoadingState variant="featured" />
      <LoadingState variant="market-list" :count="3" />
    </section>

    <section v-else-if="errorMessage && games.length === 0" class="dashboard-empty">
      <span class="dashboard-empty-emoji">📡</span>
      <h1>We couldn't load the markets</h1>
      <p>{{ errorMessage }}</p>
      <button class="btn btn-primary rounded-pill px-4" @click="fetchGames">↻ Try again</button>
    </section>

    <template v-else>
      <section v-if="marqueeText" class="dashboard-announcement" aria-label="Announcement">
        <span class="announcement-emoji">📢</span>
        <div class="announcement-window"><div class="announcement-track">
          <span>{{ marqueeText }}</span><span aria-hidden="true">{{ marqueeText }}</span>
        </div></div>
      </section>

      <section v-if="noticeEnabled && noticeLines.length" class="dashboard-notice">
        <div class="notice-heading"><span>⚠️</span><div><strong>Important notice</strong><small>Updates from the GSK team</small></div></div>
        <ul><li v-for="(line,index) in noticeLines" :key="index">{{ line }}</li></ul>
      </section>

      <section v-if="banners.length" class="dashboard-promotions" aria-label="Featured promotions">
        <div id="heroCarousel" ref="heroCarouselElement" class="carousel slide">
          <div class="carousel-indicators" v-if="banners.length > 1">
            <button v-for="(banner,index) in banners" :key="banner.id" type="button"
              :class="{active:index===activeBannerIndex}" :aria-label="'Show promotion '+(index+1)"
              :aria-current="index===activeBannerIndex?'true':undefined" @click="goToBanner(index)"></button>
          </div>
          <div class="carousel-inner">
            <div v-for="(banner,index) in banners" :key="banner.id" class="carousel-item" :class="{active:index===0}">
              <img :src="banner.imageUrl" class="d-block w-100" :alt="banner.title || 'GSK promotion'" />
            </div>
          </div>
        </div>
      </section>

      <section class="dashboard-welcome">
        <div><span class="eyebrow">YOUR GAME ZONE</span><h1>Play. Track. Stay updated.</h1>
          <p>Everything you need, right here.</p></div>
        <span class="welcome-emoji" aria-hidden="true">🎮</span>
      </section>

      <nav class="dashboard-actions" aria-label="Wallet and support shortcuts">
        <router-link to="/wallet/add" class="dashboard-action action-add"><span>💰</span><b>Add money</b><small>Top up wallet</small></router-link>
        <router-link to="/wallet/withdraw" class="dashboard-action action-withdraw"><span>🏦</span><b>Withdraw</b><small>Request payout</small></router-link>
        <router-link to="/live-support" class="dashboard-action action-support"><span>💬</span><b>Live support</b><small>We're here to help</small></router-link>
      </nav>

      <section class="featured-result-section">
        <div class="section-heading"><div><span class="eyebrow">LATEST UPDATE</span><h2>🏆 Today's featured result</h2></div>
          <span class="market-count">{{ marketCount }} markets</span></div>
        <div v-if="isLoading && !featuredGame" class="py-2"><LoadingState variant="featured" /></div>
        <article v-else-if="featuredGame" class="featured-result-card">
          <div class="featured-result-top"><span>⭐ FEATURED MARKET</span><span>🕒 {{ formatTime(featuredGame.result_time) }}</span></div>
          <h3>{{ featuredGame.name }}</h3>
          <div class="featured-result-bottom">
            <div><small>Today's result</small><strong>{{ featuredGame.today_result?.date === todayDate ? (featuredGame.today_result?.number ?? '--') : '--' }}</strong></div>
            <span v-if="featuredGame.today_result?.date === todayDate" class="result-live">● Published</span>
            <span v-else class="result-pending">⌛ Awaiting result</span>
          </div>
        </article>
        <div v-else class="dashboard-inline-empty"><span>🗓️</span><p>No featured result is available yet.</p></div>
      </section>

      <section class="market-section">
        <div class="section-heading"><div><span class="eyebrow">EXPLORE & PLAY</span><h2>🎯 Live markets</h2></div>
          <router-link to="/monthly-chart" class="section-link">View charts →</router-link></div>
        <div v-if="errorMessage" class="alert alert-danger rounded-4">{{ errorMessage }}
          <button class="btn btn-sm btn-outline-danger ms-2" @click="fetchGames">Retry</button></div>
        <div v-else-if="isLoading" class="py-2"><LoadingState variant="market-list" :count="3" /></div>
        <div v-else-if="games.length === 0" class="dashboard-inline-empty"><span>🎲</span><h3>No markets available</h3><p>Please check again later.</p></div>
        <div v-else class="market-list">
          <article v-for="game in games" :key="game.id" v-memo="[game,isGamePlayable(game),serverOffset]"
            class="market-item" :class="{'market-item-closed':!isGamePlayable(game)}">
            <div class="market-item-main">
              <div class="market-symbol">🎮</div>
              <div class="market-info"><h3>{{ game.name }}</h3>
                <span class="market-status" :class="isGamePlayable(game)?'status-open':'status-closed'">
                  <i></i>{{ game.monthly_closure ? 'Month-end closed' : getGameStatus(game) }}
                </span>
                <small v-if="game.monthly_closure" class="closure-note">{{ game.play_status_message || 'आज महीने का आखिरी दिन है, इसलिए आज सभी खेल बंद रहेंगे। 1 तारीख से सभी खेल फिर से शुरू करेंगे। धन्यवाद।' }}</small>
              </div>
              <div class="market-result"><small>Today</small><strong>{{ game.latest_result?.date === todayDate ? (game.latest_result?.number ?? '--') : '--' }}</strong>
                <small v-if="isGamePlayable(game)" class="countdown"><GameCountdown :end-at="game.play_window_end_at" :server-offset="serverOffset" /></small>
              </div>
            </div>
            <div class="market-item-footer"><span>Last result: <b>{{ game.previous_result?.number ?? '--' }}</b></span>
              <span>🕒 {{ formatTime(game.result_time) }}</span>
              <router-link v-if="isGamePlayable(game)" :to="{name:'play-game',params:{id:game.id}}" class="market-play">Play now →</router-link>
              <span v-else class="market-closed-label">Closed</span>
            </div>
          </article>
        </div>
      </section>
      <section class="dashboard-bottom-link"><span>📊</span><div><strong>Explore monthly charts</strong><small>Browse historical market results</small></div>
        <router-link to="/monthly-chart" aria-label="Open monthly charts">→</router-link></section>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Carousel } from 'bootstrap'
import api from '../plugins/axios'
import LoadingState from '@/components/LoadingState.vue'
import GameCountdown from '@/components/GameCountdown.vue'

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
  const value = (type) => parts.find(part => part.type === type)?.value || ''
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
    .map(line => line.trim())
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
  return Number.isNaN(timestamp)
    ? null
    : timestamp
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
  return isGamePlayable(game)
    ? 'RUNNING'
    : 'CLOSED'
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
  const parts = String(time)
    .split(':')
    .map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) {
    return '--'
  }
  const hours = parts[0]
  const minutes = parts[1]
  const seconds = parts[2] || 0
  const date = new Date()
  date.setHours(
    hours,
    minutes,
    seconds,
    0
  )
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
    latest_result: game.today_result ?? (
      game.latest_result?.date === todayDate.value ? game.latest_result : null
    ),
    previous_result: game.previous_result ?? null,
    is_playable: Boolean(
      game.is_playable
    ),
    remaining_seconds: Number(
      game.remaining_seconds ?? 0
    ),
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
    const response = await api.get('/games/list', { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } })
    const data = response.data
    if (!data?.status) {
      throw new Error(
        data?.message || 'Unable to load games.'
      )
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
      ? data.banners.map((banner) => ({
        id: banner.id,
        title: banner.title || banner.name || 'Banner',
        imageUrl: banner.image_url || banner.image,
      }))
      : []
    const previousBannerSignature = banners.value.map(banner => `${banner.id}:${banner.imageUrl}`).join('|')
    const nextBannerSignature = nextBanners.map(banner => `${banner.id}:${banner.imageUrl}`).join('|')
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
    marqueeText.value =
      typeof data.marquee?.content === 'string'
        ? data.marquee.content.trim()
        : ''
    /*
|--------------------------------------------------------------------------
| Notice
|--------------------------------------------------------------------------
*/
    noticeEnabled.value =
      Boolean(data.notice?.status)
    noticeText.value =
      typeof data.notice?.content === 'string'
        ? data.notice.content.trim()
        : ''
    /*
|--------------------------------------------------------------------------
| Featured Game
|--------------------------------------------------------------------------
*/
    featuredGame.value = data.featured_game
      ? normalizeGame(data.featured_game)
      : null
    /*
  |--------------------------------------------------------------------------
  | Games
  |--------------------------------------------------------------------------
  */
    games.value = Array.isArray(data.games)
      ? data.games.map(normalizeGame)
      : []
  } catch (error) {
    console.error(
      'Games API Error:',
      error
    )
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      'Unable to load games.'
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

  dashboardAnimationObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle('dashboard-animation-paused', !entry.isIntersecting)
    }
  }, { rootMargin: '100px 0px', threshold: 0.01 })

  root.querySelectorAll('.marquee-wrapper, .notice-card, .live-result-box, .custom-card, .row.g-2.mb-4.ms-2.me-2 .btn')
    .forEach((element) => dashboardAnimationObserver.observe(element))
}

const handleBannerSlid = (event) => {
  activeBannerIndex.value = event.to
}

const goToBanner = (index) => {
  activeBannerIndex.value = index
  heroCarouselInstance?.to(index)
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
.gsk-dashboard{--gsk-navy:#182d4d;--gsk-blue:#315f9f;--gsk-sky:#eaf2ff;--gsk-ink:#1d2b40;--gsk-muted:#78869a;min-height:100dvh;padding:14px 14px calc(104px + env(safe-area-inset-bottom));background:#f5f7fb;color:var(--gsk-ink);overflow-x:clip}
.dashboard-loading{display:grid;gap:14px}.dashboard-announcement{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:#fff;border:1px solid #e5ebf3;overflow:hidden}.announcement-emoji{font-size:21px}.announcement-window{overflow:hidden;flex:1}.announcement-track{display:flex;width:max-content;gap:64px;white-space:nowrap;animation:announcement-scroll 28s linear infinite}.announcement-track span{font-size:12px;font-weight:650;color:#4c5b70}@keyframes announcement-scroll{to{transform:translateX(-50%)}}
.dashboard-notice{margin-top:12px;padding:14px;border-radius:17px;background:#fff8e9;border:1px solid #f2dfb7}.notice-heading{display:flex;align-items:center;gap:10px}.notice-heading>span{font-size:25px}.notice-heading div{display:grid}.notice-heading strong{font-size:14px}.notice-heading small{font-size:11px;color:#8a795d}.dashboard-notice ul{padding-left:23px;margin:12px 0 0;color:#6f6048;font-size:12px;line-height:1.6}.dashboard-promotions{margin:14px 0}.dashboard-promotions .carousel,.dashboard-promotions .carousel-inner,.dashboard-promotions img{border-radius:18px;overflow:hidden}.dashboard-promotions img{width:100%;aspect-ratio:16/6;object-fit:cover}
.dashboard-welcome{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0;padding:19px;border-radius:20px;background:linear-gradient(125deg,#18365e,#315f9f);color:#fff}.dashboard-welcome .eyebrow,.eyebrow{font-size:9px;letter-spacing:.13em;font-weight:850;color:#93acd0}.dashboard-welcome h1{margin:5px 0;font-size:19px;font-weight:850;line-height:1.2}.dashboard-welcome p{margin:0;color:#d4e1f3;font-size:11px}.welcome-emoji{font-size:44px;filter:drop-shadow(0 5px 8px #102746)}
.dashboard-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:14px 0 22px}.dashboard-action{display:grid;justify-items:start;gap:4px;min-width:0;padding:13px 10px;border:1px solid #e5ebf3;border-radius:16px;background:#fff;color:var(--gsk-ink);text-decoration:none;box-shadow:0 5px 14px #213b5b0b}.dashboard-action>span{font-size:24px}.dashboard-action b{font-size:11px;white-space:nowrap}.dashboard-action small{font-size:9px;color:var(--gsk-muted)}.action-add{border-bottom:3px solid #38a879}.action-withdraw{border-bottom:3px solid #e4a34b}.action-support{border-bottom:3px solid #648ac5}
.section-heading{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:20px 1px 12px}.section-heading .eyebrow{color:#8090a6}.section-heading h2{margin:3px 0 0;font-size:17px;font-weight:850;color:var(--gsk-ink)}.market-count{padding:6px 9px;border-radius:30px;background:#e8eff9;color:#315f9f;font-size:10px;font-weight:800;white-space:nowrap}.featured-result-card{padding:17px;border-radius:19px;background:linear-gradient(135deg,#213f69,#315f9f);color:#fff;box-shadow:0 10px 25px #1c3c681f}.featured-result-top,.featured-result-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px}.featured-result-top{font-size:9px;font-weight:800;color:#c5d7f0}.featured-result-card h3{margin:13px 0;font-size:19px;font-weight:850}.featured-result-bottom small{display:block;color:#d2e0f2;font-size:10px}.featured-result-bottom strong{display:block;font-size:34px;line-height:1.1;font-weight:900;letter-spacing:.04em}.result-live,.result-pending{padding:6px 9px;border-radius:30px;background:#ffffff20;font-size:10px;font-weight:800}.result-live{color:#baf5d7}.result-pending{color:#ffe1a5}
.market-list{display:grid;gap:11px}.market-item{padding:14px;border:1px solid #e5ebf3;border-radius:17px;background:#fff;box-shadow:0 5px 15px #213b5b09}.market-item-main{display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:10px}.market-symbol{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:#edf3fc;font-size:21px}.market-info{min-width:0}.market-info h3{margin:0 0 4px;font-size:14px;font-weight:850;text-transform:capitalize;overflow-wrap:anywhere}.market-status{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:850;text-transform:uppercase}.market-status i{width:6px;height:6px;border-radius:50%;background:currentColor}.status-open{color:#239667}.status-closed{color:#d16a6a}.closure-note{display:block;margin-top:5px;color:#bd5b55;font-size:10px}.market-result{text-align:right}.market-result small{display:block;color:var(--gsk-muted);font-size:9px}.market-result strong{display:block;font-size:22px;font-weight:900;color:var(--gsk-navy)}.market-result .countdown{color:#b66b29;font-weight:750}.market-item-footer{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid #edf0f5;color:#718096;font-size:10px}.market-item-footer b{color:#273c59}.market-play{margin-left:auto;padding:7px 11px;border-radius:9px;background:#eaf2ff;color:#28558f;font-size:10px;font-weight:850;text-decoration:none}.market-closed-label{margin-left:auto;color:#b66a6a;font-weight:800}.market-item-closed{background:#fcfcfd}.dashboard-inline-empty,.dashboard-empty{display:grid;justify-items:center;text-align:center;padding:28px 18px;border:1px dashed #d8e0eb;border-radius:17px;background:#fff}.dashboard-inline-empty>span,.dashboard-empty-emoji{font-size:35px}.dashboard-inline-empty h3,.dashboard-empty h1{margin:8px 0 4px;font-size:15px;font-weight:850}.dashboard-inline-empty p,.dashboard-empty p{margin:0;color:var(--gsk-muted);font-size:12px}.dashboard-empty{min-height:50vh;align-content:center;gap:10px}.dashboard-empty-emoji{font-size:46px}.dashboard-bottom-link{display:flex;align-items:center;gap:12px;margin-top:20px;padding:14px;border:1px solid #e4eaf2;border-radius:16px;background:#fff}.dashboard-bottom-link>span{font-size:28px}.dashboard-bottom-link div{display:grid;flex:1}.dashboard-bottom-link strong{font-size:12px}.dashboard-bottom-link small{font-size:10px;color:var(--gsk-muted)}.dashboard-bottom-link>a{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#eaf2ff;color:#315f9f;text-decoration:none;font-size:20px}
@media(min-width:700px){.gsk-dashboard{max-width:760px;margin:0 auto;padding-top:24px}.dashboard-actions{gap:14px}.dashboard-action{padding:17px}.market-list{grid-template-columns:repeat(2,minmax(0,1fr))}.market-item-footer{font-size:11px}}
@media(prefers-reduced-motion:reduce){.announcement-track{animation:none}}
</style>
