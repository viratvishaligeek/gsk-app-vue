<template>
  <main class="profile-page">
      <header class="profile-screen-heading"><span>👤</span><div><small>YOUR ACCOUNT</small><h1>Profile & security</h1></div></header>
    <div class="profile-layout">
      <nav class="profile-section-nav" aria-label="Profile sections"><a href="#profile-personal">👤 Personal details</a><a href="#profile-security">🔐 Password & security</a></nav>
      <section id="profile-personal" class="profile-section" >
        <div class="section-heading">
          <div class="section-heading__icon">
            <span class="gsk-emoji-icon" aria-hidden="true">👤</span>
          </div>
          <div>
            <h2>Personal information</h2>
            <p>Update your details below.</p>
          </div>
        </div>

        <form @submit.prevent="handleUpdateProfile" novalidate>
          <div class="edit-grid">
            <div class="edit-field">
              <label for="profile-name">Full name <span>*</span></label>
              <div class="line-input">
                <span class="gsk-emoji-icon" aria-hidden="true">👤</span>
                <input id="profile-name" v-model.trim="profileForm.name" type="text" placeholder="Enter your name"
                  autocomplete="name" maxlength="255" required :class="{ 'input-error': errors.name }"
                  @input="clearProfileError('name')" />
              </div>
              <small v-if="errors.name" class="field-error">{{ errors.name }}</small>
            </div>

            <div class="edit-field">
              <label for="profile-phone">Phone number</label>
              <div class="line-input line-input--readonly">
                <span class="gsk-emoji-icon" aria-hidden="true">📞</span>
                <input id="profile-phone" :value="authStore.user?.phone || ''" type="tel" readonly
                  aria-describedby="phone-note" />
                <span class="gsk-emoji-icon" aria-hidden="true">🔒</span>
              </div>
            </div>

            <div class="edit-field">
              <label for="profile-city">City</label>
              <div class="line-input">
                <span class="gsk-emoji-icon" aria-hidden="true">📍</span>
                <input id="profile-city" v-model.trim="profileForm.city" type="text" placeholder="Enter your city"
                  autocomplete="address-level2" maxlength="255" :class="{ 'input-error': errors.city }"
                  @input="clearProfileError('city')" />
              </div>
              <small v-if="errors.city" class="field-error">{{ errors.city }}</small>
            </div>

            <div class="edit-field">
              <label for="profile-gender">Gender</label>
              <div class="line-input">
                <span class="gsk-emoji-icon" aria-hidden="true">💞</span>
                <select id="profile-gender" v-model="profileForm.gender" :class="{ 'input-error': errors.gender }"
                  @change="clearProfileError('gender')">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <span class="gsk-emoji-icon" aria-hidden="true">⌄</span>
              </div>
              <small v-if="errors.gender" class="field-error">{{ errors.gender }}</small>
            </div>

          </div>

          <div v-if="profileStatus.text" class="status-message" :class="'status-message--' + profileStatus.type"
            role="status">
            <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
            <span>{{ profileStatus.text }}</span>
          </div>

          <div class="form-footer">
            <span class="footer-note">
              <span class="gsk-emoji-icon" aria-hidden="true">🛡️</span>
              Your information is protected.
            </span>

            <button class="save-button save-button--dark" type="submit" :disabled="isProfileLoading">
              <span v-if="isProfileLoading" class="spinner-border spinner-border-sm"></span>
              <span class="gsk-emoji-icon" aria-hidden="true">✓</span>
              {{ isProfileLoading ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </form>
      </section>

      <section class="profile-section security-section">
        <div class="section-heading">
          <div class="section-heading__icon section-heading__icon--purple">
            <span class="gsk-emoji-icon" aria-hidden="true">🔐</span>
          </div>
          <div>
            <h2 style="color: black;">Password & security</h2>
            <p>Keep your account protected.</p>
          </div>
        </div>

        <div class="security-banner">
          <span class="gsk-emoji-icon" aria-hidden="true">ℹ️</span>
          <span>Use a strong password with at least 8 characters.</span>
        </div>

        <div v-if="passwordStatus.text" class="status-message" :class="'status-message--' + passwordStatus.type"
          role="status" aria-live="polite">
          <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
          <span>{{ passwordStatus.text }}</span>
          <button type="button" class="dismiss-button" aria-label="Dismiss" @click="passwordStatus.text = ''">
            <span class="gsk-emoji-icon" aria-hidden="true">✕</span>
          </button>
        </div>

        <form @submit.prevent="handleChangePassword" novalidate>
          <div class="edit-grid security-grid">
            <div class="edit-field edit-field--full">
              <label for="current-password">Current password <span>*</span></label>
              <div class="line-input">
                <span class="gsk-emoji-icon" aria-hidden="true">🔑</span>
                <input id="current-password" v-model="passwordForm.current_password"
                  :type="showCurrentPassword ? 'text' : 'password'" autocomplete="current-password"
                  placeholder="Enter current password" :class="{ 'input-error': passErrors.current_password }"
                  @input="clearPasswordError('current_password')" />
                <button type="button" class="eye-button"
                  :aria-label="showCurrentPassword ? 'Hide password' : 'Show password'"
                  @click="showCurrentPassword = !showCurrentPassword">
                  <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
                </button>
              </div>
              <small v-if="passErrors.current_password" class="field-error">
                {{ passErrors.current_password }}
              </small>
            </div>

            <div class="edit-field">
              <label for="new-password">New password <span>*</span></label>
              <div class="line-input">
                <span class="gsk-emoji-icon" aria-hidden="true">🔒</span>
                <input id="new-password" v-model="passwordForm.new_password"
                  :type="showNewPassword ? 'text' : 'password'" autocomplete="new-password"
                  placeholder="Min. 8 characters" :class="{ 'input-error': passErrors.new_password }"
                  @input="clearPasswordError('new_password')" />
                <button type="button" class="eye-button"
                  :aria-label="showNewPassword ? 'Hide password' : 'Show password'"
                  @click="showNewPassword = !showNewPassword">
                  <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
                </button>
              </div>
              <small v-if="passErrors.new_password" class="field-error">
                {{ passErrors.new_password }}
              </small>
            </div>

            <div class="edit-field">
              <label for="confirm-password">Confirm password <span>*</span></label>
              <div class="line-input">
                <span class="gsk-emoji-icon" aria-hidden="true">🔒</span>
                <input id="confirm-password" v-model="passwordForm.new_password_confirmation"
                  :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password"
                  placeholder="Repeat password" :class="{ 'input-error': passErrors.new_password_confirmation }"
                  @input="clearPasswordError('new_password_confirmation')" />
                <button type="button" class="eye-button"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                  @click="showConfirmPassword = !showConfirmPassword">
                  <span class="gsk-emoji-icon" aria-hidden="true">✨</span>
                </button>
              </div>
              <small v-if="passErrors.new_password_confirmation" class="field-error">
                {{ passErrors.new_password_confirmation }}
              </small>
            </div>
          </div>

          <div class="form-footer security-footer">
            <span class="footer-note">
              <span class="gsk-emoji-icon" aria-hidden="true">🔐</span>
              Never share your password.
            </span>
            <button class="save-button save-button--dark" type="submit" :disabled="isPasswordLoading">
              <span v-if="isPasswordLoading" class="spinner-border spinner-border-sm"></span>
              <span class="gsk-emoji-icon" aria-hidden="true">🛡️</span>
              {{ isPasswordLoading ? 'Updating...' : 'Update password' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
<script setup>
import { reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/utils/auth'
import api from '@/plugins/axios'

const authStore = useAuthStore()

const isProfileLoading = ref(false)
const isPasswordLoading = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const profileStatus = reactive({ type: '', text: '' })
const passwordStatus = reactive({ type: '', text: '' })
const errors = reactive({})
const passErrors = reactive({})

const profileForm = reactive({ name: '', gender: '', city: '', address: '' })
const passwordForm = reactive({ current_password: '', new_password: '', new_password_confirmation: '' })

const populateUserData = (user = authStore.user) => {
  if (!user) return
  profileForm.name = user.name ?? ''
  profileForm.gender = String(user.gender ?? '').toLowerCase()
  profileForm.city = user.city ?? ''
  profileForm.address = user.address ?? ''
}

watch(() => authStore.user, (user) => populateUserData(user), { immediate: true })

const clearProfileError = (field) => {
  if (errors[field]) errors[field] = ''
}

const clearPasswordError = (field) => {
  if (passErrors[field]) passErrors[field] = ''
  if (field === 'new_password' || field === 'new_password_confirmation') passwordStatus.text = ''
}

const applyServerErrors = (target, serverErrors) => {
  Object.keys(serverErrors || {}).forEach((key) => {
    const message = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key]
    target[key] = String(message || 'Please check this field.')
  })
}

const handleUpdateProfile = async () => {
  Object.keys(errors).forEach((key) => { errors[key] = '' })
  profileStatus.text = ''

  if (!profileForm.name.trim()) {
    errors.name = 'Please enter your full name.'
    return
  }

  isProfileLoading.value = true
  try {
    // Bank and UPI details are managed separately and are intentionally excluded from this request.
    const payload = {
      name: profileForm.name.trim(),
      gender: profileForm.gender,
      city: profileForm.city.trim(),
      address: profileForm.address.trim(),
    }
    const response = await api.put('/update-profile', payload)

    if (response.data?.success) {
      const updatedUser = response.data?.data?.user
      if (updatedUser) {
        authStore.updateUserData(updatedUser)
        populateUserData(updatedUser)
      }
      profileStatus.type = 'success'
      profileStatus.text = response.data.message || 'Profile updated successfully.'
    } else {
      profileStatus.type = 'danger'
      profileStatus.text = response.data?.message || 'Profile could not be updated. Please try again.'
    }
  } catch (error) {
    if (error.response?.status === 422 && error.response.data?.errors) {
      applyServerErrors(errors, error.response.data.errors)
    } else {
      profileStatus.type = 'danger'
      profileStatus.text = error.response?.data?.message || 'Failed to update profile. Check your connection and try again.'
    }
  } finally {
    isProfileLoading.value = false
  }
}

const handleChangePassword = async () => {
  Object.keys(passErrors).forEach((key) => { passErrors[key] = '' })
  passwordStatus.text = ''

  if (!passwordForm.current_password) passErrors.current_password = 'Please enter your current password.'
  if (!passwordForm.new_password) {
    passErrors.new_password = 'Please enter a new password.'
  } else if (passwordForm.new_password.length < 8) {
    passErrors.new_password = 'New password must be at least 8 characters.'
  }
  if (!passwordForm.new_password_confirmation) {
    passErrors.new_password_confirmation = 'Please confirm your new password.'
  } else if (passwordForm.new_password && passwordForm.new_password !== passwordForm.new_password_confirmation) {
    passErrors.new_password_confirmation = 'The password confirmation does not match.'
  }

  if (Object.values(passErrors).some(Boolean)) return

  isPasswordLoading.value = true
  try {
    const response = await api.put('/update-password', {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
      new_password_confirmation: passwordForm.new_password_confirmation,
    })

    if (response.data?.success) {
      passwordStatus.type = 'success'
      passwordStatus.text = response.data.message || 'Password updated successfully.'
      passwordForm.current_password = ''
      passwordForm.new_password = ''
      passwordForm.new_password_confirmation = ''
      showCurrentPassword.value = false
      showNewPassword.value = false
      showConfirmPassword.value = false
    } else {
      passwordStatus.type = 'danger'
      passwordStatus.text = response.data?.message || 'Password could not be updated. Please try again.'
    }
  } catch (error) {
    if (error.response?.status === 422 && error.response.data?.errors) {
      applyServerErrors(passErrors, error.response.data.errors)
    } else {
      passwordStatus.type = 'danger'
      passwordStatus.text = error.response?.data?.message || 'Password update failed. Check your connection and try again.'
    }
  } finally {
    isPasswordLoading.value = false
  }
}
</script><style scoped>
.profile-page{min-height:100dvh;padding:15px 13px calc(100px + env(safe-area-inset-bottom));background:#f4f7fb}.profile-layout{display:grid;gap:13px;max-width:720px;margin:0 auto}.profile-screen-heading{display:flex;align-items:center;gap:12px;margin:3px 0 5px}.profile-screen-heading>span{display:grid;place-items:center;width:48px;height:48px;border-radius:15px;background:#eaf1fc;font-size:26px}.profile-screen-heading div{display:grid}.profile-screen-heading small{color:#8b99ad;font-size:9px;font-weight:900;letter-spacing:.13em}.profile-screen-heading h1{margin:1px 0;font-size:21px;font-weight:900}.profile-section{padding:17px;border:1px solid #e5ebf3;border-radius:18px;background:#fff;box-shadow:0 7px 20px #1b365d0b}.section-heading{display:flex;align-items:center;gap:11px;margin-bottom:17px}.section-heading__icon{display:grid;place-items:center;width:43px;height:43px;border-radius:13px;background:#edf3fc;font-size:23px}.section-heading__icon--purple{background:#edf3fc}.section-heading h2{margin:0;font-size:14px;font-weight:900;color:#263a55!important}.section-heading p{margin:3px 0 0;color:#8391a4;font-size:10px}.edit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.edit-field{min-width:0}.edit-field--full{grid-column:1/-1}.edit-field label{display:block;margin-bottom:6px;color:#52637b;font-size:10px;font-weight:850}.edit-field label span{color:#c75b61}.line-input{display:flex;align-items:center;gap:9px;min-height:47px;padding:0 11px;border:1px solid #dfe6ef;border-radius:11px;background:#f8fafd}.line-input>.gsk-emoji-icon{font-size:17px}.line-input input,.line-input select{min-width:0;flex:1;width:100%;border:0;outline:0;background:transparent;color:#253951;font-size:12px}.line-input--readonly{background:#f0f3f7}.line-input--readonly input{color:#7c899a}.input-error{border-color:#d45c65!important}.field-error{display:block;margin-top:5px;color:#bd535b;font-size:9px}.security-banner{display:flex;align-items:center;gap:9px;margin-bottom:14px;padding:11px;border-radius:11px;background:#eef4fc;color:#5c6f88;font-size:10px}.status-message{display:flex;align-items:center;gap:9px;margin:12px 0;padding:11px;border-radius:10px;background:#edf7f0;color:#267a53;font-size:10px}.status-message--error{background:#fff0f0;color:#b34d55}.dismiss-button,.eye-button{border:0;background:transparent;color:#6b7d95}.form-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:17px;padding-top:13px;border-top:1px solid #edf1f6}.footer-note{display:flex;align-items:center;gap:6px;color:#8794a6;font-size:9px}.save-button{display:flex;align-items:center;gap:7px;min-height:43px;padding:9px 14px;border:0;border-radius:11px;background:#244e83;color:#fff;font-size:10px;font-weight:850}.save-button:disabled{opacity:.6}.security-grid{grid-template-columns:1fr 1fr}
@media(max-width:480px){.edit-grid,.security-grid{grid-template-columns:1fr}.edit-field--full{grid-column:auto}.profile-section{padding:14px}.form-footer{align-items:flex-start;flex-direction:column}.save-button{width:100%;justify-content:center}}
</style>
<style scoped>
.profile-section-nav{display:flex;gap:8px;overflow-x:auto;margin:0 0 12px;padding:2px 1px 6px;scrollbar-width:none}.profile-section-nav::-webkit-scrollbar{display:none}.profile-section-nav a{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;min-height:39px;padding:0 13px;border:1px solid #dfe7f1;border-radius:30px;background:#fff;color:#4b607b;text-decoration:none;font-size:10px;font-weight:850}.profile-section-nav a:active{border-color:#315f9f;background:#edf3fc}.profile-section{scroll-margin-top:14px}.profile-page{background:radial-gradient(ellipse at top right,#e9f1fc 0,transparent 34%),#f3f6fb}.profile-section .section-heading{padding-bottom:12px;border-bottom:1px solid #edf1f6}.profile-section .edit-grid{gap:14px}.profile-section .line-input{min-height:47px;border-radius:12px}.profile-section .save-button{min-height:44px;border-radius:12px}
@media(min-width:720px){.profile-section-nav{max-width:720px;margin-right:auto;margin-left:auto}.profile-layout{grid-template-columns:repeat(2,minmax(0,1fr))}.profile-layout>.profile-section:first-of-type{grid-column:1/-1}}
</style>