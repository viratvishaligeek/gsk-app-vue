<template>
  <main class="games-discovery page-content games-discovery-v3">
    <section v-if="featuredGame && !searchTerm && activeFilter === 'all'" class="games-spotlight-v3">
      <div class="games-spotlight-heading"><span>⭐ SPOTLIGHT MARKET</span><small>{{ featuredGame.is_playable ? 'READY TO PLAY' : 'NEXT SCHEDULE' }}</small></div>
      <div class="games-spotlight-body">
        <div class="games-spotlight-icon">🎲</div>
        <div class="games-spotlight-copy"><h2>{{ featuredGame.name }}</h2><p>🕒 {{ formatTime(featuredGame.play_start) }} – {{ formatTime(featuredGame.play_end) }}</p></div>
        <div class="games-spotlight-result"><small>TODAY</small><strong>{{ resultNumber(featuredGame) }}</strong></div>
      </div>
      <router-link v-if="featuredGame.is_playable" :to="{name:'play-game',params:{id:featuredGame.id}}">Enter game studio <b>→</b></router-link>
      <router-link v-else :to="{name:'monthly-chart',query:{game:featuredGame.id}}">Explore market history <b>→</b></router-link>
    </section>

    <section class="games-discovery-controls-v3" aria-label="Find a market">
      <div class="games-discovery-heading"><div><span>MARKET DIRECTORY</span><h2>Explore all games</h2></div><router-link to="/monthly-chart">📊 Charts</router-link></div>
      <label class="games-search">
        <span aria-hidden="true">🔎</span>
        <input v-model="searchTerm" type="search" placeholder="Search market name…" aria-label="Search markets">
        <button v-if="searchTerm" type="button" aria-label="Clear search" @click="searchTerm = ''">✕</button>
      </label>
      <div class="games-filter-row" role="group" aria-label="Filter markets">
        <button v-for="option in filters" :key="option.value" type="button"
          :class="{ 'is-selected': activeFilter === option.value }"
          :aria-pressed="activeFilter === option.value" @click="activeFilter = option.value">
          {{ option.label }} <span>{{ filterCounts[option.value] }}</span>
        </button>
      </div>
    </section>

    <section v-if="isLoading" class="games-state" aria-busy="true">
      <span>⏳</span><strong>Preparing your game lobby…</strong><p>Getting the latest market schedules.</p>
    </section>
    <section v-else-if="errorMessage" class="games-state games-state-error" role="alert">
      <span>📡</span><strong>We couldn't load the games</strong><p>{{ errorMessage }}</p>
      <button type="button" class="btn btn-primary rounded-pill px-4" @click="loadGames">Try again</button>
    </section>
    <section v-else-if="filteredGames.length === 0" class="games-state">
      <span>🎲</span><strong>{{ games.length ? 'No matching markets' : 'No markets available' }}</strong>
      <p>{{ games.length ? 'Try another filter or search term.' : 'Please check back later.' }}</p>
      <button v-if="searchTerm || activeFilter !== 'all'" type="button" class="btn btn-outline-primary rounded-pill px-4" @click="resetFilters">Show all markets</button>
    </section>

    <section v-else class="games-grid games-grid-v3" aria-label="Available games">
      <article v-for="game in discoveryGames" :key="game.id" class="game-lobby-card"
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
            class="btn btn-primary">Play now <span>→</span></router-link>
          <router-link v-else :to="{ name: 'monthly-chart', query: { game: game.id } }"
            class="btn btn-outline-secondary">View history <span>→</span></router-link>
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

const featuredGame = computed(() => games.value.find(game => Boolean(game.is_playable)) || games.value[0] || null)

const filteredGames = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase()
  return games.value.filter(game => {
    const matchesSearch = !query || String(game.name || '').toLocaleLowerCase().includes(query)
    const matchesFilter = activeFilter.value === 'all'
      || (activeFilter.value === 'open' ? Boolean(game.is_playable) : !game.is_playable)
    return matchesSearch && matchesFilter
  })
})

const discoveryGames = computed(() => filteredGames.value.filter(game => !(game.id === featuredGame.value?.id && !searchTerm.value.trim() && activeFilter.value === 'all')))

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


<style scoped>
.games-discovery-v3{background:radial-gradient(circle at 100% 0, #ffffff 0, #384aff8f 10%), #028214;color:#f4f6ff}
.games-hero-v3{position:relative;overflow:hidden;margin:5px 0 14px;padding:19px;border:1px solid #7569ca55;border-radius:22px;background:radial-gradient(circle at 90% 10%,#8b72ff55 0,transparent 32%),linear-gradient(140deg,#201e4a,#142b50 72%,#11415d);box-shadow:0 17px 38px #00000040}
.games-hero-copy{position:relative;z-index:1}.games-hero-copy>span{color:#c0b7ff;font-size:8px;font-weight:950;letter-spacing:.17em}
.games-hero-copy h1{margin:8px 0;color:#fff;font-size:31px;font-weight:950;line-height:1.03;letter-spacing:-.05em}.games-hero-copy h1 em{color:#ffc96d;font-style:normal}
.games-hero-copy p{max-width:280px;margin:0;color:#c4cee5;font-size:10px;line-height:1.55}
.games-hero-orbit{position:absolute;top:24px;right:19px;display:grid;place-items:center;width:92px;height:92px;border:1px solid #ffffff25;border-radius:50%;background:#ffffff0b;box-shadow:0 0 0 12px #ffffff06,0 0 30px #8b72ff30}
.games-hero-orbit>span{display:grid;place-items:center;width:55px;height:55px;border-radius:18px;background:linear-gradient(145deg,#8b72ff,#286ee9);font-size:29px;box-shadow:0 8px 22px #0005}
.games-hero-orbit i{position:absolute;top:2px;right:12px;color:#ffd27a;font-style:normal}.games-hero-orbit b{position:absolute;bottom:3px;left:8px;color:#a5e6ff}
.games-hero-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:18px}
.games-hero-stats>div{display:grid;gap:1px;padding:9px 10px;border:1px solid #ffffff1d;border-radius:12px;background:#ffffff0d}
.games-hero-stats strong{color:#fff;font-size:20px;font-weight:950}.games-hero-stats small{color:#b6c5e0;font-size:8px;font-weight:750}
.games-spotlight-v3{margin:13px 0 19px;padding:15px;border:1px solid #7669c05c;border-radius:19px;background:linear-gradient(145deg,#171f3d,#111b31);box-shadow:0 12px 30px #0000002c}
.games-spotlight-heading{display:flex;justify-content:space-between;gap:8px;color:#b8aaff;font-size:8px;font-weight:950;letter-spacing:.12em}
.games-spotlight-heading small{color:#70dfb5;font-size:8px;letter-spacing:.06em}
.games-spotlight-body{display:flex;align-items:center;gap:10px;margin:13px 0}
.games-spotlight-icon{display:grid;place-items:center;width:48px;height:48px;flex:0 0 48px;border-radius:15px;background:#292650;font-size:26px}
.games-spotlight-copy{flex:1;min-width:0}.games-spotlight-copy h2{overflow:hidden;margin:0;color:#fff;font-size:15px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}
.games-spotlight-copy p{margin:4px 0 0;color:#91a0bf;font-size:9px}
.games-spotlight-result{display:grid;justify-items:end;gap:1px}.games-spotlight-result small{color:#8798b8;font-size:8px;font-weight:900}.games-spotlight-result strong{color:#fff;font-size:26px;font-weight:950}
.games-spotlight-v3>a{display:flex;justify-content:space-between;padding-top:11px;border-top:1px solid #2d3b59;color:#b9adff;font-size:10px;font-weight:900}
.games-discovery-controls-v3{position:sticky;top:68px;z-index:5;margin:0 -13px 15px;padding:13px;border-bottom:1px solid #283552;background:#0b1325ee;backdrop-filter:blur(16px)}
.games-discovery-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.games-discovery-heading>div>span{color:#9b8cff;font-size:8px;font-weight:950;letter-spacing:.14em}
.games-discovery-heading h2{margin:3px 0 0;color:#f4f6ff;font-size:17px;font-weight:950}.games-discovery-heading>a{color:#b6aaff;font-size:9px;font-weight:850}
.games-search{border-color:#354363;background:#121d34;color:#fff}.games-search input{color:#fff}.games-search input::placeholder{color:#7888aa}
.games-filter-row button{border-color:#354363;background:#131e35;color:#b7c4df}.games-filter-row button.is-selected{border-color:#8b72ff;background:linear-gradient(110deg,#765cf5,#326ce5);color:#fff;box-shadow:0 5px 15px #4e54d944}
.games-grid-v3{gap:10px}.games-grid-v3 .game-lobby-card{border-color:#2e3d5e;background:linear-gradient(155deg,#18233d,#101a2e);box-shadow:0 10px 25px #00000025}
.games-grid-v3 .game-lobby-card-closed{background:linear-gradient(155deg,#151d31,#101827);opacity:.88}
.games-grid-v3 .game-card-symbol{background:#292650}.games-grid-v3 .game-card-copy h2{color:#f4f6ff}
.games-grid-v3 .game-card-copy p,.games-grid-v3 .game-card-result small{color:#8f9fbe}
.games-grid-v3 .game-card-result{border:1px solid #2e3d5e;background:#0b1428}.games-grid-v3 .game-card-result strong{color:#fff}
.games-grid-v3 .game-card-result>span{color:#9ba9c8}
.games-grid-v3 .game-card-status.status-open{background:#123b35;color:#70e2ba}.games-grid-v3 .game-card-status.status-closed{background:#27334b;color:#aab6cf}
.games-grid-v3 .game-card-actions .btn-primary{border-color:#8b72ff;background:linear-gradient(110deg,#765cf5,#326ce5)}
.games-grid-v3 .game-card-actions .btn-outline-secondary{border-color:#465779;background:#1a2945;color:#c6d1e8}
.games-state{border-color:#34415f;background:#111a2e;color:#f4f6ff}.games-state strong{color:#fff}.games-state p{color:#9ba9c8}
.games-footnote{color:#8292b2}
@media(max-width:390px){.games-hero-copy h1{font-size:27px}.games-hero-orbit{right:12px;width:78px;height:78px}.games-hero-orbit>span{width:47px;height:47px;font-size:24px}}
@media(prefers-reduced-motion:reduce){.games-grid-v3 .game-lobby-card{transition:none}}
</style>
