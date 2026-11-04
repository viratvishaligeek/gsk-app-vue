<template>
  <main class="gsk-screen">
    <header class="screen-banner chart-banner"><div class="screen-banner-icon">📊</div><div><span>RESULT ARCHIVE</span><h1>Monthly charts</h1><p>Browse date-wise market results.</p></div></header>
    <section class="chart-filter-panel">
      <div class="screen-section-title"><span>🗓️</span><div><strong>Choose a period</strong><small>Update the chart by month and year</small></div></div>
      <div class="row g-2"><div class="col-7"><label class="form-label" for="chart-month">Month</label><select id="chart-month" v-model="selectedMonth" @change="fetchMonthlyResults" class="form-select"><option v-for="(month,index) in months" :key="index" :value="index+1">{{ month }}</option></select></div><div class="col-5"><label class="form-label" for="chart-year">Year</label><select id="chart-year" v-model="selectedYear" @change="fetchMonthlyResults" class="form-select"><option v-for="year in years" :key="year" :value="year">{{ year }}</option></select></div></div>
    </section>
    <section v-if="gameHeaders.length" class="chart-market-strip">
      <div v-for="game in gameHeaders" :key="game.id" class="chart-market-chip"><small>{{ game.name }}</small><strong>{{ getLatestResult(game.id) }}</strong><span :class="hasTodayResult(game.id)?'text-success':'text-secondary'">{{ hasTodayResult(game.id)?'● Today':'No result today' }}</span></div>
    </section>
    <section class="chart-table-panel">
      <div class="chart-table-heading"><div><span>📅</span><strong>{{ getMonthName(selectedMonth) }} {{ selectedYear }}</strong></div><small>{{ monthlyData.length }} calendar days</small></div>
      <div v-if="isLoading" class="gsk-empty-state"><span>⏳</span><strong>Loading results…</strong><p>Fetching the latest saved chart.</p></div>
      <div v-else-if="!gameHeaders.length" class="gsk-empty-state"><span>🎮</span><strong>No games available</strong><p>There are no markets to display for this period.</p></div>
      <div v-else class="table-responsive gsk-chart-scroll"><table class="table table-bordered table-hover align-middle text-center mb-0 gsk-chart-table">
        <thead><tr><th class="chart-date-column">Date</th><th v-for="game in gameHeaders" :key="game.id">{{ game.name }}</th></tr></thead>
        <tbody><tr v-for="row in monthlyData" :key="row.date" :class="{'chart-today-row':row.is_today}">
          <th class="chart-date-column"><span>{{ row.formatted_day }}</span><small v-if="row.is_today">TODAY</small></th>
          <td v-for="game in gameHeaders" :key="game.id">
            <span v-if="row.results[game.id]!==null&&row.results[game.id]!==undefined&&row.results[game.id]!==''"
              class="chart-result" :class="{'chart-joda':isJodaResult(row.results[game.id]),'chart-today-result':row.is_today}">{{ row.results[game.id] }}</span>
            <span v-else class="chart-missing">—</span>
          </td>
        </tr></tbody>
      </table></div>
      <footer class="chart-legend"><span>🟨 Today's row</span><span>— Result not published</span><span>✨ Highlighted Jodi</span></footer>
    </section>
  </main>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { App } from '@capacitor/app'
import { useRoute } from 'vue-router'
import api from '@/plugins/axios'
import { isJodaResult } from '@/utils/jodaResults'

const route = useRoute()

const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() + 1

const selectedMonth = ref(currentMonth)
const selectedYear = ref(currentYear)

const isLoading = ref(false)
const monthlyData = ref([])
const games = ref([])
let lastFetchedAt = 0
let appStateListener = null

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const years = computed(() => {
  const result = []

  for (let year = currentYear; year >= currentYear - 5; year--) {
    result.push(year)
  }

  return result
})

const colors = [
  '#ffc107',
  '#0d6efd',
  '#198754',
  '#dc3545',
  '#6f42c1',
  '#fd7e14',
  '#20c997',
  '#0dcaf0',
]

const gameHeaders = computed(() =>
  games.value.map((game, index) => ({
    ...game,
    color: colors[index % colors.length],
  }))
)

const getMonthName = (month) => months[month - 1]


const selectedGameId = computed(() => {
  const gameId = route.query.game

  if (!gameId) {
    return null
  }

  const id = Number(gameId)

  return Number.isInteger(id) && id > 0 ? id : null
})

const fetchMonthlyResults = async () => {
  isLoading.value = true

  try {
    const params = {
      month: selectedMonth.value,
      year: selectedYear.value,
    }

    if (selectedGameId.value) {
      params.game_id = selectedGameId.value
    }

    const response = await api.get('/result-chart/index', {
      params,
    })
    const payload = response.data

    games.value = payload.games || []
    monthlyData.value = payload.data || []
    lastFetchedAt = Date.now()
  } catch (error) {
    games.value = []
    monthlyData.value = []

    console.error(
      'Monthly chart fetch failed:',
      error
    )
  } finally {
    isLoading.value = false
  }
}

const getLatestResult = (gameId) => {
  const todayRow = monthlyData.value.find(
    (row) => row.is_today
  )

  if (todayRow?.results?.[gameId]) {
    return todayRow.results[gameId]
  }

  const game = games.value.find(
    (item) => item.id === gameId
  )

  return game?.last_result || '--'
}

const hasTodayResult = (gameId) => {
  const todayRow = monthlyData.value.find(
    (row) => row.is_today
  )

  return Boolean(todayRow?.results?.[gameId])
}

onMounted(async () => {
  try {
    appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && Date.now() - lastFetchedAt >= 60 * 1000) {
        void fetchMonthlyResults()
      }
    })
  } catch (error) {
    console.warn('Unable to register chart foreground refresh:', error)
  }
  await fetchMonthlyResults()
})

onBeforeUnmount(async () => {
  if (appStateListener) {
    await appStateListener.remove()
    appStateListener = null
  }
})
</script>
<style scoped>
.gsk-screen{min-height:100dvh;padding:14px 13px calc(100px + env(safe-area-inset-bottom));background:#f4f7fb;color:#1e2c42}.screen-banner{display:flex;align-items:center;gap:13px;padding:19px;border-radius:19px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff}.screen-banner-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#ffffff1b;font-size:28px}.screen-banner span{color:#cbd9eb;font-size:9px;font-weight:900;letter-spacing:.13em}.screen-banner h1{margin:2px 0;color:#fff;font-size:22px;font-weight:900}.screen-banner p{margin:0;color:#d5e1f0;font-size:11px}.chart-filter-panel,.chart-table-panel{margin-top:13px;padding:15px;border:1px solid #e5ebf3;border-radius:17px;background:#fff;box-shadow:0 8px 22px #1b365d0b}.screen-section-title{display:flex;align-items:center;gap:10px;margin-bottom:13px}.screen-section-title>span{font-size:25px}.screen-section-title div{display:grid}.screen-section-title strong{font-size:13px}.screen-section-title small{font-size:10px;color:#7b899d}.chart-filter-panel .form-label{font-size:10px;font-weight:800;color:#63738a}.chart-market-strip{display:flex;gap:9px;overflow:auto;padding:13px 0 2px;scrollbar-width:none}.chart-market-chip{display:grid;gap:3px;min-width:112px;padding:11px;border:1px solid #e4eaf2;border-radius:13px;background:#fff}.chart-market-chip small{overflow:hidden;color:#6d7d93;font-size:9px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.chart-market-chip strong{font-size:20px;font-weight:900;color:#244e83}.chart-market-chip span{font-size:8px;font-weight:800}.chart-table-panel{padding:0;overflow:hidden}.chart-table-heading{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px;border-bottom:1px solid #e9eef5}.chart-table-heading div{display:flex;align-items:center;gap:8px}.chart-table-heading div span{font-size:21px}.chart-table-heading strong{font-size:13px}.chart-table-heading small{color:#7b899d;font-size:9px}.gsk-chart-scroll{max-height:65vh}.gsk-chart-table{min-width:max-content;font-size:11px}.gsk-chart-table th,.gsk-chart-table td{min-width:72px;padding:9px 7px!important}.gsk-chart-table thead th{position:sticky;top:0;z-index:3;background:#edf3fb;color:#38516f;font-size:9px}.gsk-chart-table .chart-date-column{position:sticky;left:0;z-index:4;min-width:55px;background:#f2f5f9;color:#40516a}.gsk-chart-table tbody .chart-date-column{z-index:2}.chart-date-column span{display:block;font-weight:900}.chart-date-column small{display:block;color:#bf7840;font-size:7px}.chart-today-row td,.chart-today-row .chart-date-column{background:#fff6df!important}.chart-result{display:inline-grid;place-items:center;min-width:31px;min-height:27px;border-radius:7px;background:#edf3fc;color:#244e83;font-weight:900}.chart-today-result{background:#ffe7ad;color:#7b5010}.chart-joda{outline:2px solid #50a77c;background:#e0f5e9;color:#17663f}.chart-missing{color:#aeb8c5}.chart-legend{display:flex;flex-wrap:wrap;gap:10px;padding:12px 14px;border-top:1px solid #e9eef5;color:#7b899d;font-size:9px}
</style>