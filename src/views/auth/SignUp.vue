<template>
  <main class="gsk-auth-page">
    <section class="auth-brand-panel"><div class="auth-brand-mark">🎁</div><span>JOIN GSK PLAY</span><h1>Make your<br>account yours.</h1><p>Create an account to manage your activity and wallet in one place.</p><div class="auth-brand-art">✨</div></section>
    <section class="auth-form-panel">
      <div class="auth-mobile-brand"><span>🎮</span><b>GSK Play</b></div>
      <div class="auth-heading"><span class="auth-eyebrow">GET STARTED</span><h2>Create account</h2><p>Just a few details to get you started.</p></div>
      <div v-if="errors.api" class="alert alert-danger" role="alert">{{ errors.api }}</div>
      <form class="gsk-auth-form" @submit.prevent="handleSignUp" novalidate>
        <div class="mb-3"><label for="fullName" class="form-label">Full name</label><input id="fullName" v-model.trim="form.fullName" class="form-control" type="text" autocomplete="name" placeholder="Enter your full name"><small v-if="errors.fullName" class="text-danger">{{ errors.fullName }}</small></div>
        <div class="mb-3"><label for="phone" class="form-label">Mobile number</label><div class="input-group"><span class="input-group-text">🇮🇳 +91</span><input id="phone" :value="form.phone" @input="handlePhoneInput" class="form-control" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="10-digit mobile number"></div><small v-if="errors.phone" class="text-danger">{{ errors.phone }}</small></div>
        <div class="mb-3"><label for="password" class="form-label">Create password</label><div class="input-group"><input id="password" v-model="form.password" :type="showPassword?'text':'password'" class="form-control" autocomplete="new-password" placeholder="At least 8 characters"><button class="btn btn-outline-secondary" type="button" @click="showPassword=!showPassword">{{ showPassword?'🙈':'👁️' }}</button></div><div class="d-flex gap-1 mt-2"><span v-for="n in 4" :key="n" class="password-meter" :class="getBarClass(n)"></span></div><small :class="strengthTextClass">{{ passwordStrengthText }}</small><small v-if="errors.password" class="text-danger d-block">{{ errors.password }}</small></div>
        <div class="mb-3"><label for="referralCode" class="form-label">Referral code <span class="text-secondary fw-normal">(optional)</span></label><input id="referralCode" v-model.trim="form.referralCode" class="form-control text-uppercase" autocomplete="off" placeholder="Enter referral code"><small v-if="errors.referralCode" class="text-danger">{{ errors.referralCode }}</small></div>
        <button class="btn btn-primary w-100 auth-submit" type="submit" :disabled="isLoading"><span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>{{ isLoading?'Creating account…':'Create my account →' }}</button>
      </form>
      <p class="auth-switch">Already registered? <router-link to="/">Sign in</router-link></p>
      <p class="auth-safety">🔒 Your information is handled securely.</p>
    </section>
  </main>
</template>
<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/plugins/axios'
import { useAuthStore } from '@/utils/auth'
import { normalizeIndianPhone } from '@/utils/indianPhone'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  fullName: '',
  phone: '',
  password: '',
  referralCode: typeof route.query.ref === 'string' ? route.query.ref.toUpperCase() : '',
})

const showPassword = ref(false)
const isLoading = ref(false)

const errors = reactive({
  fullName: '',
  phone: '',
  password: '',
  referralCode: '',
  api: '',
})

const clearFieldError = (field) => {
  errors[field] = ''
  errors.api = ''
}

// Client Validation
const handlePhoneInput = (event) => {
  const normalized = normalizeIndianPhone(event.target.value)
  if (event.target.value !== normalized) event.target.value = normalized
  form.phone = normalized
  clearFieldError('phone')
}

const validateForm = () => {
  let isValid = true
  if (!form.fullName) {
    errors.fullName = 'Full name is required.'
    isValid = false
  } else if (form.fullName.length < 2) {
    errors.fullName = 'Name must be at least 2 characters.'
    isValid = false
  }

  if (!form.phone) {
    errors.phone = 'Phone number is required.'
    isValid = false
  }

  if (!form.password) {
    errors.password = 'Password is required.'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
    isValid = false
  }
  return isValid
}

// Password Strength Computation
const passwordScore = computed(() => {
  const p = form.password
  let score = 0
  if (!p) return 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const passwordStrengthText = computed(() => {
  switch (passwordScore.value) {
    case 1:
      return 'Weak'
    case 2:
      return 'Medium'
    case 3:
      return 'Strong'
    case 4:
      return 'Very Strong'
    default:
      return 'Too Short'
  }
})

const strengthTextClass = computed(() => {
  switch (passwordScore.value) {
    case 1:
      return 'text-danger'
    case 2:
      return 'text-warning'
    case 3:
    case 4:
      return 'text-success'
    default:
      return 'text-muted'
  }
})

const getBarClass = (barIndex) => {
  if (barIndex <= passwordScore.value) {
    if (passwordScore.value === 1) return 'bg-danger'
    if (passwordScore.value === 2) return 'bg-warning'
    return 'bg-success'
  }
  return 'bg-light'
}

const handleSignUp = async () => {
  errors.api = ''

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const response = await api.post('/register', {
      name: form.fullName,
      phone: form.phone,
      password: form.password,
      ...(form.referralCode ? { referral_code: form.referralCode.trim().toUpperCase() } : {}),
    })

    const responseData = response.data

    if (
      responseData?.success &&
      responseData?.data?.token
    ) {
      const userData = responseData.data.user || {}
      authStore.setAuth(
        responseData.data.token,
        userData,
        false
      )
      await router.push({ name: 'dashboard' })
      return
    }

    errors.api =
      responseData?.message ||
      'Account creation failed. Please try again.'
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response

      if (status === 422 && data?.errors) {
        errors.fullName = data.errors.name?.[0] || ''
        errors.phone = data.errors.phone?.[0] || ''
        errors.password = data.errors.password?.[0] || ''
        errors.referralCode = data.errors.referral_code?.[0] || ''

        errors.api =
          data.message ||
          'Validation failed. Please review the highlighted fields.'
      } else {
        errors.api =
          data?.message ||
          'Account creation failed. Please try again.'
      }
    } else {
      errors.api =
        'Network error. Please check your internet connection.'
    }
  } finally {
    isLoading.value = false
  }
}

</script><style>
.gsk-auth-page{--auth-navy:#18365e;display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,480px);min-height:100dvh;background:#f4f7fb}.auth-brand-panel{position:relative;display:flex;flex-direction:column;justify-content:center;min-height:100%;overflow:hidden;padding:clamp(32px,7vw,90px);background:radial-gradient(circle at 82% 18%,#456fa4 0,transparent 32%),linear-gradient(145deg,#142b4b,#315f9f);color:#fff}.auth-brand-mark{display:grid;place-items:center;width:68px;height:68px;border:1px solid #ffffff35;border-radius:22px;background:#ffffff17;font-size:36px}.auth-brand-panel>span{margin-top:25px;color:#c8d8ed;font-size:10px;font-weight:900;letter-spacing:.18em}.auth-brand-panel h1{margin:12px 0;color:#fff;font-size:clamp(34px,5vw,58px);font-weight:900;line-height:1.08;letter-spacing:-.05em}.auth-brand-panel p{max-width:400px;color:#d3e0f1;font-size:14px}.auth-brand-art{position:absolute;right:8%;bottom:5%;font-size:clamp(100px,18vw,210px);opacity:.17;transform:rotate(-12deg)}.auth-form-panel{align-self:center;width:100%;max-width:480px;margin:auto;padding:clamp(24px,5vw,54px)}.auth-mobile-brand{display:none;align-items:center;gap:9px;margin-bottom:25px;color:#1e2d43}.auth-mobile-brand span{font-size:27px}.auth-heading{margin-bottom:24px}.auth-eyebrow{color:#8191a8;font-size:9px;font-weight:900;letter-spacing:.15em}.auth-heading h2{margin:6px 0;font-size:29px;font-weight:900;letter-spacing:-.04em}.auth-heading p{margin:0;color:#78869a;font-size:12px}.gsk-auth-form .form-label{font-size:11px;font-weight:800;color:#35465e}.gsk-auth-form .form-control,.gsk-auth-form .input-group-text{min-height:49px;border-color:#dce4ef}.gsk-auth-form .input-group .form-control{border-radius:0 11px 11px 0}.gsk-auth-form .input-group-text{border-radius:11px 0 0 11px;background:#f1f5fa;color:#315f9f;font-size:12px;font-weight:800}.auth-submit{min-height:52px;margin-top:8px;border-radius:12px;font-size:13px}.auth-remember{display:flex;align-items:center;gap:8px;margin:12px 0 15px;color:#66758a;font-size:11px}.auth-switch{margin:20px 0 0;text-align:center;color:#718096;font-size:11px}.auth-switch a{font-weight:850}.auth-safety{margin:18px 0 0;text-align:center;color:#8b98aa;font-size:10px}.password-meter{height:4px;flex:1;border-radius:5px;background:#e9eef5}.password-meter.bg-danger{background:#d65a60}.password-meter.bg-warning{background:#e8b44d}.password-meter.bg-success{background:#269a6b}.auth-back-link{display:inline-block;margin-bottom:22px;font-size:11px;font-weight:800}.gsk-auth-single{grid-template-columns:1fr;place-items:center;padding:24px}.gsk-auth-single .auth-form-panel{max-width:460px;padding:30px;border:1px solid #e3eaf3;border-radius:22px;background:#fff;box-shadow:0 16px 45px #1b365d12}.gsk-auth-single .auth-mobile-brand{display:flex}
@media(max-width:760px){.gsk-auth-page{display:block;padding:0 0 env(safe-area-inset-bottom)}.auth-brand-panel{display:none}.auth-form-panel{max-width:500px;padding:34px 22px}.auth-mobile-brand{display:flex}.auth-heading h2{font-size:26px}.gsk-auth-single{display:grid;min-height:100dvh;align-content:center;padding:20px 14px}.gsk-auth-single .auth-form-panel{padding:25px 19px}.auth-switch{margin-top:18px}}
</style>
