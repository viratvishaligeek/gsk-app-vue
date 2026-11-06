<template>
  <div class="support-page">
    <div class="support-container">
      <!-- Header -->
      <header class="support-header">
        <div class="support-brand">
          <div class="support-brand-icon">🎧</div>
          <div>
            <h1>Live Support</h1>
            <p>
              {{
                realtimeConnected
                  ? 'Connected · To Admin'
                  : connected
                    ? 'Connected · To Admin'
                    : 'Connecting to Admin...'
              }}
            </p>
          </div>
        </div>

        <div class="connection-status" :class="{ online: connected }">
          <span class="status-dot"></span>
          {{ realtimeConnected ? 'Live' : connected ? 'Online' : 'Connecting' }}
        </div>
      </header>

      <!-- Chat -->
      <section class="support-chat">
        <div class="chat-heading">
          <div class="agent-avatar">🎧</div>
          <div class="agent-info">
            <h3>Support Team</h3>
            <span>
              <span class="status-dot"></span>
              Available for assistance
            </span>
          </div>
        </div>

        <!-- Messages -->
        <div ref="chatFeed" class="chat-feed">
          <div v-if="loading && !messages.length" class="chat-loading">
            <span class="spinner-border spinner-border-sm"></span>
            Loading conversation...
          </div>

          <div v-else-if="!messages.length" class="chat-empty">
            <div class="empty-icon">💬</div>
            <h3>Welcome to Live Support</h3>
            <p>
              Have a question or need assistance? Send us a message and our support team will help
              you.
            </p>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-row"
            :class="msg.sender === 'user' ? 'message-own' : 'message-support'"
          >
            <div
              class="message-bubble"
              :class="msg.sender === 'user' ? 'bubble-own' : 'bubble-support'"
            >
              <div v-if="msg.sender !== 'user'" class="message-author">
                <span>🎧</span> Support Team
              </div>

              <p v-if="msg.body" class="message-text">
                {{ msg.body }}
              </p>

              <template v-if="msg.media_url">
                <img
                  v-if="(msg.media_mime || '').startsWith('image/')"
                  :src="msg.display_media_url"
                  :alt="msg.media_name || 'Attachment'"
                  class="chat-media"
                />

                <video
                  v-else-if="(msg.media_mime || '').startsWith('video/')"
                  :src="msg.display_media_url"
                  controls
                  playsinline
                  class="chat-media"
                ></video>

                <audio
                  v-else-if="(msg.media_mime || '').startsWith('audio/')"
                  :src="msg.display_media_url"
                  controls
                  preload="metadata"
                  class="chat-audio"
                ></audio>

                <a
                  v-else
                  :href="msg.display_media_url"
                  target="_blank"
                  rel="noopener"
                  class="attachment-link"
                >
                  📎 Open attachment
                </a>
              </template>

              <div class="message-time">
                {{ formatTime(msg.created_at) }}
                <span v-if="msg.sender === 'user' && msg.read_at"> · ✓✓</span>
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="chat-error">
            {{ errorMessage }}
            <button type="button" @click="syncMessages">Retry</button>
          </div>
        </div>

        <!-- Composer -->
        <div class="chat-composer">
          <!-- Attachment / recording preview -->
          <div v-if="selectedFile" class="attachment-preview">
            <img
              v-if="selectedFile.type.startsWith('image/')"
              :src="selectedFilePreview"
              class="preview-image"
              alt="Attachment preview"
            />

            <video
              v-else-if="selectedFile.type.startsWith('video/')"
              :src="selectedFilePreview"
              class="preview-video"
              controls
            ></video>

            <audio
              v-else-if="selectedFile.type.startsWith('audio/')"
              :src="selectedFilePreview"
              controls
            ></audio>

            <div class="attachment-info">
              <strong>{{ selectedFile.name }}</strong>
              <small>{{ (selectedFile.size / 1024).toFixed(1) }} KB</small>
            </div>

            <button
              type="button"
              class="remove-attachment"
              @click="removeSelectedFile"
              aria-label="Remove attachment"
            >
              ✕
            </button>
          </div>

          <div v-if="recording" class="recording-indicator">
            <span class="recording-dot"></span>
            Recording voice message...
          </div>

          <form @submit.prevent="sendMessage" class="composer-form">
            <input
              ref="fileInput"
              type="file"
              class="d-none"
              accept="image/*,video/mp4,video/webm,audio/*"
              @change="onFileSelected"
            />

            <button
              type="button"
              class="composer-action"
              title="Attach file"
              @click="fileInput?.click()"
              :disabled="sending || recording"
            >
              📎
            </button>

            <button
              type="button"
              class="composer-action voice-action"
              :class="{ recording: recording }"
              :disabled="!canRecord || sending"
              :title="recording ? 'Stop recording' : 'Record voice'"
              @click="toggleRecording"
            >
              {{ recording ? '■' : '🎙' }}
            </button>

            <input
              v-model="newMessage"
              type="text"
              class="message-input"
              placeholder="Type your message..."
              maxlength="5000"
              :disabled="sending"
            />

            <button
              type="submit"
              class="send-button"
              :disabled="sending || (!newMessage.trim() && !selectedFile)"
            >
              <span v-if="sending" class="spinner-border spinner-border-sm"></span>
              <span v-else>➤</span>
            </button>
          </form>
          <p class="composer-hint">Our support team will respond as soon as possible.</p>
        </div>
      </section>
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
const selectedFilePreview = ref('')
let selectedPreviewUrl = null
const recording = ref(false)
const canRecord =
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof MediaRecorder !== 'undefined'
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
  const delay = connected.value
    ? 30000
    : Math.min(60000, 5000 * 2 ** Math.min(consecutiveFailures, 3))
  pollTimer = setTimeout(() => {
    pollTimer = null
    void syncMessages()
  }, delay)
}

const removeSelectedFile = () => {
  selectedFile.value = null

  if (selectedPreviewUrl) {
    URL.revokeObjectURL(selectedPreviewUrl)
    selectedPreviewUrl = null
  }

  selectedFilePreview.value = ''

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const onFileSelected = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 20 * 1024 * 1024) {
    errorMessage.value = 'Attachments must be 20 MB or smaller.'
    event.target.value = ''
    return
  }

  removeSelectedFile()

  selectedFile.value = file
  selectedPreviewUrl = URL.createObjectURL(file)
  selectedFilePreview.value = selectedPreviewUrl

  errorMessage.value = ''
}

const initRealtime = () => {
  try {
    realtimeSubscription = createSupportRealtime({
      PusherConstructor: window.Pusher,
      key: import.meta.env.VITE_PUSHER_APP_KEY,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      authEndpoint: new URL(
        '/api/broadcasting/auth',
        api.defaults.baseURL || window.location.origin,
      ).toString(),
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
      onMessage: (payload) => {
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
const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
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
  const wasNearBottom =
    !chatFeed.value ||
    chatFeed.value.scrollHeight - chatFeed.value.scrollTop - chatFeed.value.clientHeight < 100
  try {
    const isIncremental = hasLoadedHistory
    const params = isIncremental ? { after_id: lastMessageId } : {}
    const { data } = await api.get('/support-chat', { params, showGlobalLoader: false })
    conversationId = data?.conversation_id || conversationId
    const incoming = Array.isArray(data?.data) ? data.data : []
    await Promise.all(
      incoming
        .filter((message) => message.media_url)
        .map(async (message) => {
          if (mediaUrlCache.has(message.id)) {
            message.display_media_url = mediaUrlCache.get(message.id)
            return
          }
          try {
            const media = await api.get('/support-chat/media/' + message.id, {
              responseType: 'blob',
              showGlobalLoader: false,
            })
            const objectUrl = URL.createObjectURL(media.data)
            mediaUrlCache.set(message.id, objectUrl)
            message.display_media_url = objectUrl
          } catch {
            message.display_media_url = ''
          }
        }),
    )

    if (!hasLoadedHistory) {
      messages.value = incoming
      hasLoadedHistory = true
      lastMessageId = incoming.reduce((max, message) => Math.max(max, Number(message.id) || 0), 0)
      await scrollToBottom()
    } else if (incoming.length) {
      const existingIds = new Set(messages.value.map((message) => message.id))
      const additions = incoming.filter((message) => !existingIds.has(message.id))
      if (additions.length) {
        messages.value = [...messages.value, ...additions]
        lastMessageId = Math.max(
          lastMessageId,
          ...additions.map((message) => Number(message.id) || 0),
        )
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
    errorMessage.value =
      error?.response?.status === 401
        ? 'Please sign in again to continue chat.'
        : 'Connection interrupted. Retrying automatically…'
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
const toggleRecording = async () => {
  if (recording.value && recorder) {
    recorder.stop()
    recording.value = false
    return
  }
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) =>
      MediaRecorder.isTypeSupported(type),
    )
    recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined)
    recordedChunks = []
    recorder.ondataavailable = (event) => {
      if (event.data.size) recordedChunks.push(event.data)
    }
    recorder.onstop = () => {
      const type = recorder?.mimeType || 'audio/webm'
      selectedFile.value = new File(
        [new Blob(recordedChunks, { type })],
        'voice-message.' + (type.includes('mp4') ? 'mp4' : 'webm'),
        { type },
      )
      recordingStream?.getTracks().forEach((track) => track.stop())
      recordingStream = null
    }
    recorder.start()
    recording.value = true
    errorMessage.value = ''
  } catch {
    errorMessage.value =
      'Microphone permission was denied or recording is not supported by this browser.'
  }
}
const sendMessage = async () => {
  if (sending.value || (!newMessage.value.trim() && !selectedFile.value)) return
  sending.value = true
  const form = new FormData()
  if (newMessage.value.trim()) form.append('body', newMessage.value.trim())
  if (selectedFile.value) form.append('attachment', selectedFile.value)
  try {
    await api.post('/support-chat/messages', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    newMessage.value = ''
    removeSelectedFile()
    if (fileInput.value) fileInput.value.value = ''
    await syncMessages()
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'Unable to send message. Please retry.'
  } finally {
    sending.value = false
  }
}
onMounted(() => {
  initRealtime()
  void syncMessages()
})
onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
  realtimeSubscription?.disconnect()
  if (selectedPreviewUrl) {
    URL.revokeObjectURL(selectedPreviewUrl)
  }
})
</script>
 <style scoped>

.support-page {
  min-height: 100dvh;
  padding: 16px 12px calc(20px + env(safe-area-inset-bottom));
  background: #f3f6fc;
  color: #17233d;
}

.support-container {
  width: 100%;
  max-width: 850px;
  margin: 0 auto;
}

.support-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  margin-bottom: 16px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(125deg, #172d50, #315fa6);
  box-shadow: 0 8px 24px rgba(32, 65, 115, .13);
}

.support-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.support-brand-icon,
.agent-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 45px;
  height: 45px;
  border-radius: 14px;
  background: rgba(255,255,255,.14);
  font-size: 22px;
}

.support-header h1 {
  margin: 0 0 4px;
  color: #fff;
  font-size: 19px;
  font-weight: 800;
}

.support-header p {
  margin: 0;
  color: #dce8fa;
  font-size: 11px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border-radius: 30px;
  background: rgba(255,255,255,.13);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.status-dot {
  width: 7px;
  height: 7px;
  display: inline-block;
  border-radius: 50%;
  background: #a0aec0;
}

.connection-status.online .status-dot,
.agent-info .status-dot {
  background: #22c982;
}

.support-chat {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 205px);
  overflow: hidden;
  border: 1px solid #e4eaf3;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 30px rgba(28, 52, 90, .07);
}

.chat-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 18px;
  border-bottom: 1px solid #e9eef5;
  background: #fff;
}

.agent-avatar {
  width: 42px;
  height: 42px;
  background: #edf2ff;
}

.agent-info h3 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 800;
  color: #1c3152;
}

.agent-info span {
  color: #71809a;
  font-size: 10px;
}

.chat-feed {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 16px;
  background: #f7f9fd;
  overscroll-behavior: contain;
}

.chat-loading,
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: #77849b;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 65px;
  height: 65px;
  margin-bottom: 15px;
  border-radius: 22px;
  background: #e9efff;
  font-size: 29px;
}

.chat-empty h3 {
  margin-bottom: 7px;
  color: #203758;
  font-size: 17px;
  font-weight: 800;
}

.chat-empty p {
  max-width: 280px;
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
}

.message-row {
  display: flex;
  width: 100%;
}

.message-own {
  justify-content: flex-end;
}

.message-support {
  justify-content: flex-start;
}

.message-bubble {
  max-width: min(80%, 520px);
  padding: 11px 13px 8px;
  border-radius: 15px;
  overflow-wrap: anywhere;
  box-shadow: 0 2px 7px rgba(30, 50, 80, .04);
}

.bubble-own {
  color: #fff;
  background: #315fba;
  border-bottom-right-radius: 4px;
}

.bubble-support {
  color: #263650;
  background: #fff;
  border: 1px solid #e7ecf4;
  border-bottom-left-radius: 4px;
}

.message-author {
  margin-bottom: 6px;
  color: #4669a4;
  font-size: 10px;
  font-weight: 800;
}

.message-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-line;
}

.message-time {
  margin-top: 6px;
  text-align: right;
  font-size: 9px;
  opacity: .72;
}

.chat-media {
  display: block;
  max-width: min(260px, 65vw);
  max-height: 260px;
  margin-top: 7px;
  border-radius: 10px;
  object-fit: contain;
}

.chat-audio {
  display: block;
  width: min(260px, 65vw);
  margin-top: 7px;
}

.attachment-link {
  display: inline-block;
  margin-top: 7px;
  color: #315fba;
  font-size: 12px;
}

.chat-error {
  padding: 10px;
  border-radius: 9px;
  background: #fff1f0;
  color: #b42318;
  font-size: 11px;
}

.chat-error button {
  border: 0;
  background: transparent;
  color: #315fba;
  font-weight: 700;
}

.chat-composer {
  flex-shrink: 0;
  padding: 12px 14px 8px;
  border-top: 1px solid #e8edf5;
  background: #fff;
}

.composer-form {
  display: flex;
  align-items: center;
  gap: 9px;
}

.composer-action,
.send-button {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid #e5eaf2;
  border-radius: 50%;
  background: #f4f6fb;
  color: #425777;
  font-size: 17px;
  cursor: pointer;
}

.composer-action:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.voice-action.recording {
  color: #fff;
  border-color: #dc3545;
  background: #dc3545;
}

.message-input {
  flex: 1;
  min-width: 0;
  height: 43px;
  padding: 0 16px;
  border: 1px solid #e6eaf2;
  border-radius: 30px;
  outline: none;
  background: #f7f9fc;
  color: #263650;
  font-size: 12px;
}

.message-input:focus {
  border-color: #6489d1;
  background: #fff;
}

.message-input::placeholder {
  color: #929db0;
}

.send-button {
  border: 0;
  background: #315fba;
  color: #fff;
  font-size: 21px;
}

.send-button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.attachment-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px;
  margin-bottom: 10px;
  border: 1px solid #e5eaf2;
  border-radius: 12px;
  background: #f7f9fd;
}

.preview-image,
.preview-video {
  width: 55px;
  height: 55px;
  border-radius: 8px;
  object-fit: cover;
}

.attachment-preview audio {
  width: min(220px, 45vw);
}

.attachment-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.attachment-info strong {
  overflow: hidden;
  color: #293d5b;
  font-size: 11px;
  text-overflow: ellipsis;
}

.attachment-info small {
  color: #8793a7;
  font-size: 10px;
}

.remove-attachment {
  border: 0;
  background: transparent;
  color: #d04444;
  font-size: 17px;
}

.recording-indicator {
  margin-bottom: 10px;
  color: #d04444;
  font-size: 11px;
}

.recording-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
  background: #e33d4c;
  animation: recording-pulse 1s infinite;
}

@keyframes recording-pulse {
  50% { opacity: .3; }
}

.composer-hint {
  margin: 8px 0 0;
  color: #99a3b4;
  text-align: center;
  font-size: 9px;
}

@media (max-width: 576px) {
  .support-page {
    padding: 10px 9px calc(10px + env(safe-area-inset-bottom));
  }

  .support-header {
    padding: 14px;
    border-radius: 15px;
  }

  .support-header h1 {
    font-size: 16px;
  }
  .chat-feed {
    padding: 15px 11px;
  }

  .message-bubble {
    max-width: 88%;
  }

  .chat-composer {
    padding: 10px 9px 7px;
  }

  .composer-form {
    gap: 6px;
  }

  .composer-action,
  .send-button {
    width: 36px;
    height: 36px;
  }

  .message-input {
    height: 40px;
    padding: 0 11px;
    font-size: 11px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .recording-dot {
    animation: none;
  }
}

</style>
