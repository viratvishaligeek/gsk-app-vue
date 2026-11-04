<template>
  <div class="content-area pb-5 history-bg min-vh-100 d-flex flex-column">
    <div class="container-fluid px-2 px-md-3 py-2 flex-grow-1 d-flex flex-column">
      <div class="support-banner support-workspace-header">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-3">
            <div
              class="support-banner-icon">
              <span class="gsk-emoji-icon" aria-hidden="true">🎧</span></div>
            <div>
              <h1 class="fw-bold text-white mb-1">Live support</h1><span class="small text-white-50">{{
                realtimeConnected ? 'Connected · live messages' : connected ? 'Connected · recovery sync' :
                  humanSupportRequested ? 'Reconnecting to support…' : 'Browse FAQs before starting a chat' }}</span>
            </div>
          </div>
          <span class="badge" :class="connected ? 'bg-success' : 'bg-secondary'">{{ realtimeConnected ? 'Live' :
            connected ? 'Online' : 'Reconnecting' }}</span>
        </div>
      </div>
      <section v-if="!humanSupportRequested" class="support-faq-card support-faq-workspace mb-3">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
            <div>
              <h6 class="fw-bold mb-1">Find an instant answer</h6>
              <p class="small text-muted mb-0">Check these FAQs before joining the support queue.</p>
            </div>
            <span class="badge bg-warning text-dark">{{ faqs.length }} FAQs</span>
          </div>
          <div v-if="faqLoading" class="small text-muted py-3">Loading helpful answers…</div>
          <div v-else-if="faqs.length" class="d-grid gap-2">
            <div v-for="faq in faqs" :key="faq.id" class="border rounded-3 overflow-hidden">
              <button type="button"
                class="btn w-100 text-start fw-semibold d-flex justify-content-between align-items-center"
                @click="activeFaqId = activeFaqId === faq.id ? null : faq.id">
                <span>{{ faq.question }}</span><span class="gsk-emoji-icon" aria-hidden="true">✨</span>
              </button>
              <div v-if="activeFaqId === faq.id" class="px-3 pb-3 text-muted" style="white-space:pre-line">{{ faq.answer
                }}</div>
            </div>
          </div>
          <p v-else class="small text-muted py-2 mb-0">No FAQs are published for this platform yet.</p>
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
            <span class="small text-muted">Still need help from a person?</span>
            <button class="btn btn-warning text-dark fw-bold" type="button" @click="openHumanSupport"><span class="gsk-emoji-icon" aria-hidden="true">🎧</span>Contact human support</button>
          </div>
        </div>
      </section>
      <div v-if="humanSupportRequested" class="d-flex justify-content-between align-items-center gap-2 mb-2">
        <span class="small text-muted">Human support conversation</span><button type="button"
          class="btn btn-sm btn-outline-secondary" @click="closeHumanSupport">Back to FAQs</button>
      </div>
      <div v-if="humanSupportRequested"
        class="card border-0 shadow-sm rounded-4 bg-white flex-grow-1 d-flex flex-column overflow-hidden mb-2"
        style="max-height:65vh;min-height:380px">
        <div ref="chatFeed" class="card-body p-3 overflow-auto d-flex flex-column gap-3 bg-light-subtle">
          <div v-if="loading && messages.length === 0" class="text-center text-muted py-5"><span
              class="spinner-border spinner-border-sm me-2"></span>Loading conversation…</div>
          <div v-for="msg in messages" :key="msg.id" class="d-flex flex-column"
            :class="msg.sender === 'user' ? 'align-items-end' : 'align-items-start'">
            <div class="message-bubble p-3 rounded-4 shadow-sm"
              :class="msg.sender === 'user' ? 'bg-warning text-dark rounded-bottom-right-0' : 'bg-white border text-dark rounded-bottom-left-0'">
              <div v-if="msg.sender !== 'user'" class="small fw-bold text-danger mb-1"><span class="gsk-emoji-icon" aria-hidden="true">✅</span> Support Desk</div>
              <p v-if="msg.body" class="mb-1" style="white-space:pre-line">{{ msg.body }}</p>
              <template v-if="msg.media_url">
                <img v-if="(msg.media_mime || '').startsWith('image/')" :src="msg.display_media_url"
                  :alt="msg.media_name || 'Chat attachment'" class="chat-media">
                <video v-else-if="(msg.media_mime || '').startsWith('video/')" :src="msg.display_media_url" controls
                  playsinline class="chat-media"></video>
                <audio v-else-if="(msg.media_mime || '').startsWith('audio/')" :src="msg.display_media_url" controls
                  preload="metadata"></audio>
                <a v-else :href="msg.display_media_url" target="_blank" rel="noopener">Open attachment</a>
              </template>
            </div>
            <span class="small text-muted mt-1 px-1">{{ formatTime(msg.created_at) }} <span
                v-if="msg.sender === 'user' && msg.read_at">· Seen</span></span>
          </div>
          <div v-if="errorMessage" class="alert alert-warning py-2 small">{{ errorMessage }} <button
              class="btn btn-sm btn-link" @click="syncMessages">Retry</button></div>
        </div>
        <div class="card-footer bg-white border-top p-2">
          <form @submit.prevent="sendMessage" class="d-flex align-items-center gap-2">
            <input ref="fileInput" type="file" class="d-none" accept="image/*,video/mp4,video/webm,audio/*"
              @change="onFileSelected">
            <button type="button" class="btn btn-light rounded-circle border" style="width:38px;height:38px"
              title="Attach image, video, or audio" @click="fileInput?.click()"><span class="gsk-emoji-icon" aria-hidden="true">📎</span></button>
            <button type="button" class="btn rounded-circle border"
              :class="recording ? 'btn-danger text-white' : 'btn-light'" style="width:38px;height:38px"
              :disabled="!canRecord" :title="recording ? 'Stop voice recording' : 'Record voice message'"
              @click="toggleRecording"><span class="gsk-emoji-icon" aria-hidden="true">✨</span></button>
            <input v-model="newMessage" type="text"
              class="form-control form-control-sm border-0 bg-light rounded-pill px-3 py-2 shadow-none"
              placeholder="Type your message…" maxlength="5000">
            <button type="submit" class="btn btn-warning text-dark rounded-circle" style="width:38px;height:38px"
              :disabled="sending || (!newMessage.trim() && !selectedFile)"><span class="gsk-emoji-icon" aria-hidden="true">📨</span></button>
          </form>
          <div v-if="selectedFile" class="small text-muted mt-2 d-flex align-items-center justify-content-between">
            <span><span class="gsk-emoji-icon" aria-hidden="true">📎</span>{{ selectedFile.name }}</span><button
              class="btn btn-sm btn-link text-danger p-0" @click="selectedFile = null">Remove</button></div>
          <div v-if="recording" class="small text-danger mt-2"><span
              class="spinner-grow spinner-grow-sm me-1"></span>Recording
            voice message…</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import api from '@/plugins/axios'
import { useAuthStore, getAuthToken } from '@/utils/auth'
import { createSupportRealtime, isRelevantSupportMessage } from '@/services/supportRealtime'

const authStore = useAuthStore()
const chatFeed = ref(null)
const fileInput = ref(null)
const newMessage = ref('')
const messages = ref([])
const loading = ref(true)
const sending = ref(false)
const connected = ref(false)
const realtimeConnected = ref(false)
const errorMessage = ref('')
const selectedFile = ref(null)
const faqs = ref([])
const faqLoading = ref(true)
const activeFaqId = ref(null)
const humanSupportRequested = ref(false)
const recording = ref(false)
const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
let pollTimer = null
let syncInFlight = false
let syncRequested = false
let consecutiveFailures = 0
let hasLoadedHistory = false
let recorder = null
let recordingStream = null
let recordedChunks = []
let lastMessageId = 0
let conversationId = null
let realtimeSubscription = null

const loadFaqs = async () => {
  faqLoading.value = true
  try {
    const platform = Capacitor.isNativePlatform() ? 'app' : 'web'
    const { data } = await api.get('/faqs', { params: { platform }, showGlobalLoader: false })
    faqs.value = Array.isArray(data?.data) ? data.data : []
  } catch {
    faqs.value = []
  } finally {
    faqLoading.value = false
  }
}
const scheduleNextSync = () => {
  if (!humanSupportRequested.value || realtimeConnected.value || pollTimer) return
  const delay = connected.value ? 30000 : Math.min(60000, 5000 * (2 ** Math.min(consecutiveFailures, 3)))
  pollTimer = setTimeout(() => {
    pollTimer = null
    void syncMessages()
  }, delay)
}

const initRealtime = () => {
  try {
    realtimeSubscription = createSupportRealtime({
      PusherConstructor: window.Pusher,
      key: import.meta.env.VITE_PUSHER_APP_KEY,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT || '/api/v1/broadcasting/auth',
      token: getAuthToken(),
      userId: authStore.userId,
      onConnected: () => {
        realtimeConnected.value = true
        connected.value = true
        consecutiveFailures = 0
        if (pollTimer) clearTimeout(pollTimer)
        pollTimer = null
        if (humanSupportRequested.value) void syncMessages()
      },
      onDisconnected: () => {
        realtimeConnected.value = false
        connected.value = false
        scheduleNextSync()
      },
      onMessage: payload => {
        if (isRelevantSupportMessage(payload, conversationId, humanSupportRequested.value)) {
          void syncMessages()
        }
      },
    })
  } catch (error) {
    console.warn('Support chat realtime initialization failed:', error?.message || error)
    realtimeConnected.value = false
  }
}
const openHumanSupport = async () => {
  humanSupportRequested.value = true
  await syncMessages()
}
const closeHumanSupport = () => {
  humanSupportRequested.value = false
  syncRequested = false
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}
const mediaUrlCache = new Map()
const formatTime = value => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
const scrollToBottom = async () => {
  await nextTick()
  if (chatFeed.value) chatFeed.value.scrollTop = chatFeed.value.scrollHeight
}
const syncMessages = async () => {
  if (syncInFlight) {
    syncRequested = true
    return
  }
  syncInFlight = true
  const wasNearBottom = !chatFeed.value || (chatFeed.value.scrollHeight - chatFeed.value.scrollTop - chatFeed.value.clientHeight < 100)
  try {
    const isIncremental = hasLoadedHistory
    const params = isIncremental ? { after_id: lastMessageId } : {}
    const { data } = await api.get('/support-chat', { params, showGlobalLoader: false })
    conversationId = data?.conversation_id || conversationId
    const incoming = Array.isArray(data?.data) ? data.data : []
    await Promise.all(incoming.filter(message => message.media_url).map(async message => {
      if (mediaUrlCache.has(message.id)) {
        message.display_media_url = mediaUrlCache.get(message.id)
        return
      }
      try {
        const media = await api.get('/support-chat/media/' + message.id, { responseType: 'blob', showGlobalLoader: false })
        const objectUrl = URL.createObjectURL(media.data)
        mediaUrlCache.set(message.id, objectUrl)
        message.display_media_url = objectUrl
      } catch {
        message.display_media_url = ''
      }
    }))

    if (!hasLoadedHistory) {
      messages.value = incoming
      hasLoadedHistory = true
      lastMessageId = incoming.reduce((max, message) => Math.max(max, Number(message.id) || 0), 0)
      await scrollToBottom()
    } else if (incoming.length) {
      const existingIds = new Set(messages.value.map(message => message.id))
      const additions = incoming.filter(message => !existingIds.has(message.id))
      if (additions.length) {
        messages.value = [...messages.value, ...additions]
        lastMessageId = Math.max(lastMessageId, ...additions.map(message => Number(message.id) || 0))
        if (wasNearBottom) await scrollToBottom()
      }
    }
    if (isIncremental && incoming.length >= 200) syncRequested = true
    connected.value = true
    consecutiveFailures = 0
    errorMessage.value = ''
  } catch (error) {
    connected.value = false
    consecutiveFailures += 1
    errorMessage.value = error?.response?.status === 401 ? 'Please sign in again to continue chat.' : 'Connection interrupted. Retrying automatically…'
  } finally {
    loading.value = false
    syncInFlight = false
    if (syncRequested && humanSupportRequested.value) {
      syncRequested = false
      void syncMessages()
    } else {
      syncRequested = false
      scheduleNextSync()
    }
  }
}
const onFileSelected = event => {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 20 * 1024 * 1024) {
    errorMessage.value = 'Attachments must be 20 MB or smaller.'
    event.target.value = ''
    return
  }
  selectedFile.value = file
}
const toggleRecording = async () => {
  if (recording.value && recorder) {
    recorder.stop()
    recording.value = false
    return
  }
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type))
    recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined)
    recordedChunks = []
    recorder.ondataavailable = event => { if (event.data.size) recordedChunks.push(event.data) }
    recorder.onstop = () => {
      const type = recorder?.mimeType || 'audio/webm'
      selectedFile.value = new File([new Blob(recordedChunks, { type })], 'voice-message.' + (type.includes('mp4') ? 'mp4' : 'webm'), { type })
      recordingStream?.getTracks().forEach(track => track.stop())
      recordingStream = null
    }
    recorder.start()
    recording.value = true
    errorMessage.value = ''
  } catch {
    errorMessage.value = 'Microphone permission was denied or recording is not supported by this browser.'
  }
}
const sendMessage = async () => {
  if (sending.value || (!newMessage.value.trim() && !selectedFile.value)) return
  sending.value = true
  const form = new FormData()
  if (newMessage.value.trim()) form.append('body', newMessage.value.trim())
  if (selectedFile.value) form.append('attachment', selectedFile.value)
  try {
    await api.post('/support-chat/messages', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    newMessage.value = ''
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    await syncMessages()
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'Unable to send message. Please retry.'
  } finally {
    sending.value = false
  }
}
onMounted(() => {
  void loadFaqs()
  initRealtime()
})
onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
  realtimeSubscription?.disconnect()
  if (recorder && recorder.state !== 'inactive') recorder.stop()
  recordingStream?.getTracks().forEach(track => track.stop())
  mediaUrlCache.forEach(url => URL.revokeObjectURL(url))
  mediaUrlCache.clear()
})
</script><style scoped>
.content-area.history-bg{min-height:100dvh;padding:14px 12px calc(100px + env(safe-area-inset-bottom));background:#f4f7fb}.content-area.history-bg>.container-fluid{max-width:720px;margin:0 auto;padding:0!important}.support-banner{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:16px;border-radius:17px;background:linear-gradient(130deg,#19365e,#315f9f);color:#fff}.support-banner-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:#ffffff1b;font-size:25px}.support-banner h1{margin:0;color:#fff;font-size:17px;font-weight:900}.support-banner .small{color:#d4e0f0!important;font-size:10px}.support-banner .badge{margin-left:auto}.support-faq-card,.card{border:1px solid #e5ebf3!important;border-radius:16px!important;background:#fff;box-shadow:0 7px 20px #1b365d0b!important}.support-faq-card .card-body{padding:15px}.support-faq-card .btn{min-height:42px;font-size:11px}.message-bubble{max-width:84%;word-break:break-word;font-size:12px;line-height:1.5}.message-bubble.bg-warning{background:#e9f1fc!important;color:#203b5e!important}.message-bubble.bg-white{border-color:#e5ebf3!important}.chat-media{display:block;max-width:min(260px,65vw);max-height:260px;margin-top:6px;border-radius:11px}.card-footer form .form-control{min-height:42px}.no-scrollbar{scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}.rounded-bottom-right-0{border-bottom-right-radius:3px!important}.rounded-bottom-left-0{border-bottom-left-radius:3px!important}
</style>
<style scoped>
.history-bg{background:radial-gradient(ellipse at top right,#eaf2fc 0,transparent 38%),#f4f7fb}.support-workspace-header{padding:18px;border-radius:20px;background:linear-gradient(125deg,#152d4d,#315f9f);box-shadow:0 12px 25px #18385c1c}.support-faq-workspace{max-width:760px;margin:14px auto!important;border:1px solid #e2eaf3;border-radius:18px;background:#fff;box-shadow:0 8px 22px #1b365d0a}.support-faq-workspace .card-body{padding:17px}.support-faq-workspace .border.rounded-3{border-color:#e5ebf3!important;border-radius:13px!important}.support-faq-workspace .border.rounded-3>button{min-height:48px;padding:11px 13px;color:#2d4563;font-size:11px}.support-faq-workspace .border.rounded-3>div{font-size:10px;line-height:1.6}.support-banner-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:15px;background:#ffffff20;font-size:25px}.support-workspace-header h1{font-size:20px!important}.support-workspace-header .badge{padding:7px 10px}.content-area:has(.message-bubble){padding-bottom:calc(14px + env(safe-area-inset-bottom))}.content-area:has(.message-bubble) .container-fluid{max-width:820px}.content-area:has(.message-bubble) .card.flex-grow-1{max-height:calc(100dvh - 190px)!important;min-height:420px!important;border:1px solid #e3eaf3!important;border-radius:18px!important}.content-area:has(.message-bubble) .card-body.bg-light-subtle{background:#f5f8fc!important}.content-area:has(.message-bubble) .card-footer{position:sticky;bottom:0;padding:11px!important}.message-bubble{max-width:min(88%,520px);font-size:11px;line-height:1.55}.content-area:has(.message-bubble) .card-footer input.form-control{min-height:42px;font-size:12px}.content-area:has(.message-bubble) .card-footer button{flex:0 0 40px!important;width:40px!important;height:40px!important}
@media(prefers-reduced-motion:reduce){.support-faq-workspace{scroll-behavior:auto}}
</style>

<style scoped>
.content-area.history-bg{min-height:100dvh;padding-bottom:calc(24px + env(safe-area-inset-bottom));background:radial-gradient(circle at 95% 0,#342b70 0,transparent 26%),#080d1b;color:#f4f6ff}
.content-area .container-fluid{max-width:760px;margin-inline:auto}
.support-banner{border:1px solid #7569c05c;border-radius:20px;background:radial-gradient(circle at 100% 0,#765cf533 0,transparent 38%),linear-gradient(140deg,#211e4b,#142b50);box-shadow:0 13px 30px #00000030}
.support-banner h1{color:#fff}.support-banner .text-white-50{color:#bdc8e2!important}
.support-faq-card,.content-area .card{border:1px solid #2e3d5e!important;border-radius:17px!important;background:#121b31!important;color:#f4f6ff;box-shadow:0 10px 24px #00000022}
.support-faq-card h6,.content-area .card h6{color:#fff}.support-faq-card .text-muted,.content-area .card .text-muted{color:#91a0bf!important}
.support-faq-card .border{border-color:#344361!important;background:#0d172b}
.support-faq-card .btn{background:#172541;color:#e8edff}.support-faq-card .badge{background:#3b301d!important;color:#ffd17b!important}
.support-faq-card .text-muted{color:#aab7d3!important}
.content-area .card-header,.content-area .card-footer{border-color:#2e3d5e!important;background:#111a2e!important;color:#f4f6ff}
.content-area .form-control,.content-area .form-control-sm{border-color:#39496c;background:#0b1428;color:#fff}
.content-area .form-control::placeholder{color:#7888aa}
.message-bubble{border:1px solid #344361;background:#1a2945;color:#e8edff}
.message-bubble.own,.message-bubble.sent{border-color:#6655ca;background:linear-gradient(120deg,#5e49c8,#2865ca);color:#fff}
.chat-media{border-color:#39496c}
.content-area .btn-warning{border-color:#ffd27a;background:linear-gradient(110deg,#ffcb70,#e9a83e);color:#2b2441}
.content-area .btn-light,.content-area .bg-light,.content-area .bg-white{border-color:#344361!important;background:#182541!important;color:#e8edff!important}
.content-area .text-dark{color:#f4f6ff!important}
.content-area .border{border-color:#344361!important}
</style>
