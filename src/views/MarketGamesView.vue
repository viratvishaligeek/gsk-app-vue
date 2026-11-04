<template>
  <main class="container-fluid py-2 market-page">

    <!-- Header -->
    <section class="d-flex align-items-center justify-content-between gap-3 mb-2">
      <div>
        <div class="small fw-bold text-uppercase market-eyebrow">
          <i class="bi bi-grid-1x2-fill me-1"></i>
          Explore All Markets
        </div>
        <h1 class="h3 fw-bold mb-1 mt-2">Market Games</h1>
        <p class="text-secondary small mb-0">
          Browse markets and check live availability.
        </p>
      </div>

      <div class="market-count text-center">
        <strong>{{ filteredGames.length }}</strong>
        <small>Markets</small>
      </div>
    </section>

    <!-- Search and filters -->
    <section class="d-flex flex-column flex-sm-row gap-2 mb-3">
      <div class="input-group market-search flex-grow-1">
        <span class="input-group-text bg-white border-end-0">
          <i class="bi bi-search"></i>
        </span>

        <input v-model="search" type="search" class="form-control border-start-0 shadow-none"
          placeholder="Search markets..." aria-label="Search markets" />

        <button v-if="search" class="btn btn-outline-secondary" type="button" @click="search = ''"
          aria-label="Clear search">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="btn-group market-filters" role="group" aria-label="Filter markets">
        <button v-for="item in filters" :key="item.value" type="button" class="btn btn-sm" :class="filter === item.value
          ? 'btn-danger'
          : 'btn-outline-secondary'" @click="filter = item.value">
          {{ item.label }}
        </button>
      </div>
    </section>

    <!-- Loading -->
    <div v-if="isLoading" class="market-message" role="status">
      <span class="spinner-border spinner-border-sm text-danger"></span>
      <span>Loading markets...</span>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="alert alert-light border text-center py-4" role="alert">
      <i class="bi bi-cloud-slash fs-3 text-secondary"></i>
      <h2 class="h6 mt-2">Markets couldn't load</h2>
      <p class="small text-secondary">{{ errorMessage }}</p>

      <button type="button" class="btn btn-danger btn-sm" @click="loadGames">
        <i class="bi bi-arrow-clockwise me-1"></i>
        Try again
      </button>
    </div>

    <!-- Compact market strips -->
    <section v-else-if="filteredGames.length" class="market-list">
      <article v-for="game in filteredGames" :key="game.id" class="market-strip"
        :class="{ 'market-strip-closed': !isGamePlayable(game) }">
        <!-- Market name -->
        <div class="market-strip-name">
          <h2 class="mb-0 fs-2">{{ game.name }}</h2>
          <small class="text-secondary">
            <span class="market-status" :class="isGamePlayable(game) ? 'status-open' : 'status-closed'">
              <span class="status-dot"></span>
              {{ game.monthly_closure
                ? 'Month-end closed'
                : isGamePlayable(game)
                  ? 'Open'
                  : 'Closed'
              }}
            </span> </small>
          <!-- Play button -->
          <router-link v-if="isGamePlayable(game)" :to="{ name: 'play-game', params: { id: game.id } }"
            class="btn btn-danger btn-sm market-play-btn">
            <i class="bi bi-controller me-1"></i>
            Play
          </router-link>
          <span v-else class="market-unavailable">
            <i class="bi bi-lock-fill me-1"></i>
            Unavailable
          </span>

        </div>

        <!-- Availability -->


        <!-- Month-end message -->
        <small v-if="game.monthly_closure && game.play_status_message" class="market-strip-note">
          {{ game.play_status_message }}
        </small>
      </article>
    </section>

    <!-- Empty state -->
    <div v-else class="market-message flex-column py-5">
      <i class="bi bi-search fs-3 text-secondary"></i>
      <h2 class="h6 mb-0">No matching markets</h2>
      <p class="small text-secondary mb-1">
        Try another search or availability filter.
      </p>
      <button type="button" class="btn btn-outline-secondary btn-sm" @click="search = ''; filter = 'all'">
        Clear filters
      </button>
    </div>

    <!-- Footer -->
    <footer class="d-flex justify-content-between align-items-center gap-3 flex-wrap mt-4 pt-3 border-top small">
      <router-link to="/dashboard" class="text-decoration-none fw-semibold">
        <i class="bi bi-arrow-left me-1"></i>
        Back to Home
      </router-link>

      <span class="text-secondary">Play responsibly · 18+ only</span>
    </footer>

  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/plugins/axios'

const games = ref([])
const serverNow = ref(Date.now())
const serverOffset = ref(0)
const isLoading = ref(true)
const errorMessage = ref('')
const search = ref('')
const filter = ref('all')
const filters = [
  { label: 'All markets', value: 'all' },
  { label: 'Open now', value: 'open' },
  { label: 'Closed', value: 'closed' },
]

const isGamePlayable = (game) => {
  if (!game || game.status !== 'active' || game.monthly_closure) return false
  const start = new Date(game.play_window_start_at).getTime()
  const end = new Date(game.play_window_end_at).getTime()
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    serverNow.value + serverOffset.value >= start &&
    serverNow.value + serverOffset.value < end
  )
}

const filteredGames = computed(() => {
  const query = search.value.trim().toLowerCase()
  return games.value.filter((game) => {
    const matchesSearch =
      !query ||
      String(game.name || '')
        .toLowerCase()
        .includes(query)
    const open = isGamePlayable(game)
    const matchesFilter = filter.value === 'all' || (filter.value === 'open' ? open : !open)
    return matchesSearch && matchesFilter
  })
})

const formatTime = (value) => {
  if (!value) return '--'
  const parts = String(value).split(':').map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) return '--'
  const date = new Date()
  date.setHours(parts[0], parts[1], parts[2] || 0, 0)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const loadGames = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await api.get('/games/list', {
      params: { _ts: Date.now() },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    })
    const data = response.data
    if (!data?.status) throw new Error(data?.message || 'Unable to load markets.')
    if (data.server_time) {
      const serverTimestamp = new Date(data.server_time).getTime()
      if (Number.isFinite(serverTimestamp)) serverOffset.value = serverTimestamp - Date.now()
    }
    games.value = Array.isArray(data.games)
      ? data.games
      : Array.isArray(data.data?.games)
        ? data.data.games
        : []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Unable to load markets.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadGames)
</script>

<style scoped>
.market-page {
  --market-primary: #033c07;
  --market-border: #e8e1dd;
  max-width: 1400px;
  color: #252525;
}

.market-eyebrow {
  color: var(--market-primary);
  letter-spacing: 0.08em;
  font-size: 10px;
}

.market-page h1 {
  color: var(--market-primary);
}

.market-count {
  flex-shrink: 0;
  min-width: 68px;
  padding: 8px 12px;
  border: 1px solid var(--market-border);
  border-radius: 12px;
  background: #fff;
}

.market-count strong,
.market-count small {
  display: block;
}

.market-count strong {
  color: var(--market-primary);
  font-size: 22px;
  line-height: 1.2;
}

.market-count small {
  color: #777;
  font-size: 10px;
}

.market-search,
.market-search .input-group-text,
.market-search .form-control {
  border-color: var(--market-border);
}

.market-search {
  min-width: 0;
}

.market-filters .btn-danger,
.market-play-btn {
  background-color: var(--market-primary);
  border-color: var(--market-primary);
}

.market-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.market-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 11px 14px;
  border: 1px solid var(--market-border);
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.15s ease;
}

.market-strip:hover {
  border-color: #d5b2a8;
}

.market-strip-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.market-strip-name h2 {
  overflow: hidden;
  color: #8f2513;
  font-size: 13px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.market-strip-name small {
  flex-shrink: 0;
  font-size: 11px;
}

.market-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.status-open {
  background: #eaf7ee;
  color: #197342;
}

.status-closed {
  background: #f2efed;
  color: #777;
}

.status-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: currentColor;
}

.market-play-btn {
  flex-shrink: 0;
  min-width: 76px;
}

.market-unavailable {
  flex-shrink: 0;
  color: #999;
  font-size: 10px;
  white-space: nowrap;
}

.market-strip-closed {
  background: #fcfaf9;
}

.market-strip-note {
  flex-basis: 100%;
  color: #a05b29;
  font-size: 10px;
}

.market-message {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 35px 16px;
  border: 1px solid var(--market-border);
  border-radius: 10px;
  background: #fff;
  text-align: center;
}

@media (max-width: 575.98px) {
  .market-page {
    padding-inline: 12px;
  }

  .market-strip {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px;
  }

  .market-strip-name {
    flex-basis: 100%;
  }

  .market-status {
    margin-right: auto;
  }

  .market-strip-note {
    flex-basis: 100%;
  }

  .market-filters .btn {
    padding-inline: 8px;
    font-size: 11px;
  }
}
</style>
