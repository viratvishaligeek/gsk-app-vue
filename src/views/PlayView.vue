<template>
  <div class="content-area  position-relative play-game-page">
    <LoadingState v-if="isLoading" variant="play-game" />

    <div v-else-if="errorMessage" class="alert alert-danger m-2">
      {{ errorMessage }}
      <div class="mt-2">
        <router-link to="/" class="btn btn-sm btn-danger"> Back Home </router-link>
      </div>
    </div>
    <template v-else-if="game">
      <div class="play-game-header">
        <router-link to="/dashboard" class="play-back" aria-label="Back to markets">←</router-link>
        <h5 class="m-0 fw-bold d-flex align-items-center gap-2">
          {{ game.name }}
        </h5>

        <div class="text-end">
          <small class="d-block text-muted"> Play Time </small>
          <small class="fw-bold">
            {{ formatTime(game.play_start) }}
            -
            {{ formatTime(game.play_end) }}
          </small>
        </div>
      </div>

      <div v-if="!game.is_playable" class="alert alert-warning mx-1">
        <span class="gsk-emoji-icon" aria-hidden="true">🕒</span>

        {{ game.play_status_message || ('Betting time for ' + game.name + ' is currently closed.') }}
      </div>

      <template v-else>
        <div class="px-1 mb-3">
          <ul class="nav nav-pills nav-fill p-1 rounded-4 border shadow-xs play-game-tabs">
            <li class="nav-item">
              <button class="nav-link fw-bold rounded-3 py-2" :class="{
                'active bg-warning text-dark shadow-sm': activeTab === 'single',
              }" @click="changeMode('single')">
                🎯 Jodi
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link fw-bold rounded-3 py-2" :class="{
                'active bg-warning text-dark shadow-sm': activeTab === 'harup',
              }" @click="changeMode('harup')">
                🎲 Harup
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link fw-bold rounded-3 py-2" :class="{
                'active bg-warning text-dark shadow-sm': activeTab === 'crossing',
              }" @click="changeMode('crossing')">
                🔀 Crossing
              </button>
            </li>
          </ul>
        </div>

        <div v-if="activeTab === 'single'" class="px-1">
          <div class="card p-2 mb-3 shadow-xs border-0 bg-white rounded-3">
            <small class="fw-bold text-muted mb-2 d-block fs-7">
              नीचे दिए गए रकम में से चुने, या अपनी रकम खुद डाले:
            </small>
            <div class="d-flex gap-2 flex-wrap">
              <button v-for="chip in chipOptions" :key="chip" type="button" class="btn btn-sm rounded-pill fw-bold "
                :class="selectedChip === chip
                  ? 'btn-warning text-dark shadow-sm'
                  : 'btn-outline-secondary'
                  " @click="selectedChip = chip">
                ₹{{ chip }}
              </button>
            </div>
            <div class="input-group input-group-sm mt-2">
              <span class="input-group-text bg-light fw-bold text-danger">
                ₹
              </span>
              <input v-model.number="selectedChip" type="number" min="1" step="1"
                class="form-control text-center fw-bold text-danger" placeholder="Enter custom amount" />
            </div>
          </div>
          <div class="row g-2">
            <div v-for="num in singleNumbers" :key="num" class="col-2 col-sm-2 col-md-1">
              <button type="button"
                class="btn w-100 p-2 position-relative d-flex flex-column align-items-center justify-content-center rounded-3 border"
                :class="singleBets[num]
                  ? 'btn-success text-white border-success shadow-sm'
                  : 'btn-white bg-white text-dark shadow-xs'
                  " @click="toggleSingleBet(num)">
                <span class="fw-bold fs-6">
                  {{ num }}
                </span>
                <span v-if="singleBets[num]" class="badge bg-warning text-dark p-1 mt-1 rounded-2 w-100">
                  ₹{{ singleBets[num] }}
                </span>
              </button>
            </div>
          </div>

        </div>


        <div v-if="activeTab === 'harup'" class="px-1">
          <div class="card p-2 mb-3 shadow-xs border-0 bg-white rounded-3">
            <small class="fw-bold text-muted mb-2 d-block fs-7">
              नीचे दिए गए रकम में से चुने, या अपनी रकम खुद डाले:
            </small>
            <div class="d-flex gap-2 flex-wrap mb-2">
              <button v-for="chip in chipOptions" :key="chip" type="button" class="btn btn-sm rounded-pill fw-bold"
                :class="harupAmount === chip ? 'btn-warning text-dark shadow-sm' : 'btn-outline-secondary'
                  " @click="harupAmount = chip">
                ₹{{ chip }}
              </button>
            </div>
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light fw-bold text-danger"> ₹ </span>
              <input v-model.number="harupAmount" type="number" min="1" step="1"
                class="form-control text-center fw-bold text-danger" placeholder="Custom amount" />
            </div>
          </div>
          <div class="card p-2 mb-3 shadow-xs border-0 bg-white rounded-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <small class="fw-bold"> Ander </small>
              <span class="badge bg-light text-dark border">
                {{ Object.keys(harupBets.ander).length }} Selected
              </span>
            </div>
            <div class="row g-2">
              <div v-for="digit in 10" :key="'ander-' + digit" class="col-2 col-sm-2 col-md-1">
                <button type="button"
                  class="btn w-100 p-2 position-relative d-flex flex-column align-items-center justify-content-center rounded-3 border"
                  :class="harupBets.ander[digit - 1]
                    ? 'btn-success text-white border-success shadow-sm'
                    : 'btn-white bg-white text-dark shadow-xs'
                    " @click="toggleHarupBet('ander', digit - 1)">
                  <span class="fw-bold fs-6">
                    {{ digit - 1 }}
                  </span>
                  <span v-if="harupBets.ander[digit - 1]" class="badge bg-warning text-dark p-1 mt-1 rounded-2 w-100">
                    ₹{{ harupBets.ander[digit - 1] }}
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div class="card p-2 mb-3 shadow-xs border-0 bg-white rounded-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <small class="fw-bold"> Bahar </small>
              <span class="badge bg-light text-dark border">
                {{ Object.keys(harupBets.bahar).length }} Selected
              </span>
            </div>
            <div class="row g-2">
              <div v-for="digit in 10" :key="'bahar-' + digit" class="col-2 col-sm-2 col-md-1">
                <button type="button"
                  class="btn w-100 p-2 position-relative d-flex flex-column align-items-center justify-content-center rounded-3 border"
                  :class="harupBets.bahar[digit - 1]
                    ? 'btn-success text-white border-success shadow-sm'
                    : 'btn-white bg-white text-dark shadow-xs'
                    " @click="toggleHarupBet('bahar', digit - 1)">
                  <span class="fw-bold fs-6">
                    {{ digit - 1 }}
                  </span>
                  <span v-if="harupBets.bahar[digit - 1]" class="badge bg-warning text-dark p-1 mt-1 rounded-2 w-100">
                    ₹{{ harupBets.bahar[digit - 1] }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'crossing'" class="px-1">
          <div class="card p-2 mb-3 shadow-xs border-0 bg-white rounded-3">
            <small class="fw-bold text-muted mb-2 d-block fs-7">
              नीचे दिए गए रकम में से चुने, या अपनी रकम खुद डाले:
            </small>
            <div class="d-flex gap-2 flex-wrap mb-2">
              <button v-for="chip in chipOptions" :key="chip" type="button" class="btn btn-sm rounded-pill fw-bold"
                :class="crossingAmount === chip
                  ? 'btn-warning text-dark shadow-sm'
                  : 'btn-outline-secondary'
                  " @click="crossingAmount = chip">
                ₹{{ chip }}
              </button>
            </div>
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light fw-bold text-danger"> ₹ </span>
              <input v-model.number="crossingAmount" type="number" min="1" step="1"
                class="form-control text-center fw-bold text-danger" placeholder="Custom amount" />
            </div>
          </div>
          <div class="card p-2 mb-3 shadow-xs border-0 bg-white rounded-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <small class="fw-bold"> Select Digits </small>
              <span class="badge bg-light text-dark border">
                {{ selectedCrossingDigits.length }} Selected
              </span>
            </div>
            <div class="row g-2">
              <div v-for="digit in 10" :key="'cross-' + digit" class="col-2 col-sm-2 col-md-1">
                <button type="button" class="btn w-100 p-2 rounded-3 border fw-bold" :class="selectedCrossingDigits.includes(digit - 1)
                  ? 'btn-success text-white border-success shadow-sm'
                  : 'btn-white bg-white text-dark shadow-xs'
                  " @click="toggleCrossingDigit(digit - 1)">
                  {{ digit - 1 }}
                </button>
              </div>
            </div>
            <div class="form-check form-switch mt-3 mb-1">
              <input id="joraSwitch" v-model="includeJora" class="form-check-input" type="checkbox" />
              <label class="form-check-label fw-bold text-dark fs-7" for="joraSwitch">
                Include Jora
              </label>
            </div>
          </div>
          <div v-if="generatedCrossingJodis.length" class="card p-2 shadow-xs border-0 bg-white rounded-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <small class="text-muted fw-bold fs-7"> Generated Jodis </small>
              <span class="badge bg-light text-dark border">
                {{ generatedCrossingJodis.length }}
              </span>
            </div>
            <div class="row g-2">
              <div v-for="jodi in generatedCrossingJodis" :key="jodi" class="col-2 col-sm-2 col-md-1">
                <div
                  class="btn w-100 p-2 position-relative d-flex flex-column align-items-center justify-content-center rounded-3 border btn-success text-white border-success shadow-sm">
                  <span class="fw-bold fs-6">
                    {{ jodi }}
                  </span>
                  <span class="badge bg-warning text-dark p-1 mt-1 rounded-2 w-100">
                    ₹{{ crossingAmount }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-muted py-4">
            <span class="gsk-emoji-icon" aria-hidden="true">🎮</span>
            <small> Select at least two digits to generate combinations. </small>
          </div>
        </div>

        <div class="sticky-bottom-bar position-fixed bottom-custom start-0 end-0 p-3 z-3">
          <div class="container p-0">
            <div
              class="card bg-dark text-white rounded-4 shadow-lg border-0 p-3 mx-auto max-w-600 border-top border-warning border-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <small class="text-uppercase fw-semibold fs-8 d-block">
                    Selected
                  </small>
                  <div class="d-flex align-items-baseline gap-2">
                    <span class="fs-4 fw-bold text-warning"> ₹{{ grandTotalAmount }} </span>
                    <span class="badge bg-secondary rounded-pill fs-8">
                      {{ totalBetsCount }} Bets
                    </span>
                  </div>
                </div>
                <button class="btn btn-warning btn-lg px-4 rounded-pill fw-bold text-dark shadow-sm" :disabled="totalBetsCount === 0 ||
                  grandTotalAmount <= 0 ||
                  isSubmitting ||
                  !game?.is_playable
                  " @click="submitBetsAPI">
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
                  <span v-else>
                    <span class="gsk-emoji-icon" aria-hidden="true">✅</span>
                    Place Bet
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
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
        <span class="gsk-emoji-icon" aria-hidden="true">💰</span>
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
      confirmButton: 'btn btn-warning fw-bold rounded-pill px-4',
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
</script><style scoped>
.content-area.play-game-page{min-height:100dvh;padding:13px 11px calc(130px + env(safe-area-inset-bottom));background:#f4f7fb;color:#1e2c42;overflow-x:hidden}.play-game-page>*{max-width:760px;margin-right:auto;margin-left:auto}.play-game-header{display:flex;align-items:center;gap:12px;min-height:68px;margin-bottom:12px;padding:12px;border-radius:16px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff;box-shadow:0 8px 20px #1b365d22}.play-back{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border:1px solid #ffffff35;border-radius:12px;color:#fff;font-size:23px}.play-game-header h5{flex:1;min-width:0;margin:0;color:#fff!important;font-size:17px;font-weight:900;overflow-wrap:anywhere}.play-game-header .text-end{display:grid;gap:2px;padding:7px 9px;border:1px solid #ffffff24;border-radius:10px;background:#ffffff12}.play-game-header .text-end small:first-child{color:#d3e0f0!important;font-size:8px}.play-game-header .text-end small:last-child{color:#fff;font-size:9px}.play-game-tabs{display:flex;gap:5px;margin:0 auto 13px;padding:5px!important;border:1px solid #e5ebf3!important;border-radius:14px!important;background:#fff}.play-game-tabs .nav-link{min-height:43px;padding:8px 5px;color:#66768d;font-size:11px;font-weight:850}.play-game-tabs .nav-link.active{background:#315f9f!important;color:#fff!important;box-shadow:0 4px 10px #315f9f25!important}.play-game-page .card{margin-bottom:12px;padding:13px!important;border:1px solid #e5ebf3!important;border-radius:15px!important;background:#fff!important;box-shadow:0 5px 16px #1b365d08!important}.play-game-page .card small{font-size:10px;line-height:1.5}.play-game-page .input-group{max-width:320px}.play-game-page .input-group .form-control{min-height:40px}.play-game-page .btn{min-height:40px;border-radius:10px;font-size:11px;font-weight:800}.play-game-page .btn-outline-secondary{border-color:#dce4ee;color:#5d6e85}.play-game-page .btn-warning{background:#efb64e;border-color:#efb64e;color:#26354a}.play-game-page .row.g-2{margin-inline:0}.play-game-page .row.g-2>[class*="col-"]{padding:4px}.play-game-page .row.g-2 .btn{min-height:52px;padding:7px 3px;border:1px solid #e1e8f1!important;border-radius:11px!important;background:#fff;color:#30445f;box-shadow:none!important}.play-game-page .row.g-2 .btn-success{border-color:#315f9f!important;background:#315f9f!important;color:#fff!important}.play-game-page .row.g-2 .btn .badge{font-size:8px}.play-game-page .form-check{margin:10px 0;padding:10px 12px;border:1px solid #e5ebf3;border-radius:11px;background:#fff}.play-game-page .form-check-label{font-size:11px;font-weight:700}.play-game-page .alert{border-radius:12px;font-size:11px}.sticky-bottom-bar{position:fixed!important;z-index:1015;right:0;bottom:calc(8px + env(safe-area-inset-bottom));left:0;padding:0 11px!important;pointer-events:none}.sticky-bottom-bar>.container{max-width:720px;padding:13px!important;border:1px solid #ffffff24;border-radius:17px;background:#19365e;color:#fff;box-shadow:0 12px 28px #112b4d45;pointer-events:auto}.sticky-bottom-bar .text-warning{color:#f5c66f!important}.sticky-bottom-bar .btn-warning{min-height:45px;background:#efb64e!important;border-color:#efb64e!important;color:#23354d!important}.max-w-600{max-width:600px}.fs-8{font-size:9px!important}
@media(max-width:360px){.play-game-header h5{font-size:14px}.play-game-header .text-end{padding:5px}.play-game-tabs .nav-link{font-size:9px}.play-game-page .row.g-2>[class*="col-"]{padding:3px}}
</style>