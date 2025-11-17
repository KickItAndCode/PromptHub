import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2,
  Sparkles,
  Terminal,
  Clipboard,
  Check,
  Activity,
  Timer,
  Shield,
  BookOpenCheck,
} from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'

const APP_ARCHETYPES = [
  {
    id: 'web-app',
    label: 'Web App',
    description: 'Responsive browser experience with modern web tooling.',
  },
  {
    id: 'react-native',
    label: 'React Native',
    description: 'Cross-platform mobile application targeting iOS and Android.',
  },
  {
    id: 'native-ios',
    label: 'Native iOS',
    description: 'Swift / SwiftUI experience optimized for Apple devices.',
  },
] as const

type AppArchetype = (typeof APP_ARCHETYPES)[number]['id']

type EnhancePromptInput = {
  idea: string
  appType: AppArchetype
}

type PromptRecipeItem = {
  id: string
  title: string
  hint: string
  matcher: (text: string) => boolean
}

const PROMPT_RECIPE: PromptRecipeItem[] = [
  {
    id: 'users',
    title: 'Users & pains',
    hint: 'Name the personas plus the frustration you solve.',
    matcher: (text) => /(user|team|founder|manager|designer|player|customer)/i.test(text),
  },
  {
    id: 'features',
    title: 'Hero features',
    hint: 'List 2-3 workflows or differentiators.',
    matcher: (text) => /(feature|workflow|dashboard|automation|pipeline|collaborat)/i.test(text),
  },
  {
    id: 'stack',
    title: 'Technical stack',
    hint: 'Call out frameworks, APIs, or data sources.',
    matcher: (text) => /(api|sdk|graphql|firebase|supabase|swift|react|native|postgres|aws)/i.test(text),
  },
  {
    id: 'risks',
    title: 'Edge cases',
    hint: 'Note performance, compliance, or offline needs.',
    matcher: (text) => /(latency|compliance|security|offline|edge|retry|fallback)/i.test(text),
  },
]

const SAMPLE_IDEAS = [
  'A multiplayer product strategy room that syncs live whiteboards, backlog grooming, and KPI dashboards for remote SaaS founders.',
  'A React Native field ops assistant for solar installers with offline survey capture, photo annotations, and automated permit packets.',
  'A SwiftUI CFO cockpit that ingests NetSuite + Stripe to forecast runway, trigger anomaly alerts, and share investor-ready briefs.',
] as const

const PLATFORM_THEMES: Record<
  AppArchetype,
  {
    gradient: string
    ring: string
    glow: string
    chip: string
  }
> = {
  'web-app': {
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    ring: 'ring-cyan-500/40',
    glow: 'bg-cyan-500/20',
    chip: 'text-cyan-200 border-cyan-400/40',
  },
  'react-native': {
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    ring: 'ring-fuchsia-500/30',
    glow: 'bg-fuchsia-500/20',
    chip: 'text-fuchsia-200 border-fuchsia-400/50',
  },
  'native-ios': {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    ring: 'ring-emerald-500/30',
    glow: 'bg-emerald-500/25',
    chip: 'text-emerald-200 border-emerald-400/40',
  },
}

const HERO_STATS = [
  {
    label: 'Ship-ready prompts',
    value: '94%',
    detail: 'go live without rewrites',
  },
  {
    label: 'Avg. turnaround',
    value: '<5s',
    detail: 'per PRD performance goal',
  },
  {
    label: 'Platforms tuned',
    value: '3',
    detail: 'Web, RN, Native iOS',
  },
] as const

const enhancePrompt = createServerFn({ method: 'POST' })
  .inputValidator((payload: EnhancePromptInput) => {
    const trimmedIdea = payload.idea.trim()
    const isValidType = APP_ARCHETYPES.some((type) => type.id === payload.appType)

    if (!trimmedIdea) {
      throw new Error('Share a project idea before enhancing the prompt.')
    }

    if (!isValidType) {
      throw new Error('Choose a supported application type.')
    }

    return { ...payload, idea: trimmedIdea }
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error(
        'Missing OPENAI_API_KEY. Add it to your environment and restart the dev server.',
      )
    }

    const { default: OpenAI, APIError } = await import('openai')
    const openai = new OpenAI({ apiKey })
    const appLabel = APP_ARCHETYPES.find((type) => type.id === data.appType)?.label

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are PromptHub, an expert prompt engineer who transforms vague ideas into detailed, high-impact product prompts for AI code generation.',
          },
          {
            role: 'user',
            content: `Create a concise but detailed build prompt for an AI engineer.\n\nIdea: ${data.idea}\nTarget platform: ${appLabel}\n\nReturn:\n- A compelling title\n- 2 bullet goal summary\n- Detailed prompt with technical stack, APIs, performance goals, and edge cases.`,
          },
        ],
      })

      const enhancedPrompt =
        completion.choices[0]?.message?.content?.trim() ??
        'Unable to generate an enhanced prompt right now. Please try again.'

      return { enhancedPrompt }
    } catch (error) {
      console.error('OpenAI prompt enhancement failed', error)

      if (error instanceof APIError) {
        if (error.status === 401) {
          throw new Error(
            'OpenAI rejected the API key. Double-check OPENAI_API_KEY and restart the dev server.',
          )
        }

        if (error.status === 429 || error.code === 'insufficient_quota') {
          throw new Error(
            'OpenAI usage quota was exceeded. Update your billing plan or try again later.',
          )
        }

        throw new Error(
          error.message ??
            'OpenAI could not process this request right now. Please try again shortly.',
        )
      }

      throw new Error('Prompt enhancer is temporarily unavailable. Please retry in a moment.')
    }
  })

export const Route = createFileRoute('/')({
  component: PromptHubHome,
})

function PromptHubHome() {
  const [idea, setIdea] = useState('')
  const [appType, setAppType] = useState<AppArchetype>('web-app')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const activeType = APP_ARCHETYPES.find((type) => type.id === appType)
  const activeTheme = PLATFORM_THEMES[appType]

  const recipeProgress = useMemo(() => {
    const text = idea.trim()
    if (!text) {
      return PROMPT_RECIPE.map((check) => ({ ...check, met: false }))
    }

    return PROMPT_RECIPE.map((check) => ({
      ...check,
      met: check.matcher(text),
    }))
  }, [idea])

  useEffect(() => {
    if (!copied) {
      return
    }
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    try {
      const response = await enhancePrompt({
        data: {
          idea,
          appType,
        },
      })
      setResult(response.enhancedPrompt)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while contacting the AI service.',
      )
      setResult(null)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
    } catch (err) {
      console.error('Unable to copy prompt', err)
      setError('Clipboard permissions blocked the copy action. You can still select text manually.')
    }
  }

  return (
    <main className="relative overflow-hidden px-4 pb-20 pt-10 sm:pt-16 lg:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-10 top-0 h-72 w-72 rounded-full bg-cyan-500/30 blur-[140px]" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-purple-600/25 blur-[160px]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 text-center"
      >
        <span className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          <Sparkles className="h-3 w-3" /> PromptHub Labs · Platform aware
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          Prompt smarter, ship faster{' '}
          <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            for any build destination.
          </span>
        </h1>
        <p className="text-base text-slate-300 sm:text-lg">
          Feed an idea into PromptHub, pick a destination platform, and watch a production-ready brief form with
          stack, API, and edge-case coverage in under five seconds.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {HERO_STATS.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="relative mx-auto mt-10 grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          layout
          className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Wand2 className="h-5 w-5 text-cyan-300" /> Describe your product vision
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                The richer the context, the sharper your generated prompt will be.
              </p>
            </div>
            <span
              className={`hidden rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] sm:inline-flex ${activeTheme.chip}`}
            >
              {activeType?.label}
            </span>
          </div>

          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Eg. A collaboration tool for indie game studios to plan sprints, share builds, and capture player feedback."
            rows={7}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/40"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {SAMPLE_IDEAS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setIdea(sample)}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-300 group-hover:text-white" />
                Use template
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Target platform
              </h3>
              <span className="text-xs text-slate-500">Adaptive outputs &amp; stack hints</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {APP_ARCHETYPES.map((type) => {
                const isActive = appType === type.id
                return (
                  <motion.button
                    key={type.id}
                    type="button"
                    onClick={() => setAppType(type.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? `border-white/50 bg-gradient-to-br ${PLATFORM_THEMES[type.id].gradient} text-white shadow-xl shadow-black/40`
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                    }`}
                  >
                    <p className="text-base font-semibold">{type.label}</p>
                    <p className="mt-1 text-sm text-slate-200/80">{type.description}</p>
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <BookOpenCheck className="h-4 w-4 text-cyan-300" />
              Prompt recipe
            </div>
            <div className="mt-4 space-y-4">
              {recipeProgress.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.hint}</p>
                  </div>
                  <motion.span
                    aria-label={item.met ? 'Complete' : 'Missing'}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
                      item.met
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {item.met ? (
                      <>
                        <Check className="h-3 w-3" /> Covered
                      </>
                    ) : (
                      'Add'
                    )}
                  </motion.span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: isGenerating ? 1 : 0.98 }}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${activeTheme.gradient} px-6 py-3 text-base font-semibold text-white shadow-lg shadow-black/40 transition disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Enhancing prompt...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enhance prompt
                </>
              )}
            </motion.button>
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Powered by OpenAI · {activeType?.label}
            </span>
          </div>

          <div className="mt-6 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Activity className="h-3.5 w-3.5 text-emerald-300" />
              94% success rate
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Timer className="h-3.5 w-3.5 text-cyan-300" />
              &lt;5s average latency
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Shield className="h-3.5 w-3.5 text-purple-300" />
              API key never leaves server
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                key={error}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.aside
          layout
          className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-purple-500/10 backdrop-blur"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
              <Terminal className="h-4 w-4 text-purple-300" />
              Prompt output
            </div>
            {result && (
              <motion.button
                type="button"
                onClick={handleCopy}
                whileHover={{ scale: 1.02 }}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-white/30"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Clipboard className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </motion.button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Drop the enhanced brief into your AI builder or share with teammates once the animation settles.
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Generated for {activeType?.label}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                      Ready to ship
                    </span>
                  </div>
                  <motion.pre
                    aria-live="polite"
                    className="mt-3 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200"
                  >
                    {result}
                  </motion.pre>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 text-slate-400"
                >
                  <p className="font-semibold text-white/80">You&apos;re one tap away.</p>
                  <p className="text-sm">
                    We return a title, goals, and a detailed build prompt tuned for {activeType?.label}.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
                    <li>Recommended tech stack &amp; architecture notes</li>
                    <li>Critical APIs, data contracts, and edge cases</li>
                    <li>Performance targets aligned to the PRD</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      </div>
    </main>
  )
}
