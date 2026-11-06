<template>
  <main class="gsk-screen">
    <GskScreenHeader emoji="🗃️" kicker="YOUR MONEY" title="My wallet" subtitle="Balance, payments and transactions." />

    <section class="wallet-balance-card">
      <div class="wallet-balance-head"><span>AVAILABLE BALANCE</span><button type="button" @click="isBalanceVisible=!isBalanceVisible">{{ isBalanceVisible?'🙈 Hide':'👁️ Show' }}</button></div>
      <strong class="wallet-balance-amount">₹{{ isBalanceVisible?formatCurrency(walletBalance):'••••••' }}</strong>
      <div class="wallet-balance-actions"><router-link to="/wallet/add">➕ Add money</router-link><router-link to="/wallet/withdraw">🏦 Withdraw</router-link></div>
    </section>
    <section class="wallet-metrics">
      <article><span>📥</span><small>Cash added</small><strong>₹{{ formatCurrency(wallet.totalCredited) }}</strong></article>
      <article><span>📤</span><small>Withdrawn</small><strong>₹{{ formatCurrency(wallet.totalDebited) }}</strong></article>
      <article><span>🎮</span><small>Played</small><strong>₹{{ formatCurrency(wallet.totalPlayedBet) }}</strong></article>
      <article><span>🏆</span><small>Total wins</small><strong>₹{{ formatCurrency(wallet.totalWin) }}</strong></article>
    </section>
    <section id="wallet-transactions" class="wallet-activity">
      <div class="wallet-activity-heading"><div><span class="gsk-page-kicker">MONEY MOVEMENT</span><h2>Transactions</h2></div><small>{{ totalTransactions }} records</small></div>
      <div class="wallet-filter-tabs"><button v-for="type in transactionFilters" :key="type" type="button" :class="{active:filterType===type}" @click="changeFilter(type)">{{ type==='all'?'All':type==='credit'?'📥 Credits':'📤 Debits' }}</button></div>
      <div v-if="isLoading" class="gsk-empty-state"><span>⏳</span><strong>Loading transactions…</strong></div>
      <div v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}<button class="btn btn-sm btn-outline-danger ms-2" @click="loadWallet">Retry</button></div>
      <div v-else-if="transactions.length" class="wallet-transaction-list">
        <article v-for="item in transactions" :key="item.id" class="wallet-transaction">
          <span class="transaction-symbol">{{ item.description?.toLowerCase().includes('winning')?'🏆':item.type==='credit'?'📥':'📤' }}</span>
          <div class="transaction-copy"><strong>{{ item.description||'Wallet transaction' }}</strong><small>{{ item.txn_id }} · {{ formatDate(item.created_at) }}</small><span class="transaction-status" :class="getStatusBadge(item.status)">{{ item.status }}</span></div>
          <strong class="transaction-amount" :class="item.type==='credit'?'credit':'debit'">{{ item.type==='credit'?'+':'−' }}₹{{ formatCurrency(item.amount) }}</strong>
        </article>
      </div>
      <div v-else class="gsk-empty-state"><span>🧾</span><strong>No transactions found</strong><p>Your wallet activity will appear here.</p></div>
      <div v-if="!isLoading&&totalPages>1" class="wallet-pagination"><small>{{ paginationFrom }}–{{ paginationTo }} of {{ totalTransactions }}</small><div><button :disabled="currentPage===1" @click="goToPage(currentPage-1)">←</button><button v-for="page in visiblePages" :key="page" :class="{active:currentPage===page}" @click="goToPage(page)">{{ page }}</button><button :disabled="currentPage===totalPages" @click="goToPage(currentPage+1)">→</button></div></div>
    </section>
  </main>
</template>
<script setup>
import GskScreenHeader from '@/components/GskScreenHeader.vue'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/utils/auth'
import api from '@/plugins/axios'


const authStore = useAuthStore()
const isBalanceVisible = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')
const transactionFilters = ['all', 'credit', 'debit']
const filterType = ref('all')
const currentPage = ref(1)
const perPage = ref(15)
const totalPages = ref(1)
const totalTransactions = ref(0)
const paginationFrom = ref(0)
const paginationTo = ref(0)
const transactions = ref([])

const wallet = ref({
  balance: 0,
  totalCredited: 0,
  totalDebited: 0,
  totalPlayedBet: 0,
  totalWin: 0,
})

const walletBalance = computed(() => {
  return Number(wallet.value.balance ?? authStore.user?.balance ?? 0)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }
  let start = Math.max(current - 2, 2)
  let end = Math.min(current + 2, total - 1)
  if (current <= 3) {
    start = 2
    end = 5
  }
  if (current >= total - 2) {
    start = total - 4
    end = total - 1
  }
  const pages = []
  for (let page = start; page <= end; page++) {
    pages.push(page)
  }
  return pages
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}


const formatDate = (dateStr) => {
  if (!dateStr) {
    return '--'
  }
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusBadge = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'success':
    case 'successful':
    case 'completed':
      return 'bg-success-subtle text-success'
    case 'pending':
      return 'bg-warning-subtle text-warning'
    case 'failed':
      return 'bg-danger-subtle text-danger'
    case 'rejected':
      return 'bg-danger-subtle text-danger'
    default:
      return 'bg-secondary-subtle text-secondary'
  }
}

const loadWallet = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await api.get('/wallet', {
      params: {
        page: currentPage.value,
        per_page: perPage.value,
        type: filterType.value === 'all' ? undefined : filterType.value,
      },
    })
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Unable to load wallet.')
    }
    const data = response.data.data || {}
    wallet.value = {
      balance: Number(data.balance || 0),
      totalCredited: Number(data.summary?.cash_added || 0),
      totalDebited: Number(data.summary?.withdrawn || 0),
      totalPlayedBet: Number(data.summary?.played_bet || 0),
      totalWin: Number(data.summary?.total_win || 0),
    }
    const pagination = data.transactions || {}
    transactions.value = pagination.data || []
    currentPage.value = Number(pagination.current_page || currentPage.value)
    totalPages.value = Number(pagination.last_page || 1)
    perPage.value = Number(pagination.per_page || perPage.value)
    totalTransactions.value = Number(pagination.total || 0)
    paginationFrom.value = Number(pagination.from || 0)
    paginationTo.value = Number(pagination.to || 0)
    if (authStore.user) {
      authStore.user.balance = Number(data.balance || 0)
    }
  } catch (error) {
    console.error('Wallet loading failed:', error)
    errorMessage.value = error.response?.data?.message || error.message || 'Unable to load wallet.'
  } finally {
    isLoading.value = false
  }
}

const changeFilter = (type) => {
  if (filterType.value === type) {
    return
  }
  filterType.value = type
  currentPage.value = 1
  loadWallet()
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value || isLoading.value) {
    return
  }
  currentPage.value = page
  loadWallet()
}

onMounted(() => {
  loadWallet()
})
</script><style scoped>
.gsk-screen{min-height:min-content;padding:14px 13px calc(100px + env(safe-area-inset-bottom));background:#f4f7fb;color:#1e2c42}.screen-banner{display:flex;align-items:center;gap:13px;padding:19px;border-radius:19px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff}.screen-banner-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#ffffff1b;font-size:28px}.screen-banner span{color:#cbd9eb;font-size:9px;font-weight:900;letter-spacing:.13em}.screen-banner h1{margin:2px 0;color:#fff;font-size:22px;font-weight:900}.screen-banner p{margin:0;color:#d5e1f0;font-size:11px}.wallet-balance-card{margin-top:13px;padding:19px;border-radius:19px;background:linear-gradient(130deg,#1b365d,#315f9f);color:#fff;box-shadow:0 12px 26px #1b365d25}.wallet-balance-head{display:flex;justify-content:space-between;align-items:center;color:#d3e0f0;font-size:9px;font-weight:850;letter-spacing:.1em}.wallet-balance-head button{border:1px solid #ffffff35;border-radius:30px;background:#ffffff15;color:#fff;padding:5px 9px;font-size:9px}.wallet-balance-amount{display:block;margin:9px 0 17px;color:#fff;font-size:36px;font-weight:950;letter-spacing:-.03em}.wallet-balance-actions{display:flex;gap:9px}.wallet-balance-actions a{flex:1;padding:11px;border-radius:11px;background:#ffffffeb;color:#244e83;text-align:center;font-size:11px;font-weight:850}.wallet-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:13px 0 21px}.wallet-metrics article{display:grid;grid-template-columns:35px 1fr;grid-template-rows:auto auto;align-items:center;gap:1px 8px;padding:12px;border:1px solid #e5ebf3;border-radius:14px;background:#fff}.wallet-metrics article>span{grid-row:1/3;font-size:23px}.wallet-metrics small{color:#7b899d;font-size:9px}.wallet-metrics strong{font-size:13px;font-weight:900}.wallet-activity{padding:14px;border:1px solid #e5ebf3;border-radius:17px;background:#fff}.wallet-activity-heading{display:flex;justify-content:space-between;align-items:end}.wallet-activity-heading h2{margin:2px 0 0;font-size:17px;font-weight:900}.wallet-activity-heading>small{color:#8390a2;font-size:9px}.wallet-filter-tabs{display:flex;gap:6px;margin:13px 0;padding:4px;border-radius:12px;background:#f1f4f8}.wallet-filter-tabs button{flex:1;min-height:36px;border:0;border-radius:9px;background:transparent;color:#728097;font-size:10px;font-weight:800}.wallet-filter-tabs button.active{background:#fff;color:#28558f;box-shadow:0 2px 7px #1b365d13}.wallet-transaction-list{display:grid}.wallet-transaction{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #edf1f6}.wallet-transaction:last-child{border-bottom:0}.transaction-symbol{display:grid;place-items:center;width:39px;height:39px;flex:0 0 39px;border-radius:12px;background:#edf3fc;font-size:21px}.transaction-copy{display:grid;flex:1;min-width:0;gap:2px}.transaction-copy>strong{overflow:hidden;color:#293b55;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.transaction-copy small{overflow:hidden;color:#8996a8;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.transaction-status{justify-self:start;padding:3px 7px;border-radius:20px;font-size:8px;font-weight:800}.transaction-amount{font-size:11px;white-space:nowrap}.transaction-amount.credit{color:#21865e}.transaction-amount.debit{color:#c75b61}.wallet-pagination{display:grid;justify-items:center;gap:8px;padding-top:14px;color:#7b899d;font-size:9px}.wallet-pagination>div{display:flex;gap:5px}.wallet-pagination button{min-width:30px;min-height:30px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#42536c;font-size:10px}.wallet-pagination button.active{background:#315f9f;color:#fff}.wallet-pagination button:disabled{opacity:.4}
@media(min-width:720px){.gsk-screen{max-width:760px;margin:0 auto}.wallet-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}}
</style>
<style scoped>
.wallet-quick-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:13px 0}.wallet-quick-actions>a{display:grid;justify-items:start;gap:4px;min-width:0;padding:12px 10px;border:1px solid #e3eaf3;border-radius:14px;background:#fff;color:#29415f;text-decoration:none;transition:transform .16s,border-color .16s}.wallet-quick-actions>a:active{transform:scale(.97);border-color:#315f9f}.wallet-quick-actions>a>span{font-size:20px}.wallet-quick-actions strong{font-size:10px;font-weight:900}.wallet-quick-actions small{color:#8795a8;font-size:8px}.wallet-activity{scroll-margin-top:16px}.wallet-transaction{transition:background .15s}.wallet-transaction:active{background:#f3f7fc}
@media(min-width:620px){.wallet-quick-actions{gap:12px}.wallet-quick-actions>a{padding:15px}}
@media(prefers-reduced-motion:reduce){.wallet-quick-actions>a{transition:none}}
</style>

<style scoped>
.gsk-screen{min-height:min-content;padding:15px 13px calc(13px + env(safe-area-inset-bottom));background:radial-gradient(circle at 100% 0, #ffffff 0, #384aff8f 10%), #028214;color:#f4f6ff}
.wallet-quick-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0}
.wallet-quick-actions>a{display:grid;justify-items:center;gap:4px;min-width:0;padding:12px 6px;border:1px solid #34415f;border-radius:15px;background:#131e35;color:#e7ebff;text-align:center;box-shadow:0 8px 20px #0000001c}
.wallet-quick-actions>a>span{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:#292550;color:#d2caff;font-size:20px}
.wallet-quick-actions>a strong{font-size:10px;font-weight:900}
.wallet-quick-actions>a small{color:#91a0bf;font-size:8px}
.wallet-balance-card{position:relative;overflow:hidden;margin-top:13px;padding:21px;border:1px solid #8175db66;border-radius:22px;background:radial-gradient(circle at 92% 0,#8b72ff55 0,transparent 36%),linear-gradient(125deg,#262252,#173d72 70%,#124c68);color:#fff;box-shadow:0 18px 42px #05081788}
.wallet-balance-card:after{position:absolute;right:-30px;bottom:-75px;width:190px;height:190px;border:1px solid #ffffff1a;border-radius:50%;content:"";box-shadow:0 0 0 22px #ffffff08,0 0 0 45px #ffffff05}
.wallet-balance-head{position:relative;z-index:1;color:#d3d3ff}
.wallet-balance-head button{border:1px solid #ffffff35;border-radius:30px;background:#ffffff14;color:#fff}
.wallet-balance-amount{position:relative;z-index:1;color:#fff;font-size:clamp(32px,9vw,42px);font-weight:950;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.wallet-balance-actions{position:relative;z-index:1}
.wallet-balance-actions a{border:1px solid #ffffff2b;background:#ffffffed;color:#28316b;box-shadow:0 5px 14px #0000001c}
.wallet-metrics{gap:9px;margin:13px 0 20px}
.wallet-metrics article{border-color:#293754;border-radius:15px;background:#121b31;color:#f4f6ff;box-shadow:0 8px 22px #00000020}
.wallet-metrics article>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#25264c}
.wallet-metrics small{color:#91a0bf}
.wallet-metrics strong{color:#f4f6ff;font-size:14px;font-variant-numeric:tabular-nums}
.wallet-activity{padding:15px;border:1px solid #293754;border-radius:19px;background:#111a2e;color:#f4f6ff;box-shadow:0 14px 32px #00000024}
.wallet-activity-heading h2{color:#fff;font-size:19px;font-weight:950}
.wallet-activity-heading>small{color:#91a0bf}
.wallet-filter-tabs{border:1px solid #2d3b59;background:#0a1326}
.wallet-filter-tabs button{color:#8f9fbe}
.wallet-filter-tabs button.active{background:linear-gradient(110deg,#765cf5,#326ce5);color:#fff;box-shadow:0 5px 14px #4f5ee633}
.wallet-transaction{border-color:#283552}
.transaction-symbol{background:#25264c;color:#d0c7ff}
.transaction-copy>strong{color:#f1f4ff}
.transaction-copy small{color:#8393b5}
.transaction-status{width:max-content;padding:4px 7px;border:1px solid #39496c;border-radius:30px;background:#1a2946;color:#b9c8e4;font-size:8px;font-weight:850}
.transaction-status.bg-success-subtle{border-color:#286b5a;background:#123a34!important;color:#76e4bf!important}
.transaction-status.bg-warning-subtle{border-color:#806333;background:#3b301d!important;color:#ffd17b!important}
.transaction-status.bg-danger-subtle{border-color:#824252;background:#3c202f!important;color:#ff9eae!important}
.transaction-status.bg-secondary-subtle{border-color:#405174;background:#1a2946!important;color:#b9c8e4!important}
.transaction-amount{font-variant-numeric:tabular-nums}
.transaction-amount.credit{color:#5fe0b0}
.transaction-amount.debit{color:#ff8b9e}
.wallet-pagination{border-color:#283552}
.wallet-pagination small{color:#91a0bf}
.wallet-pagination button{border-color:#39496c;background:#182541;color:#c6d1e8}
.wallet-pagination button.active{border-color:#8b72ff;background:#765cf5;color:#fff}
.wallet-pagination button:disabled{opacity:.4}
@media(max-width:360px){.wallet-quick-actions>a{padding:10px 4px}.wallet-quick-actions>a strong{font-size:9px}.wallet-activity{padding:12px}}
</style>
