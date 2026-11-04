<template>
  <div class="add-money-page pb-5">

    <main class="container-fluid px-3 gsk-payment-flow">\n      <header class="payment-screen-header"><router-link to="/wallet" class="payment-back" aria-label="Back to wallet">←</router-link><div class="payment-screen-heading"><small>WALLET SERVICES</small><h1>Add money</h1><p>Choose an amount and payment method.</p></div></header>
      

      <section class="amount-card">
        <div class="section-label">
          <span class="section-icon green">
            <span class="gsk-emoji-icon" aria-hidden="true">💰</span>
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
.add-money-page,.withdraw-page{min-height:100dvh;background:#f4f7fb;color:#1e2c42}.gsk-payment-flow{max-width:720px;margin:0 auto;padding-top:15px;padding-bottom:calc(105px + env(safe-area-inset-bottom))}
.payment-screen-header{display:flex;align-items:center;gap:12px;margin:3px 0 17px}.payment-screen-header .payment-back{display:grid;place-items:center;width:40px;height:40px;border:1px solid #e3eaf3;border-radius:12px;background:#fff;color:#315f9f;font-size:20px}.payment-screen-heading{display:grid;gap:1px}.payment-screen-heading small{color:#8a98aa;font-size:9px;font-weight:900;letter-spacing:.13em}.payment-screen-heading h1{margin:0;font-size:21px;font-weight:900}.payment-screen-heading p{margin:2px 0 0;color:#7b899d;font-size:10px}
.amount-card,.payment-card,.withdraw-card,.pending-section,.details-panel{margin-bottom:12px;padding:16px;border:1px solid #e5ebf3;border-radius:17px;background:#fff;box-shadow:0 7px 20px #1b365d0a}.section-label,.section-heading,.details-heading{display:flex;align-items:center;gap:11px;margin-bottom:14px}.section-label>div,.section-heading>div,.details-heading>div{display:grid}.section-label strong,.section-heading h6,.details-heading strong{margin:0;color:#263a55;font-size:13px;font-weight:900}.section-label small,.section-heading span,.details-heading small{color:#8290a3;font-size:10px}.section-icon,.details-heading-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#edf3fc;color:#315f9f;font-size:23px}.amount-input-box,.amount-input{display:flex;align-items:center;gap:10px;min-height:68px;padding:10px 13px;border:1px solid #dfe7f1;border-radius:14px;background:#f7f9fc}.amount-input-box input,.amount-input input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#244e83;font-size:31px;font-weight:950}.rupee-symbol,.amount-symbol{color:#315f9f;font-size:26px;font-weight:900}.amount-suffix,.amount-currency{color:#8a97a8;font-size:10px;font-weight:850}.quick-amounts{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.quick-amounts button{flex:1 1 68px;min-height:38px;border:1px solid #dfe6ef;border-radius:10px;background:#fff;color:#50627c;font-size:10px;font-weight:850}.quick-amounts button.selected{border-color:#315f9f;background:#edf3fc;color:#244e83}
.payment-card .section-heading{justify-content:space-between}.secured-pill{padding:6px 9px;border-radius:30px;background:#e4f5eb;color:#237b55;font-size:9px;font-weight:850}.gateway-option,.manual-option,.destination-option{margin-top:9px;padding:13px;border:1px solid #e3eaf2;border-radius:13px;background:#fff;cursor:pointer}.gateway-option.selected,.manual-option.selected,.destination-option.selected{border-color:#315f9f;background:#f4f8ff;box-shadow:0 0 0 2px #315f9f14}.gateway-top,.manual-option-inner{display:flex;align-items:center;gap:10px}.gateway-radio,.destination-radio{display:grid;place-items:center;width:19px;height:19px;flex:0 0 19px;border:1.5px solid #b7c3d2;border-radius:50%}.selected .gateway-radio,.selected .destination-radio{border-color:#315f9f}.selected .gateway-radio span,.selected .destination-radio span{width:9px;height:9px;border-radius:50%;background:#315f9f}.gateway-main,.manual-content,.destination-text{display:grid;flex:1;gap:2px}.gateway-title-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.gateway-title-row strong,.manual-content strong,.destination-text strong{font-size:12px;font-weight:850}.gateway-main small,.manual-content small,.destination-text small{font-size:9px;color:#8391a3}.recommended-badge{padding:4px 7px;border-radius:30px;background:#e4f5eb;color:#217b54;font-size:8px;font-weight:850}.gateway-lightning,.manual-icon{font-size:23px}.upi-apps{display:flex;justify-content:space-between;gap:8px;margin:13px 0 8px;padding:10px;border-radius:11px;background:#f7f9fc}.upi-app{display:grid;justify-items:center;gap:4px}.upi-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#fff}.upi-app small{font-size:8px;color:#6d7c90}.upi-app img{max-width:26px;max-height:22px;object-fit:contain}.gateway-note,.secure-footer{display:flex;align-items:center;gap:7px;color:#7f8da0;font-size:9px}.gateway-note{padding-top:9px;border-top:1px solid #e8edf4}.api-message{display:flex;align-items:center;gap:10px;margin:10px 0;padding:12px;border:1px solid #e4eaf2;border-radius:12px;background:#fff;font-size:11px}.message-error{border-color:#f1d2d5;background:#fff7f7;color:#a94c55}.message-success{border-color:#cdebd9;background:#f4fbf6;color:#267a53}.message-close{border:0;background:transparent;font-size:20px}.pay-button,.withdraw-submit{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:54px;margin-top:12px;padding:13px 16px;border:0;border-radius:13px;background:#244e83;color:#fff;font-size:12px;font-weight:900}.pay-button:disabled,.withdraw-submit:disabled{opacity:.6}.pay-button-left{display:flex;align-items:center;gap:8px}.pay-button-amount{display:flex;align-items:center;gap:9px}.secure-footer{justify-content:center;padding:11px}.pending-section .section-heading{justify-content:space-between}.pending-section .section-heading h6{font-size:13px;font-weight:900}.refresh-btn{width:35px;height:35px;border:1px solid #e2e9f2;border-radius:10px;background:#f7f9fc;color:#315f9f;font-size:19px}.pending-item,.pending-payment,.withdrawal-item{padding:12px 0;border-bottom:1px solid #edf1f6}.pending-item:last-child,.pending-payment:last-child,.withdrawal-item:last-child{border-bottom:0}.destination-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.destination-option{display:flex;align-items:center;gap:8px;text-align:left}.destination-icon{font-size:22px}.field-label,.field-label-row label{display:block;margin:12px 0 6px;color:#5d6e85;font-size:10px;font-weight:850}.form-field{margin-top:12px}.text-input{display:flex;align-items:center;gap:9px;min-height:47px;padding:0 11px;border:1px solid #dfe6ef;border-radius:11px;background:#f8fafd}.text-input input{min-width:0;flex:1;border:0;outline:0;background:transparent;font-size:12px}.field-error{display:block;margin-top:5px;color:#bd535b;font-size:9px}.status-success{color:#217b54;background:#e5f5ec}.status-danger{color:#b64f58;background:#fcebed}.status-pending{color:#956d22;background:#fff3dc}.activity-section{display:none}.withdraw-card .section-heading{margin-bottom:16px}.details-heading{margin-bottom:10px}.amount-field .field-label-row{display:flex;justify-content:space-between;align-items:center}.minimum-label{font-size:9px;color:#8996a8}.withdraw-page .container-fluid{max-width:720px;margin:0 auto}.withdraw-page .pending-section{margin-top:13px}.withdraw-page .form-footer{display:flex;justify-content:space-between;gap:10px}.withdraw-page .pay-button,.withdraw-page .withdraw-submit{background:#244e83}.secure-footer{padding-bottom:5px}
@media(max-width:420px){.gsk-payment-flow{padding-inline:11px}.amount-card,.payment-card,.withdraw-card,.pending-section{padding:13px}.upi-apps{gap:4px}.upi-app small{font-size:7px}.destination-grid{grid-template-columns:1fr}.payment-screen-heading h1{font-size:19px}}

.pending-section{margin-top:13px}.pending-section .section-heading{justify-content:space-between}.pending-heading>div{display:grid}.pending-heading strong{font-size:13px;font-weight:900}.pending-heading small{font-size:9px;color:#8492a6}.pending-loading,.empty-pending{display:grid;justify-items:center;gap:7px;padding:22px 12px;color:#7e8ca0;font-size:10px}.empty-pending .empty-icon{font-size:29px}.empty-pending strong{color:#31435c;font-size:11px}.pending-list{display:grid}.pending-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #edf1f6}.pending-item:last-child{border-bottom:0}.pending-item-left{display:flex;align-items:center;gap:9px;min-width:0}.pending-payment-icon,.pending-item-left .pending-payment-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#edf3fc;font-size:20px}.pending-item-left>div:last-child{display:grid}.pending-item-left strong{font-size:11px}.pending-item-left small,.pending-item-right small{font-size:8px;color:#8996a8}.pending-item-right{display:grid;justify-items:end;gap:4px}.status-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:30px;font-size:8px;font-weight:850}.status-dot{width:6px;height:6px;border-radius:50%;background:currentColor}.resume-payment-btn{min-height:34px;padding:6px 10px;border:1px solid #315f9f;border-radius:9px;background:#edf3fc;color:#244e83;font-size:9px;font-weight:850}
.modal-backdrop-custom{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:14px;background:#10233db8;backdrop-filter:blur(5px)}.manual-modal{width:min(100%,520px);max-height:min(92dvh,850px);overflow:auto;border:1px solid #e5ebf3;border-radius:20px;background:#fff;box-shadow:0 22px 70px #0a1b324d}.gateway-payment-modal{width:min(100%,760px)}.modal-header-custom{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e8edf4;background:#fff}.modal-title-wrap{display:flex;align-items:center;gap:10px}.modal-title-wrap>div:last-child{display:grid}.modal-title-wrap h5{margin:0;font-size:14px;font-weight:900}.modal-title-wrap small{color:#315f9f;font-size:11px;font-weight:850}.modal-upi-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#edf3fc;font-size:22px}.modal-close{display:grid;place-items:center;width:35px;height:35px;border:1px solid #e5ebf3;border-radius:10px;background:#f7f9fc;color:#50627b}.modal-body-custom{padding:15px}.gateway-payment-status{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:11px;font-size:10px}.gateway-payment-status .status-dot{width:8px;height:8px}.gateway-payment-help{margin:12px 0;color:#708097;font-size:10px;line-height:1.6}.gateway-payment-frame{display:block;width:100%;height:min(56vh,520px);border:1px solid #e3eaf2;border-radius:12px;background:#f7f9fc}.gateway-payment-status-message{margin:10px 0;color:#6c7c92;font-size:10px}.manual-submit-btn,.gateway-back-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:46px;margin-top:9px;border:0;border-radius:11px;background:#244e83;color:#fff;font-size:11px;font-weight:850}.gateway-back-btn{border:1px solid #dfe6ef;background:#fff;color:#52647d}.qr-container{display:grid;justify-items:center;gap:8px;padding:14px;border:1px solid #e5ebf3;border-radius:14px;background:#f8fafd}.qr-label{color:#8492a6;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.manual-qr{width:min(210px,65vw);height:auto;max-height:210px;object-fit:contain;border-radius:10px;background:#fff}.qr-placeholder{display:grid;place-items:center;gap:5px;width:180px;height:180px;border:1px dashed #d2dce9;border-radius:12px;background:#fff;color:#8190a5;font-size:11px}.qr-placeholder .gsk-emoji-icon{font-size:42px}.upi-copy{display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #dce5f0;border-radius:9px;background:#fff;color:#315f9f;font-size:10px;font-weight:850}.manual-instruction{display:flex;gap:8px;margin:12px 0;padding:10px;border-radius:10px;background:#eef4fc;color:#61738b;font-size:10px}.field-with-icon{display:flex;align-items:center;gap:9px;min-height:46px;padding:0 11px;border:1px solid #dfe6ef;border-radius:11px;background:#f8fafd}.field-with-icon input{min-width:0;flex:1;border:0;outline:0;background:transparent}.upload-box{display:grid;justify-items:center;gap:6px;padding:17px;border:1px dashed #b9c9dc;border-radius:13px;background:#f8fafd;text-align:center;cursor:pointer}.upload-box input{position:absolute;width:1px;height:1px;opacity:0}.upload-icon{font-size:26px}.upload-box strong{font-size:11px}.upload-box small{color:#8996a8;font-size:9px}.screenshot-preview{max-width:100%;max-height:180px;border-radius:10px;object-fit:contain}.change-image{font-size:9px;color:#315f9f;font-weight:850}
</style>