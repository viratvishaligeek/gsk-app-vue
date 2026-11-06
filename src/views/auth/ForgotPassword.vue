<template>
  <main class="gsk-auth-page gsk-auth-single">
    <section class="auth-form-panel">
      <router-link to="/" class="auth-back-link">← Back to sign in</router-link>
      <div class="auth-mobile-brand"><span>🔐</span><b>Account recovery</b></div>
      <div class="auth-heading"><span class="auth-eyebrow">SECURE RECOVERY</span><h2>{{ step===1?'Verify your number':'Reset your password' }}</h2><p>{{ step===1?'We will send a one-time password to your registered mobile number.':'Enter the OTP and choose a new password.' }}</p></div>
      <div v-if="apiMessage.text" class="alert" :class="apiMessage.type==='success'?'alert-success':'alert-danger'" role="status">{{ apiMessage.text }}</div>
      <form v-if="step===1" class="gsk-auth-form" @submit.prevent="handleSendOtp" novalidate>
        <label for="phone" class="form-label">Registered mobile number</label><div class="input-group mb-2"><span class="input-group-text">🇮🇳 +91</span><input id="phone" :value="form.phone" @input="handlePhoneInput" class="form-control" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel-national" placeholder="10-digit mobile number"></div><small v-if="errors.phone" class="text-danger">{{ errors.phone }}</small>
        <button class="btn btn-primary w-100 auth-submit mt-3" type="submit" :disabled="isLoading"><span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>{{ isLoading?'Sending OTP…':'Send one-time password →' }}</button>
      </form>
      <form v-else class="gsk-auth-form" @submit.prevent="handleResetPassword" novalidate>
        <div class="mb-3"><label for="otp" class="form-label">6-digit OTP</label><input id="otp" v-model="form.otp" class="form-control" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="Enter OTP"><small v-if="errors.otp" class="text-danger">{{ errors.otp }}</small></div>
        <div class="mb-3"><label for="password" class="form-label">New password</label><div class="input-group"><input id="password" v-model="form.password" :type="showPassword?'text':'password'" class="form-control" autocomplete="new-password" placeholder="At least 8 characters"><button class="btn btn-outline-secondary" type="button" @click="showPassword=!showPassword">{{ showPassword?'🙈':'👁️' }}</button></div><small v-if="errors.password" class="text-danger">{{ errors.password }}</small></div>
        <div class="mb-3"><label for="passwordConfirmation" class="form-label">Confirm new password</label><input id="passwordConfirmation" v-model="form.passwordConfirmation" type="password" class="form-control" autocomplete="new-password" placeholder="Enter password again"><small v-if="errors.passwordConfirmation" class="text-danger">{{ errors.passwordConfirmation }}</small></div>
        <button class="btn btn-primary w-100 auth-submit" type="submit" :disabled="isLoading"><span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>{{ isLoading?'Updating password…':'Reset password →' }}</button>
      </form>
      <p class="auth-safety">🛡️ Never share your OTP with anyone.</p>
    </section>
  </main>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/plugins/axios'
import { normalizeIndianPhone } from '@/utils/indianPhone'

const router = useRouter()

const step = ref(1)
const showPassword = ref(false)
const isLoading = ref(false)

const form = reactive({
  phone: '',
  otp: '',
  password: '',
  passwordConfirmation: '',
})

const errors = reactive({
  phone: '',
  otp: '',
  password: '',
  passwordConfirmation: '',
})

const apiMessage = reactive({
  text: '',
  type: 'error',
})

const clearFieldError = (field) => {
  errors[field] = ''
  apiMessage.text = ''
}

const handlePhoneInput = (event) => {
  const normalized = normalizeIndianPhone(event.target.value)
  if (event.target.value !== normalized) event.target.value = normalized
  form.phone = normalized
  clearFieldError('phone')
}

// Send OTP Handler
const handleSendOtp = async () => {
  apiMessage.text = ''
  if (!form.phone) {
    errors.phone = 'Phone number is required.'
    return
  }

  isLoading.value = true

  try {
    const response = await api.post('/forgot/send-otp', {
      phone: form.phone,
    })

    if (response.data?.success) {
      step.value = 2
      apiMessage.type = 'success'
      apiMessage.text = response.data.message || 'OTP sent successfully.'
    }
  } catch (error) {
    apiMessage.type = 'error'
    if (error.response) {
      const { status, data } = error.response
      if (status === 422 && data.errors?.phone) {
        errors.phone = data.errors.phone[0]
      } else {
        apiMessage.text = data.message || 'Failed to send OTP.'
      }
    } else {
      apiMessage.text = 'Network error. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

// Reset Password Handler
const handleResetPassword = async () => {
  apiMessage.text = ''
  let isValid = true

  if (!/^\d{6}$/.test(form.otp)) {
    errors.otp = 'Please enter valid 6-digit OTP.'
    isValid = false
  }

  if (!form.password) {
    errors.password = 'New password is required.'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
    isValid = false
  }

  if (form.password !== form.passwordConfirmation) {
    errors.passwordConfirmation = 'Passwords do not match.'
    isValid = false
  }

  if (!isValid) return

  isLoading.value = true

  try {
    const response = await api.post('/forgot/reset', {
      phone: form.phone,
      otp: form.otp,
      password: form.password,
      password_confirmation: form.passwordConfirmation,
    })

    if (response.data?.success) {
      alert('Password reset successfully! Redirecting to login.')
      router.push('/')
    }
  } catch (error) {
    apiMessage.type = 'error'
    if (error.response) {
      const { status, data } = error.response
      if (status === 422 && data.errors) {
        errors.otp = data.errors.otp ? data.errors.otp[0] : ''
        errors.password = data.errors.password ? data.errors.password[0] : ''
        apiMessage.text = data.message || 'Validation error.'
      } else {
        apiMessage.text = data.message || 'Password reset failed.'
      }
    } else {
      apiMessage.text = 'Network error. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script><style>
.gsk-auth-page{--auth-navy:#18365e;display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,480px);min-height:min-content;background:#f4f7fb}.auth-brand-panel{position:relative;display:flex;flex-direction:column;justify-content:center;min-height:100%;overflow:hidden;padding:clamp(32px,7vw,90px);background:radial-gradient(circle at 82% 18%,#456fa4 0,transparent 32%),linear-gradient(145deg,#142b4b,#315f9f);color:#fff}.auth-brand-mark{display:grid;place-items:center;width:68px;height:68px;border:1px solid #ffffff35;border-radius:22px;background:#ffffff17;font-size:36px}.auth-brand-panel>span{margin-top:25px;color:#c8d8ed;font-size:10px;font-weight:900;letter-spacing:.18em}.auth-brand-panel h1{margin:12px 0;color:#fff;font-size:clamp(34px,5vw,58px);font-weight:900;line-height:1.08;letter-spacing:-.05em}.auth-brand-panel p{max-width:400px;color:#d3e0f1;font-size:14px}.auth-brand-art{position:absolute;right:8%;bottom:5%;font-size:clamp(100px,18vw,210px);opacity:.17;transform:rotate(-12deg)}.auth-form-panel{align-self:center;width:100%;max-width:480px;margin:auto;padding:clamp(24px,5vw,54px)}.auth-mobile-brand{display:none;align-items:center;gap:9px;margin-bottom:25px;color:#1e2d43}.auth-mobile-brand span{font-size:27px}.auth-heading{margin-bottom:24px}.auth-eyebrow{color:#8191a8;font-size:9px;font-weight:900;letter-spacing:.15em}.auth-heading h2{margin:6px 0;font-size:29px;font-weight:900;letter-spacing:-.04em}.auth-heading p{margin:0;color:#78869a;font-size:12px}.gsk-auth-form .form-label{font-size:11px;font-weight:800;color:#35465e}.gsk-auth-form .form-control,.gsk-auth-form .input-group-text{min-height:49px;border-color:#dce4ef}.gsk-auth-form .input-group .form-control{border-radius:0 11px 11px 0}.gsk-auth-form .input-group-text{border-radius:11px 0 0 11px;background:#f1f5fa;color:#315f9f;font-size:12px;font-weight:800}.auth-submit{min-height:52px;margin-top:8px;border-radius:12px;font-size:13px}.auth-remember{display:flex;align-items:center;gap:8px;margin:12px 0 15px;color:#66758a;font-size:11px}.auth-switch{margin:20px 0 0;text-align:center;color:#718096;font-size:11px}.auth-switch a{font-weight:850}.auth-safety{margin:18px 0 0;text-align:center;color:#8b98aa;font-size:10px}.password-meter{height:4px;flex:1;border-radius:5px;background:#e9eef5}.password-meter.bg-danger{background:#d65a60}.password-meter.bg-warning{background:#e8b44d}.password-meter.bg-success{background:#269a6b}.auth-back-link{display:inline-block;margin-bottom:22px;font-size:11px;font-weight:800}.gsk-auth-single{grid-template-columns:1fr;place-items:center;padding:24px}.gsk-auth-single .auth-form-panel{max-width:460px;padding:30px;border:1px solid #e3eaf3;border-radius:22px;background:#fff;box-shadow:0 16px 45px #1b365d12}.gsk-auth-single .auth-mobile-brand{display:flex}
@media(max-width:760px){.gsk-auth-page{display:block;padding:0 0 env(safe-area-inset-bottom)}.auth-brand-panel{display:none}.auth-form-panel{max-width:500px;padding:34px 22px}.auth-mobile-brand{display:flex}.auth-heading h2{font-size:26px}.gsk-auth-single{display:grid;min-height:min-content;align-content:center;padding:20px 14px}.gsk-auth-single .auth-form-panel{padding:25px 19px}.auth-switch{margin-top:18px}}
</style>


<style scoped>
.gsk-auth-page.gsk-auth-single{min-height:min-content;display:grid;place-items:center;padding:24px 14px;background:radial-gradient(circle at 80% 0,#44368b 0,transparent 36%),linear-gradient(160deg,#0b1225,#080d1b);color:#f4f6ff}
.gsk-auth-single .auth-form-panel{width:min(100%,520px);border:1px solid #2e3d5e;border-radius:23px;background:linear-gradient(155deg,#17223c,#101a2e);color:#f4f6ff;box-shadow:0 20px 50px #00000035}
.auth-back-link,.auth-form-panel a{color:#b8adff}.auth-mobile-brand{color:#fff}.auth-mobile-brand>span{background:linear-gradient(145deg,#765cf5,#286ee9)}
.auth-eyebrow{color:#b9adff;font-size:9px;font-weight:950;letter-spacing:.15em}.auth-heading h2{color:#fff;font-weight:950}.auth-heading p{color:#9ba9c8}
.auth-form-panel .form-label{color:#cbd5e9;font-weight:800}.auth-form-panel .form-control,.auth-form-panel .input-group-text{border-color:#39496c;background:#0b1428;color:#fff}
.auth-form-panel .form-control::placeholder{color:#7888aa}.auth-form-panel .input-group-text{color:#c6d1e8}
.auth-form-panel .btn-outline-secondary{border-color:#465779;background:#1a2945;color:#c6d1e8}
.auth-submit{border:1px solid #9b8aff;background:radial-gradient(circle at 100% 0, #ffffff 0, #384aff8f 10%), #028214;box-shadow:0 10px 24px #4f5de944}
.auth-safety{color:#8292b2}.gsk-auth-single .alert-success{border-color:#286b5a;background:#123a34;color:#76e4bf}.gsk-auth-single .alert-danger{border-color:#824252;background:#3c202f;color:#ff9eae}
</style>
