<template>
  <main class="gsk-screen">
    <GskScreenHeader
      emoji="📊"
      kicker="RESULT ARCHIVE"
      title="Monthly charts"
      subtitle="Browse date-wise market results."
    />
    <nav class="chart-shortcuts" aria-label="Results navigation">
      <router-link to="/play-history">📜 Play History</router-link
      ><router-link to="/games">🎮 Play Games</router-link>
    </nav>
    <section class="chart-filter-panel">
      <div class="screen-section-title">
        <span>🗓️</span>
        <div><strong>Choose a period</strong><small>Update the chart by month and year</small></div>
      </div>
      <div class="row g-2">
        <div class="col-7">
          <label class="form-label" for="chart-month">Month</label
          ><select
            id="chart-month"
            v-model="selectedMonth"
            @change="fetchMonthlyResults"
            class="form-select"
          >
            <option v-for="(month, index) in months" :key="index" :value="index + 1">
              {{ month }}
            </option>
          </select>
        </div>
        <div class="col-5">
          <label class="form-label" for="chart-year">Year</label
          ><select
            id="chart-year"
            v-model="selectedYear"
            @change="fetchMonthlyResults"
            class="form-select"
          >
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>
    </section>
    <section v-if="gameHeaders.length" class="chart-market-strip">
      <div v-for="game in gameHeaders" :key="game.id" class="chart-market-chip">
        <small>{{ game.name }}</small
        ><strong :class="hasTodayResult(game.id) ? 'text-success' : 'text-danger'">{{ getLatestResult(game.id) }}</strong
        ><span :class="hasTodayResult(game.id) ? 'text-success' : 'text-danger'">{{
          hasTodayResult(game.id) ? '● आज' : 'कल'
        }}</span>
      </div>
    </section>
    <section class="chart-table-panel">
      <div class="chart-table-heading">
        <div>
          <span>📅</span><strong>{{ getMonthName(selectedMonth) }} {{ selectedYear }}</strong>
        </div>
        <small>{{ monthlyData.length }} calendar days</small>
      </div>
      <div v-if="isLoading" class="gsk-empty-state">
        <span>⏳</span><strong>Loading results…</strong>
        <p>Fetching the latest saved chart.</p>
      </div>
      <div v-else-if="!gameHeaders.length" class="gsk-empty-state">
        <span>🎮</span><strong>No games available</strong>
        <p>There are no markets to display for this period.</p>
      </div>
      <div v-else class="table-responsive gsk-chart-scroll">
        <table
          class="table table-bordered table-hover align-middle text-center mb-0 gsk-chart-table"
        >
          <thead>
            <tr>
              <th class="chart-date-column">Date</th>
              <th v-for="game in gameHeaders" :key="game.id">{{ game.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in monthlyData"
              :key="row.date"
              :class="{ 'chart-today-row': row.is_today }"
            >
              <th class="chart-date-column">
                <span>{{ row.formatted_day }}</span
                ><small v-if="row.is_today">TODAY</small>
              </th>
              <td v-for="game in gameHeaders" :key="game.id">
                <span
                  v-if="
                    row.results[game.id] !== null &&
                    row.results[game.id] !== undefined &&
                    row.results[game.id] !== ''
                  "
                  class="chart-result"
                  :class="{
                    'chart-joda': isJodaResult(row.results[game.id]),
                    'chart-today-result': row.is_today,
                  }"
                  >{{ row.results[game.id] }}</span
                >
                <span v-else class="chart-missing">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer class="chart-legend">
        <span>🟨 Today's row</span><span>— Result not published</span
        ><span>✨ Highlighted Jodi</span>
      </footer>
    </section>
  </main>
</template>
<script setup>
import GskScreenHeader from '@/components/GskScreenHeader.vue'
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
  })),
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

    console.error('Monthly chart fetch failed:', error)
  } finally {
    isLoading.value = false
  }
}

const getLatestResult = (gameId) => {
  const todayRow = monthlyData.value.find((row) => row.is_today)

  if (todayRow?.results?.[gameId]) {
    return todayRow.results[gameId]
  }

  const game = games.value.find((item) => item.id === gameId)

  return game?.last_result || '--'
}

const hasTodayResult = (gameId) => {
  const todayRow = monthlyData.value.find((row) => row.is_today)

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
.gsk-screen {
  min-height: min-content;
  padding: 14px 13px calc(100px + env(safe-area-inset-bottom));
  background: #f4f7fb;
  color: #1e2c42;
}
.screen-banner {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 19px;
  border-radius: 19px;
  background: linear-gradient(130deg, #19365e, #315f9f);
  color: #fff;
}
.screen-banner-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #ffffff1b;
  font-size: 28px;
}
.screen-banner span {
  color: #cbd9eb;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.13em;
}
.screen-banner h1 {
  margin: 2px 0;
  color: #fff;
  font-size: 22px;
  font-weight: 900;
}
.screen-banner p {
  margin: 0;
  color: #d5e1f0;
  font-size: 11px;
}
.chart-filter-panel,
.chart-table-panel {
  margin-top: 13px;
  padding: 15px;
  border: 1px solid #e5ebf3;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 8px 22px #1b365d0b;
}
.screen-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
}
.screen-section-title > span {
  font-size: 25px;
}
.screen-section-title div {
  display: grid;
}
.screen-section-title strong {
  font-size: 13px;
}
.screen-section-title small {
  font-size: 10px;
  color: #7b899d;
}
.chart-filter-panel .form-label {
  font-size: 10px;
  font-weight: 800;
  color: #63738a;
}
.chart-market-strip {
  display: flex;
  gap: 9px;
  overflow: auto;
  padding: 13px 0 2px;
  scrollbar-width: none;
}
.chart-market-chip {
  display: grid;
  gap: 3px;
  min-width: 112px;
  padding: 11px;
  border: 1px solid #e4eaf2;
  border-radius: 13px;
  background: #fff;
}
.chart-market-chip small {
  overflow: hidden;
  color: #fdae03;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chart-market-chip strong {
  font-size: 20px;
  font-weight: 900;
  color: #244e83;
}
.chart-market-chip span {
  font-size: 8px;
  font-weight: 800;
}
.chart-table-panel {
  padding: 0;
  overflow: hidden;
}
.chart-table-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-bottom: 1px solid #e9eef5;
}
.chart-table-heading div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chart-table-heading div span {
  font-size: 21px;
}
.chart-table-heading strong {
  font-size: 13px;
}
.chart-table-heading small {
  color: #7b899d;
  font-size: 9px;
}
.gsk-chart-scroll {
  max-height: 65vh;
}
.gsk-chart-table {
  min-width: max-content;
  font-size: 11px;
}
.gsk-chart-table th,
.gsk-chart-table td {
  min-width: 72px;
  padding: 9px 7px !important;
}
.gsk-chart-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #edf3fb;
  color: #38516f;
  font-size: 14px;
}
.gsk-chart-table .chart-date-column {
  position: sticky;
  left: 0;
  z-index: 4;
  min-width: 55px;
  background: #f2f5f9;
  color: #40516a;
}
.gsk-chart-table tbody .chart-date-column {
  z-index: 2;
}
.chart-date-column span {
  display: block;
  font-weight: 900;
}
.chart-date-column small {
  display: block;
  color: #bf7840;
  font-size: 7px;
}
.chart-today-row td,
.chart-today-row .chart-date-column {
  background: #fff6df !important;
  color: #7b5010 !important;
}
.chart-result {
  display: inline-grid;
  place-items: center;
  min-width: 31px;
  min-height: 27px;
  border-radius: 7px;
  background: #edf3fc;
  color: green;
  font-weight: 900;
}
.chart-today-result {
  background: #ffe7ad;
  color: #7b5010;
}
.chart-joda {
  outline: 2px solid #50a77c;
  background: #e0f5e9;
  color: #17663f;
}
.chart-missing {
  color: #aeb8c5;
}
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid #e9eef5;
  color: #7b899d;
  font-size: 9px;
}
</style>
<style scoped>
.chart-shortcuts {
  display: flex;
  gap: 8px;
  margin: 12px 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.chart-shortcuts::-webkit-scrollbar {
  display: none;
}
.chart-shortcuts a {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 39px;
  padding: 0 12px;
  border: 1px solid #e2eaf3;
  border-radius: 12px;
  background: #fff;
  color: #31577f;
  text-decoration: none;
  font-size: 10px;
  font-weight: 850;
  white-space: nowrap;
}
.chart-filter-panel {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
}
.chart-filter-panel .form-select {
  min-height: 43px;
  border-radius: 11px;
}
.chart-market-strip {
  scroll-snap-type: x mandatory;
  padding-bottom: 15px;
}
.chart-market-chip {
  scroll-snap-align: start;
  min-width: 145px;
  border-radius: 14px;
}
.chart-table-panel {
  overflow: hidden;
  border-radius: 18px;
}
.gsk-chart-scroll {
  overscroll-behavior-x: contain;
}
.gsk-chart-table th,
.gsk-chart-table td {
  min-width: 72px;
}
.gsk-chart-table .chart-date-column {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 65px;
  background: #f0f4fa;
}
.gsk-chart-table thead .chart-date-column {
  z-index: 3;
}
.chart-legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 12px 12px;
  font-size: 9px;
  color: #74849a;
}
</style>

<style scoped>
.gsk-screen {
  min-height: min-content;
  padding: 15px 13px calc(13px + env(safe-area-inset-bottom));
  background: radial-gradient(circle at 100% 0, #08051c 0, #7171718a 20%), #213774;
  color: #f4f6ff;
}
.chart-shortcuts {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin: 13px 0;
}
.chart-shortcuts a {
  flex: 1;
  min-width: max-content;
  padding: 10px 12px;
  border: 1px solid #354363;
  border-radius: 12px;
  background: #131e35;
  color: #c8c0ff;
  font-size: 10px;
  font-weight: 850;
}
.chart-filter-panel,
.chart-table-panel {
  border: 1px solid #2e3d5e;
  border-radius: 18px;
  background: linear-gradient(155deg, #17223c, #101a2e);
  color: #f4f6ff;
  box-shadow: 0 12px 28px #00000024;
}
.screen-section-title strong {
  color: #fff;
}
.screen-section-title small {
  color: #91a0bf;
}
.screen-section-title > span {
  background: #292650;
  color: #c9beff;
}
.chart-filter-panel .form-label {
  color: #c6d1e8;
}
.chart-filter-panel .form-select {
  border-color: #39496c;
  background-color: #0b1428;
  color: #fff;
  color-scheme: dark;
}
.chart-market-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 1px;
  scroll-snap-type: x mandatory;
}
.chart-market-chip {
  min-width: 125px;
  border: 1px solid #2e3d5e;
  border-radius: 14px;
  background: #131e35;
  color: #f4f6ff;
  scroll-snap-align: start;
}
.chart-market-chip strong {
  color: #fff;
}
.chart-market-chip span {
  font-size: 8px;
}
.chart-table-heading {
  border-color: #2e3d5e;
  color: #f4f6ff;
}
.chart-table-heading strong {
  color: #fff;
}
.chart-table-heading small {
  color: #91a0bf;
}
.gsk-chart-scroll {
  border-color: #344361;
  background: #0b1428;
}
.gsk-chart-table {
  --bs-table-bg: #111a2e;
  --bs-table-color: #dce4f6;
  --bs-table-border-color: #344361;
  --bs-table-hover-bg: #1c2b49;
  --bs-table-hover-color: #fff;
  color: #dce4f6;
}

.gsk-chart-table tbody th {
  background: #182541;
  color: #c8d3e9;
}
.gsk-chart-table tbody td {
  color: #f4f6ff;
}
.chart-date-column {
  background: #1b2947 !important;
  color: #d2caff !important;
}
.chart-missing {
  color: #7888aa;
}
.chart-today-row th,
.chart-today-row td {
  background: #20234a !important;
}
</style>
