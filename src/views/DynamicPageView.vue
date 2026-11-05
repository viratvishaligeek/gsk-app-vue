<template>
  <div class="content-area pb-5 mb-5 dynamic-page-bg">
    <div class="container-fluid px-2 px-md-3 py-3"><div class="dynamic-kicker">📘 GSK INFORMATION CENTER</div>
      <div v-if="isLoading" class="page-card loading-card">
        <div class="spinner-border text-warning"></div>
        <p class="text-muted mb-0 mt-3">
          Loading page...
        </p>
      </div>

      <div v-else-if="errorMessage" class="page-card error-card">
        <div class="error-icon">
          <span class="gsk-emoji-icon" aria-hidden="true">⚠️</span>
        </div>
        <h5 class="fw-bold mb-2">
          Page unavailable
        </h5>
        <p class="text-muted mb-3">
          {{ errorMessage }}
        </p>
        <router-link to="/dashboard" class="btn btn-warning rounded-pill px-4 fw-bold">
          <span class="gsk-emoji-icon" aria-hidden="true">🏠</span>
          Back Home
        </router-link>
      </div>

      <template v-else-if="page">
        <div class="page-card overflow-hidden">
          <div class="page-header">
            <div class="flex-grow-1">
              <h1 class="page-title">
                {{ page.name }}
              </h1>
            </div>
          </div>
          <div class="cms-content" v-html="responsiveContent"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/plugins/axios'

const route = useRoute()

const page = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')
const responsiveContent = computed(() => {
  const html = page.value?.content || ''

  if (!html) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  doc.querySelectorAll('iframe').forEach((iframe) => {
    const src = iframe.getAttribute('src') || ''

    // Sirf YouTube embeds process karo
    if (!/^https?:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\//i.test(src)) {
      return
    }

    // Agar pehle se wrapper hai, dobara wrap mat karo
    if (iframe.parentElement?.classList.contains('youtube-responsive')) {
      return
    }

    const wrapper = doc.createElement('div')
    wrapper.className = 'youtube-responsive'

    iframe.setAttribute('title', 'YouTube video')
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    )
    iframe.setAttribute('allowfullscreen', '')

    wrapper.appendChild(iframe.cloneNode(true))
    iframe.replaceWith(wrapper)
  })

  return doc.body.innerHTML
})


const fetchPage = async () => {
  const slug = String(route.params.slug || '').trim()

  if (!slug) {
    errorMessage.value = 'Invalid page.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  page.value = null

  try {
    const response = await api.get(`/pages/${encodeURIComponent(slug)}`)

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Unable to load page.')
    }

    page.value = response.data.data
  } catch (error) {
    console.error('CMS PAGE ERROR:', error)

    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      'Unable to load page.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchPage)

watch(() => route.params.slug, fetchPage)
</script><style scoped>
.dynamic-page-bg{min-height:min-content;padding:15px 13px calc(13px + env(safe-area-inset-bottom));background:#f4f7fb}.dynamic-page-bg .container-fluid{max-width:780px;margin:0 auto;padding:0!important}.dynamic-kicker{margin:3px 0 12px;color:#8291a6;font-size:9px;font-weight:900;letter-spacing:.14em}.page-card{overflow:hidden;border:1px solid #e5ebf3;border-radius:19px;background:#fff;box-shadow:0 10px 28px #1b365d0c}.page-header{padding:22px;background:linear-gradient(130deg,#19365e,#315f9f)}.page-title{margin:0;color:#fff;font-size:23px;font-weight:900}.cms-content{padding:20px;color:#52637b;font-size:13px;line-height:1.75;overflow-wrap:anywhere}.cms-content :deep(h1),.cms-content :deep(h2),.cms-content :deep(h3){margin:22px 0 9px;color:#203754;font-weight:850}.cms-content :deep(p){margin-bottom:13px}.cms-content :deep(img){max-width:100%;height:auto;border-radius:12px}.cms-content :deep(table){display:block;max-width:100%;overflow-x:auto;border-collapse:collapse}.cms-content :deep(th),.cms-content :deep(td){padding:9px;border:1px solid #e3eaf2}.cms-content :deep(.youtube-responsive){position:relative;width:100%;aspect-ratio:16/9;margin:16px 0;overflow:hidden;border-radius:12px;background:#000}.cms-content :deep(.youtube-responsive iframe){position:absolute;inset:0;width:100%;height:100%;border:0}.cms-content :deep(iframe),.cms-content :deep(video){max-width:100%}.loading-card,.error-card{display:grid;justify-items:center;gap:9px;padding:38px 20px;text-align:center}.error-icon{font-size:37px}
</style>

<style scoped>
.dynamic-page-bg{min-height:min-content;padding-bottom:calc(105px + env(safe-area-inset-bottom));background:radial-gradient(circle at 100% 0, #08051c 0, #7171718a 20%), #213774;color:#f4f6ff}
.dynamic-kicker{color:#a99bff;font-size:9px;font-weight:950;letter-spacing:.14em}
.page-card{border:1px solid #2e3d5e;border-radius:19px;background:linear-gradient(155deg,#17223c,#101a2e);color:#f4f6ff;box-shadow:0 12px 28px #00000024}
.page-title{color:#fff;font-size:22px;font-weight:950}.cms-content{color:#c5d0e6;line-height:1.75}
.cms-content :deep(h1),.cms-content :deep(h2),.cms-content :deep(h3),.cms-content :deep(h4){color:#fff;font-weight:900}
.cms-content :deep(a){color:#b7aaff}.cms-content :deep(table){color:#e7edff}.cms-content :deep(th){background:#1b2947;color:#d2caff}
.cms-content :deep(td){background:#111a2e;color:#dce4f6}.cms-content :deep(img),.cms-content :deep(video),.cms-content :deep(iframe){max-width:100%;border-radius:12px}
.loading-card,.error-card{border-color:#34415f;background:#111a2e;color:#f4f6ff}.error-card h5{color:#fff}.error-card p{color:#9ba9c8!important}
</style>
