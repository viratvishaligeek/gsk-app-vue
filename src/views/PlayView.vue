<template>
  <main class="content-area premium-page premium-play-page">
    <LoadingState v-if="isLoading" variant="play-game" />
    <section v-else-if="errorMessage" class="play-state-card">
      <span class="play-state-icon">
        <i class="bi bi-exclamation-triangle">
        </i>
      </span>
      <h2>Game unavailable</h2>
      <p>{{ errorMessage }}</p>
      <router-link to="/market-games" class="btn btn-primary">Back to markets</router-link>
    </section>
    <template v-else-if="game">
      <section class="play-market-hero">
        <div class="play-hero-meta">
          <h1 class="m-0">{{ game.name }}</h1>
          <span>
            <i class="bi bi-clock me-1">
            </i>{{ formatTime(game.play_start) }} – {{
              formatTime(game.play_end) }}</span>
        </div>
      </section>
      <div v-if="!game.is_playable" class="play-closed-banner">
        <i class="bi bi-clock-history">

        </i>
        <span>{{
          game.play_status_message || ('Betting time for ' + game.name + ' is currently closed.') }}</span>
      </div>
      <template v-else>
        <section class="play-type-panel">
          <div class="play-type-tabs" role="tablist" aria-label="Bet type">
            <button type="button" role="tab" :aria-selected="activeTab === 'single'"
              :class="{ active: activeTab === 'single' }" @click="changeMode('single')">
              <strong>Jodi</strong>
              <small>00–99</small>
            </button>
            <button type="button" role="tab" :aria-selected="activeTab === 'harup'"
              :class="{ active: activeTab === 'harup' }" @click="changeMode('harup')">
              <strong>Harup</strong>
              <small>Ander /
                Bahar</small>
            </button>
            <button type="button" role="tab" :aria-selected="activeTab === 'crossing'"
              :class="{ active: activeTab === 'crossing' }" @click="changeMode('crossing')">
              <strong>Crossing</strong>
              <small>Combinations</small>
            </button>
          </div>
        </section>
        <section class="play-stake-panel">
          <div class="play-section-heading">
            <div>
              <h2>Amount value</h2>
            </div>
            <span class="play-step">02 / 03</span>
          </div>
          <div class="play-chip-row">
            <button v-for="chip in chipOptions" :key="chip" type="button"
              :class="{ selected: (activeTab === 'single' ? selectedChip : activeTab === 'harup' ? harupAmount : crossingAmount) === chip }"
              @click="activeTab === 'single' ? selectedChip = chip : activeTab === 'harup' ? harupAmount = chip : crossingAmount = chip">₹{{
                chip }}</button>
          </div>
          <label class="play-custom-stake">
            <span>Custom amount</span>
            <span class="play-stake-input">
              <b>₹</b>
              <input v-if="activeTab === 'single'" v-model.number="selectedChip" type="number" min="1" step="1"
                inputmode="numeric" aria-label="Jodi stake amount" />
              <input v-else-if="activeTab === 'harup'" v-model.number="harupAmount" type="number" min="1" step="1"
                inputmode="numeric" aria-label="Harup stake amount" />
              <input v-else v-model.number="crossingAmount" type="number" min="1" step="1" inputmode="numeric"
                aria-label="Crossing stake amount" />
              <small>INR</small>
            </span>
          </label>
        </section>
        <section v-if="activeTab === 'single'" class="play-number-panel">
          <div class="play-section-heading">
            <div>
              <h2>अपनी जोड़ी चुनें</h2>
              <p>Tap any number to add it to your slip.</p>
            </div>
            <span class="btn btn-sm btn-outline-danger">{{ Object.keys(singleBets).length }} selected</span>
          </div>
          <div class="play-number-grid">
            <button v-for="num in singleNumbers" :key="num" type="button"
              :class="{ selected: singleBets[num] !== undefined }" :aria-pressed="singleBets[num] !== undefined"
              @click="toggleSingleBet(num)">
              <strong>{{ num }}</strong>
              <small v-if="singleBets[num] !== undefined">₹{{
                singleBets[num] }}</small>
            </button>
          </div>
        </section>
        <template v-else-if="activeTab === 'harup'">
          <section v-for="type in ['ander', 'bahar']" :key="type" class="play-number-panel">
            <div class="play-section-heading">
              <div>
                <span class="play-eyebrow">HARUP</span>
                <h2>{{ type === 'ander' ? 'Ander' : 'Bahar' }}</h2>
                <p>Select digits from 0 to 9.</p>
              </div>
              <span class="play-selected-count">{{ Object.keys(harupBets[type]).length }} selected</span>
            </div>
            <div class="play-digit-grid">
              <button v-for="digit in 10" :key="type + digit" type="button"
                :class="{ selected: harupBets[type][digit - 1] !== undefined }"
                :aria-pressed="harupBets[type][digit - 1] !== undefined" @click="toggleHarupBet(type, digit - 1)">
                <strong>{{
                  digit - 1 }}</strong>
                <small v-if="harupBets[type][digit - 1] !== undefined">₹{{ harupBets[type][digit
                  -
                  1]
                  }}</small>
              </button>
            </div>
          </section>
        </template>
        <template v-else>
          <section class="play-number-panel">
            <div class="play-section-heading">
              <div>
                <span class="play-eyebrow">CROSSING</span>
                <h2>Select digits</h2>
                <p>Choose at least two digits to generate Jodi combinations.</p>
              </div>
              <span class="play-selected-count">{{ selectedCrossingDigits.length }} selected</span>
            </div>
            <div class="play-digit-grid">
              <button v-for="digit in 10" :key="'cross-' + digit" type="button"
                :class="{ selected: selectedCrossingDigits.includes(digit - 1) }"
                :aria-pressed="selectedCrossingDigits.includes(digit - 1)" @click="toggleCrossingDigit(digit - 1)">
                <strong>{{ digit - 1 }}</strong>
              </button>
            </div>
            <label class="play-jora-toggle">
              <input v-model="includeJora" class="form-check-input" type="checkbox" />
              <span>
                <strong>Include Jora</strong>
                <small>Allow the same digit twice in a
                  combination.</small>
              </span>
            </label>
            <div v-if="generatedCrossingJodis.length" class="play-combination-summary">
              <div class="play-section-heading">
                <div>
                  <h2>Generated Jodis</h2>
                  <p>{{ generatedCrossingJodis.length }} combinations · ₹{{ crossingAmount }} each</p>
                </div>
              </div>
              <div class="play-combination-list">
                <span v-for="jodi in generatedCrossingJodis" :key="jodi">{{ jodi }}
                  <small>₹{{ crossingAmount }}</small>
                </span>
              </div>
            </div>
            <div v-else class="play-crossing-hint">
              <i class="bi bi-shuffle">

              </i> Select two or more digits to see
              combinations.
            </div>
          </section>
        </template>
        <section class="play-slip-card">
          <div>
            <h2>Your bet slip</h2>
            <p>{{ totalBetsCount }} {{ totalBetsCount === 1 ? 'selection' : 'selections' }} added</p>
          </div>
          <div class="play-slip-total">₹{{ Number(grandTotalAmount || 0).toLocaleString('en-IN') }}</div>
          <button type="button" class="btn btn-primary play-submit-button"
            :disabled="totalBetsCount === 0 || grandTotalAmount <= 0 || isSubmitting || !game?.is_playable"
            @click="submitBetsAPI">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2">

            </span>
            <i v-else class="bi bi-shield-check me-2">
            </i>{{ isSubmitting ? 'Placing bet…' : 'Review & place bet' }} <i v-if="!isSubmitting"
              class="bi bi-arrow-right ms-auto">
            </i>
          </button>
          <button v-if="totalBetsCount" type="button" class="play-clear-button" @click="clearSelections">सभी हटाएं
          </button>
          <small class="play-responsible-note">
            <i class="bi bi-info-circle me-1">

            </i>Check your selections and stake
            carefully before confirming.</small>
        </section>
      </template>
    </template>
  </main>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import LoadingState from '@/components/LoadingState.vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import Swal from 'sweetalert2'
import api from '../plugins/axios'
import { useAuthStore } from '@/utils/auth'
import { useSettings } from '@/composables/useSettings'
const toast = useToast()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { loadSettings, getSetting } = useSettings()


const game = ref(null)

const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')

const activeTab = ref('single')


const changeMode = (mode) => {
  if (activeTab.value === mode) {
    return
  }

  activeTab.value = mode

  clearSelections()
}


const chipOptions = [10, 50, 100, 500, 1000]

const selectedChip = ref(10)

const singleBets = ref({})

const singleNumbers = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'))

const toggleSingleBet = (num) => {
  const current = singleBets.value[num]

  if (current !== undefined) {
    delete singleBets.value[num]

    return
  }

  singleBets.value[num] = Number(selectedChip.value)
}


const harupAmount = ref(10)

const harupBets = ref({
  ander: {},
  bahar: {},
})

const toggleHarupBet = (type, digit) => {
  const current = harupBets.value[type][digit]

  if (current !== undefined) {
    delete harupBets.value[type][digit]

    return
  }

  const amount = Number(harupAmount.value)

  if (!Number.isFinite(amount) || amount < 1) {
    toast.warning('Please enter a valid Harup amount.')

    return
  }

  harupBets.value[type][digit] = amount
}


const selectedCrossingDigits = ref([])

const includeJora = ref(true)

const crossingAmount = ref(10)

const toggleCrossingDigit = (digit) => {
  const index = selectedCrossingDigits.value.indexOf(digit)

  if (index !== -1) {
    selectedCrossingDigits.value.splice(index, 1)

    return
  }

  selectedCrossingDigits.value.push(digit)
}

const generatedCrossingJodis = computed(() => {
  const digits = selectedCrossingDigits.value

  if (digits.length < 2) {
    return []
  }

  const result = []

  for (let i = 0; i < digits.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      if (!includeJora.value && digits[i] === digits[j]) {
        continue
      }

      result.push(`${digits[i]}${digits[j]}`)
    }
  }

  return [...new Set(result)]
})


const totalSingleAmount = computed(() => {
  return Object.values(singleBets.value).reduce((total, amount) => total + Number(amount || 0), 0)
})

const normalizeAmount = (value) => {
  const amount = Number(value)

  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

const totalHarupAmount = computed(() => {
  const ander = Object.values(harupBets.value.ander).reduce(
    (total, amount) => total + normalizeAmount(amount),
    0,
  )

  const bahar = Object.values(harupBets.value.bahar).reduce(
    (total, amount) => total + normalizeAmount(amount),
    0,
  )

  return ander + bahar
})

const totalCrossingAmount = computed(() => {
  const amount = normalizeAmount(crossingAmount.value)
  return generatedCrossingJodis.value.length * amount
})

const grandTotalAmount = computed(() => {
  if (activeTab.value === 'single') {
    return totalSingleAmount.value
  }

  if (activeTab.value === 'harup') {
    return totalHarupAmount.value
  }

  if (activeTab.value === 'crossing') {
    return totalCrossingAmount.value
  }

  return 0
})

const totalBetsCount = computed(() => {
  if (activeTab.value === 'single') {
    return Object.keys(singleBets.value).length
  }

  if (activeTab.value === 'harup') {
    return Object.keys(harupBets.value.ander).length + Object.keys(harupBets.value.bahar).length
  }

  if (activeTab.value === 'crossing') {
    return generatedCrossingJodis.value.length
  }

  return 0
})


const fetchGame = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(`/games/${route.params.id}`)

    game.value = response.data?.data ?? null

    if (!game.value) {
      errorMessage.value = 'Game not found.'
    }
  } catch (error) {
    console.error('FETCH GAME ERROR:', error)

    errorMessage.value = error.response?.data?.message || 'Unable to load game.'
  } finally {
    isLoading.value = false
  }
}


const submitBetsAPI = async () => {
  if (isSubmitting.value) {
    return
  }

  /*
  |--------------------------------------------------------------------------
  | GAME CHECK
  |--------------------------------------------------------------------------
  */

  if (!game.value) {
    toast.error('Game information is unavailable.')

    return
  }

  if (!game.value.is_playable) {
    toast.warning('This game is currently not playable.')

    return
  }



  const totalAmount = Number(grandTotalAmount.value)

  const totalBets = Number(totalBetsCount.value)

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    toast.warning('Please select at least one bet.')

    return
  }

  if (!Number.isInteger(totalBets) || totalBets <= 0) {
    toast.warning('Please select at least one bet.')

    return
  }

  // Match the server's per-bet limits before sending a request that will be rejected.
  try {
    await loadSettings()
  } catch (settingsError) {
    console.warn('Unable to load bet limits; the API will validate the bet.', settingsError)
  }

  const isHarup = activeTab.value === 'harup'
  const minimumKey = isHarup ? 'min_bid_amount_haruf' : 'min_bid_amount_jodi'
  const maximumKey = isHarup ? 'max_bid_amount_haruf' : 'max_bid_amount_jodi'
  const minimumBetAmount = Number(getSetting(minimumKey, 1)) || 1
  const maximumBetAmount = Number(getSetting(maximumKey, 0)) || 0
  const selectedAmounts = activeTab.value === 'single'
    ? Object.values(singleBets.value).map(Number)
    : activeTab.value === 'harup'
      ? [
        ...Object.values(harupBets.value.ander).map(Number),
        ...Object.values(harupBets.value.bahar).map(Number),
      ]
      : generatedCrossingJodis.value.length
        ? [Number(crossingAmount.value)]
        : []

  if (selectedAmounts.some((amount) => amount < minimumBetAmount)) {
    toast.warning(`Minimum bet amount is ₹${minimumBetAmount} per selection.`)
    return
  }

  if (
    maximumBetAmount > 0 &&
    selectedAmounts.some((amount) => amount > maximumBetAmount)
  ) {
    toast.warning(`Maximum bet amount is ₹${maximumBetAmount} per selection.`)
    return
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRM
  |--------------------------------------------------------------------------
  */

  const result = await Swal.fire({
    title: 'Place Bet?',
    html: `
    <div class="bet-confirm-box">
      <div class="bet-confirm-amount">
        ₹${totalAmount.toFixed(2)}
      </div>

      <div class="bet-confirm-text">
        ${totalBets} ${totalBets === 1 ? 'bet' : 'bets'} selected
      </div>

      <div class="bet-confirm-warning">
        <i class="bi bi-wallet2">
          </i>
        This amount will be deducted from your wallet.
      </div>
    </div>
  `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Place Bet',
    cancelButtonText: 'No, Cancel',
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: 'mobile-bet-swal',
      title: 'mobile-bet-swal-title',
      htmlContainer: 'mobile-bet-swal-content',
      confirmButton: 'btn btn-success fw-bold rounded-pill px-4',
      cancelButton: 'btn btn-light border fw-bold rounded-pill px-4 me-2',
    },
  })

  if (!result.isConfirmed) {
    return
  }


  const payload = {
    mode: activeTab.value,

    total_amount: Number(totalAmount.toFixed(2)),

    total_bets: totalBets,

    single_bets: activeTab.value === 'single' ? { ...singleBets.value } : {},

    harup_bets:
      activeTab.value === 'harup'
        ? {
          ander: {
            ...harupBets.value.ander,
          },
          bahar: {
            ...harupBets.value.bahar,
          },
        }
        : {
          ander: {},
          bahar: {},
        },

    crossing_jodis: activeTab.value === 'crossing' ? [...generatedCrossingJodis.value] : [],

    crossing_amount_per_jodi: activeTab.value === 'crossing' ? Number(crossingAmount.value) : null,
  }


  isSubmitting.value = true

  try {
    const response = await api.post(`/games/${game.value.id}/bids`, payload)

    const data = response.data?.data

    const placedAmount = Number(data?.total_amount ?? totalAmount)
    const remainingBalance = Number(data?.balance)

    if (Number.isFinite(remainingBalance) && remainingBalance >= 0) {
      authStore.updateUserData({ balance: remainingBalance })
    }

    toast.success(
      `Bet placed successfully • ₹${placedAmount.toFixed(2)}`,
      {
        timeout: 3000,
        closeOnClick: true,
        pauseOnHover: true,
      },
    )

    clearSelections()

    await fetchGame()
  } catch (error) {
    console.error('PLACE BET ERROR:', error)

    const responseData = error.response?.data

    const validationErrors = responseData?.errors

    let message = responseData?.message || 'Unable to place bet.'

    if (validationErrors && typeof validationErrors === 'object') {
      const messages = Object.values(validationErrors).flat().filter(Boolean)

      if (messages.length) {
        message = messages.join(' ')
      }
    }

    toast.error(message, {
      timeout: 6000,
    })
  } finally {
    isSubmitting.value = false
  }
}


const clearSelections = () => {
  singleBets.value = {}

  harupBets.value = {
    ander: {},
    bahar: {},
  }

  selectedCrossingDigits.value = []
}


const formatTime = (time) => {
  if (!time) {
    return '--'
  }

  const parts = String(time).split(':')

  if (parts.length < 2) {
    return '--'
  }

  const hours = Number(parts[0])

  const minutes = Number(parts[1])

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return '--'
  }

  const date = new Date()

  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}


onMounted(() => {
  if (!route.params.id) {
    router.push('/')

    return
  }

  fetchGame()
})
</script>

<style scoped>
.premium-play-page {
  padding-top: 16px;
  /* padding-bottom: 145px; */
  max-width: 900px
}

.play-back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: #6f7c91;
  font-size: 11px;
  font-weight: 850
}

.play-market-hero {
  padding: 20px;
  border-radius: 23px;
  background: radial-gradient(circle at 100% 0, rgba(23, 184, 144, .25), transparent 42%), linear-gradient(130deg, #033c07, #292f52);
  color: #fff;
  box-shadow: 0 14px 32px rgba(23, 27, 53, .15)
}

.play-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px
}

.play-market-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 14px;
  background: rgba(255, 255, 255, .1);
  color: #f5c55b;
  font-size: 20px
}

.play-live-status {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 9px;
  border-radius: 9px;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .08em
}

.play-live-status>span {
  width: 6px;
  height: 6px;
  border-radius: 50%
}

.play-open {
  background: rgba(23, 184, 144, .16);
  color: #81e9cc
}

.play-open>span {
  background: #29d6a8
}

.play-closed {
  background: rgba(255, 255, 255, .1);
  color: #c1cad9
}

.play-closed>span {
  background: #9ba7ba
}

.play-market-hero h1 {
  margin: 17px 0 5px;
  color: #fff;
  font-size: clamp(25px, 6vw, 34px);
  font-weight: 850;
  letter-spacing: -.05em
}

.play-market-hero p {
  max-width: 540px;
  margin: 0;
  color: #c0c9d9;
  font-size: 11px;
  line-height: 1.6
}

.play-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 9px 16px;
  color: #c5cede;
  font-size: 10px;
  align-items: center;
  justify-content: space-between;
}

.play-closed-banner {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 14px 0;
  padding: 14px;
  border: 1px solid #f2dfad;
  border-radius: 14px;
  background: #fff8e6;
  color: #87641a;
  font-size: 11px;
  font-weight: 750
}

.play-closed-banner i {
  font-size: 18px
}

.play-type-panel,
.play-stake-panel,
.play-number-panel,
.play-slip-card {
  margin-top: 15px;
  padding: 10px;
  border: 1px solid #e3e9f2;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 5px 17px rgba(23, 27, 53, .035)
}

.play-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px
}

.play-eyebrow {
  display: block;
  color: #0d9d78;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .13em
}

.play-section-heading h2 {
  margin: 4px 0 2px;
  color: #202642;
  font-size: 17px;
  font-weight: 850;
  letter-spacing: -.035em
}

.play-section-heading p {
  margin: 0;
  color: #8b96a8;
  font-size: 10px
}

.play-step {
  color: #9aa4b4;
  font-size: 9px;
  font-weight: 900
}

.play-type-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px
}

.play-type-tabs button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 5px 5px;
  border: 1px solid #e3e8f1;
  border-radius: 14px;
  background: #f9fafc;
  color: #7b8799
}

.play-type-tabs button>i {
  font-size: 19px
}

.play-type-tabs button strong {
  color: #323b57;
  font-size: 11px
}

.play-type-tabs button small {
  color: #98a2b1;
  font-size: 8px
}

.play-type-tabs button.active {
  border-color: #033c07;
  background: #033c07;
  color: #f5c65d;
  box-shadow: 0 7px 17px rgba(23, 27, 53, .15)
}

.play-type-tabs button.active strong {
  color: #fff
}

.play-type-tabs button.active small {
  color: #aebbd1
}

.play-chip-row {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding: 1px 1px 8px;
  scrollbar-width: none
}

.play-chip-row button {
  flex: 0 0 auto;
  min-width: 52px;
  min-height: 37px;
  padding: 7px 11px;
  border: 1px solid #e1e7f0;
  border-radius: 11px;
  background: #fff;
  color: #637087;
  font-size: 11px;
  font-weight: 850
}

.play-chip-row button.selected {
  border-color: #17b890;
  background: #e5faf2;
  color: #0b926d
}

.play-custom-stake {
  display: block;
  margin-top: 8px;
  color: #657188;
  font-size: 10px;
  font-weight: 800
}

.play-stake-input {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 45px;
  margin-top: 7px;
  padding: 0 12px;
  border: 1px solid #dce4ef;
  border-radius: 12px;
  background: #f9fafc
}

.play-stake-input>b {
  color: #0d9d78;
  font-size: 17px
}

.play-stake-input input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #202642;
  font-size: 15px;
  font-weight: 850
}

.play-stake-input small {
  color: #9aa4b4;
  font-size: 9px;
  font-weight: 900
}

.play-selected-count {
  flex: 0 0 auto;
  padding: 6px 8px;
  border-radius: 9px;
  background: #edf2ff;
  color: #424d79;
  font-size: 9px;
  font-weight: 850
}

.play-number-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 7px
}

.play-number-grid button,
.play-digit-grid button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  min-height: 51px;
  padding: 5px 2px;
  border: 1px solid #e2e8f1;
  border-radius: 12px;
  background: #f9fafc;
  color: #252b4c;
  transition: transform .12s ease, border-color .12s ease, background .12s ease
}

.play-number-grid button strong,
.play-digit-grid button strong {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 800
}

.play-number-grid button small,
.play-digit-grid button small {
  padding: 3px 5px;
  border-radius: 5px;
  background: #f7d575;
  color: #453610;
  font-size: 10px;
  font-weight: 900
}

.play-number-grid button.selected,
.play-digit-grid button.selected {
  border-color: #17b890;
  background: #e4faf2;
  color: #087d60;
  box-shadow: inset 0 0 0 1px rgba(23, 184, 144, .12)
}

.play-number-grid button:active,
.play-digit-grid button:active {
  transform: scale(.96)
}

.play-digit-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px
}

.play-digit-grid button {
  min-height: 58px
}

.play-jora-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding: 12px;
  border: 1px solid #e5eaf2;
  border-radius: 13px;
  background: #f9fafc
}

.play-jora-toggle input {
  margin: 0
}

.play-jora-toggle span {
  display: grid;
  gap: 2px
}

.play-jora-toggle strong {
  color: #2c3450;
  font-size: 11px
}

.play-jora-toggle small {
  color: #8d98a8;
  font-size: 9px
}

.play-combination-summary {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #edf0f5
}

.play-combination-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px
}

.play-combination-list>span {
  padding: 7px 9px;
  border: 1px solid #d5f3e7;
  border-radius: 9px;
  background: #edfcf6;
  color: #0a8968;
  font-size: 10px;
  font-weight: 900
}

.play-combination-list small {
  margin-left: 3px;
  color: #8a9d98;
  font-size: 8px
}

.play-crossing-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 14px;
  border-radius: 13px;
  background: #f7f9fc;
  color: #8b96a8;
  font-size: 10px
}

.play-crossing-hint i {
  font-size: 17px
}

.play-slip-card {
  position: sticky;
  bottom: 0;
  z-index: 4;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  border-color: #dfe6f0;
  box-shadow: 0 12px 32px rgba(23, 27, 53, .12)
}

.play-slip-card h2 {
  margin: 4px 0 2px;
  color: #202642;
  font-size: 17px;
  font-weight: 850
}

.play-slip-card p {
  margin: 0;
  color: #8994a6;
  font-size: 10px
}

.play-slip-total {
  color: #0b9d78;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 25px;
  font-weight: 800
}

.play-submit-button {
  grid-column: 1/-1;
  display: flex;
  align-items: center;
  min-height: 48px;
  border-radius: 13px;
  font-size: 12px
}

.play-clear-button {
  grid-column: 1/-1;
  justify-self: center;
  border: 0;
  background: transparent;
  color: #000;
  font-size: 12px;
  font-weight: bold
}

.play-responsible-note {
  grid-column: 1/-1;
  color: #9aa4b3;
  text-align: center;
  font-size: 9px
}

.play-state-card {
  display: grid;
  justify-items: center;
  padding: 60px 18px;
  text-align: center
}

.play-state-icon {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: #fff1f2;
  color: #d9485b;
  font-size: 23px
}

.play-state-card h2 {
  margin: 15px 0 4px;
  font-size: 19px
}

.play-state-card p {
  color: #8390a3;
  font-size: 11px
}

@media(min-width:600px) {
  .premium-play-page {
    padding-inline: 22px
  }

  .play-number-grid {
    grid-template-columns: repeat(10, minmax(0, 1fr))
  }

  .play-digit-grid {
    grid-template-columns: repeat(10, minmax(0, 1fr))
  }

  .play-slip-card {
    grid-template-columns: 1fr auto
  }

  .play-submit-button {
    grid-column: auto;
    min-width: 220px
  }

  .play-clear-button,
  .play-responsible-note {
    grid-column: 1/-1
  }
}

@media(max-width:380px) {
  .premium-play-page {
    padding-inline: 10px
  }

  .play-market-hero {
    padding: 16px
  }

  .play-type-panel,
  .play-stake-panel,
  .play-number-panel,
  .play-slip-card {
    padding: 13px
  }

  .play-number-grid {
    gap: 5px
  }

  .play-number-grid button {
    min-height: 46px
  }

  .play-number-grid button strong {
    font-size: 13px
  }

  .play-type-tabs {
    gap: 5px
  }

  .play-type-tabs button {
    padding-inline: 2px
  }
}
</style>
