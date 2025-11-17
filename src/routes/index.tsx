import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Wand2, Sparkles, Terminal } from 'lucide-react'
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

  const activeType = APP_ARCHETYPES.find((type) => type.id === appType)

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

  return (
    <main className="relative flex flex-col gap-10 px-4 pb-16 pt-8 sm:pt-14 lg:px-0">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-x-0 top-10 mx-auto h-[480px] w-[480px] rounded-full bg-cyan-500/20 blur-[180px]" />
        <div className="absolute inset-x-20 bottom-0 h-[320px] rounded-full bg-purple-700/10 blur-[160px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 text-center">
        <span className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          <Sparkles className="h-3 w-3" /> PromptHub Labs
              </span>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          Craft the perfect AI build prompt in seconds.
            </h1>
        <p className="text-base text-slate-300 sm:text-lg">
          Feed an idea into PromptHub, pick a destination platform, and let our OpenAI-powered enhancer
          output a production-ready brief tailored for AI application generators.
        </p>
          </div>

      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Wand2 className="h-5 w-5 text-cyan-400" /> Describe your product vision
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            The richer the context, the sharper your generated prompt will be. Think features, users, and differentiators.
          </p>

          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Eg. A collaboration tool for indie game studios to plan sprints, share builds, and capture player feedback."
            rows={6}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition ring-0 focus:border-cyan-400 focus:bg-white/10"
          />

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Target platform
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {APP_ARCHETYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setAppType(type.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    appType === type.id
                      ? 'border-cyan-400 bg-cyan-400/10 text-white shadow-lg shadow-cyan-500/20'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/50 hover:text-white'
                  }`}
                >
                  <p className="text-base font-semibold">{type.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
            </button>
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Powered by OpenAI · {activeType?.label}
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
        </section>

        <aside className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-purple-500/10 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
            <Terminal className="h-4 w-4 text-purple-300" />
            Prompt output
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Copy the enhanced prompt directly into your AI builder or code generation workflow.
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
            {result ? (
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200">
                {result}
              </pre>
            ) : (
              <div className="space-y-3 text-slate-500">
                <p className="font-semibold text-white/80">You&apos;re one tap away.</p>
                <p className="text-sm">
                  We&apos;ll return a title, success criteria, and a detailed prompt tuned for {activeType?.label}.
                </p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  <li>Tech stack &amp; architecture suggestions</li>
                  <li>Critical APIs plus data contracts</li>
                  <li>Performance targets and edge cases</li>
                </ul>
            </div>
            )}
        </div>
        </aside>
    </div>
    </main>
  )
}
