<template>
  <main class="gsk-screen">
    <GskScreenHeader emoji="📜" kicker="YOUR ACTIVITY" title="Play history" subtitle="Review your slips and daily totals." />
    <section class="history-date-panel"><div><strong>🗓️ Select date</strong><small>Choose a day to view your activity</small></div><input v-model="selectedDate" type="date" :max="todayDateStr" class="form-control" @change="fetchPlayHistory(1)"><button v-if="selectedDate!==todayDateStr" class="btn btn-sm btn-outline-primary rounded-pill" @click="resetToToday">Today</button></section>
    <section class="history-stat-grid">
      <article><span>💸</span><small>Total spent</small><strong>₹{{ formatCurrency(dailyStats.totalSpent) }}</strong></article>
      <article><span>🎟️</span><small>Play slips</small><strong>{{ dailyStats.totalSlips }}</strong></article>
      <article><span>🏆</span><small>Total winnings</small><strong>₹{{ formatCurrency(dailyStats.totalWon) }}</strong></article>
    </section>
    <div class="history-list-heading"><div><span class="gsk-page-kicker">YOUR SLIP LEDGER</span><h2>Recent plays</h2></div><small>{{ pagination.total }} records</small></div>
    <div v-if="isLoading" class="gsk-empty-state"><span>⏳</span><strong>Loading play history…</strong></div>
    <div v-else-if="history.length===0" class="gsk-empty-state"><span>🎟️</span><strong>No plays found for this date</strong><p>Try another date to review your previous activity.</p><router-link to="/dashboard" class="btn btn-primary rounded-pill mt-2">Explore markets</router-link></div>
    <section v-else class="history-slip-list">
      <article v-for="slip in history" :key="slip.id" class="history-slip">
        <div class="slip-top"><div><span class="slip-market">{{ slip.game_name }}</span><span class="slip-mode">{{ getModeLabel(slip.mode) }}</span></div>
          <span class="slip-status" :class="slip.status==='won'?'won':slip.status==='running'?'running':slip.status==='loss'||slip.status==='lost'?'lost':'closed'">
            {{ slip.status==='won'?'🏆 WON':slip.status==='running'?'⏳ RUNNING':slip.status==='loss'||slip.status==='lost'?'↘ LOST':'🔒 CLOSED' }}
          </span></div>
        <div class="slip-main"><div><small>Slip reference</small><strong>#{{ slip.slip_code }}</strong></div><div><small>Placed at</small><strong>{{ formatTime(slip.created_at) }}</strong></div><div><small>Selections</small><strong>{{ slip.total_bets_count }}</strong></div></div>
        <div class="slip-bottom"><div><small>Total amount</small><strong>₹{{ formatCurrency(slip.total_amount) }}</strong></div><div v-if="slip.winning_number"><small>Winning number</small><strong class="text-success">{{ slip.winning_number }}</strong></div>
          <button type="button" class="btn btn-sm btn-outline-primary rounded-pill" @click="toggleSlipDetails(slip.id)">{{ activeExpandedId===slip.id?'Hide details':'View details' }} {{ activeExpandedId===slip.id?'↑':'↓' }}</button></div>
        <div v-if="activeExpandedId===slip.id" class="slip-detail-panel">
          <div v-if="slip.mode==='single'" class="slip-bet-grid"><div v-for="(amount,number) in slip.single_bets" :key="number"><span>{{ number }}</span><b>₹{{ formatCurrency(amount) }}</b></div></div>
          <div v-else-if="slip.mode==='harup'" class="slip-bet-grid"><div v-for="(amount,digit) in slip.harup_bets?.ander||{}" :key="'a'+digit"><span>Ander {{ digit }}</span><b>₹{{ formatCurrency(amount) }}</b></div><div v-for="(amount,digit) in slip.harup_bets?.bahar||{}" :key="'b'+digit"><span>Bahar {{ digit }}</span><b>₹{{ formatCurrency(amount) }}</b></div></div>
          <div v-else-if="slip.mode==='crossing'" class="slip-bet-grid"><div v-for="digit in slip.crossing_digits||[]" :key="digit"><span>Digit {{ digit }}</span><b>₹{{ formatCurrency(slip.crossing_amount_per_jodi) }}</b></div></div>
          <p v-else class="small text-secondary mb-0">Mode: {{ slip.mode }} · {{ slip.total_bets_count }} selections.</p>
        </div>
      </article>
      <nav v-if="pagination.last_page>1" class="history-pagination" aria-label="Play history pages"><button :disabled="pagination.current_page===1" @click="goToPage(pagination.current_page-1)">← Previous</button><button v-for="page in visiblePages" :key="page" :class="{active:page===pagination.current_page}" @click="goToPage(page)">{{ page }}</button><button :disabled="pagination.current_page===pagination.last_page" @click="goToPage(pagination.current_page+1)">Next →</button></nav>
    </section>
  </main>
</template>
<script setup>
import GskScreenHeader from '@/components/GskScreenHeader.vue'
import { ref, computed, onMounted } from 'vue'
import api from '@/plugins/axios'

const getTodayString = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const todayDateStr = getTodayString()
const selectedDate = ref(todayDateStr)

const isLoading = ref(false)
const activeExpandedId = ref(null)

const history = ref([])

const dailyStats = ref({
  totalSlips: 0,
  totalSpent: 0,
  totalWon: 0,
})

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: 0,
  to: 0,
})

const visiblePages = computed(() => {
  const current = pagination.value.current_page
  const last = pagination.value.last_page

  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1)
  }

  let start = Math.max(1, current - 2)
  let end = Math.min(last, current + 2)

  if (current <= 3) {
    start = 1
    end = 5
  }

  if (current >= last - 2) {
    start = last - 4
    end = last
  }

  return Array.from(
    { length: end - start + 1 },
    (_, index) => start + index
  )
})

const fetchPlayHistory = async (page = 1) => {
  if (page < 1) {
    return
  }

  if (
    pagination.value.last_page > 0 &&
    page > pagination.value.last_page
  ) {
    return
  }

  isLoading.value = true
  activeExpandedId.value = null

  try {
    const params = {
      page,
      per_page: 50,
    }

    // Let the backend apply each game's current business date for today's history.
    if (selectedDate.value !== todayDateStr) {
      params.date = selectedDate.value
    }

    const response = await api.get('/play-history', { params })

    if (response.data?.success) {
      const data = response.data.data

      history.value = data.slips || []

      dailyStats.value = {
        totalSlips: data.stats?.total_slips || 0,
        totalSpent: Number(data.stats?.total_spent || 0),
        totalWon: Number(data.stats?.total_won || 0),
      }

      pagination.value = {
        current_page: data.pagination?.current_page || 1,
        last_page: data.pagination?.last_page || 1,
        per_page: data.pagination?.per_page || 10,
        total: data.pagination?.total || 0,
        from: data.pagination?.from || 0,
        to: data.pagination?.to || 0,
      }
    } else {
      history.value = []

      dailyStats.value = {
        totalSlips: 0,
        totalSpent: 0,
        totalWon: 0,
      }
    }
  } catch (error) {
    console.error('Play history loading failed:', error)

    history.value = []

    dailyStats.value = {
      totalSlips: 0,
      totalSpent: 0,
      totalWon: 0,
    }
  } finally {
    isLoading.value = false
  }
}

const goToPage = (page) => {
  if (
    page < 1 ||
    page > pagination.value.last_page ||
    page === pagination.value.current_page
  ) {
    return
  }

  fetchPlayHistory(page)
}

const toggleSlipDetails = (id) => {
  activeExpandedId.value =
    activeExpandedId.value === id ? null : id
}

const resetToToday = () => {
  selectedDate.value = todayDateStr
  fetchPlayHistory(1)
}

const getModeLabel = (mode) => {
  switch (mode) {
    case 'single':
      return '🎯 Jodi'

    case 'harup':
      return '🎲 Harup'

    case 'crossing':
      return '🔀 Crossing'

    default:
      return mode
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) {
    return ''
  }

  return new Date(dateTimeStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

onMounted(() => {
  fetchPlayHistory(1)
})
</script>
<style scoped>
.gsk-screen{min-height:100dvh;padding:14px 13px calc(100px + env(safe-area-inset-bottom));background:#f4f7fb;color:#1e2c42}.screen-banner{display:flex;align-items:center;gap:13px;padding:19px;border-radius:19px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff}.screen-banner-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#ffffff1b;font-size:28px}.screen-banner span{color:#cbd9eb;font-size:9px;font-weight:900;letter-spacing:.13em}.screen-banner h1{margin:2px 0;color:#fff;font-size:22px;font-weight:900}.screen-banner p{margin:0;color:#d5e1f0;font-size:11px}.history-date-panel{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:13px;padding:13px;border:1px solid #e5ebf3;border-radius:15px;background:#fff}.history-date-panel>div{display:grid}.history-date-panel strong{font-size:12px}.history-date-panel small{font-size:9px;color:#7b899d}.history-date-panel input{grid-column:1/-1}.history-date-panel button{grid-column:2;grid-row:2}.history-stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 21px}.history-stat-grid article{display:grid;gap:3px;padding:11px 9px;border:1px solid #e5ebf3;border-radius:14px;background:#fff}.history-stat-grid article>span{font-size:20px}.history-stat-grid small{color:#7b899d;font-size:9px}.history-stat-grid strong{font-size:12px;font-weight:900;overflow-wrap:anywhere}.history-list-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:10px}.history-list-heading h2{margin:2px 0 0;font-size:17px;font-weight:900}.history-list-heading>small{color:#8290a3;font-size:10px}.history-slip-list{display:grid;gap:10px}.history-slip{overflow:hidden;border:1px solid #e5ebf3;border-radius:16px;background:#fff;box-shadow:0 6px 18px #1b365d0a}.slip-top,.slip-main,.slip-bottom{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:12px 13px}.slip-top{border-bottom:1px solid #edf1f6}.slip-top>div{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.slip-market{font-size:12px;font-weight:900}.slip-mode{padding:4px 7px;border-radius:7px;background:#edf3fc;color:#315f9f;font-size:9px;font-weight:800}.slip-status{padding:5px 8px;border-radius:30px;font-size:8px;font-weight:900}.slip-status.won{background:#e3f5eb;color:#217b54}.slip-status.running{background:#fff2d8;color:#936b21}.slip-status.lost,.slip-status.closed{background:#f0f2f5;color:#78869a}.slip-main{justify-content:flex-start;background:#f8fafd}.slip-main>div,.slip-bottom>div{display:grid;gap:2px;min-width:0;flex:1}.slip-main small,.slip-bottom small{color:#8a97a9;font-size:8px}.slip-main strong,.slip-bottom strong{font-size:10px;font-weight:850;overflow-wrap:anywhere}.slip-bottom{border-top:1px solid #edf1f6}.slip-bottom button{white-space:nowrap;font-size:9px}.slip-detail-panel{padding:12px;border-top:1px solid #e8edf4;background:#f8fafd}.slip-bet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.slip-bet-grid>div{display:flex;justify-content:space-between;gap:6px;padding:8px;border:1px solid #e5ebf3;border-radius:9px;background:#fff;font-size:10px}.history-pagination{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;padding:14px 0}.history-pagination button{min-width:34px;min-height:34px;padding:5px 9px;border:1px solid #e1e8f1;border-radius:9px;background:#fff;color:#40516a;font-size:10px}.history-pagination button.active{background:#315f9f;color:#fff;border-color:#315f9f}.history-pagination button:disabled{opacity:.4}
@media(min-width:720px){.gsk-screen{max-width:760px;margin:0 auto}.history-stat-grid article{padding:14px}.slip-bet-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>