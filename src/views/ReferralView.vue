<template>
  <main class="gsk-screen">
    <GskScreenHeader emoji="🎁" kicker="GROW YOUR CIRCLE" title="Refer & earn" subtitle="Invite friends and track your rewards." /><section class="referral-steps" aria-label="How referrals work"><div><span>1</span><strong>Share</strong><small>Send your invite</small></div><i></i><div><span>2</span><strong>Friend joins</strong><small>They sign up</small></div><i></i><div><span>3</span><strong>Earn</strong><small>Reward is tracked</small></div></section>
    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div><div v-if="success" class="alert alert-success mt-3">{{ success }}</div>
    <div v-if="loading" class="gsk-empty-state mt-3"><span>⏳</span><strong>Loading referral details…</strong></div>
    <template v-else>
      <section class="referral-code-card"><span class="referral-card-kicker">YOUR INVITE CODE</span><div class="referral-code-row"><strong>{{ data.referral_code||'—' }}</strong><button type="button" @click="copyText(data.referral_code)" :disabled="!data.referral_code">📋 Copy</button></div>
        <label class="form-label mt-3" for="shareUrl">Your personal invite link</label><div class="input-group"><input id="shareUrl" class="form-control" :value="data.share_url||''" readonly><button class="btn btn-outline-light" @click="copyText(data.share_url)" :disabled="!data.share_url">Copy</button></div>
        <button type="button" class="btn btn-warning w-100 mt-3 fw-bold" @click="shareReferral">📤 Share invite link</button>
        <p class="referral-reward-note">🎉 Reward: {{ data.referral_percentage }}% of your friend's first successful deposit, with a minimum of ₹{{ money(data.referral_min_amount) }}.</p>
      </section>
      <section class="referral-stats"><article><span>👥</span><small>Friends invited</small><strong>{{ data.total_referrals||0 }}</strong></article><article><span>🗃️</span><small>Total rewards</small><strong>₹{{ money(data.total_reward) }}</strong></article></section>
      <section v-if="data.can_apply_code" class="referral-apply-card"><div><strong>Have a referral code?</strong><small>Apply or change it before your first successful deposit.</small></div><form @submit.prevent="applyCode"><input v-model.trim="applyCodeValue" class="form-control text-uppercase" maxlength="32" placeholder="Enter referral code" required><button class="btn btn-primary w-100 mt-2" type="submit" :disabled="applying||!applyCodeValue">{{ applying?'Applying…':'Apply code' }}</button></form><p v-if="data.applied_referral_code" class="small text-success mt-2 mb-0">Current code: {{ data.applied_referral_code }}</p></section>
      <div v-else-if="data.applied_referral_code" class="alert alert-light border mt-3 small">Referral code <strong>{{ data.applied_referral_code }}</strong> is locked because your first successful deposit has been made.</div>
      <section class="referral-people-card"><div class="referral-people-heading"><div><span class="gsk-page-kicker">YOUR NETWORK</span><h2>People you invited</h2></div><button type="button" @click="loadData" aria-label="Refresh referrals">↻</button></div>
        <div v-if="!data.referrals?.length" class="gsk-empty-state"><span>🫶</span><strong>Your invite list is empty</strong><p>Share your code to invite your first friend.</p></div>
        <article v-for="person in data.referrals" :key="person.id" class="referral-person"><div class="referral-person-avatar">👤</div><div class="referral-person-copy"><strong>{{ person.name||'User' }}</strong><small>{{ person.phone||'Phone unavailable' }}</small><small>First deposit: {{ person.first_deposit_at?new Date(person.first_deposit_at).toLocaleDateString():'Not made yet' }}</small></div><div class="referral-person-reward"><strong>{{ person.reward_amount==null?'Pending':'+₹'+money(person.reward_amount) }}</strong><small>Reward</small></div></article>
      </section>
    </template>
  </main>
</template>
<script setup>
import GskScreenHeader from '@/components/GskScreenHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import api from '@/plugins/axios'

const loading = ref(true)
const applying = ref(false)
const applyCodeValue = ref('')
const error = ref('')
const success = ref('')
const data = reactive({
  referral_code: '',
  share_url: '',
  referral_percentage: 2,
  referral_min_amount: 10,
  total_referrals: 0,
  total_reward: 0,
  referrals: [],
  applied_referral_code: null,
  can_apply_code: false,
})

const money = (value) => Number(value || 0).toFixed(2)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/referrals')
    Object.assign(data, response.data?.data || {})
    applyCodeValue.value = data.applied_referral_code || ''
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to load referral details. Please try again.'
  } finally {
    loading.value = false
  }
}

async function copyText(value) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    success.value = 'Copied to clipboard.'
    error.value = ''
  } catch {
    const field = document.createElement('textarea')
    field.value = value
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const copied = document.execCommand('copy')
    field.remove()
    if (copied) success.value = 'Copied to clipboard.'
    else error.value = 'Could not copy automatically. Please select and copy the text.'
  }
}

async function shareReferral() {
  if (!data.share_url) return
  const message = `Join me on the app using my referral code ${data.referral_code}. ${data.share_url}`
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Refer & Earn', text: message, url: data.share_url })
      return
    } catch (err) {
      if (err?.name === 'AbortError') return
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
}

async function applyCode() {
  applying.value = true
  error.value = ''
  success.value = ''
  try {
    const response = await api.post('/referrals/apply', { referral_code: applyCodeValue.value.toUpperCase() })
    success.value = response.data?.message || 'Referral code applied.'
    await loadData()
  } catch (err) {
    error.value = err.response?.data?.message || err.response?.data?.errors?.referral_code?.[0] || 'Could not apply this referral code.'
  } finally {
    applying.value = false
  }
}

onMounted(loadData)
</script><style scoped>
.gsk-screen{min-height:min-content;padding:14px 13px calc(100px + env(safe-area-inset-bottom));background:#f4f7fb;color:#1e2c42}.screen-banner{display:flex;align-items:center;gap:13px;padding:19px;border-radius:19px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff}.screen-banner-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#ffffff1b;font-size:28px}.screen-banner span{color:#cbd9eb;font-size:9px;font-weight:900;letter-spacing:.13em}.screen-banner h1{margin:2px 0;color:#fff;font-size:22px;font-weight:900}.screen-banner p{margin:0;color:#d5e1f0;font-size:11px}.referral-code-card{margin-top:13px;padding:17px;border-radius:18px;background:linear-gradient(135deg,#1b365d,#315f9f);color:#fff;box-shadow:0 12px 25px #1b365d22}.referral-card-kicker{font-size:9px;font-weight:900;letter-spacing:.13em;color:#d1def0}.referral-code-row{display:flex;align-items:center;gap:8px;margin-top:8px}.referral-code-row strong{flex:1;overflow-wrap:anywhere;font-size:26px;font-weight:950;letter-spacing:.1em}.referral-code-row button{border:1px solid #ffffff40;border-radius:9px;padding:8px 10px;background:#ffffff18;color:#fff;font-size:10px;font-weight:800}.referral-code-card .form-label{font-size:10px;color:#e0e9f5}.referral-code-card .form-control{min-width:0;border:0}.referral-code-card .input-group .btn{min-height:46px;border-color:#ffffff55;color:#fff}.referral-reward-note{margin:12px 0 0;color:#dce6f3;font-size:9px}.referral-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:12px 0}.referral-stats article{display:grid;grid-template-columns:34px 1fr;grid-template-rows:auto auto;gap:1px 7px;padding:12px;border:1px solid #e5ebf3;border-radius:14px;background:#fff}.referral-stats article>span{grid-row:1/3;font-size:23px}.referral-stats small{color:#8492a6;font-size:9px}.referral-stats strong{font-size:14px;font-weight:900}.referral-apply-card,.referral-people-card{margin-top:12px;padding:15px;border:1px solid #e5ebf3;border-radius:16px;background:#fff}.referral-apply-card>div{display:grid;margin-bottom:10px}.referral-apply-card>div strong{font-size:12px}.referral-apply-card>div small{font-size:10px;color:#7b899d}.referral-people-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:12px}.referral-people-heading h2{margin:2px 0 0;font-size:16px;font-weight:900}.referral-people-heading button{width:34px;height:34px;border:1px solid #e4eaf2;border-radius:10px;background:#f6f8fb;color:#315f9f;font-size:20px}.referral-person{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid #edf1f6}.referral-person-avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#edf3fc;font-size:20px}.referral-person-copy{display:grid;flex:1;min-width:0}.referral-person-copy strong{font-size:11px}.referral-person-copy small{overflow:hidden;color:#8a97a8;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.referral-person-reward{display:grid;text-align:right}.referral-person-reward strong{font-size:10px;color:#21865e}.referral-person-reward small{font-size:8px;color:#8794a5}
</style>
<style scoped>
.referral-steps{display:flex;align-items:center;gap:6px;margin:13px 0;padding:12px;border:1px solid #e2eaf3;border-radius:15px;background:#fff}.referral-steps>div{display:grid;justify-items:center;gap:3px;min-width:58px}.referral-steps>div span{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#eaf1fc;color:#315f9f;font-size:10px;font-weight:950}.referral-steps strong{font-size:9px}.referral-steps small{color:#8a98aa;font-size:8px;white-space:nowrap}.referral-steps>i{height:1px;flex:1;background:#dfe7f1}.referral-code-card{position:relative;overflow:hidden;border-radius:20px}.referral-code-card:after{content:'🎁';position:absolute;right:12px;top:12px;font-size:55px;opacity:.11;pointer-events:none}.referral-code-row strong{font-size:clamp(21px,6vw,29px)}.referral-stats{gap:9px}.referral-stats article{border-radius:15px}.referral-people-card{border-radius:18px}.referral-person{padding:12px 2px;border-bottom:1px solid #edf1f6}
</style>

<style scoped>
.gsk-screen{min-height:min-content;padding:15px 13px calc(13px + env(safe-area-inset-bottom));background:radial-gradient(circle at 100% 0, #08051c 0, #7171718a 20%), #213774;color:#f4f6ff}
.referral-steps{border:1px solid #2e3d5e;border-radius:17px;background:#121b31;color:#f4f6ff}.referral-steps>div{color:#f4f6ff}.referral-steps>div>span{border-color:#6b5cc5;background:#292650;color:#cfc6ff}.referral-steps strong{color:#fff}.referral-steps small{color:#91a0bf}.referral-steps>i{background:#3a4770}
.referral-code-card{border:1px solid #7569c05c;border-radius:20px;background:radial-gradient(circle at 100% 0,#765cf533 0,transparent 38%),linear-gradient(145deg,#1b2445,#11203a);color:#f4f6ff;box-shadow:0 15px 32px #00000030}
.referral-card-kicker{color:#b8aaff}.referral-code-row strong{color:#fff;letter-spacing:.1em}.referral-code-row button{border:1px solid #51488a;background:#292650;color:#d1c9ff}
.referral-code-card .form-label{color:#c6d1e8}.referral-code-card .form-control{border-color:#39496c;background:#0b1428;color:#fff}
.referral-code-card .btn-warning{border-color:#ffd27a;background:linear-gradient(110deg,#ffcb70,#e9a83e);color:#2b2441}
.referral-reward-note{color:#c1cce4}.referral-stats article{border:1px solid #2e3d5e;border-radius:15px;background:#121b31;color:#f4f6ff}.referral-stats article>span{background:#292650}.referral-stats small{color:#91a0bf}.referral-stats strong{color:#fff}
.referral-people-card,.referral-apply-card{border:1px solid #2e3d5e;border-radius:17px;background:#121b31;color:#f4f6ff}.referral-people-heading strong,.referral-apply-card strong{color:#fff}.referral-people-heading small,.referral-apply-card small{color:#91a0bf}
.referral-person{border-color:#2d3b59}.referral-person-avatar{background:#292650;color:#cfc6ff}.referral-person-copy strong{color:#f4f6ff}.referral-person-copy small{color:#91a0bf}.referral-person-reward{color:#75e4bc}
.referral-apply-card .form-control{border-color:#39496c;background:#0b1428;color:#fff}
</style>
