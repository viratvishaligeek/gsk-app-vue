<template>
  <main class="play-studio">
    <LoadingState v-if="isLoading" variant="play-game" />
    <section v-else-if="errorMessage" class="play-state-card play-error">
      <span>⚠️</span><h2>We couldn't open this game</h2><p>{{ errorMessage }}</p>
      <router-link to="/games" class="play-primary-link">Back to games</router-link>
    </section>

    <template v-else-if="game">
      <header class="play-studio-header">
        <router-link to="/games" class="play-studio-back" aria-label="Back to games">←</router-link>
        <div class="play-studio-title"><span>🎮 GAME STUDIO</span><h1>{{ game.name }}</h1><small>{{ formatTime(game.play_start) }} – {{ formatTime(game.play_end) }}</small></div>
        <div class="play-live-pill" :class="game.is_playable ? 'is-open' : 'is-closed'"><i></i>{{ game.is_playable ? 'Open' : 'Closed' }}</div>
      </header>

      <section v-if="!game.is_playable" class="play-closed-panel">
        <span>🕒</span><div><strong>Entries are closed</strong><p>{{ game.play_status_message || ('Betting time for ' + game.name + ' is currently closed.') }}</p></div>
      </section>

      <template v-else>
        <section class="play-step-intro">
          <div><span>STEP 01 · CHOOSE YOUR PLAY</span><h2>Build your entry</h2><p>Choose a play type, set your amount and select numbers.</p></div>
          <span class="play-step-number">01</span>
        </section>

        <section class="play-mode-picker" aria-label="Choose play type">
          <button type="button" :class="{active:activeTab==='single'}" @click="changeMode('single')">
            <span class="mode-symbol">🎯</span><span><strong>Jodi</strong><small>00–99 numbers</small></span><b>{{ activeTab==='single'?'✓':'→' }}</b>
          </button>
          <button type="button" :class="{active:activeTab==='harup'}" @click="changeMode('harup')">
            <span class="mode-symbol">🎲</span><span><strong>Harup</strong><small>Ander & Bahar</small></span><b>{{ activeTab==='harup'?'✓':'→' }}</b>
          </button>
          <button type="button" :class="{active:activeTab==='crossing'}" @click="changeMode('crossing')">
            <span class="mode-symbol">🔀</span><span><strong>Crossing</strong><small>Digit combinations</small></span><b>{{ activeTab==='crossing'?'✓':'→' }}</b>
          </button>
        </section>

        <section class="play-builder-panel">
          <div class="play-panel-heading"><div><span>STEP 02 · SET YOUR STAKE</span><h2>Choose an amount</h2></div><span class="play-panel-emoji">💵</span></div>
          <div v-if="activeTab==='single'" class="play-amount-control">
            <button v-for="chip in chipOptions" :key="chip" type="button" :class="{active:selectedChip===chip}" @click="selectedChip=chip">₹{{ chip }}</button>
            <label class="play-custom-amount"><span>₹</span><input v-model.number="selectedChip" type="number" min="1" step="1" inputmode="numeric" aria-label="Custom Jodi amount"></label>
          </div>
          <div v-else-if="activeTab==='harup'" class="play-amount-control">
            <button v-for="chip in chipOptions" :key="chip" type="button" :class="{active:harupAmount===chip}" @click="harupAmount=chip">₹{{ chip }}</button>
            <label class="play-custom-amount"><span>₹</span><input v-model.number="harupAmount" type="number" min="1" step="1" inputmode="numeric" aria-label="Custom Harup amount"></label>
          </div>
          <div v-else class="play-amount-control">
            <button v-for="chip in chipOptions" :key="chip" type="button" :class="{active:crossingAmount===chip}" @click="crossingAmount=chip">₹{{ chip }}</button>
            <label class="play-custom-amount"><span>₹</span><input v-model.number="crossingAmount" type="number" min="1" step="1" inputmode="numeric" aria-label="Custom Crossing amount"></label>
          </div>
          <p class="play-helper">Select a preset or enter your own amount for each selection.</p>
        </section>

        <section v-if="activeTab==='single'" class="play-builder-panel">
          <div class="play-panel-heading"><div><span>STEP 03 · PICK YOUR NUMBERS</span><h2>Choose Jodi numbers</h2></div><span class="play-selection-count">{{ Object.keys(singleBets).length }} selected</span></div>
          <div class="play-number-grid">
            <button v-for="num in singleNumbers" :key="num" type="button" :class="{selected:singleBets[num]!==undefined}" :aria-pressed="singleBets[num]!==undefined" @click="toggleSingleBet(num)">
              <strong>{{ num }}</strong><small v-if="singleBets[num]!==undefined">₹{{ singleBets[num] }}</small><span v-else>+</span>
            </button>
          </div>
          <p class="play-helper">Tap a number to add it. Tap it again to remove it.</p>
        </section>

        <template v-else-if="activeTab==='harup'">
          <section v-for="side in ['ander','bahar']" :key="side" class="play-builder-panel">
            <div class="play-panel-heading"><div><span>STEP 03 · SELECT DIGITS</span><h2>{{ side==='ander'?'Ander':'Bahar' }}</h2></div><span class="play-selection-count">{{ Object.keys(harupBets[side]).length }} selected</span></div>
            <div class="play-digit-grid">
              <button v-for="digit in 10" :key="side+'-'+digit" type="button" :class="{selected:harupBets[side][digit-1]!==undefined}" :aria-pressed="harupBets[side][digit-1]!==undefined" @click="toggleHarupBet(side,digit-1)">
                <strong>{{ digit-1 }}</strong><small v-if="harupBets[side][digit-1]!==undefined">₹{{ harupBets[side][digit-1] }}</small><span v-else>+</span>
              </button>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="play-builder-panel">
            <div class="play-panel-heading"><div><span>STEP 03 · BUILD COMBINATIONS</span><h2>Select your digits</h2></div><span class="play-selection-count">{{ selectedCrossingDigits.length }} selected</span></div>
            <div class="play-digit-grid">
              <button v-for="digit in 10" :key="'cross-'+digit" type="button" :class="{selected:selectedCrossingDigits.includes(digit-1)}" :aria-pressed="selectedCrossingDigits.includes(digit-1)" @click="toggleCrossingDigit(digit-1)"><strong>{{ digit-1 }}</strong><span>{{ selectedCrossingDigits.includes(digit-1)?'✓':'+' }}</span></button>
            </div>
            <label class="play-jora-toggle"><span><strong>Include Jora</strong><small>Include repeated-digit combinations</small></span><input id="joraSwitch" v-model="includeJora" type="checkbox"></label>
          </section>
          <section class="play-builder-panel">
            <div class="play-panel-heading"><div><span>GENERATED ENTRIES</span><h2>Your combinations</h2></div><span class="play-selection-count">{{ generatedCrossingJodis.length }} jodis</span></div>
            <div v-if="generatedCrossingJodis.length" class="play-generated-grid"><span v-for="jodi in generatedCrossingJodis" :key="jodi"><strong>{{ jodi }}</strong><small>₹{{ crossingAmount }}</small></span></div>
            <div v-else class="play-empty-combinations"><span>🔢</span><strong>Choose at least two digits</strong><small>Your combinations will appear here automatically.</small></div>
          </section>
        </template>

        <section class="play-review-panel">
          <div class="play-panel-heading"><div><span>STEP 04 · REVIEW</span><h2>Your entry summary</h2></div><span class="play-panel-emoji">🧾</span></div>
          <div class="play-review-row"><span>Play type</span><strong>{{ activeTab==='single'?'Jodi':activeTab==='harup'?'Harup':'Crossing' }}</strong></div>
          <div class="play-review-row"><span>Selections</span><strong>{{ totalBetsCount }}</strong></div>
          <div v-if="activeTab==='single' && totalBetsCount" class="play-review-picks">{{ Object.entries(singleBets).map(([number,amount])=>number+' · ₹'+amount).join('  /  ') }}</div>
          <div v-if="activeTab==='harup' && totalBetsCount" class="play-review-picks">Ander: {{ Object.keys(harupBets.ander).join(', ') || '—' }} · Bahar: {{ Object.keys(harupBets.bahar).join(', ') || '—' }}</div>
          <div v-if="activeTab==='crossing' && totalBetsCount" class="play-review-picks">{{ generatedCrossingJodis.join(', ') }}</div>
          <div class="play-review-total"><span>Total entry amount</span><strong>₹{{ Number(grandTotalAmount).toLocaleString('en-IN') }}</strong></div>
          <p class="play-review-note">Please review your selections before confirming. Your wallet will be charged only after confirmation.</p>
        </section>

        <div class="play-submit-spacer"></div>
        <footer class="play-submit-dock">
          <div><small>ENTRY TOTAL</small><strong>₹{{ Number(grandTotalAmount).toLocaleString('en-IN') }}</strong><span>{{ totalBetsCount }} selection{{ totalBetsCount===1?'':'s' }}</span></div>
          <button type="button" :disabled="totalBetsCount===0 || grandTotalAmount<=0 || isSubmitting || !game?.is_playable" @click="submitBetsAPI">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span><template v-else>Review & confirm <span>→</span></template>
          </button>
        </footer>
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
</script>
<style scoped>
.play-studio{min-height:100dvh;max-width:760px;margin:0 auto;padding:12px 13px calc(150px + env(safe-area-inset-bottom));background:#f3f6fb;color:#172b45;overflow-x:clip}
.play-studio-header{display:flex;align-items:center;gap:11px;padding:15px;border-radius:20px;background:linear-gradient(125deg,#152d4d,#285a91);color:#fff;box-shadow:0 12px 26px #18385c22}
.play-studio-back{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border:1px solid #ffffff40;border-radius:13px;color:#fff;font-size:23px;text-decoration:none}
.play-studio-title{display:grid;gap:2px;flex:1;min-width:0}.play-studio-title>span,.play-step-intro>div>span,.play-panel-heading>div>span{font-size:8px;font-weight:900;letter-spacing:.14em;opacity:.72}.play-studio-title h1{margin:0;color:#fff;font-size:19px;font-weight:950;overflow-wrap:anywhere}.play-studio-title small{color:#d6e4f5;font-size:10px}
.play-live-pill{display:flex;align-items:center;gap:6px;padding:7px 9px;border-radius:30px;background:#ffffff17;font-size:9px;font-weight:900;white-space:nowrap}.play-live-pill i{width:6px;height:6px;border-radius:50%;background:#ffbd54}.play-live-pill.is-open i{background:#69e5a2;box-shadow:0 0 0 4px #69e5a22b}
.play-closed-panel,.play-state-card{display:flex;align-items:center;gap:13px;margin-top:15px;padding:17px;border:1px solid #f0dfb8;border-radius:17px;background:#fff9eb}.play-closed-panel>span,.play-state-card>span{font-size:28px}.play-closed-panel strong,.play-state-card h2{font-size:14px;font-weight:900}.play-closed-panel p,.play-state-card p{margin:3px 0 0;color:#718097;font-size:11px}.play-state-card{display:block;text-align:center;padding:32px 18px}.play-state-card>span{font-size:36px}.play-error{border-color:#f0d6d6;background:#fff}
.play-step-intro{display:flex;align-items:center;justify-content:space-between;margin:20px 2px 12px}.play-step-intro h2{margin:3px 0;font-size:20px;font-weight:950}.play-step-intro p{margin:0;color:#7c8ba0;font-size:10px}.play-step-intro>div>span,.play-panel-heading>div>span{color:#7890ac;opacity:1}.play-step-number{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#e5edf8;color:#315f9f;font-size:16px;font-weight:950}
.play-mode-picker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:13px}.play-mode-picker button{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:7px;min-width:0;padding:11px 9px;border:1px solid #e3eaf3;border-radius:15px;background:#fff;text-align:left;color:#4d6079;transition:border-color .16s,background .16s,transform .16s}.play-mode-picker button.active{border-color:#315f9f;background:#eaf2ff;box-shadow:inset 0 0 0 1px #315f9f1a}.mode-symbol{grid-row:span 2;font-size:21px}.play-mode-picker button>span:nth-child(2){display:grid;min-width:0}.play-mode-picker strong{font-size:11px;font-weight:950}.play-mode-picker small{font-size:8px;color:#8795a8;white-space:nowrap}.play-mode-picker b{grid-column:2;color:#315f9f;font-size:10px}
.play-builder-panel,.play-review-panel{margin-bottom:12px;padding:15px;border:1px solid #e5ebf3;border-radius:18px;background:#fff;box-shadow:0 7px 20px #1b365d09}.play-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}.play-panel-heading h2{margin:3px 0 0;font-size:15px;font-weight:950}.play-panel-emoji{font-size:22px}.play-selection-count{padding:6px 9px;border-radius:30px;background:#edf3fc;color:#315f9f;font-size:9px;font-weight:900;white-space:nowrap}
.play-amount-control{display:flex;gap:7px;flex-wrap:wrap}.play-amount-control>button{min-height:38px;padding:0 12px;border:1px solid #dfe7f1;border-radius:11px;background:#fff;color:#4d6079;font-size:11px;font-weight:900}.play-amount-control>button.active{border-color:#315f9f;background:#315f9f;color:#fff}.play-custom-amount{display:flex;align-items:center;min-height:38px;gap:5px;padding:0 10px;border:1px solid #dfe7f1;border-radius:11px;color:#315f9f;font-size:12px;font-weight:900}.play-custom-amount input{width:80px;border:0;outline:0;color:#172b45;font-size:12px;font-weight:900}.play-helper{margin:10px 0 0;color:#8a98aa;font-size:9px}
.play-number-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.play-number-grid button,.play-digit-grid button{position:relative;display:grid;place-items:center;gap:2px;min-width:0;min-height:57px;padding:7px 3px;border:1px solid #e3eaf3;border-radius:12px;background:#f9fbfe;color:#203550;transition:background .14s,border-color .14s,transform .14s}.play-number-grid button strong{font-size:15px;font-weight:950;font-variant-numeric:tabular-nums}.play-number-grid button span,.play-digit-grid button span{color:#a0adbd;font-size:11px}.play-number-grid button small,.play-digit-grid button small{font-size:8px;font-weight:900}.play-number-grid button.selected,.play-digit-grid button.selected{border-color:#2b9469;background:#e5f7ef;color:#176d4a;box-shadow:inset 0 0 0 1px #2b94691c}.play-number-grid button.selected span,.play-digit-grid button.selected span{display:none}
.play-digit-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.play-digit-grid button{min-height:64px}.play-digit-grid button strong{font-size:21px;font-weight:950}.play-jora-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding:12px;border:1px solid #e7edf4;border-radius:13px}.play-jora-toggle span{display:grid;gap:2px}.play-jora-toggle strong{font-size:11px}.play-jora-toggle small{color:#8997a9;font-size:9px}.play-jora-toggle input{width:42px;height:23px;accent-color:#315f9f}
.play-generated-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.play-generated-grid span{display:grid;gap:3px;padding:9px 5px;border:1px solid #dceee5;border-radius:11px;background:#f0faf5;text-align:center}.play-generated-grid strong{font-size:14px;color:#176d4a}.play-generated-grid small{font-size:9px;color:#5c8b73}.play-empty-combinations{display:grid;justify-items:center;gap:4px;padding:20px 8px;color:#8b98aa}.play-empty-combinations span{font-size:27px}.play-empty-combinations strong{color:#4d6079;font-size:11px}.play-empty-combinations small{font-size:9px}
.play-review-panel{border-color:#dce7f5;background:#f9fbff}.play-review-row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #e9eff6;color:#78889e;font-size:10px}.play-review-row strong{color:#263d5a;font-size:10px}.play-review-picks{padding:10px;border-radius:10px;background:#edf3fc;color:#365b86;font-size:9px;line-height:1.7;overflow-wrap:anywhere}.play-review-total{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px}.play-review-total span{font-size:11px;font-weight:800}.play-review-total strong{font-size:20px;font-weight:950;color:#234f83}.play-review-note{margin:8px 0 0;color:#8795a8;font-size:9px}
.play-submit-spacer{height:10px}.play-submit-dock{position:fixed;right:0;bottom:0;left:0;z-index:1010;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px max(14px,calc((100vw - 730px)/2)) calc(12px + env(safe-area-inset-bottom));border-top:1px solid #e2eaf3;background:#ffffffed;box-shadow:0 -8px 25px #1b365d12;backdrop-filter:blur(15px)}.play-submit-dock>div{display:grid;gap:1px}.play-submit-dock small{color:#8795a8;font-size:8px;font-weight:900;letter-spacing:.12em}.play-submit-dock strong{color:#203d60;font-size:19px;font-weight:950}.play-submit-dock>div span{color:#8b98a9;font-size:9px}.play-submit-dock button{display:flex;align-items:center;gap:10px;min-height:45px;padding:0 18px;border:0;border-radius:13px;background:#244f82;color:#fff;font-size:11px;font-weight:900}.play-submit-dock button:disabled{background:#b7c3d1;color:#f8fafc}.play-submit-dock button span{font-size:17px}
@media(min-width:620px){.play-number-grid{grid-template-columns:repeat(10,minmax(0,1fr))}.play-digit-grid{grid-template-columns:repeat(10,minmax(0,1fr))}.play-generated-grid{grid-template-columns:repeat(8,minmax(0,1fr))}.play-studio{padding-right:20px;padding-left:20px}}
@media(max-width:360px){.play-studio{padding-right:9px;padding-left:9px}.play-mode-picker{gap:5px}.play-mode-picker button{padding:9px 6px;gap:5px}.mode-symbol{font-size:18px}.play-mode-picker strong{font-size:10px}.play-mode-picker small{font-size:7px}.play-number-grid{gap:5px}.play-number-grid button{min-height:51px}.play-submit-dock button{padding:0 13px;font-size:10px}}
@media(prefers-reduced-motion:reduce){.play-mode-picker button,.play-number-grid button,.play-digit-grid button{transition:none}}
</style>