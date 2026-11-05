<template>
  <div class="add-money-page pb-5">

    <main class="container-fluid px-3 gsk-payment-flow">
      <header class="payment-screen-header"><router-link to="/wallet" class="payment-back" aria-label="Back to wallet">←</router-link><div class="payment-screen-heading"><small>WALLET SERVICES</small><h1>Add money</h1><p>Choose an amount and payment method.</p></div></header>
      <section class="payment-journey" aria-label="Add money steps">
        <div class="is-current"><span>1</span><small>Amount</small></div><i></i>
        <div><span>2</span><small>Method</small></div><i></i>
        <div><span>3</span><small>Confirm</small></div>
      </section>
      <section class="payment-security-strip"><span>🛡️</span><div><strong>Protected payment journey</strong><small>Choose your amount, select UPI and verify your transaction.</small></div><span class="payment-security-tag">SECURE</span></section>


      <section class="amount-card">
        <div class="section-label">
          <span class="section-icon green">
            <span class="gsk-emoji-icon" aria-hidden="true">🗃️</span>
          </span>
          <div>
            <strong>Add money</strong>
            <small>Choose how much you want to add</small>
          </div>
        </div>
        <div class="amount-input-box">
          <span class="rupee-symbol">₹</span>
          <input v-model.number="form.amount" type="number" min="1" inputmode="decimal" placeholder="0"
            aria-label="Amount" />
          <span class="amount-suffix">INR</span>
        </div>
        <div class="quick-amounts">
          <button v-for="amount in quickAmounts" :key="amount" type="button"
            :class="{ selected: Number(form.amount) === amount }" @click="form.amount = amount">
            ₹{{ amount.toLocaleString('en-IN') }}
          </button>
        </div>
      </section>

      <section class="payment-card">
        <div class="section-heading">
          <div>
            <h6>Choose payment method</h6>
            <span>Fast & secure payment</span>
          </div>
          <span class="secured-pill">
            <span class="gsk-emoji-icon" aria-hidden="true">🔒</span>
            Secure
          </span>
        </div>
        <!-- AUTOMATIC GATEWAY -->
        <div v-if="gatewayEnabled" class="gateway-option" :class="{ selected: form.paymentMethod === 'gateway' }"
          @click="form.paymentMethod = 'gateway'">
          <div class="gateway-top">
            <div class="gateway-radio">
              <span></span>
            </div>
            <div class="gateway-main">
              <div class="gateway-title-row">
                <strong>UPI Payment</strong>
                <span class="recommended-badge">
                  Recommended
                </span>
              </div>
              <small>
                Pay instantly using your preferred UPI app
              </small>
            </div>
            <div class="gateway-lightning">
              <span class="gsk-emoji-icon" aria-hidden="true">⚡</span>
            </div>
          </div>
          <!-- UPI APP STYLE -->
          <div class="upi-apps">
            <div class="upi-app">
              <div class="upi-icon">
                <img src="../../assets/img/gpay.jpg" height="20px" alt="">
              </div>
              <small>Google Pay</small>
            </div>
            <div class="upi-app">
              <div class="upi-icon">
                <img src="../../assets/img/phone.jpg" height="20px" alt="">
              </div>
              <small>PhonePe</small>
            </div>
            <div class="upi-app">
              <div class="upi-icon">
                <img src="../../assets/img/paytm.jpg" height="20px" alt="">
              </div>
              <small>Paytm</small>
            </div>
            <div class="upi-app">
              <div class="upi-icon bhim">
                <img src="../../assets/img/bhim.jpg" height="20px" alt="">
              </div>
              <small>BHIM</small>
            </div>
            <div class="upi-app">
              <div class="upi-icon more">
                <span class="gsk-emoji-icon" aria-hidden="true">⋯</span>
              </div>
              <small>More</small>
            </div>
          </div>
          <div class="gateway-note">
            <span class="gsk-emoji-icon" aria-hidden="true">🛡️</span>
            You'll be redirected to the secure payment page.
          </div>
        </div>
        <!-- MANUAL UPI -->
        <div class="manual-option" :class="{ selected: form.paymentMethod === 'manual_upi' }"
          @click="form.paymentMethod = 'manual_upi'">
          <div class="manual-option-inner">
            <div class="gateway-radio">
              <span></span>
            </div>
            <div class="manual-icon">
              <span class="gsk-emoji-icon" aria-hidden="true">📷</span>
            </div>
            <div class="manual-content">
              <strong>Manual UPI</strong>
              <small>
                Pay by QR and submit UTR
              </small>
            </div>
            <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
          </div>
        </div>
      </section>

      <transition name="slide-fade">
        <div v-if="apiMessage.text" class="api-message"
          :class="apiMessage.type === 'error' ? 'message-error' : 'message-success'">
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
      <button type="button" class="pay-button" :disabled="isLoading" @click="handleAddMoney">
        <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
        <template v-else>
          <span class="pay-button-left">
            <span class="gsk-emoji-icon" aria-hidden="true">🔒</span>
            Secure Payment
          </span>
          <span class="pay-button-amount">
            ₹{{ formatCurrency(form.amount) }}
            <span class="gsk-emoji-icon" aria-hidden="true">→</span>
          </span>
        </template>
      </button>

      <div class="secure-footer">
        <span class="gsk-emoji-icon" aria-hidden="true">🛡️</span>
        Your payment is processed securely.
      </div>

      <section class="pending-section">
        <div class="section-heading pending-heading">
          <div>
            <h6>Pending payments</h6>
            <span>Your recent add-money requests</span>
          </div>
          <button type="button" class="refresh-btn" :class="{ spinning: pendingLoading }" @click="loadPendingPayments">
            <span class="gsk-emoji-icon" aria-hidden="true">↻</span>
          </button>
        </div>
        <!-- LOADING -->
        <div v-if="pendingLoading && pendingPayments.length === 0" class="pending-loading">
          <div class="spinner-border spinner-border-sm"></div>
          <span>Loading requests...</span>
        </div>
        <!-- EMPTY -->
        <div v-else-if="!pendingLoading && pendingPayments.length === 0" class="empty-pending">
          <div class="empty-icon">
            <span class="gsk-emoji-icon" aria-hidden="true">🧾</span>
          </div>
          <strong>No pending payments</strong>
          <span>
            Your pending add-money requests will appear here.
          </span>
        </div>
        <!-- TABLE / LIST -->
        <div v-else class="pending-list">
          <div v-for="payment in pendingPayments" :key="payment.id" class="pending-item">
            <div class="pending-item-left">
              <div class="pending-payment-icon">
                <span class="gsk-emoji-icon" aria-hidden="true">↙️</span>
              </div>
              <div>
                <strong>
                  ₹{{ formatCurrency(payment.amount) }}
                </strong>
                <small>
                  {{ formatPaymentDate(payment.created_at) }}
                </small>
              </div>
            </div>
            <div class="pending-item-right">
              <span class="status-pill" :class="getStatusClass(payment.status)">
                <span class="status-dot"></span>
                {{ formatStatus(payment.status) }}
              </span>
              <small v-if="payment.utr">
                UTR: {{ payment.utr }}
              </small>
              <button
                v-if="payment.payment_method === 'gateway' && payment.gateway_payment_url && ['pending', 'processing'].includes(String(payment.status).toLowerCase())"
                type="button" class="resume-payment-btn" @click="resumeGatewayPayment(payment)">
                Resume payment
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>


    <transition name="modal">
      <div v-if="showGatewayModal" class="modal-backdrop-custom gateway-payment-backdrop"
        @click.self="closeGatewayPayment" @keydown.esc.window="closeGatewayPayment">
        <div class="manual-modal gateway-payment-modal">
          <div class="modal-header-custom">
            <div class="modal-title-wrap">
              <div class="modal-upi-icon"><span class="gsk-emoji-icon" aria-hidden="true">📷</span></div>
              <div>
                <h5>Complete UPI payment</h5>
                <small>₹{{ formatCurrency(gatewayPaymentAmount) }}</small>
              </div>
            </div>
            <button type="button" class="modal-close" aria-label="Close payment screen" @click="closeGatewayPayment">
              <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
            </button>
          </div>
          <div class="modal-body-custom">
            <div class="gateway-payment-status" :class="getStatusClass(gatewayPaymentStatus)">
              <span class="status-dot"></span>
              <strong>{{ formatStatus(gatewayPaymentStatus) }}</strong>
            </div>
            <p class="gateway-payment-help">
              Complete the payment in the secure UPIGateway screen below. Keep this screen open while the server
              verifies
              your payment.
              Closing this screen does not cancel the transaction.
            </p>
            <iframe v-if="gatewayPaymentUrl" :src="gatewayPaymentUrl" title="UPIGateway UPI payment"
              class="gateway-payment-frame" referrerpolicy="no-referrer" allow="payment *"></iframe>
            <p class="gateway-payment-status-message" role="status">{{ gatewayStatusMessage }}</p>
            <button type="button" class="manual-submit-btn" :disabled="gatewayStatusChecking"
              @click="refreshGatewayPaymentStatus">
              <span v-if="gatewayStatusChecking" class="spinner-border spinner-border-sm me-2"></span>
              Check payment status
            </button>
            <button type="button" class="gateway-back-btn" @click="closeGatewayPayment">Back to Add Money</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showManualModal" class="modal-backdrop-custom" @click.self="closeManualModal">
        <div class="manual-modal">
          <div class="modal-header-custom">
            <div class="modal-title-wrap">
              <div class="modal-upi-icon">
                <span class="gsk-emoji-icon" aria-hidden="true">▦</span>
              </div>
              <div>
                <h5>Pay via UPI</h5>
                <small>
                  ₹{{ formatCurrency(form.amount) }}
                </small>
              </div>
            </div>
            <button type="button" class="modal-close" @click="closeManualModal">
              <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
            </button>
          </div>
          <transition name="slide-fade">
            <div v-if="apiMessage.text" class="api-message"
              :class="apiMessage.type === 'error' ? 'message-error' : 'message-success'">
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
          <div class="modal-body-custom">
            <div class="qr-container">
              <div class="qr-label">
                Scan & Pay
              </div>
              <img v-if="paymentInfo.qr_url" :src="paymentInfo.qr_url" class="manual-qr" alt="UPI QR Code" />
              <div v-else class="qr-placeholder">
                <span class="gsk-emoji-icon" aria-hidden="true">▦</span>
                <span>QR unavailable</span>
              </div>
              <strong>
                {{ paymentInfo.name || 'UPI Payment' }}
              </strong>
              <button v-if="paymentInfo.upi_id" type="button" class="upi-copy" @click="copyUpiId">
                {{ paymentInfo.upi_id }}
                <span class="gsk-emoji-icon" aria-hidden="true">📋</span>
              </button>
            </div>
            <div class="manual-instruction">
              <span class="gsk-emoji-icon" aria-hidden="true">ℹ️</span>
              <span v-if="getSetting('add_money_notice')" class="add-money-hindi-notice" lang="hi">{{
                getSetting('add_money_notice') }}
              </span>
            </div>
            <div class="form-field">
              <label>
                UTR / Transaction ID
              </label>
              <div class="field-with-icon">
                <span class="gsk-emoji-icon" aria-hidden="true">🧾</span>
                <input v-model="manualForm.utr" type="text" autocomplete="off" style="font-size: 16px;"
                  placeholder="Enter 12 digit UTR" />
              </div>
            </div>
            <div class="form-field">
              <label>
                Payment Screenshot
              </label>
              <label class="upload-box">
                <input type="file" accept="image/png,image/jpeg,image/webp" @change="handleScreenshot" />
                <template v-if="!screenshotPreview">
                  <div class="upload-icon">
                    <span class="gsk-emoji-icon" aria-hidden="true">☁️</span>
                  </div>
                  <strong>Upload screenshot</strong>
                  <small>
                    JPG, PNG or WEBP • Max 15 MB
                  </small>
                </template>
                <template v-else>
                  <img :src="screenshotPreview" class="screenshot-preview" alt="Payment screenshot preview" />
                  <span class="change-image">
                    Tap to change
                  </span>
                </template>
              </label>
            </div>
            <button type="button" class="manual-submit-btn" :disabled="manualLoading" @click="submitManualRequest">
              <span v-if="manualLoading" class="spinner-border spinner-border-sm"></span>
              <template v-else>
                <span class="gsk-emoji-icon" aria-hidden="true">✅</span>
                Submit Payment
              </template>
            </button>
          </div>
        </div>
      </div>

    </transition>

  </div>
</template>


<script setup>
import {
  reactive,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
} from 'vue'

import { useSettings } from '@/composables/useSettings'
import { useRouter, useRoute } from 'vue-router'
import { App } from '@capacitor/app'
import { useAuthStore } from '@/utils/auth'
import api from '@/plugins/axios'
import { playNotificationSound } from '@/services/notificationAudio'
import { isTrustedGatewayPaymentUrl } from '@/utils/paymentUrl'
import { getPaymentErrorMessage } from '@/utils/paymentErrors'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const {
  loadSettings,
  getSetting,
} = useSettings()

const minAddMoney = computed(() => {
  return Number(getSetting('min_deposit', 1)) || 1
})

const maxAddMoney = computed(() => {
  const configuredMaximum = Number(getSetting('max_deposit', 0)) || 0
  return configuredMaximum > 0
    ? Math.min(configuredMaximum, 1000000)
    : 1000000
})


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const isLoading = ref(false)
const manualLoading = ref(false)

const gatewayEnabled = ref(false)
const showManualModal = ref(false)

const pendingLoading = ref(false)
const pendingGatewayRequestId = ref(null)
const showGatewayModal = ref(false)
const gatewayPaymentUrl = ref('')
const gatewayPaymentAmount = ref(0)
const gatewayPaymentStatus = ref('processing')
const gatewayStatusMessage = ref('Payment is waiting for provider confirmation.')
const gatewayStatusChecking = ref(false)

const quickAmounts = [
  100,
  500,
  1000,
  2000,
]


const form = reactive({
  amount: 500,
  paymentMethod: 'gateway',
})


const paymentInfo = reactive({
  upi_id: '',
  name: '',
  qr_url: '',
})


const manualForm = reactive({
  utr: '',
  screenshot: null,
})


const screenshotPreview = ref(null)


const apiMessage = reactive({
  text: '',
  type: 'error',
})


/*
|--------------------------------------------------------------------------
| Pending payments
|--------------------------------------------------------------------------
|
| Change this endpoint if your backend uses another route.
|--------------------------------------------------------------------------
*/

const PENDING_PAYMENT_ENDPOINT =
  '/wallet/get-money-request'

const pendingPayments = ref([])


/*
|--------------------------------------------------------------------------
| Demo activity
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This is intentionally labelled as demo activity.
| Replace it with real activity API if required.
|--------------------------------------------------------------------------
*/

const demoActivities = [
  {
    name: 'Rahul',
    amount: '500',
    initials: 'R',
  },
  {
    name: 'Aman',
    amount: '1,000',
    initials: 'A',
  },
  {
    name: 'Vikas',
    amount: '2,000',
    initials: 'V',
  },
  {
    name: 'Neha',
    amount: '500',
    initials: 'N',
  },
  {
    name: 'Rohit',
    amount: '1,500',
    initials: 'R',
  },
  {
    name: 'Pooja',
    amount: '1,000',
    initials: 'P',
  },
  {
    name: 'Arjun',
    amount: '2,500',
    initials: 'A',
  },
]

const activityIndex = ref(0)

const currentActivity = computed(() => {
  return demoActivities[
    activityIndex.value
  ]
})

let activityTimer = null
let pendingTimer = null
let gatewayStatusTimer = null
let appStateListener = null
let appBackButtonListener = null
let gatewayStatusInFlight = false
const handledGatewayTerminalRequests = new Set()
const gatewaySuccessStatuses = new Set(['approved', 'success', 'completed', 'paid'])
const gatewayFailureStatuses = new Set(['failed', 'rejected', 'cancelled', 'canceled', 'expired'])


/*
|--------------------------------------------------------------------------
| Currency
|--------------------------------------------------------------------------
*/

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}


/*
|--------------------------------------------------------------------------
| Payment Date
|--------------------------------------------------------------------------
*/

const formatPaymentDate = (value) => {
  if (!value) {
    return '--'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}


/*
|--------------------------------------------------------------------------
| Payment Status
|--------------------------------------------------------------------------
*/

const formatStatus = (status) => {
  const value = String(status || '').toLowerCase()

  const map = {
    pending: 'Pending',
    processing: 'Processing',
    approved: 'Approved',
    success: 'Success',
    completed: 'Completed',
    paid: 'Paid',
    rejected: 'Rejected',
    failed: 'Failed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    expired: 'Expired',
  }

  return map[value] || 'Pending'
}


const getStatusClass = (status) => {
  const value = String(status || '').toLowerCase()

  if (
    value === 'approved' ||
    value === 'success' ||
    value === 'completed'
  ) {
    return 'status-success'
  }

  if (
    value === 'rejected' ||
    value === 'failed' ||
    value === 'cancelled' ||
    value === 'canceled' ||
    value === 'expired'
  ) {
    return 'status-danger'
  }

  return 'status-pending'
}


/*
|--------------------------------------------------------------------------
| Load payment methods
|--------------------------------------------------------------------------
*/

const loadPaymentMethods = async () => {
  try {

    const response = await api.get(
      '/wallet/payment-methods'
    )

    if (!response.data?.success) {
      return
    }

    const data =
      response.data.data || {}

    const manualUpi =
      data.manual_upi || {}

    const gateway =
      data.gateway || {}


    paymentInfo.upi_id =
      manualUpi.upi_id || ''

    paymentInfo.name =
      manualUpi.name || ''

    paymentInfo.qr_url =
      manualUpi.qr_url || ''


    gatewayEnabled.value =
      Boolean(gateway.enabled)


    /*
     * Prefer automatic gateway when available.
     */
    if (gatewayEnabled.value) {
      form.paymentMethod = 'gateway'
    } else {
      form.paymentMethod = 'manual_upi'
    }

  } catch (error) {

    console.error(
      'Payment methods error:',
      error
    )

    /*
     * Don't break the page if payment-method
     * configuration API fails.
     */
  }
}


/*
|--------------------------------------------------------------------------
| Add money
|--------------------------------------------------------------------------
*/

const handleAddMoney = async () => {

  apiMessage.text = ''


  const amount =
    Number(form.amount)


  if (
    !amount ||
    Number.isNaN(amount) ||
    amount < minAddMoney.value
  ) {

    apiMessage.type = 'error'

    apiMessage.text =
      `Minimum add money amount is ₹${formatCurrency(minAddMoney.value)}.`

    return
  }

  if (
    maxAddMoney.value > 0 &&
    amount > maxAddMoney.value
  ) {

    apiMessage.type = 'error'

    apiMessage.text =
      `Maximum add money amount is ₹${formatCurrency(maxAddMoney.value)}.`

    return
  }


  if (
    form.paymentMethod === 'manual_upi'
  ) {

    showManualModal.value = true

    return
  }


  await createGatewayOrder()
}


/*
|--------------------------------------------------------------------------
| Automatic Gateway
|--------------------------------------------------------------------------
*/

const createGatewayOrder = async () => {
  if (isLoading.value) return
  isLoading.value = true

  try {
    const response = await api.post('/wallet/gateway/create-order', {
      amount: Number(form.amount),
    })

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Unable to start payment.')
    }

    const paymentData = response.data?.data || {}
    const paymentUrl = String(paymentData.payment_url || '')
    const requestId = paymentData.request_id
    if (!isTrustedGatewayPaymentUrl(paymentUrl) || !requestId) {
      throw new Error('The provider returned an unsupported payment URL. Please contact support; no wallet credit was made.')
    }

    pendingGatewayRequestId.value = String(requestId)
    gatewayPaymentAmount.value = Number(form.amount)
    gatewayPaymentUrl.value = paymentUrl
    gatewayPaymentStatus.value = 'processing'
    gatewayStatusMessage.value = 'Waiting for UPIGateway to confirm payment.'
    showGatewayModal.value = true
    startGatewayStatusPolling()
    await refreshGatewayPaymentStatus()
  } catch (error) {
    console.warn('Gateway payment request failed.', { status: error.response?.status || null })
    apiMessage.type = 'error'
    apiMessage.text = getPaymentErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Screenshot
|--------------------------------------------------------------------------
*/

const handleScreenshot = (event) => {

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

    apiMessage.type = 'error'

    apiMessage.text =
      'Please upload JPG, PNG or WEBP.'

    return
  }


  if (
    file.size >
    15 * 1024 * 1024
  ) {

    apiMessage.type = 'error'

    apiMessage.text =
      'Screenshot must not exceed 15 MB.'

    return
  }


  manualForm.screenshot =
    file


  if (screenshotPreview.value) {

    URL.revokeObjectURL(
      screenshotPreview.value
    )
  }


  screenshotPreview.value =
    URL.createObjectURL(file)
}


/*
|--------------------------------------------------------------------------
| Submit Manual UPI
|--------------------------------------------------------------------------
*/

const submitManualRequest = async () => {

  apiMessage.text = ''


  if (
    !manualForm.utr.trim()
  ) {

    apiMessage.type = 'error'

    apiMessage.text =
      'Please enter UTR / transaction number.'

    return
  }


  if (
    !manualForm.screenshot
  ) {

    apiMessage.type = 'error'

    apiMessage.text =
      'Please upload payment screenshot.'

    return
  }


  manualLoading.value = true


  try {

    const formData =
      new FormData()


    formData.append(
      'amount',
      Number(form.amount)
    )

    formData.append(
      'utr',
      manualForm.utr.trim()
    )

    formData.append(
      'screenshot',
      manualForm.screenshot
    )


    const response =
      await api.post(
        '/wallet/add-money-request',
        formData
      )


    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
        'Unable to submit payment request.'
      )
    }


    void playNotificationSound('add_money', `manual-${response.data?.data?.id || Date.now()}`)

    showManualModal.value =
      false


    apiMessage.type =
      'success'


    apiMessage.text =
      response.data.message ||
      'Payment submitted successfully.'


    resetManualForm()


    /*
     * Immediately refresh pending list.
     */
    await loadPendingPayments()


    setTimeout(() => {
      router.push('/wallet')

    }, 1800)

  } catch (error) {

    console.error(
      'Manual payment error:',
      error
    )

    apiMessage.type =
      'error'


    apiMessage.text =
      error.response?.data?.message ||
      error.message ||
      'Unable to submit payment request.'

  } finally {

    manualLoading.value =
      false
  }
}


/*
|--------------------------------------------------------------------------
| Pending Payments API
|--------------------------------------------------------------------------
*/

const loadPendingPayments = async () => {

  pendingLoading.value = true

  try {

    const response =
      await api.get(
        PENDING_PAYMENT_ENDPOINT,
        {
          params: {
            statuses: ['pending', 'processing'],
            type: 'credit',
          },
        }
      )


    /*
     * Supports:
     *
     * { success: true, data: [] }
     *
     * OR
     *
     * { status: true, data: [] }
     *
     * OR
     *
     * { success: true, data: { data: [] } }
     */

    const responseData =
      response.data


    let list =
      responseData?.data


    if (
      list &&
      !Array.isArray(list) &&
      Array.isArray(list.data)
    ) {
      list = list.data
    }


    pendingPayments.value =
      Array.isArray(list)
        ? list
        : []

  } catch (error) {

    console.error(
      'Pending payments error:',
      error
    )

    /*
     * Don't show an error banner here.
     * The payment page should remain usable even
     * if pending-history API is temporarily unavailable.
     */

  } finally {

    pendingLoading.value =
      false
  }
}


const refreshGatewayPaymentStatus = async () => {
  const requestId = pendingGatewayRequestId.value
  if (!requestId || gatewayStatusInFlight || handledGatewayTerminalRequests.has(requestId)) return

  gatewayStatusInFlight = true
  gatewayStatusChecking.value = true
  try {
    const response = await api.get(`/wallet/gateway/${encodeURIComponent(requestId)}/status`, {
      cache: false,
      showGlobalLoader: false,
    })
    // Ignore stale responses if the user has switched to a different payment.
    if (pendingGatewayRequestId.value !== requestId) return

    const payment = response.data?.data
    const status = String(payment?.status || '').toLowerCase()
    if (!payment) throw new Error('Payment status response was empty.')

    gatewayPaymentStatus.value = status || 'processing'
    gatewayStatusMessage.value = payment.message || 'Payment is still pending verification.'

    // Only a server-verified terminal status can complete this flow. Unknown,
    // pending and network-timeout states remain unconfirmed.
    if (gatewaySuccessStatuses.has(status)) {
      handledGatewayTerminalRequests.add(requestId)
      stopGatewayStatusPolling()
      showGatewayModal.value = false
      apiMessage.type = 'success'
      apiMessage.text = 'Payment verified successfully. Your wallet has been refreshed.'
      if (Number.isFinite(Number(payment.wallet_balance))) {
        authStore.updateUserData({ balance: Number(payment.wallet_balance) })
      }
      gatewayPaymentUrl.value = ''
      pendingGatewayRequestId.value = null
      await loadPendingPayments()
    } else if (gatewayFailureStatuses.has(status)) {
      handledGatewayTerminalRequests.add(requestId)
      stopGatewayStatusPolling()
      showGatewayModal.value = false
      apiMessage.type = 'error'
      apiMessage.text = status === 'cancelled' || status === 'canceled'
        ? 'The payment provider confirmed that this payment was cancelled. No wallet credit was applied.'
        : status === 'expired'
          ? 'This payment session expired. You can safely start a new payment.'
          : 'The provider confirmed that this payment failed. You can safely start a new payment.'
      gatewayPaymentUrl.value = ''
      pendingGatewayRequestId.value = null
      await loadPendingPayments()
    }
  } catch (error) {
    // A timeout or unreachable API is not evidence of payment failure.
    if (pendingGatewayRequestId.value === requestId) {
      gatewayStatusMessage.value = 'Status could not be refreshed. Your payment remains unconfirmed; try again shortly.'
    }
    console.warn('Unable to refresh gateway payment status:', error)
  } finally {
    gatewayStatusChecking.value = false
    gatewayStatusInFlight = false
  }
}

const startGatewayStatusPolling = () => {
  stopGatewayStatusPolling()
  gatewayStatusTimer = setInterval(() => {
    if (showGatewayModal.value && !gatewaySuccessStatuses.has(gatewayPaymentStatus.value) && !gatewayFailureStatuses.has(gatewayPaymentStatus.value)) {
      void refreshGatewayPaymentStatus()
    }
  }, 10000)
}

const stopGatewayStatusPolling = () => {
  if (gatewayStatusTimer) {
    clearInterval(gatewayStatusTimer)
    gatewayStatusTimer = null
  }
}

const closeGatewayPayment = () => {
  showGatewayModal.value = false
  stopGatewayStatusPolling()
  if (pendingGatewayRequestId.value && !gatewaySuccessStatuses.has(gatewayPaymentStatus.value) && !gatewayFailureStatuses.has(gatewayPaymentStatus.value)) {
    apiMessage.type = 'error'
    apiMessage.text = 'Payment status is still pending verification. You can resume it from Pending payments; closing this screen does not cancel the transaction.'
  }
}

const resumeGatewayPayment = (payment) => {
  const requestId = payment?.request_id || payment?.gateway_request_id || payment?.id
  if (!requestId || !payment?.gateway_payment_url) return
  pendingGatewayRequestId.value = String(requestId)
  gatewayPaymentUrl.value = String(payment.gateway_payment_url)
  gatewayPaymentAmount.value = Number(payment.amount || 0)
  gatewayPaymentStatus.value = String(payment.status || 'processing').toLowerCase()
  gatewayStatusMessage.value = 'Reopened pending payment. Checking the provider status now.'
  showGatewayModal.value = true
  startGatewayStatusPolling()
  void refreshGatewayPaymentStatus()
}

/*
|--------------------------------------------------------------------------
| Reset manual form
|--------------------------------------------------------------------------
*/

const resetManualForm = () => {

  manualForm.utr = ''

  manualForm.screenshot = null


  if (screenshotPreview.value) {

    URL.revokeObjectURL(
      screenshotPreview.value
    )
  }


  screenshotPreview.value =
    null
}


/*
|--------------------------------------------------------------------------
| Close modal
|--------------------------------------------------------------------------
*/

const closeManualModal = () => {

  if (manualLoading.value) {
    return
  }

  showManualModal.value =
    false
}


/*
|--------------------------------------------------------------------------
| Copy UPI
|--------------------------------------------------------------------------
*/

const copyUpiId = async () => {

  if (!paymentInfo.upi_id) {
    return
  }

  try {

    await navigator.clipboard.writeText(
      paymentInfo.upi_id
    )


    apiMessage.type =
      'success'

    apiMessage.text =
      'UPI ID copied.'

  } catch (error) {

    console.error(
      'Copy UPI error:',
      error
    )
  }
}


/*
|--------------------------------------------------------------------------
| Demo activity rotation
|--------------------------------------------------------------------------
*/

const startActivityRotation = () => {

  if (activityTimer) {
    clearInterval(activityTimer)
  }


  /*
   * 4.5 seconds keeps it noticeable
   * without becoming annoying.
   */
  activityTimer =
    setInterval(() => {
      activityIndex.value =
        (
          activityIndex.value + 1
        ) % demoActivities.length

    }, 4500)
}


/*
|--------------------------------------------------------------------------
| Pending refresh
|--------------------------------------------------------------------------
*/

const startPendingRefresh = () => {

  if (pendingTimer) {
    clearInterval(pendingTimer)
  }


  pendingTimer =
    setInterval(() => {
      if (document.visibilityState === 'visible') void loadPendingPayments()
    }, 60000)
}


/*
|--------------------------------------------------------------------------
| Lifecycle
|--------------------------------------------------------------------------
*/

onMounted(async () => {
  try {
    appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && showGatewayModal.value) void refreshGatewayPaymentStatus()
    })
    appBackButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
      if (showGatewayModal.value) {
        closeGatewayPayment()
      } else if (canGoBack) {
        router.back()
      } else {
        router.replace({ name: 'dashboard' })
      }
    })
  } catch (error) {
    console.warn('Unable to register app resume listener:', error)
  }

  await Promise.all([
    loadSettings(['min_deposit']),
    loadPaymentMethods(),
    loadPendingPayments(),
  ])

  if (String(route.query.gateway_return || '') === '1') {
    pendingGatewayRequestId.value = String(route.query.request_id || '')
    if (pendingGatewayRequestId.value) {
      await refreshGatewayPaymentStatus()
    } else {
      // A return URL is only a navigation signal, never proof of payment.
      apiMessage.type = 'error'
      apiMessage.text = 'Payment returned to the app, but the transaction could not be identified. Check Pending payments for its verified status.'
      await loadPendingPayments()
    }

    const remainingQuery = { ...route.query }
    delete remainingQuery.gateway_return
    delete remainingQuery.status
    delete remainingQuery.request_id
    await router.replace({ path: route.path, query: remainingQuery })
  }

  startActivityRotation()
  startPendingRefresh()
})



onBeforeUnmount(async () => {
  stopGatewayStatusPolling()
  if (appStateListener) {
    await appStateListener.remove()
    appStateListener = null
  }
  if (appBackButtonListener) {
    await appBackButtonListener.remove()
    appBackButtonListener = null
  }

  if (activityTimer) {

    clearInterval(
      activityTimer
    )

    activityTimer = null
  }


  if (pendingTimer) {

    clearInterval(
      pendingTimer
    )

    pendingTimer = null
  }


  if (screenshotPreview.value) {

    URL.revokeObjectURL(
      screenshotPreview.value
    )
  }
})
</script><style scoped>
.add-money-page,.withdraw-page{min-height:min-content;background:#f4f7fb;color:#1e2c42}.gsk-payment-flow{max-width:720px;margin:0 auto;padding-top:15px;padding-bottom:calc(105px + env(safe-area-inset-bottom))}
.payment-screen-header{display:flex;align-items:center;gap:12px;margin:3px 0 17px}.payment-screen-header .payment-back{display:grid;place-items:center;width:40px;height:40px;border:1px solid #e3eaf3;border-radius:12px;background:#fff;color:#315f9f;font-size:20px}.payment-screen-heading{display:grid;gap:1px}.payment-screen-heading small{color:#8a98aa;font-size:9px;font-weight:900;letter-spacing:.13em}.payment-screen-heading h1{margin:0;font-size:21px;font-weight:900}.payment-screen-heading p{margin:2px 0 0;color:#7b899d;font-size:10px}
.amount-card,.payment-card,.withdraw-card,.pending-section,.details-panel{margin-bottom:12px;padding:16px;border:1px solid #e5ebf3;border-radius:17px;background:#fff;box-shadow:0 7px 20px #1b365d0a}.section-label,.section-heading,.details-heading{display:flex;align-items:center;gap:11px;margin-bottom:14px}.section-label>div,.section-heading>div,.details-heading>div{display:grid}.section-label strong,.section-heading h6,.details-heading strong{margin:0;color:#263a55;font-size:13px;font-weight:900}.section-label small,.section-heading span,.details-heading small{color:#8290a3;font-size:10px}.section-icon,.details-heading-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#edf3fc;color:#315f9f;font-size:23px}.amount-input-box,.amount-input{display:flex;align-items:center;gap:10px;min-height:68px;padding:10px 13px;border:1px solid #dfe7f1;border-radius:14px;background:#f7f9fc}.amount-input-box input,.amount-input input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#244e83;font-size:31px;font-weight:950}.rupee-symbol,.amount-symbol{color:#315f9f;font-size:26px;font-weight:900}.amount-suffix,.amount-currency{color:#8a97a8;font-size:10px;font-weight:850}.quick-amounts{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.quick-amounts button{flex:1 1 68px;min-height:38px;border:1px solid #dfe6ef;border-radius:10px;background:#fff;color:#50627c;font-size:10px;font-weight:850}.quick-amounts button.selected{border-color:#315f9f;background:#edf3fc;color:#244e83}
.payment-card .section-heading{justify-content:space-between}.secured-pill{padding:6px 9px;border-radius:30px;background:#e4f5eb;color:#237b55;font-size:9px;font-weight:850}.gateway-option,.manual-option,.destination-option{margin-top:9px;padding:13px;border:1px solid #e3eaf2;border-radius:13px;background:#fff;cursor:pointer}.gateway-option.selected,.manual-option.selected,.destination-option.selected{border-color:#315f9f;background:#f4f8ff;box-shadow:0 0 0 2px #315f9f14}.gateway-top,.manual-option-inner{display:flex;align-items:center;gap:10px}.gateway-radio,.destination-radio{display:grid;place-items:center;width:19px;height:19px;flex:0 0 19px;border:1.5px solid #b7c3d2;border-radius:50%}.selected .gateway-radio,.selected .destination-radio{border-color:#315f9f}.selected .gateway-radio span,.selected .destination-radio span{width:9px;height:9px;border-radius:50%;background:#315f9f}.gateway-main,.manual-content,.destination-text{display:grid;flex:1;gap:2px}.gateway-title-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.gateway-title-row strong,.manual-content strong,.destination-text strong{font-size:12px;font-weight:850}.gateway-main small,.manual-content small,.destination-text small{font-size:9px;color:#8391a3}.recommended-badge{padding:4px 7px;border-radius:30px;background:#e4f5eb;color:#217b54;font-size:8px;font-weight:850}.gateway-lightning,.manual-icon{font-size:23px}.upi-apps{display:flex;justify-content:space-between;gap:8px;margin:13px 0 8px;padding:10px;border-radius:11px;background:#f7f9fc}.upi-app{display:grid;justify-items:center;gap:4px}.upi-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#fff}.upi-app small{font-size:8px;color:#6d7c90}.upi-app img{max-width:26px;max-height:22px;object-fit:contain}.gateway-note,.secure-footer{display:flex;align-items:center;gap:7px;color:#7f8da0;font-size:9px}.gateway-note{padding-top:9px;border-top:1px solid #e8edf4}.api-message{display:flex;align-items:center;gap:10px;margin:10px 0;padding:12px;border:1px solid #e4eaf2;border-radius:12px;background:#fff;font-size:11px}.message-error{border-color:#f1d2d5;background:#fff7f7;color:#a94c55}.message-success{border-color:#cdebd9;background:#f4fbf6;color:#267a53}.message-close{border:0;background:transparent;font-size:20px}.pay-button,.withdraw-submit{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:54px;margin-top:12px;padding:13px 16px;border:0;border-radius:13px;background:#244e83;color:#fff;font-size:12px;font-weight:900}.pay-button:disabled,.withdraw-submit:disabled{opacity:.6}.pay-button-left{display:flex;align-items:center;gap:8px}.pay-button-amount{display:flex;align-items:center;gap:9px}.secure-footer{justify-content:center;padding:11px}.pending-section .section-heading{justify-content:space-between}.pending-section .section-heading h6{font-size:13px;font-weight:900}.refresh-btn{width:35px;height:35px;border:1px solid #e2e9f2;border-radius:10px;background:#f7f9fc;color:#315f9f;font-size:19px}.pending-item,.pending-payment,.withdrawal-item{padding:12px 0;border-bottom:1px solid #edf1f6}.pending-item:last-child,.pending-payment:last-child,.withdrawal-item:last-child{border-bottom:0}.destination-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.destination-option{display:flex;align-items:center;gap:8px;text-align:left}.destination-icon{font-size:22px}.field-label,.field-label-row label{display:block;margin:12px 0 6px;color:#5d6e85;font-size:10px;font-weight:850}.form-field{margin-top:12px}.text-input{display:flex;align-items:center;gap:9px;min-height:47px;padding:0 11px;border:1px solid #dfe6ef;border-radius:11px;background:#f8fafd}.text-input input{min-width:0;flex:1;border:0;outline:0;background:transparent;font-size:12px}.field-error{display:block;margin-top:5px;color:#bd535b;font-size:9px}.status-success{color:#217b54;background:#e5f5ec}.status-danger{color:#b64f58;background:#fcebed}.status-pending{color:#956d22;background:#fff3dc}.activity-section{display:none}.withdraw-card .section-heading{margin-bottom:16px}.details-heading{margin-bottom:10px}.amount-field .field-label-row{display:flex;justify-content:space-between;align-items:center}.minimum-label{font-size:9px;color:#8996a8}.withdraw-page .container-fluid{max-width:720px;margin:0 auto}.withdraw-page .pending-section{margin-top:13px}.withdraw-page .form-footer{display:flex;justify-content:space-between;gap:10px}.withdraw-page .pay-button,.withdraw-page .withdraw-submit{background:#244e83}.secure-footer{padding-bottom:5px}
@media(max-width:420px){.gsk-payment-flow{padding-inline:11px}.amount-card,.payment-card,.withdraw-card,.pending-section{padding:13px}.upi-apps{gap:4px}.upi-app small{font-size:7px}.destination-grid{grid-template-columns:1fr}.payment-screen-heading h1{font-size:19px}}

.pending-section{margin-top:13px}.pending-section .section-heading{justify-content:space-between}.pending-heading>div{display:grid}.pending-heading strong{font-size:13px;font-weight:900}.pending-heading small{font-size:9px;color:#8492a6}.pending-loading,.empty-pending{display:grid;justify-items:center;gap:7px;padding:22px 12px;color:#7e8ca0;font-size:10px}.empty-pending .empty-icon{font-size:29px}.empty-pending strong{color:#31435c;font-size:11px}.pending-list{display:grid}.pending-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #edf1f6}.pending-item:last-child{border-bottom:0}.pending-item-left{display:flex;align-items:center;gap:9px;min-width:0}.pending-payment-icon,.pending-item-left .pending-payment-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#edf3fc;font-size:20px}.pending-item-left>div:last-child{display:grid}.pending-item-left strong{font-size:11px}.pending-item-left small,.pending-item-right small{font-size:8px;color:#8996a8}.pending-item-right{display:grid;justify-items:end;gap:4px}.status-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:30px;font-size:8px;font-weight:850}.status-dot{width:6px;height:6px;border-radius:50%;background:currentColor}.resume-payment-btn{min-height:34px;padding:6px 10px;border:1px solid #315f9f;border-radius:9px;background:#edf3fc;color:#244e83;font-size:9px;font-weight:850}
.modal-backdrop-custom{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:14px;background:#10233db8;backdrop-filter:blur(5px)}.manual-modal{width:min(100%,520px);max-height:min(92dvh,850px);overflow:auto;border:1px solid #e5ebf3;border-radius:20px;background:#fff;box-shadow:0 22px 70px #0a1b324d}.gateway-payment-modal{width:min(100%,760px)}.modal-header-custom{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e8edf4;background:#fff}.modal-title-wrap{display:flex;align-items:center;gap:10px}.modal-title-wrap>div:last-child{display:grid}.modal-title-wrap h5{margin:0;font-size:14px;font-weight:900}.modal-title-wrap small{color:#315f9f;font-size:11px;font-weight:850}.modal-upi-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#edf3fc;font-size:22px}.modal-close{display:grid;place-items:center;width:35px;height:35px;border:1px solid #e5ebf3;border-radius:10px;background:#f7f9fc;color:#50627b}.modal-body-custom{padding:15px}.gateway-payment-status{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:11px;font-size:10px}.gateway-payment-status .status-dot{width:8px;height:8px}.gateway-payment-help{margin:12px 0;color:#708097;font-size:10px;line-height:1.6}.gateway-payment-frame{display:block;width:100%;height:min(56vh,520px);border:1px solid #e3eaf2;border-radius:12px;background:#f7f9fc}.gateway-payment-status-message{margin:10px 0;color:#6c7c92;font-size:10px}.manual-submit-btn,.gateway-back-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:46px;margin-top:9px;border:0;border-radius:11px;background:#244e83;color:#fff;font-size:11px;font-weight:850}.gateway-back-btn{border:1px solid #dfe6ef;background:#fff;color:#52647d}.qr-container{display:grid;justify-items:center;gap:8px;padding:14px;border:1px solid #e5ebf3;border-radius:14px;background:#f8fafd}.qr-label{color:#8492a6;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.manual-qr{width:min(210px,65vw);height:auto;max-height:210px;object-fit:contain;border-radius:10px;background:#fff}.qr-placeholder{display:grid;place-items:center;gap:5px;width:180px;height:180px;border:1px dashed #d2dce9;border-radius:12px;background:#fff;color:#8190a5;font-size:11px}.qr-placeholder .gsk-emoji-icon{font-size:42px}.upi-copy{display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #dce5f0;border-radius:9px;background:#fff;color:#315f9f;font-size:10px;font-weight:850}.manual-instruction{display:flex;gap:8px;margin:12px 0;padding:10px;border-radius:10px;background:#eef4fc;color:#61738b;font-size:10px}.field-with-icon{display:flex;align-items:center;gap:9px;min-height:46px;padding:0 11px;border:1px solid #dfe6ef;border-radius:11px;background:#f8fafd}.field-with-icon input{min-width:0;flex:1;border:0;outline:0;background:transparent}.upload-box{display:grid;justify-items:center;gap:6px;padding:17px;border:1px dashed #b9c9dc;border-radius:13px;background:#f8fafd;text-align:center;cursor:pointer}.upload-box input{position:absolute;width:1px;height:1px;opacity:0}.upload-icon{font-size:26px}.upload-box strong{font-size:11px}.upload-box small{color:#8996a8;font-size:9px}.screenshot-preview{max-width:100%;max-height:180px;border-radius:10px;object-fit:contain}.change-image{font-size:9px;color:#315f9f;font-weight:850}
</style>
<style scoped>
.payment-journey{display:flex;align-items:center;gap:7px;margin:0 0 13px;padding:12px 14px;border:1px solid #e3eaf3;border-radius:15px;background:#fff}.payment-journey>div{display:grid;justify-items:center;gap:4px;min-width:45px}.payment-journey>div span{display:grid;place-items:center;width:25px;height:25px;border:1px solid #dce5f0;border-radius:50%;background:#f5f8fc;color:#74849a;font-size:10px;font-weight:900}.payment-journey>div.is-current span{border-color:#315f9f;background:#315f9f;color:#fff;box-shadow:0 0 0 4px #315f9f18}.payment-journey>div small{color:#718198;font-size:8px;font-weight:850}.payment-journey>i{height:1px;flex:1;background:#e3eaf3}.payment-security-strip{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:12px;border:1px solid #dce9f8;border-radius:14px;background:#edf4fc}.payment-security-strip>span:first-child{font-size:22px}.payment-security-strip>div{display:grid;gap:2px;flex:1}.payment-security-strip strong{color:#294f7a;font-size:10px}.payment-security-strip small{color:#7287a0;font-size:9px;line-height:1.4}.payment-security-tag{padding:5px 7px;border-radius:7px;background:#fff;color:#315f9f;font-size:8px;font-weight:950;letter-spacing:.08em}
.add-money-page .amount-card{border-color:#d8e6f5;background:linear-gradient(145deg,#fff,#f5f9ff)}.add-money-page .amount-input-box{min-height:68px;border:1px solid #dce7f4;border-radius:14px;background:#fff}.add-money-page .quick-amounts button{min-height:39px;border-radius:11px}.add-money-page .payment-card{border-radius:18px}.add-money-page .gateway-option,.add-money-page .manual-option{border-radius:15px;transition:border-color .18s,box-shadow .18s,transform .18s}.add-money-page .gateway-option.selected,.add-money-page .manual-option.selected{border-color:#315f9f;box-shadow:0 0 0 3px #315f9f14}.add-money-page .pay-button{position:sticky;bottom:calc(10px + env(safe-area-inset-bottom));z-index:5;box-shadow:0 9px 24px #244f8230}.add-money-page .pending-section{border-radius:18px}
@media(prefers-reduced-motion:reduce){.add-money-page .gateway-option,.add-money-page .manual-option{transition:none}}
</style>

<style scoped>
.add-money-page{min-height:min-content;padding-bottom:calc(120px + env(safe-area-inset-bottom));background:radial-gradient(circle at 90% 0,#372d79 0,transparent 34%),linear-gradient(180deg,#0b1225,#080d1b 52%);color:#f4f6ff}
.add-money-page .gsk-payment-flow{width:min(100%,720px);margin-inline:auto;padding-top:14px}
.add-money-page .payment-screen-header{display:flex;align-items:center;gap:13px;margin:2px 0 16px}
.add-money-page .payment-back{display:grid;place-items:center;width:43px;height:43px;flex:0 0 43px;border:1px solid #ffffff20;border-radius:14px;background:#ffffff0b;color:#fff;font-size:22px}
.add-money-page .payment-screen-heading{display:grid;gap:2px}
.add-money-page .payment-screen-heading>small{color:#a89bff;font-size:9px;font-weight:950;letter-spacing:.16em}
.add-money-page .payment-screen-heading h1{margin:0;color:#fff;font-size:25px;font-weight:950;letter-spacing:-.04em}
.add-money-page .payment-screen-heading p{margin:0;color:#9ba9c8;font-size:11px}
.add-money-page .payment-journey,.add-money-page .payment-security-strip{border-color:#354164;background:#121d36;color:#e8edff;box-shadow:0 10px 28px #00000022}
.add-money-page .payment-journey>div span{border-color:#39496c;background:#1b2947;color:#aab7d3}
.add-money-page .payment-journey>div.is-current span{border-color:#8b72ff;background:linear-gradient(145deg,#8b72ff,#4f72ec);color:#fff;box-shadow:0 0 0 4px #8b72ff25}
.add-money-page .payment-journey>div small{color:#aab7d3}
.add-money-page .payment-journey>i{background:#39496c}
.add-money-page .payment-security-strip{border-color:#554b8e;background:linear-gradient(110deg,#25244d,#172a4b)}
.add-money-page .payment-security-strip>div strong{color:#f2efff}
.add-money-page .payment-security-strip>div small{color:#aab7d3}
.add-money-page .payment-security-tag{background:#342d65;color:#c9beff}
.add-money-page .amount-card,.add-money-page .payment-card,.add-money-page .pending-section{margin-top:13px;padding:17px;border:1px solid #293754;border-radius:20px;background:linear-gradient(155deg,#151f38,#10182b);color:#f4f6ff;box-shadow:0 15px 35px #00000024}
.add-money-page .section-label strong,.add-money-page .section-heading h6{color:#fff;font-size:14px;font-weight:900}
.add-money-page .section-label small,.add-money-page .section-heading span{color:#9ba9c8}
.add-money-page .section-icon.green{background:#1a3d46;color:#6fe4ca}
.add-money-page .amount-input-box{display:flex;align-items:center;gap:9px;min-height:76px;margin-top:15px;padding:0 15px;border:1px solid #39496c;border-radius:16px;background:#0b1428;box-shadow:inset 0 1px #ffffff08}
.add-money-page .amount-input-box .rupee-symbol{color:#a99bff;font-size:25px;font-weight:900}
.add-money-page .amount-input-box input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:34px;font-weight:950;font-variant-numeric:tabular-nums}
.add-money-page .amount-input-box input::placeholder{color:#5f6e8d}
.add-money-page .amount-suffix{color:#8090b2;font-size:9px;font-weight:900;letter-spacing:.1em}
.add-money-page .quick-amounts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.add-money-page .quick-amounts button{min-height:40px;padding:0 14px;border:1px solid #39496c;border-radius:12px;background:#182541;color:#c6d1e8;font-size:11px;font-weight:850}
.add-money-page .quick-amounts button.selected{border-color:#8b72ff;background:linear-gradient(120deg,#765cf5,#356ce8);color:#fff;box-shadow:0 7px 20px #765cf533}
.add-money-page .payment-card .section-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}
.add-money-page .payment-card .section-heading h6{margin:0 0 3px}
.add-money-page .secured-pill{border:1px solid #245c52;border-radius:30px;background:#123b35;color:#6ce3b7}
.add-money-page .gateway-option,.add-money-page .manual-option{border:1px solid #34415f;background:#0d172c;color:#f4f6ff;box-shadow:none}
.add-money-page .gateway-option.selected,.add-money-page .manual-option.selected{border-color:#927cff;background:linear-gradient(140deg,#28234f,#172b4b);box-shadow:0 0 0 2px #8b72ff25,0 12px 28px #00000024}
.add-money-page .gateway-main strong,.add-money-page .manual-content strong{color:#fff}
.add-money-page .gateway-main small,.add-money-page .manual-content small{color:#9ba9c8}
.add-money-page .gateway-radio{border-color:#63749a;background:#111b30}
.add-money-page .gateway-option.selected .gateway-radio,.add-money-page .manual-option.selected .gateway-radio{border-color:#9b8bff}
.add-money-page .gateway-option.selected .gateway-radio span,.add-money-page .manual-option.selected .gateway-radio span{background:#9b8bff}
.add-money-page .recommended-badge{background:#443b78;color:#d8d0ff}
.add-money-page .upi-app{color:#aebbd5}
.add-money-page .upi-icon,.add-money-page .manual-icon{border:1px solid #34415f;background:#1b2945}
.add-money-page .gateway-note,.add-money-page .manual-instruction{border:1px solid #354b71;background:#142744;color:#b7c8e5}
.add-money-page .api-message{border-radius:14px}
.add-money-page .message-error{border:1px solid #864458;background:#351d30;color:#ffb3c0}
.add-money-page .message-success{border:1px solid #286d5b;background:#123a34;color:#8af0cb}
.add-money-page .pay-button,.add-money-page .manual-submit-btn{min-height:54px;border:1px solid #9b8aff;border-radius:16px;background:linear-gradient(105deg,#795cf5,#286ee9);color:#fff;box-shadow:0 12px 28px #4e54d944;font-size:12px;font-weight:950}
.add-money-page .pay-button:disabled{opacity:.55}
.add-money-page .secure-footer{color:#8999bb}
.add-money-page .pending-section{margin-top:18px}
.add-money-page .pending-heading strong,.add-money-page .pending-heading h6{color:#fff}
.add-money-page .pending-heading small,.add-money-page .pending-item small{color:#8f9fbe}
.add-money-page .pending-item{border-color:#293754;background:transparent}
.add-money-page .pending-payment-icon,.add-money-page .pending-item-left>span:first-child{background:#24264d;color:#c5baff}
.add-money-page .status-pill{border:1px solid #405174;background:#1a2946;color:#c2cde3}
.add-money-page .status-pill.status-success{border-color:#286b5a;background:#123a34;color:#76e4bf}
.add-money-page .status-pill.status-danger{border-color:#824252;background:#3c202f;color:#ff9eae}
.add-money-page .status-pill.status-pending{border-color:#806333;background:#3b301d;color:#ffd17b}
.add-money-page .refresh-btn{border-color:#39496c;background:#1b2945;color:#c4baff}
.add-money-page .empty-pending,.add-money-page .pending-loading{border-color:#34415f;background:#0d172b;color:#9ba9c8}
.add-money-page .empty-pending strong{color:#f4f6ff}
.add-money-page .qr-container,.add-money-page .qr-placeholder,.add-money-page .upload-box{border-color:#39496c;background:#0d172b;color:#aab7d3}
.add-money-page .upi-copy{border-color:#51488a;background:#24244b;color:#c8beff}
.add-money-page .field-with-icon{border-color:#39496c;background:#0d172b;color:#fff}
.add-money-page .field-with-icon input{color:#fff}
.add-money-page .gateway-payment-modal,.add-money-page .manual-modal{border:1px solid #39496c;background:#111b30;color:#f4f6ff;box-shadow:0 25px 80px #000b}
.add-money-page .modal-header-custom{border-color:#34415f;background:#182541;color:#fff}
.add-money-page .modal-body-custom{color:#c3cde1}
.add-money-page .modal-close{color:#dbe3f6}
@media(max-width:380px){.add-money-page .payment-screen-heading h1{font-size:22px}.add-money-page .amount-input-box input{font-size:29px}.add-money-page .amount-card,.add-money-page .payment-card,.add-money-page .pending-section{padding:14px}}
@media(prefers-reduced-motion:reduce){.add-money-page *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style>
