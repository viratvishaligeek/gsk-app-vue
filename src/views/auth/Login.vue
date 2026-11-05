<template>
  <main class="gsk-auth-page">
    <section class="auth-brand-panel"><div class="auth-brand-mark">🎮</div><span>GSK PLAY</span><h1>Your game zone.<br>One simple app.</h1><p>Sign in to access your wallet, markets and account.</p><div class="auth-brand-art">🏆</div></section>
    <section class="auth-form-panel">
      <div class="auth-mobile-brand"><span>🎮</span><b>GSK Play</b></div>
      <div class="auth-heading"><span class="auth-eyebrow">WELCOME BACK</span><h2>Sign in</h2><p>Enter your registered mobile number to continue.</p></div>
      <div v-if="errors.api" class="alert alert-danger" role="alert">{{ errors.api }}<button type="button" class="btn-close float-end" @click="errors.api = ''" aria-label="Dismiss"></button></div>
      <form class="gsk-auth-form" @submit.prevent="handleLogin" novalidate>
        <div class="mb-3"><label for="phone" class="form-label">Mobile number</label><div class="input-group"><span class="input-group-text">🇮🇳 +91</span><input id="phone" :value="form.phone" @input="handlePhoneInput" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" class="form-control" placeholder="10-digit mobile number" :aria-invalid="!!errors.phone"></div><small v-if="errors.phone" class="text-danger">{{ errors.phone }}</small></div>
        <div class="mb-3"><div class="d-flex justify-content-between"><label for="password" class="form-label">Password</label><router-link to="/forgot-password" class="small">Forgot password?</router-link></div><div class="input-group"><input id="password" v-model="form.password" :type="showPassword?'text':'password'" class="form-control" autocomplete="current-password" placeholder="Enter password"><button class="btn btn-outline-secondary" type="button" @click="showPassword=!showPassword" :aria-label="showPassword?'Hide password':'Show password'">{{ showPassword?'🙈':'👁️' }}</button></div><small v-if="errors.password" class="text-danger">{{ errors.password }}</small></div>
        <label class="auth-remember"><input v-model="form.rememberMe" type="checkbox"> <span>Keep me signed in on this device</span></label>
        <button class="btn btn-primary w-100 auth-submit" type="submit" :disabled="isLoading"><span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>{{ isLoading?'Signing in…':'Continue to GSK Play →' }}</button>
      </form>
      <p class="auth-switch">New to GSK Play? <router-link to="/register">Create an account</router-link></p>
      <p class="auth-safety">🔒 Your account details are protected.</p>
    </section>
  </main>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/plugins/axios'
import { useAuthStore } from '@/utils/auth'
import { isValidIndianPhone } from '@/utils/indianPhone'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  phone: '',
  password: '',
  rememberMe: false,
})

const showPassword = ref(false)
const isLoading = ref(false)

const errors = reactive({
  phone: '',
  password: '',
  api: '',
})

const clearFieldError = (field) => {
  errors[field] = ''
  errors.api = ''
}

const validateForm = () => {
  let isValid = true
  if (!form.phone) {
    errors.phone = 'Phone number is required.'
    isValid = false
  } else if (!isValidIndianPhone(form.phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.'
    isValid = false
  } else {
    errors.phone = ''
  }

  if (!form.password) {
    errors.password = 'Password is required.'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.'
    isValid = false
  } else {
    errors.password = ''
  }

  return isValid
}
const handlePhoneInput = (event) => {
  const value = event.target.value.replace(/\D/g, '').slice(0, 10)
  form.phone = value
  clearFieldError('phone')
}

const handleLogin = async () => {
  errors.api = ''

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const response = await api.post('/login', {
      phone: form.phone,
      password: form.password,
      remember: form.rememberMe,
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
        form.rememberMe
      )

      const redirectPath =
        typeof route.query.redirect === 'string'
          ? route.query.redirect
          : '/dashboard'

      await router.push(redirectPath)

      return
    }

    errors.api =
      responseData?.message ||
      'Login failed. Please try again.'
  } catch (error) {
    errors.api =
      error.response?.data?.message ||
      'Unable to login. Please try again.'
  } finally {
    isLoading.value = false
  }
}

</script><style scoped>
.gsk-auth-page{--auth-navy:#18365e;display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,480px);min-height:min-content;background:#f4f7fb}.auth-brand-panel{position:relative;display:flex;flex-direction:column;justify-content:center;min-height:100%;overflow:hidden;padding:clamp(32px,7vw,90px);background:radial-gradient(circle at 82% 18%,#456fa4 0,transparent 32%),linear-gradient(145deg,#142b4b,#315f9f);color:#fff}.auth-brand-mark{display:grid;place-items:center;width:68px;height:68px;border:1px solid #ffffff35;border-radius:22px;background:#ffffff17;font-size:36px}.auth-brand-panel>span{margin-top:25px;color:#c8d8ed;font-size:10px;font-weight:900;letter-spacing:.18em}.auth-brand-panel h1{margin:12px 0;color:#fff;font-size:clamp(34px,5vw,58px);font-weight:900;line-height:1.08;letter-spacing:-.05em}.auth-brand-panel p{max-width:400px;color:#d3e0f1;font-size:14px}.auth-brand-art{position:absolute;right:8%;bottom:5%;font-size:clamp(100px,18vw,210px);opacity:.17;transform:rotate(-12deg)}.auth-form-panel{align-self:center;width:100%;max-width:480px;margin:auto;padding:clamp(24px,5vw,54px)}.auth-mobile-brand{display:none;align-items:center;gap:9px;margin-bottom:25px;color:#1e2d43}.auth-mobile-brand span{font-size:27px}.auth-heading{margin-bottom:24px}.auth-eyebrow{color:#8191a8;font-size:9px;font-weight:900;letter-spacing:.15em}.auth-heading h2{margin:6px 0;font-size:29px;font-weight:900;letter-spacing:-.04em}.auth-heading p{margin:0;color:#78869a;font-size:12px}.gsk-auth-form .form-label{font-size:11px;font-weight:800;color:#35465e}.gsk-auth-form .form-control,.gsk-auth-form .input-group-text{min-height:49px;border-color:#dce4ef}.gsk-auth-form .input-group .form-control{border-radius:0 11px 11px 0}.gsk-auth-form .input-group-text{border-radius:11px 0 0 11px;background:#f1f5fa;color:#315f9f;font-size:12px;font-weight:800}.auth-submit{min-height:52px;margin-top:8px;border-radius:12px;font-size:13px}.auth-remember{display:flex;align-items:center;gap:8px;margin:12px 0 15px;color:#66758a;font-size:11px}.auth-switch{margin:20px 0 0;text-align:center;color:#718096;font-size:11px}.auth-switch a{font-weight:850}.auth-safety{margin:18px 0 0;text-align:center;color:#8b98aa;font-size:10px}.password-meter{height:4px;flex:1;border-radius:5px;background:#e9eef5}.password-meter.bg-danger{background:#d65a60}.password-meter.bg-warning{background:#e8b44d}.password-meter.bg-success{background:#269a6b}.auth-back-link{display:inline-block;margin-bottom:22px;font-size:11px;font-weight:800}.gsk-auth-single{grid-template-columns:1fr;place-items:center;padding:24px}.gsk-auth-single .auth-form-panel{max-width:460px;padding:30px;border:1px solid #e3eaf3;border-radius:22px;background:#fff;box-shadow:0 16px 45px #1b365d12}.gsk-auth-single .auth-mobile-brand{display:flex}
@media(max-width:760px){.gsk-auth-page{display:block;padding:0 0 env(safe-area-inset-bottom)}.auth-brand-panel{display:none}.auth-form-panel{max-width:500px;padding:34px 22px}.auth-mobile-brand{display:flex}.auth-heading h2{font-size:26px}.gsk-auth-single{display:grid;min-height:min-content;align-content:center;padding:20px 14px}.gsk-auth-single .auth-form-panel{padding:25px 19px}.auth-switch{margin-top:18px}}

/* Preserved responsive/theme overrides */

.gsk-auth-page{min-height:min-content;background:radial-gradient(circle at 80% 0,#44368b 0,transparent 36%),linear-gradient(160deg,#0b1225,#080d1b);color:#f4f6ff}
.auth-brand-panel{position:relative;overflow:hidden;border:1px solid #7a6bd35c;border-radius:0 0 28px 28px;background:radial-gradient(circle at 80% 0,#8b72ff55 0,transparent 40%),linear-gradient(140deg,#211e4b,#142b50);color:#fff}
.auth-brand-panel>span,.auth-eyebrow{color:#b9adff;font-size:9px;font-weight:950;letter-spacing:.15em}.auth-brand-panel h1{color:#fff;font-weight:950}.auth-brand-panel p{color:#c2cde6}
.auth-brand-mark{border:1px solid #ffffff30;border-radius:18px;background:linear-gradient(145deg,#765cf5,#286ee9);box-shadow:0 9px 25px #765cf544}
.auth-brand-art{opacity:.18}
.auth-form-panel{border:1px solid #2e3d5e;border-radius:22px;background:linear-gradient(155deg,#17223c,#101a2e);color:#f4f6ff;box-shadow:0 20px 50px #00000035}
.auth-mobile-brand{color:#fff}.auth-mobile-brand>span{background:linear-gradient(145deg,#765cf5,#286ee9)}
.auth-heading h2{color:#fff;font-weight:950}.auth-heading p{color:#9ba9c8}.auth-form-panel .form-label{color:#cbd5e9;font-weight:800}
.auth-form-panel .form-control,.auth-form-panel .input-group-text{border-color:#39496c;background:#0b1428;color:#fff}.auth-form-panel .form-control::placeholder{color:#7888aa}
.auth-form-panel .input-group-text{color:#c6d1e8}.auth-form-panel .btn-outline-secondary{border-color:#465779;background:#1a2945;color:#c6d1e8}
.auth-remember{color:#aebbd5}.auth-submit{border:1px solid #9b8aff;background:linear-gradient(105deg,#795cf5,#286ee9);box-shadow:0 10px 24px #4f5de944}
.auth-switch{color:#aebbd5}.auth-switch a,.auth-form-panel a{color:#b8adff}.auth-safety{color:#8292b2}
.gsk-auth-page .alert-danger{border-color:#824252;background:#3c202f;color:#ff9eae}
@media(max-width:767px){.auth-form-panel{margin:14px;border-radius:22px}}

/* Responsive authentication layout: avoid the desktop two-column minimum width on phones. */
.gsk-auth-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 480px);
  align-items: stretch;
  gap: clamp(18px, 4vw, 56px);
  width: 100%;
  min-height: 100svh;
  padding: clamp(16px, 4vw, 48px);
  box-sizing: border-box;
}
.gsk-auth-page > * { min-width: 0; }
.auth-brand-panel {
  min-width: 0;
  min-height: 100%;
  padding: clamp(24px, 5vw, 64px);
  border-radius: 26px;
}
.auth-form-panel {
  width: 100%;
  max-width: 480px;
  min-width: 0;
  margin: auto;
  padding: clamp(20px, 3vw, 34px);
  box-sizing: border-box;
}
.gsk-auth-form .form-control,
.gsk-auth-form .input-group-text,
.gsk-auth-form .input-group .btn { min-height: 46px; }
.gsk-auth-form .input-group { min-width: 0; }
.gsk-auth-form .input-group > .form-control { min-width: 0; }
.auth-submit { min-height: 48px; white-space: normal; }
@media (max-width: 767.98px) {
  .gsk-auth-page {
    grid-template-columns: minmax(0, 1fr);
    min-height: 100svh;
    gap: 0;
    padding: max(12px, env(safe-area-inset-top)) 12px max(18px, env(safe-area-inset-bottom));
  }
  .auth-brand-panel { display: none; }
  .auth-form-panel {
    width: min(100%, 480px);
    max-width: 480px;
    margin: auto;
    padding: 22px 18px;
    border-radius: 22px;
  }
  .auth-mobile-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
  .auth-mobile-brand > span {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    flex: 0 0 42px;
  }
  .auth-heading { margin-bottom: 20px; }
  .auth-heading h2 { font-size: clamp(25px, 7vw, 32px); }
  .gsk-auth-form .mb-3 { margin-bottom: 16px !important; }
  .auth-switch, .auth-safety { text-align: center; }
}
@media (max-width: 360px) {
  .gsk-auth-page { padding-left: 9px; padding-right: 9px; }
  .auth-form-panel { padding: 18px 14px; }
  .auth-heading p { font-size: 13px; }
  .gsk-auth-form .input-group-text { padding: 0 9px; font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .auth-submit, .auth-form-panel, .auth-brand-panel { transition: none !important; animation: none !important; }
}
</style>
