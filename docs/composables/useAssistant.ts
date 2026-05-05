import { computed, ref } from 'vue'

// Docus' app shell calls useAssistant even when the assistant UI is disabled.
const isEnabled = computed(() => false)
const isOpen = ref(false)
const isExpanded = ref(false)
const isMobile = ref(false)
const panelWidth = computed(() => 0)
const shouldPushContent = computed(() => false)
const messages = ref([])
const pendingMessage = ref<string>()
const faqQuestions = computed(() => [])

interface DisabledAssistant {
  isEnabled: typeof isEnabled
  isOpen: typeof isOpen
  isExpanded: typeof isExpanded
  isMobile: typeof isMobile
  panelWidth: typeof panelWidth
  shouldPushContent: typeof shouldPushContent
  messages: typeof messages
  pendingMessage: typeof pendingMessage
  faqQuestions: typeof faqQuestions
  open: () => void
  clearPending: () => void
  close: () => void
  toggle: () => void
  toggleExpanded: () => void
  clearMessages: () => void
}

export function useAssistant(): DisabledAssistant {
  return {
    isEnabled,
    isOpen,
    isExpanded,
    isMobile,
    panelWidth,
    shouldPushContent,
    messages,
    pendingMessage,
    faqQuestions,
    open,
    clearPending,
    close,
    toggle,
    toggleExpanded,
    clearMessages,
  }
}

function open(): void {}

function clearPending(): void {
  pendingMessage.value = undefined
}

function close(): void {
  isOpen.value = false
}

function toggle(): void {}

function toggleExpanded(): void {}

function clearMessages(): void {
  messages.value = []
}
