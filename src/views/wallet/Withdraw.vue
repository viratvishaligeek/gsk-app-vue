<template>
  <div class="withdraw-page pb-5">
    <main class="container-fluid px-3 gsk-payment-flow">
      <header class="payment-screen-header"><router-link to="/wallet" class="payment-back" aria-label="Back to wallet">←</router-link><div class="payment-screen-heading"><small>WALLET SERVICES</small><h1>Withdraw money</h1><p>Choose a payout method and enter your details.</p></div></header>
      
      <transition name="slide-fade">
        <div v-if="apiMessage.text" class="api-message" :class="apiMessage.type === 'error'
          ? 'message-error'
          : 'message-success'
          ">
          <div class="message-icon">
            <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
          </div>
          <div class="flex-grow-1">
            {{ apiMessage.text }}
          </div>
          <button type="button" class="message-close" @click="apiMessage.text = ''">
            ×
          </button>
        </div>
      </transition>
      <form @submit.prevent="handleWithdraw" enctype="multipart/form-data" novalidate>
        <section class="withdraw-card">
          <div class="section-heading">
            <div class="section-icon">
              <span class="fs-2">🪙</span>
            </div>
            <div>
              <strong>Withdraw money</strong>
              <small>
                Choose where you want to receive your funds
              </small>
            </div>
          </div>
          <div class="field-label">
            Withdrawal mode
          </div>
          <div class="destination-grid">
            <button type="button" class="destination-option" :class="{
              selected: transferMode === 'upi'
            }" @click="transferMode = 'upi'">
              <span class="destination-icon upi">
                <span class="gsk-emoji-icon" aria-hidden="true">▦</span>
              </span>
              <span class="destination-text">
                <strong>UPI</strong>
                <small>
                  UPI ID or QR code
                </small>
              </span>
              <span class="destination-radio">
                <span></span>
              </span>
            </button>
            <button type="button" class="destination-option" :class="{
              selected: transferMode === 'bank'
            }" @click="transferMode = 'bank'">
              <span class="destination-icon bank">
                <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
              </span>
              <span class="destination-text">
                <strong>Bank Account</strong>
                <small>
                  Direct bank transfer
                </small>
              </span>
              <span class="destination-radio">
                <span></span>
              </span>
            </button>
          </div>
          <div class="form-field amount-field">
            <div class="field-label-row">
              <label class="field-label">
                Withdrawal amount
              </label>
              <span class="minimum-label">
                Min ₹{{ formatCurrency(minWithdrawAmount) }}
              </span>
            </div>
            <div class="amount-input" :class="{
              invalid: errors.amount
            }">
              <span class="amount-symbol">
                ₹
              </span>
              <input v-model.number="form.amount" type="number" min="1" inputmode="decimal" placeholder="0"
                autocomplete="off" @input="errors.amount = ''" />
              <span class="amount-currency">
                INR
              </span>
            </div>
            <div v-if="errors.amount" class="field-error">
              <span class="gsk-emoji-icon" aria-hidden="true">❗</span>
              {{ errors.amount }}
            </div>
          </div>
          <div class="quick-amounts">
            <button v-for="amount in quickWithdrawAmounts" :key="amount" type="button" :class="{
              selected:
                Number(form.amount) === amount
            }" @click="
              form.amount =
              Math.max(
                amount,
                minWithdrawAmount
              )
              ">
              ₹{{ formatCurrency(amount) }}
            </button>
          </div>
          <div v-if="transferMode === 'bank'" class="details-panel">
            <div class="details-heading">
              <span class="details-heading-icon">
                <span class="gsk-emoji-icon" aria-hidden="true">🏦</span>
              </span>
              <div>
                <strong>Bank details</strong>
                <small>
                  Enter details exactly as registered
                </small>
              </div>
            </div>
            <div class="form-field">
              <label class="field-label">
                Account holder name
              </label>
              <div class="text-input">
                <span class="gsk-emoji-icon" aria-hidden="true">👤</span>
                <input type="text" v-model="form.accountName" placeholder="Name as per bank account"
                  autocomplete="name" />
              </div>
            </div>
            <div class="form-field">
              <label class="field-label">
                Account number
              </label>
              <div class="text-input">
                <span class="gsk-emoji-icon" aria-hidden="true">💳</span>
                <input type="text" v-model="form.accountNumber" class="font-monospace"
                  placeholder="Enter account number" autocomplete="off" />
              </div>
            </div>
            <div class="form-field">
              <label class="field-label">
                IFSC code
              </label>
              <div class="text-input">
                <span class="gsk-emoji-icon" aria-hidden="true">📷</span>
                <input type="text" v-model="form.ifsc" class="text-uppercase font-monospace"
                  placeholder="e.g. SBIN0001234" autocomplete="off" />
              </div>
            </div>
          </div>
          <div v-else class="details-panel">
            <div class="details-heading">
              <span class="details-heading-icon upi-heading">
                <span class="gsk-emoji-icon" aria-hidden="true">📱</span>
              </span>
              <div>
                <strong>UPI details</strong>
                <small>
                  Enter UPI ID or upload QR
                </small>
              </div>
            </div>
            <div class="form-field">
              <label class="field-label">
                UPI ID
              </label>
              <div class="text-input">
                <span class="gsk-emoji-icon" aria-hidden="true">✉️</span>
                <input type="text" v-model="form.upiId" placeholder="username@upi" autocomplete="off" />
              </div>
            </div>
            <!-- QR -->
            <div class="form-field">
              <div class="field-label-row">
                <label class="field-label">
                  UPI QR code
                </label>
                <span class="optional-label">
                  Optional
                </span>
              </div>
              <div class="qr-upload-box" :class="{
                'has-preview': qrPreviewUrl
              }">
                <div v-if="qrPreviewUrl" class="qr-preview-wrap">
                  <img :src="qrPreviewUrl" alt="UPI QR Preview" class="qr-preview" />
                  <button type="button" class="qr-remove" @click="removeQrCode">
                    <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
                  </button>
                  <div class="qr-preview-label">
                    <span class="gsk-emoji-icon" aria-hidden="true">✅</span>
                    QR selected
                  </div>
                </div>
                <label v-else class="qr-empty">
                  <input type="file" accept="image/png,image/jpeg,image/webp" @change="handleQrUpload" />
                  <div class="qr-upload-icon">
                    <span class="gsk-emoji-icon" aria-hidden="true">☁️</span>
                  </div>
                  <strong>
                    Upload UPI QR
                  </strong>
                  <small>
                    PNG, JPG or WEBP • Max 2MB
                  </small>
                  <span class="qr-upload-action">
                    Choose image
                  </span>
                </label>
              </div>
              <div v-if="errors.qrImage" class="field-error">
                <span class="gsk-emoji-icon" aria-hidden="true">❗</span>
                {{ errors.qrImage }}
              </div>
            </div>
          </div>
          <button type="submit" class="withdraw-button" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
            <template v-else>
              <span class="withdraw-button-left">
                <span class="gsk-emoji-icon" aria-hidden="true">🔐</span>
                Secure Withdrawal
              </span>
              <span class="withdraw-button-right">
                ₹{{ formatCurrency(form.amount) }}
                <span class="gsk-emoji-icon" aria-hidden="true">→</span>
              </span>
            </template>
          </button>
          <div class="secure-note">
            <span class="gsk-emoji-icon" aria-hidden="true">🛡️</span>
            Your withdrawal request is processed securely.
          </div>
        </section>
      </form>
      <section class="pending-section">
        <div class="section-heading pending-heading">
          <div>
            <strong>Pending withdrawals</strong>
            <small>
              Your recent withdrawal requests
            </small>
          </div>
          <button type="button" class="refresh-btn" :class="{
            spinning: pendingLoading
          }" @click="loadPendingWithdrawals">
            <span class="gsk-emoji-icon" aria-hidden="true">↻</span>
          </button>
        </div>
        <!-- Loading -->
        <div v-if="
          pendingLoading &&
          pendingWithdrawals.length === 0
        " class="pending-loading">
          <div class="spinner-border spinner-border-sm"></div>
          <span>
            Loading withdrawals...
          </span>
        </div>
        <!-- Empty -->
        <div v-else-if="
          !pendingLoading &&
          pendingWithdrawals.length === 0
        " class="empty-pending">
          <div class="empty-icon">
            <span class="gsk-emoji-icon" aria-hidden="true">↗️</span>
          </div>
          <strong>
            No pending withdrawals
          </strong>
          <span>
            Your recent withdrawal requests will appear here.
          </span>
        </div>
        <!-- List -->
        <div v-else class="pending-list">
          <div v-for="withdrawal in pendingWithdrawals" :key="withdrawal.id" class="pending-item">
            <div class="pending-left">
              <div class="pending-icon">
                <span class="gsk-emoji-icon" aria-hidden="true">↗️</span>
              </div>
              <div>
                <strong>
                  ₹{{ formatCurrency(withdrawal.amount) }}
                </strong>
                <small>
                  {{ formatWithdrawalDate(withdrawal.created_at) }}
                </small>
              </div>
            </div>
            <div class="pending-right">
              <span class="status-pill" :class="getStatusClass(
                withdrawal.status
              )
                ">
                <span class="status-dot"></span>
                {{
                  formatStatus(
                    withdrawal.status
                  )
                }}
              </span>
              <small>
                {{
                  withdrawal.mode === 'upi'
                    ? 'UPI'
                    : 'Bank'
                }}
              </small>
            </div>
          </div>
        </div>
      </section>
      <div class="page-footer-note">
        <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
        Withdrawal requests are reviewed and processed securely.
      </div>
    </main>
  </div>
</template>


<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/utils/auth'
import api from '@/plugins/axios'
import { playNotificationSound } from '@/services/notificationAudio'
import { useSettings } from '@/composables/useSettings'


const router = useRouter()
const authStore = useAuthStore()

const {
  loadSettings,
  getSetting,
} = useSettings()


const isLoading = ref(false)
const transferMode = ref('bank')
const qrPreviewUrl = ref(null)

const balance = ref(
  Number(
    authStore.user?.balance || 0
  )
)


const form = reactive({
  amount: '',
  accountName: '',
  accountNumber: '',
  ifsc: '',
  upiId: '',
  qrImage: null,
})

const populateWithdrawalDetails = () => {
  const user = authStore.user
  if (!user) return
  form.accountName = user.account_holder_name || user.holdername || ''
  form.accountNumber = user.account_number || user.acc || ''
  form.ifsc = user.ifsc_code || user.ifsc || ''
}


const errors = reactive({
  amount: '',
  qrImage: '',
})


const apiMessage = reactive({
  text: '',
  type: 'error',
})


const minWithdrawAmount = computed(() => {
  return Number(getSetting('min_withdraw', 1)) || 1
})

const maxWithdrawAmount = computed(() => {
  const configuredMaximum = Number(getSetting('max_withdraw', 0)) || 0
  return configuredMaximum > 0
    ? Math.min(configuredMaximum, 1000000)
    : 1000000
})

const availableBalance = computed(() => {
  return Number(
    balance.value || 0
  )

})




const quickWithdrawAmounts = computed(() => {
  const minimum =
    minWithdrawAmount.value

  const defaults = [
    100,
    500,
    1000,
    2000,
  ]

  const amounts = [
    minimum,
    ...defaults,
  ]

  return [
    ...new Set(
      amounts.filter(
        amount =>
          amount >= minimum
      )
    ),
  ].slice(0, 4)

})




let pendingTimer = null


const PENDING_WITHDRAWAL_ENDPOINT =
  '/wallet/get-money-request'

const pendingWithdrawals =
  ref([])

const pendingLoading =
  ref(false)

const formatCurrency = (value) => {
  return new Intl.NumberFormat(
    'en-IN',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value || 0)
  )

}




const formatWithdrawalDate = (
  value
) => {
  if (!value) {
    return '--'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value)
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }
  )

}




const formatStatus = (
  status
) => {
  const value =
    String(
      status || ''
    ).toLowerCase()

  const map = {
    pending: 'Pending',
    processing: 'Processing',
    approved: 'Approved',
    success: 'Success',
    completed: 'Completed',
    rejected: 'Rejected',
    failed: 'Failed',
  }

  return (
    map[value] ||
    'Pending'
  )

}


const getStatusClass = (
  status
) => {
  const value =
    String(
      status || ''
    ).toLowerCase()

  if (
    value === 'approved' ||
    value === 'success' ||
    value === 'completed'
  ) {
    return 'status-success'
  }

  if (
    value === 'rejected' ||
    value === 'failed'
  ) {
    return 'status-danger'
  }

  return 'status-pending'

}




const loadBalance = async () => {
  try {
    const response =
      await api.get(
        '/wallet'
      )
    if (
      response.data?.success
    ) {
      balance.value =
        Number(
          response.data.data.available_balance ??
          response.data.data.balance ??
          0
        )
    }
  } catch (error) {
    console.error(
      'Balance error:',
      error
    )
  }

}




const handleQrUpload = (
  event
) => {
  const file =
    event.target.files?.[0]

  if (!file) {
    return
  }

  if (
    ![
      'image/png',
      'image/jpeg',
      'image/webp',
    ].includes(file.type)
  ) {
    errors.qrImage =
      'Please upload PNG, JPG or WEBP.'
    return
  }

  if (
    file.size >
    15 * 1024 * 1024
  ) {
    errors.qrImage =
      'File size must not exceed 15 MB.'
    return
  }

  errors.qrImage = ''
  form.qrImage = file

  if (qrPreviewUrl.value) {
    URL.revokeObjectURL(
      qrPreviewUrl.value
    )
  }

  qrPreviewUrl.value =
    URL.createObjectURL(
      file
    )

}




const removeQrCode = () => {
  form.qrImage = null

  if (qrPreviewUrl.value) {
    URL.revokeObjectURL(
      qrPreviewUrl.value
    )
  }

  qrPreviewUrl.value =
    null

}




const handleWithdraw = async () => {
  apiMessage.text = ''
  errors.amount = ''
  errors.qrImage = ''

  const amount =
    Number(form.amount)

  /*
 * Basic validation
 */
  if (
    !amount ||
    Number.isNaN(amount) ||
    amount <= 0
  ) {
    errors.amount =
      'Enter a valid withdrawal amount.'
    return
  }

  /*
   * Minimum withdrawal
   */
  if (
    amount <
    minWithdrawAmount.value
  ) {
    errors.amount =
      `Minimum withdrawal amount is ₹${formatCurrency(minWithdrawAmount.value)}.`
    return
  }
  if (
    maxWithdrawAmount.value > 0 &&
    amount > maxWithdrawAmount.value
  ) {
    errors.amount =
      `Maximum withdrawal amount is ₹${formatCurrency(maxWithdrawAmount.value)}.`
    return
  }

  /*
   * Balance
   */
  if (
    amount >
    availableBalance.value
  ) {
    errors.amount =
      'Amount exceeds available balance.'
    return
  }

  /*
   * Bank validation
   */
  if (
    transferMode.value === 'bank' &&
    (
      !form.accountName ||
      !form.accountNumber ||
      !form.ifsc
    )
  ) {
    apiMessage.type =
      'error'
    apiMessage.text =
      'Please enter complete bank details.'
    return
  }

  /*
   * UPI validation
   */
  if (
    transferMode.value === 'upi' &&
    !form.upiId
  ) {
    apiMessage.type =
      'error'
    apiMessage.text =
      'Please enter your UPI ID.'
    return
  }

  isLoading.value = true

  try {
    const formData =
      new FormData()
    formData.append(
      'amount',
      amount
    )
    formData.append(
      'mode',
      transferMode.value
    )
    if (
      transferMode.value === 'bank'
    ) {
      formData.append(
        'account_name',
        form.accountName
      )
      formData.append(
        'account_number',
        form.accountNumber
      )
      formData.append(
        'ifsc',
        form.ifsc.toUpperCase()
      )
    }
    if (
      transferMode.value === 'upi'
    ) {
      formData.append(
        'upi_id',
        form.upiId
      )
      if (form.qrImage) {
        formData.append(
          'qr_code_image',
          form.qrImage
        )
      }
    }
    const response =
      await api.post(
        '/wallet/withdraw',
        formData
      )
    if (
      response.data?.success
    ) {
      void playNotificationSound('withdraw', `withdraw-${response.data?.data?.id || Date.now()}`)
      apiMessage.type =
        'success'
      apiMessage.text =
        response.data.message ||
        'Withdrawal request submitted successfully.'
      await loadBalance()
      await loadPendingWithdrawals()
      setTimeout(() => {
        router.push(
          '/wallet'
        )
      }, 1500)
    }
  } catch (error) {
    console.error(
      'Withdrawal error:',
      error
    )
    apiMessage.type =
      'error'
    apiMessage.text =
      error.response?.data?.message ||
      'Withdrawal failed. Try again.'
  } finally {
    isLoading.value =
      false
  }

}




const loadPendingWithdrawals =
  async () => {
    pendingLoading.value =
      true
    try {
      const response =
        await api.get(
          PENDING_WITHDRAWAL_ENDPOINT,
          {
            params: {
              statuses: ['pending', 'processing'],
              type: 'debit',
            },
          }
        )
      const responseData =
        response.data
      let list =
        responseData?.data
      if (
        list &&
        !Array.isArray(list) &&
        Array.isArray(
          list.data
        )
      ) {
        list =
          list.data
      }
      pendingWithdrawals.value =
        Array.isArray(list)
          ? list.map((item) => ({
            ...item,
            mode: item.mode || item.payment_method || '',
          }))
          : []
    } catch (error) {
      console.error(
        'Pending withdrawals error:',
        error
      )
    } finally {
      pendingLoading.value =
        false
    }
  }





const startPendingRefresh =
  () => {
    if (pendingTimer) {
      clearInterval(
        pendingTimer
      )
    }
    pendingTimer =
      setInterval(() => {
        if (document.visibilityState === 'visible') void loadPendingWithdrawals()
      }, 60000)
  }




onMounted(async () => {
  populateWithdrawalDetails()
  await Promise.all([
    loadBalance(),
    loadSettings([
      'min_withdraw',
    ]),
    loadPendingWithdrawals(),
  ])
startPendingRefresh()

})


onBeforeUnmount(() => {
  if (pendingTimer) {
    clearInterval(
      pendingTimer
    )
    pendingTimer = null
  }

  if (qrPreviewUrl.value) {
    URL.revokeObjectURL(
      qrPreviewUrl.value
    )
  }

})
</script><style scoped>
.add-money-page,.withdraw-page{min-height:100dvh;background:#f4f7fb;color:#1e2c42}.gsk-payment-flow{max-width:720px;margin:0 auto;padding-top:15px;padding-bottom:calc(105px + env(safe-area-inset-bottom))}
.payment-screen-header{display:flex;align-items:center;gap:12px;margin:3px 0 17px}.payment-screen-header .payment-back{display:grid;place-items:center;width:40px;height:40px;border:1px solid #e3eaf3;border-radius:12px;background:#fff;color:#315f9f;font-size:20px}.payment-screen-heading{display:grid;gap:1px}.payment-screen-heading small{color:#8a98aa;font-size:9px;font-weight:900;letter-spacing:.13em}.payment-screen-heading h1{margin:0;font-size:21px;font-weight:900}.payment-screen-heading p{margin:2px 0 0;color:#7b899d;font-size:10px}
.amount-card,.payment-card,.withdraw-card,.pending-section,.details-panel{margin-bottom:12px;padding:16px;border:1px solid #e5ebf3;border-radius:17px;background:#fff;box-shadow:0 7px 20px #1b365d0a}.section-label,.section-heading,.details-heading{display:flex;align-items:center;gap:11px;margin-bottom:14px}.section-label>div,.section-heading>div,.details-heading>div{display:grid}.section-label strong,.section-heading h6,.details-heading strong{margin:0;color:#263a55;font-size:13px;font-weight:900}.section-label small,.section-heading span,.details-heading small{color:#8290a3;font-size:10px}.section-icon,.details-heading-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#edf3fc;color:#315f9f;font-size:23px}.amount-input-box,.amount-input{display:flex;align-items:center;gap:10px;min-height:68px;padding:10px 13px;border:1px solid #dfe7f1;border-radius:14px;background:#f7f9fc}.amount-input-box input,.amount-input input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#244e83;font-size:31px;font-weight:950}.rupee-symbol,.amount-symbol{color:#315f9f;font-size:26px;font-weight:900}.amount-suffix,.amount-currency{color:#8a97a8;font-size:10px;font-weight:850}.quick-amounts{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.quick-amounts button{flex:1 1 68px;min-height:38px;border:1px solid #dfe6ef;border-radius:10px;background:#fff;color:#50627c;font-size:10px;font-weight:850}.quick-amounts button.selected{border-color:#315f9f;background:#edf3fc;color:#244e83}
.payment-card .section-heading{justify-content:space-between}.secured-pill{padding:6px 9px;border-radius:30px;background:#e4f5eb;color:#237b55;font-size:9px;font-weight:850}.gateway-option,.manual-option,.destination-option{margin-top:9px;padding:13px;border:1px solid #e3eaf2;border-radius:13px;background:#fff;cursor:pointer}.gateway-option.selected,.manual-option.selected,.destination-option.selected{border-color:#315f9f;background:#f4f8ff;box-shadow:0 0 0 2px #315f9f14}.gateway-top,.manual-option-inner{display:flex;align-items:center;gap:10px}.gateway-radio,.destination-radio{display:grid;place-items:center;width:19px;height:19px;flex:0 0 19px;border:1.5px solid #b7c3d2;border-radius:50%}.selected .gateway-radio,.selected .destination-radio{border-color:#315f9f}.selected .gateway-radio span,.selected .destination-radio span{width:9px;height:9px;border-radius:50%;background:#315f9f}.gateway-main,.manual-content,.destination-text{display:grid;flex:1;gap:2px}.gateway-title-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.gateway-title-row strong,.manual-content strong,.destination-text strong{font-size:12px;font-weight:850}.gateway-main small,.manual-content small,.destination-text small{font-size:9px;color:#8391a3}.recommended-badge{padding:4px 7px;border-radius:30px;background:#e4f5eb;color:#217b54;font-size:8px;font-weight:850}.gateway-lightning,.manual-icon{font-size:23px}.upi-apps{display:flex;justify-content:space-between;gap:8px;margin:13px 0 8px;padding:10px;border-radius:11px;background:#f7f9fc}.upi-app{display:grid;justify-items:center;gap:4px}.upi-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#fff}.upi-app small{font-size:8px;color:#6d7c90}.upi-app img{max-width:26px;max-height:22px;object-fit:contain}.gateway-note,.secure-footer{display:flex;align-items:center;gap:7px;color:#7f8da0;font-size:9px}.gateway-note{padding-top:9px;border-top:1px solid #e8edf4}.api-message{display:flex;align-items:center;gap:10px;margin:10px 0;padding:12px;border:1px solid #e4eaf2;border-radius:12px;background:#fff;font-size:11px}.message-error{border-color:#f1d2d5;background:#fff7f7;color:#a94c55}.message-success{border-color:#cdebd9;background:#f4fbf6;color:#267a53}.message-close{border:0;background:transparent;font-size:20px}.pay-button,.withdraw-submit{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:54px;margin-top:12px;padding:13px 16px;border:0;border-radius:13px;background:#244e83;color:#fff;font-size:12px;font-weight:900}.pay-button:disabled,.withdraw-submit:disabled{opacity:.6}.pay-button-left{display:flex;align-items:center;gap:8px}.pay-button-amount{display:flex;align-items:center;gap:9px}.secure-footer{justify-content:center;padding:11px}.pending-section .section-heading{justify-content:space-between}.pending-section .section-heading h6{font-size:13px;font-weight:900}.refresh-btn{width:35px;height:35px;border:1px solid #e2e9f2;border-radius:10px;background:#f7f9fc;color:#315f9f;font-size:19px}.pending-item,.pending-payment,.withdrawal-item{padding:12px 0;border-bottom:1px solid #edf1f6}.pending-item:last-child,.pending-payment:last-child,.withdrawal-item:last-child{border-bottom:0}.destination-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.destination-option{display:flex;align-items:center;gap:8px;text-align:left}.destination-icon{font-size:22px}.field-label,.field-label-row label{display:block;margin:12px 0 6px;color:#5d6e85;font-size:10px;font-weight:850}.form-field{margin-top:12px}.text-input{display:flex;align-items:center;gap:9px;min-height:47px;padding:0 11px;border:1px solid #dfe6ef;border-radius:11px;background:#f8fafd}.text-input input{min-width:0;flex:1;border:0;outline:0;background:transparent;font-size:12px}.field-error{display:block;margin-top:5px;color:#bd535b;font-size:9px}.status-success{color:#217b54;background:#e5f5ec}.status-danger{color:#b64f58;background:#fcebed}.status-pending{color:#956d22;background:#fff3dc}.activity-section{display:none}.withdraw-card .section-heading{margin-bottom:16px}.details-heading{margin-bottom:10px}.amount-field .field-label-row{display:flex;justify-content:space-between;align-items:center}.minimum-label{font-size:9px;color:#8996a8}.withdraw-page .container-fluid{max-width:720px;margin:0 auto}.withdraw-page .pending-section{margin-top:13px}.withdraw-page .form-footer{display:flex;justify-content:space-between;gap:10px}.withdraw-page .pay-button,.withdraw-page .withdraw-submit{background:#244e83}.secure-footer{padding-bottom:5px}
@media(max-width:420px){.gsk-payment-flow{padding-inline:11px}.amount-card,.payment-card,.withdraw-card,.pending-section{padding:13px}.upi-apps{gap:4px}.upi-app small{font-size:7px}.destination-grid{grid-template-columns:1fr}.payment-screen-heading h1{font-size:19px}}

.pending-section{margin-top:13px}.pending-section .section-heading{justify-content:space-between}.pending-heading>div{display:grid}.pending-heading strong{font-size:13px;font-weight:900}.pending-heading small{font-size:9px;color:#8492a6}.pending-loading,.empty-pending{display:grid;justify-items:center;gap:7px;padding:22px 12px;color:#7e8ca0;font-size:10px}.empty-pending .empty-icon{font-size:29px}.empty-pending strong{color:#31435c;font-size:11px}.pending-list{display:grid}.pending-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #edf1f6}.pending-item:last-child{border-bottom:0}.pending-left{display:flex;align-items:center;gap:9px;min-width:0}.pending-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#edf3fc;font-size:20px}.pending-left>div:last-child{display:grid}.pending-left strong{font-size:11px}.pending-left small,.pending-right small{font-size:8px;color:#8996a8}.pending-right{display:grid;justify-items:end;gap:4px}.status-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:30px;font-size:8px;font-weight:850}.status-dot{width:6px;height:6px;border-radius:50%;background:currentColor}.qr-upload-box{overflow:hidden;border:1px dashed #b9c9dc;border-radius:13px;background:#f8fafd}.qr-empty{display:grid;justify-items:center;gap:6px;padding:18px;text-align:center;cursor:pointer}.qr-empty input{position:absolute;width:1px;height:1px;opacity:0}.qr-upload-icon{font-size:28px}.qr-empty strong{font-size:11px}.qr-empty small{color:#8996a8;font-size:9px}.qr-upload-action{padding:7px 11px;border-radius:9px;background:#eaf1fc;color:#315f9f;font-size:9px;font-weight:850}.qr-preview-wrap{position:relative;display:grid;justify-items:center;gap:8px;padding:14px}.qr-preview{max-width:190px;max-height:180px;border-radius:10px;object-fit:contain}.qr-remove{position:absolute;top:9px;right:9px;width:31px;height:31px;border:0;border-radius:50%;background:#fff0f0;color:#c75b61}.qr-preview-label{font-size:9px;font-weight:850;color:#21865e}.withdraw-button{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:54px;margin-top:12px;padding:13px 16px;border:0;border-radius:13px;background:#244e83;color:#fff;font-size:12px;font-weight:900}.withdraw-button:disabled{opacity:.6}.withdraw-button-left,.withdraw-button-right{display:flex;align-items:center;gap:8px}.secure-note,.page-footer-note{display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;color:#7f8da0;font-size:9px}.optional-label{font-size:9px;color:#8996a8}
</style>