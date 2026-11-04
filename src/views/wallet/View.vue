<template>
  <main class="content-area premium-page premium-wallet-page">
    <section class="wallet-balance-hero">
      <div class="wallet-main-balance">
        <div>
          <span class="mx-1">₹</span>{{ isBalanceVisible ? formatCurrency(walletBalance) : '••••••' }}
        </div>
        <div class="wallet-balance-top">
          <div class="d-flex">
            <button type="button" @click="isBalanceVisible = !isBalanceVisible"
              :aria-label="isBalanceVisible ? 'Hide balance' : 'Show balance'">
              <i :class="isBalanceVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"> </i>
            </button>
            <button type="button" class="wallet-refresh mx-2" :disabled="isLoading" @click="loadWallet"
              aria-label="Refresh wallet">
              <i class="bi bi-arrow-clockwise" :class="{ spinning: isLoading }"> </i>
            </button>
          </div>
        </div>
      </div>
      <div class="wallet-summary-grid">
        <div>
          <span class="wallet-summary-icon">
            <i class="bi bi-arrow-down-left"> </i>
          </span>
          <span>
            <small>Cash added</small>
            <strong>+₹{{ formatCurrency(wallet.totalCredited) }}</strong>
          </span>
        </div>
        <div>
          <span class="wallet-summary-icon">
            <i class="bi bi-arrow-up-right"> </i>
          </span>
          <span>
            <small>Withdrawn</small>
            <strong>−₹{{ formatCurrency(wallet.totalDebited) }}</strong>
          </span>
        </div>
        <div>
          <span class="wallet-summary-icon">
            <i class="bi bi-controller"> </i>
          </span>
          <span>
            <small>Bet played</small>
            <strong>₹{{ formatCurrency(wallet.totalPlayedBet) }}</strong>
          </span>
        </div>
        <div>
          <span class="wallet-summary-icon">
            <i class="bi bi-trophy"> </i>
          </span>
          <span>
            <small>Total winnings</small>
            <strong>+₹{{ formatCurrency(wallet.totalWin) }}</strong>
          </span>
        </div>
      </div>
    </section>
    <section class="wallet-action-grid">
      <router-link to="/wallet/add" class="wallet-action-card add">
        <span>
          <i class="bi bi-plus-lg"> </i>
        </span>
        <div class="btn border-danger p-1">
          <strong class="btn">Add money</strong>
        </div>
      </router-link>
      <router-link to="/wallet/withdraw" class="wallet-action-card">
        <span>
          <i class="bi bi-bank"> </i>
        </span>
        <div class="btn border-danger p-1">
          <strong class="btn">Withdraw</strong><br>
        </div>
      </router-link>
    </section>
    <section class="wallet-history-panel">
      <div class="wallet-history-heading">
        <div>
          <span class="wallet-eyebrow">YOUR ACTIVITY</span>
          <h2>Transactions</h2>
          <p>Track credits, debits and status.</p>
        </div>
        <span class="wallet-history-count">{{ totalTransactions }} total</span>
      </div>
      <div class="wallet-filter-tabs" role="group" aria-label="Filter transactions">
        <button v-for="type in transactionFilters" :key="type" type="button" :class="{ active: filterType === type }"
          @click="changeFilter(type)">
          {{ type }}
        </button>
      </div>
      <div v-if="isLoading" class="wallet-state">
        <span class="spinner-border"> </span>
        <p>Loading transactions…</p>
      </div>
      <div v-else-if="errorMessage" class="wallet-state wallet-error" role="alert">
        <i class="bi bi-cloud-slash"> </i>
        <p>{{ errorMessage }}</p>
        <button class="btn btn-primary" @click="loadWallet">Try again</button>
      </div>
      <div v-else-if="transactions.length" class="wallet-transactions">
        <article v-for="item in transactions" :key="item.id" class="wallet-transaction">
          <span class="wallet-transaction-icon" :class="item.type === 'credit' ? 'credit' : 'debit'">
            <i :class="item.description?.toLowerCase().includes('winning')
              ? 'bi bi-trophy-fill'
              : item.type === 'credit'
                ? 'bi bi-arrow-down-left'
                : 'bi bi-arrow-up-right'
              ">
            </i>
          </span>
          <div class="wallet-transaction-info">
            <strong>{{ item.description || 'Wallet Transaction' }}</strong>
            <small>{{ item.txn_id || 'Transaction' }} · {{ formatDate(item.created_at) }}</small>
            <span class="wallet-status" :class="getStatusBadge(item.status)">{{
              item.status || 'Processed'
              }}</span>
          </div>
          <strong class="wallet-transaction-amount" :class="item.type === 'credit' ? 'positive' : 'negative'">{{
            item.type === 'credit' ? '+' : '−' }}₹{{ formatCurrency(item.amount) }}</strong>
        </article>
      </div>
      <div v-else class="wallet-state">
        <i class="bi bi-receipt"> </i>
        <strong>No transactions yet</strong>
        <p>Your wallet activity will appear here.</p>
        <router-link to="/wallet/add" class="btn btn-primary">Add money</router-link>
      </div>
      <div v-if="!isLoading && totalPages > 0" class="wallet-pagination">
        <small>{{
          totalTransactions > 0
            ? paginationFrom + '–' + paginationTo + ' of ' + totalTransactions
            : 'No transactions'
        }}
        </small>
        <div>
          <button type="button" :disabled="currentPage <= 1 || isLoading" @click="goToPage(currentPage - 1)"
            aria-label="Previous page">
            <i class="bi bi-chevron-left"> </i>
          </button>
          <button v-for="page in visiblePages" :key="page" type="button" :class="{ active: page === currentPage }"
            @click="goToPage(page)">
            {{ page }}
          </button>
          <button type="button" :disabled="currentPage >= totalPages || isLoading" @click="goToPage(currentPage + 1)"
            aria-label="Next page">
            <i class="bi bi-chevron-right"> </i>
          </button>
        </div>
      </div>
    </section>
    <footer class="wallet-page-footer">
      <i class="bi bi-shield-lock me-1"> </i>Your wallet information is private and protected.
    </footer>
  </main>
</template>
<script setup>
defineOptions({ name: 'WalletView' })
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
</script>
<style scoped>
.premium-wallet-page {
  padding-top: 24px;
}

.wallet-page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.wallet-eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0c9c78;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.13em;
}

.wallet-page-heading h1 {
  margin: 7px 0 4px;
  color: #033c07;
  font-size: 31px;
  font-weight: 850;
  letter-spacing: -0.05em;
}

.wallet-page-heading p,
.wallet-history-heading p {
  margin: 0;
  color: #8792a4;
  font-size: 11px;
}

.wallet-refresh {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e1e7f0;
  border-radius: 13px;
  background: #fff;
  color: #4b5571;
  font-size: 17px;
}

.wallet-refresh .spinning {
  animation: wallet-spin 0.8s linear infinite;
}

.wallet-balance-hero {
  padding: 10px 20px;
  border-radius: 23px;
  background: #033c07;
  color: #fff;
  box-shadow: 0 14px 32px rgba(23, 27, 53, 0.16);
}

.wallet-balance-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #b8c4d9;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.wallet-balance-top button {
  display: grid;
  place-items: center;
  width: 33px;
  height: 33px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.wallet-main-balance {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(34px, 8vw, 43px);
  font-weight: 800;
  letter-spacing: -0.05em;
  overflow-wrap: anywhere;
}

.wallet-main-balance span {
  color: #f5c65d;
  font-size: 22px;
}

.wallet-balance-caption {
  margin-top: 2px;
  color: #aebbd1;
  font-size: 10px;
}

.wallet-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-top: 10px;
}

.wallet-summary-grid>div {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.06);
}

.wallet-summary-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.wallet-summary-grid>div>span:last-child {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.wallet-summary-grid small {
  color: #e1e8f4;
  font-size: 9px;
}

.wallet-summary-grid strong {
  overflow: hidden;
  color: #fff;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallet-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 25px;
}

.wallet-action-card {
  position: relative;
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 5px;
  padding: 15px;
  border: 1px solid #e2e8f1;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(23, 27, 53, 0.035);
  justify-content: center;
}

.wallet-action-card>span {
  display: grid;
  place-items: center;
  width: 35px;
  height: 35px;
  margin-bottom: 4px;
  border-radius: 11px;
  background: #edf2ff;
  color: #343d68;
  font-size: 17px;
}

.wallet-action-card.add>span {
  background: #e3faf1;
  color: #0b9a75;
}

.wallet-action-card strong {
  color: #222946;
  font-size: 12px;
}

.wallet-action-card small {
  color: #8b96a7;
  font-size: 9px;
}

.wallet-action-arrow {
  position: absolute;
  top: 15px;
  right: 14px;
  color: #a0aaba;
  font-size: 12px;
}

.wallet-history-panel {
  overflow: hidden;
  border: 1px solid #e3e9f2;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 5px 18px rgba(23, 27, 53, 0.04);
}

.wallet-history-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  padding: 17px 16px 14px;
}

.wallet-history-heading h2 {
  margin: 5px 0 3px;
  color: #202642;
  font-size: 20px;
  font-weight: 850;
}

.wallet-history-count {
  flex: 0 0 auto;
  padding: 6px 8px;
  border-radius: 9px;
  background: #f1f4f9;
  color: #778399;
  font-size: 9px;
  font-weight: 850;
}

.wallet-filter-tabs {
  display: flex;
  gap: 5px;
  margin: 0 16px 8px;
  padding: 4px;
  border-radius: 12px;
  background: #f2f5f9;
}

.wallet-filter-tabs button {
  flex: 1;
  min-height: 33px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #7c8799;
  font-size: 10px;
  font-weight: 850;
  text-transform: capitalize;
}

.wallet-filter-tabs button.active {
  background: #033c07;
  color: #fff;
  box-shadow: 0 4px 10px rgba(23, 27, 53, 0.12);
}

.wallet-transactions {
  padding: 0 13px;
}

.wallet-transaction {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 3px;
  border-bottom: 1px solid #eef1f6;
}

.wallet-transaction:last-child {
  border-bottom: 0;
}

.wallet-transaction-icon {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  flex: 0 0 39px;
  border-radius: 13px;
  font-size: 16px;
}

.wallet-transaction-icon.credit {
  background: #e4faf2;
  color: #0c9a74;
}

.wallet-transaction-icon.debit {
  background: #fff0f2;
  color: #d4495b;
}

.wallet-transaction-info {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.wallet-transaction-info>strong {
  overflow: hidden;
  color: #29314c;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallet-transaction-info>small {
  overflow: hidden;
  color: #929daf;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallet-status {
  width: max-content;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 8px;
  font-weight: 850;
  text-transform: capitalize;
}

.wallet-transaction-amount {
  flex: 0 0 auto;
  font-size: 11px;
  white-space: nowrap;
}

.wallet-transaction-amount.positive {
  color: #0b9b75;
}

.wallet-transaction-amount.negative {
  color: #d4485b;
}

.wallet-state {
  display: grid;
  justify-items: center;
  gap: 9px;
  padding: 40px 15px;
  color: #8792a4;
  text-align: center;
  font-size: 11px;
}

.wallet-state>i {
  color: #aab4c3;
  font-size: 28px;
}

.wallet-state strong {
  color: #343c57;
  font-size: 12px;
}

.wallet-state p {
  margin: 0;
  font-size: 10px;
}

.wallet-state .spinner-border {
  color: #17b890 !important;
}

.wallet-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 15px;
  border-top: 1px solid #eef1f6;
}

.wallet-pagination>small {
  color: #8b96a7;
  font-size: 9px;
}

.wallet-pagination>div {
  display: flex;
  gap: 4px;
}

.wallet-pagination button {
  display: grid;
  place-items: center;
  min-width: 29px;
  height: 29px;
  padding: 0 6px;
  border: 1px solid #e2e8f1;
  border-radius: 8px;
  background: #fff;
  color: #6d7890;
  font-size: 9px;
  font-weight: 850;
}

.wallet-pagination button.active {
  border-color: #033c07;
  background: #033c07;
  color: #fff;
}

.wallet-pagination button:disabled {
  opacity: 0.4;
}

.wallet-page-footer {
  padding: 17px 0;
  color: #9aa4b3;
  text-align: center;
  font-size: 9px;
}

@keyframes wallet-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 700px) {
  .premium-wallet-page {
    padding-inline: 24px;
  }

  .wallet-summary-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .wallet-balance-hero {
    padding: 25px;
  }

  .wallet-history-panel {
    margin-top: 20px;
  }
}

@media (max-width: 380px) {
  .premium-wallet-page {
    padding-inline: 10px;
  }

  .wallet-balance-hero {
    padding: 16px;
  }

  .wallet-summary-grid {
    gap: 6px;
  }

  .wallet-summary-grid>div {
    padding: 8px 6px;
    gap: 6px;
  }

  .wallet-summary-icon {
    width: 28px;
    height: 28px;
    flex-basis: 28px;
  }

  .wallet-summary-grid strong {
    font-size: 10px;
  }

  .wallet-pagination {
    flex-direction: column;
  }
}
</style>
