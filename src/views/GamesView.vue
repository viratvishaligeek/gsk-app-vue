<template>
  <main class="games-discovery page-content">
    <header class="games-intro">
      <div>
        <span class="gsk-page-kicker">🎮 THE GAME LOBBY</span>
        <h1>Find your game</h1>
        <p>Explore every market, check its live schedule and jump into play when the window is open.</p>
      </div>
      <router-link to="/monthly-chart" class="games-results-link">📊 Results archive <span>→</span></router-link>
    </header>

    <section class="games-summary" aria-label="Market summary">
      <div><strong>{{ games.length }}</strong><span>All markets</span></div>
      <div><strong>{{ openCount }}</strong><span>Open to play</span></div>
      <div><strong>{{ closedCount }}</strong><span>Currently closed</span></div>
    </section>

    <section class="games-controls" aria-label="Find a market">
      <label class="games-search">
        <span aria-hidden="true">🔎</span>
        <input v-model="searchTerm" type="search" placeholder="Search markets" aria-label="Search markets">
        <button v-if="searchTerm" type="button" aria-label="Clear search" @click="searchTerm = ''">✕</button>
      </label>
      <div class="games-filter-row" role="group" aria-label="Filter markets">
        <button v-for="option in filters" :key="option.value" type="button"
          :class="{ 'is-selected': activeFilter === option.value }"
          :aria-pressed="activeFilter === option.value" @click="activeFilter = option.value">
          {{ option.label }}
          <span>{{ filterCounts[option.value] }}</span>
        </button>
      </div>
    </section>

    <section v-if="isLoading" class="games-state" aria-busy="true">
      <span>⏳</span><strong>Loading the game lobby…</strong><p>Getting the latest market schedules.</p>
    </section>
    <section v-else-if="errorMessage" class="games-state games-state-error" role="alert">
      <span>📡</span><strong>We couldn't load the games</strong><p>{{ errorMessage }}</p>
      <button type="button" class="btn btn-primary rounded-pill px-4" @click="loadGames">Try again</button>
    </section>
    <section v-else-if="filteredGames.length === 0" class="games-state">
      <span>🎯</span><strong>{{ games.length ? 'No matching markets' : 'No markets available' }}</strong>
      <p>{{ games.length ? 'Try another filter or search term.' : 'Please check back later.' }}</p>
      <button v-if="searchTerm || activeFilter !== 'all'" type="button" class="btn btn-outline-primary rounded-pill px-4" @click="resetFilters">Show all markets</button>
    </section>

    <section v-else class="games-grid" aria-label="Available games">
      <article v-for="game in filteredGames" :key="game.id" class="game-lobby-card"
        :class="{ 'game-lobby-card-closed': !game.is_playable }">
        <div class="game-card-top">
          <span class="game-card-symbol" aria-hidden="true">🎮</span>
          <span class="game-card-status" :class="game.is_playable ? 'status-open' : 'status-closed'">
            <i></i>{{ game.monthly_closure ? 'Month-end closed' : (game.is_playable ? 'Open now' : 'Closed') }}
          </span>
        </div>
        <div class="game-card-copy">
          <h2>{{ game.name }}</h2>
          <p>🕒 {{ formatTime(game.play_start) }} – {{ formatTime(game.play_end) }}</p>
        </div>
        <div class="game-card-result">
          <div><small>Today's result</small><strong>{{ resultNumber(game) }}</strong></div>
          <span>{{ hasTodayResult(game) ? 'Published' : 'Awaiting result' }}</span>
        </div>
        <div class="game-card-actions">
          <router-link v-if="game.is_playable" :to="{ name: 'play-game', params: { id: game.id } }"
            class="btn btn-primary">Play this market <span>→</span></router-link>
          <router-link v-else :to="{ name: 'monthly-chart', query: { game: game.id } }"
            class="btn btn-outline-secondary">View results <span>→</span></router-link>
        </div>
      </article>
    </section>
    <p class="games-footnote">Market availability and play timings are controlled by the server. Play responsibly.</p>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/plugins/axios'

const games = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const searchTerm = ref('')
const activeFilter = ref('all')
const serverToday = ref('')

const filters = [
  { value: 'all', label: 'All markets' },
  { value: 'open', label: 'Open now' },
  { value: 'closed', label: 'Closed' },
]

const openCount = computed(() => games.value.filter(game => Boolean(game.is_playable)).length)
const closedCount = computed(() => games.value.length - openCount.value)
const filterCounts = computed(() => ({
  all: games.value.length,
  open: openCount.value,
  closed: closedCount.value,
}))

const filteredGames = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase()
  return games.value.filter(game => {
    const matchesSearch = !query || String(game.name || '').toLocaleLowerCase().includes(query)
    const matchesFilter = activeFilter.value === 'all'
      || (activeFilter.value === 'open' ? Boolean(game.is_playable) : !game.is_playable)
    return matchesSearch && matchesFilter
  })
})

const hasTodayResult = game => Boolean(game.today_result?.number ?? (game.latest_result?.date === serverToday.value ? game.latest_result?.number : null))
const resultNumber = game => {
  const result = game.today_result ?? (game.latest_result?.date === serverToday.value ? game.latest_result : null)
  return result?.number ?? '--'
}

const formatTime = value => {
  if (!value) return '--'
  const [hours, minutes] = String(value).split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '--'
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const resetFilters = () => {
  searchTerm.value = ''
  activeFilter.value = 'all'
}

const loadGames = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await api.get('/games/list', {
      params: { _ts: Date.now() },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    })
    if (!response.data?.status) throw new Error(response.data?.message || 'Unable to load games.')
    const timezone = response.data.timezone || 'Asia/Kolkata'
    const serverTime = response.data.server_time ? new Date(response.data.server_time) : new Date()
    serverToday.value = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(serverTime)
    games.value = Array.isArray(response.data.games) ? response.data.games : []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Unable to load games.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadGames)
</script>

<style scoped>
.games-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:4px 0 18px}.games-intro h1{margin:5px 0 4px;font-size:26px;font-weight:950;letter-spacing:-.04em}.games-intro p{max-width:440px;margin:0;color:var(--gsk-muted);font-size:11px}.games-results-link{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;padding:10px 12px;border:1px solid var(--gsk-line);border-radius:12px;background:#fff;font-size:10px;font-weight:850}.games-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:15px}.games-summary>div{display:grid;gap:2px;padding:13px;border:1px solid var(--gsk-line);border-radius:14px;background:#fff}.games-summary strong{font-size:21px;font-weight:950;line-height:1.2}.games-summary span{color:var(--gsk-muted);font-size:9px}.games-controls{position:sticky;top:64px;z-index:5;margin:0 -13px 15px;padding:10px 13px 12px;background:var(--gsk-paper);border-bottom:1px solid var(--gsk-line)}.games-search{display:flex;align-items:center;gap:9px;min-height:46px;padding:0 12px;border:1px solid var(--gsk-line);border-radius:13px;background:#fff}.games-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:12px}.games-search button{border:0;background:transparent;color:var(--gsk-muted)}.games-filter-row{display:flex;gap:7px;overflow-x:auto;padding-top:10px;scrollbar-width:none}.games-filter-row::-webkit-scrollbar{display:none}.games-filter-row button{display:flex;align-items:center;gap:7px;flex:0 0 auto;min-height:35px;padding:0 11px;border:1px solid var(--gsk-line);border-radius:30px;background:#fff;color:#5f6e83;font-size:10px;font-weight:800}.games-filter-row button.is-selected{border-color:var(--gsk-brand);background:var(--gsk-brand);color:#fff}.games-filter-row button span{opacity:.72}.games-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.game-lobby-card{display:flex;min-width:0;flex-direction:column;gap:12px;padding:13px;border:1px solid var(--gsk-line);border-radius:17px;background:#fff;box-shadow:var(--gsk-shadow)}.game-lobby-card-closed{background:linear-gradient(160deg,#fff,#f7f8fa)}.game-card-top{display:flex;align-items:center;justify-content:space-between;gap:6px}.game-card-symbol{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#edf3fc;font-size:22px}.game-card-status{display:inline-flex;align-items:center;gap:5px;padding:5px 7px;border-radius:30px;font-size:8px;font-weight:850;white-space:nowrap}.game-card-status i{width:5px;height:5px;border-radius:50%;background:currentColor}.status-open{background:#e5f5ec;color:#237b55}.status-closed{background:#eef0f3;color:#69778a}.game-card-copy h2{overflow-wrap:anywhere;margin:0 0 4px;font-size:13px;font-weight:900}.game-card-copy p{margin:0;color:var(--gsk-muted);font-size:9px}.game-card-result{display:flex;align-items:end;justify-content:space-between;gap:5px;padding:10px;border-radius:11px;background:#f1f5fa}.game-card-result>div{display:grid;gap:2px}.game-card-result small{color:var(--gsk-muted);font-size:8px}.game-card-result strong{font-size:22px;font-weight:950;line-height:1.1}.game-card-result>span{color:var(--gsk-muted);font-size:8px;text-align:right}.game-card-actions{margin-top:auto}.game-card-actions .btn{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:40px;padding:0 10px;font-size:9px}.games-state{display:grid;justify-items:center;gap:6px;padding:35px 16px;border:1px dashed var(--gsk-line);border-radius:17px;background:#fff;text-align:center}.games-state>span{font-size:34px}.games-state strong{font-size:14px}.games-state p{margin:0 0 8px;color:var(--gsk-muted);font-size:11px}.games-footnote{margin:18px 0 0;color:var(--gsk-muted);font-size:9px;text-align:center}@media(max-width:390px){.games-intro{align-items:flex-start;flex-direction:column}.games-results-link{align-self:flex-start}.games-grid{grid-template-columns:1fr}.games-controls{top:58px}}@media(prefers-reduced-motion:reduce){.game-lobby-card{transition:none}}
</style>
