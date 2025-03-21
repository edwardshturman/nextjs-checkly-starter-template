import Link from "next/link"
import Image from "next/image"
import { headers } from "next/headers"
import { type Greeting } from "@/app/api/greetings/route"

const VERCEL_PROTECTION_HEADER = "x-vercel-protection-bypass"

export default async function Home({
  searchParams
}: {
  searchParams: Promise<URLSearchParams>
}) {
  // Check for a Vercel Deployment Protection bypass header, query parameter, or environment variable
  // See: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
  const headersList = await headers()
  const params = new URLSearchParams(await searchParams)
  const vercelProtectionBypassHeader = headersList.get(VERCEL_PROTECTION_HEADER)
  const vercelProtectionBypassQueryParam = params.get(VERCEL_PROTECTION_HEADER)
  const vercelProtectionBypassEnvVar = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

  // IIFE to check for Vercel Deployment Protection bypass
  const getBypass = (() => {
    if (vercelProtectionBypassHeader) {
      return vercelProtectionBypassHeader
    }
    if (vercelProtectionBypassQueryParam) {
      return vercelProtectionBypassQueryParam
    }
    if (vercelProtectionBypassEnvVar) {
      return vercelProtectionBypassEnvVar
    }
    return null
  })()

  // Construct endpoint to fetch greetings from, bypassing Vercel Deployment Protection if necessary and able
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto")
  const apiURL = `${protocol}://${host}/api/greetings`
  const response = await fetch(apiURL, {
    ...(getBypass
      ? { headers: { [VERCEL_PROTECTION_HEADER]: getBypass } }
      : {})
  })

  async function fetchGreeting() {
    if (!response.ok) {
      return null
    }
    const greetings = await response.json()
    const greeting = greetings[Math.floor(Math.random() * greetings.length)]
    return greeting as Greeting
  }

  function Greeting({ greeting }: { greeting: Greeting }) {
    return (
      <div className="mb-4 text-gray-500 dark:text-gray-400">
        <span className="capitalize">{greeting.text}</span>, this is the
      </div>
    )
  }

  function SystemEnvVarsNotExposed() {
    return (
      <>
        <p className="border border-solid border-blue-500 dark:border-blue-400 rounded-md p-4 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 max-w-prose">
          Almost there! Please check the README for instructions on how to expose your {" "}
          <Link
            className="text-blue-700 dark:text-blue-500 underline"
            href="https://vercel.com/docs/environment-variables/system-environment-variables"
            target="_blank"
          >
            Vercel system environment variables
          </Link>
          .
        </p>
      </>
    )
  }

  function NoProtectionBypass() {
    return (
      <>
        <p className="border border-solid border-blue-500 dark:border-blue-400 rounded-md p-4 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 max-w-prose">
          Almost there!
          It looks like you have Vercel Deployment Protection enabled, but no bypass set.
          Please check the README for instructions on how to provide one.
        </p>
      </>
    )
  }

  function Success() {
    return (
      <>
        <p>
          This is a simple Next.js app with a Checkly integration. In a nutshell, it does three things:
        </p>
        <ol className="list-decimal text-left list-inside">
          <li className="mb-2">
            The app fetches data from the {" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              /api/greetings
            </code>
            {" "} endpoint and displays it on this landing page.
          </li>
          <li className="mb-2">
            Checkly verifies if the page loads — using Playwright — and if the API responds correctly.
          </li>
          <li>
            Checkly checks can run after deployment and deployed as monitors using the Checkly CLI.
          </li>
        </ol>
        <p>
          To get going, {" "}
          <Link
            className="text-blue-700 dark:text-blue-500 underline"
            href="https://github.com/checkly/nextjs-checkly-starter-template"
            target="_blank"
          >
            go to the repo
          </Link>
          {" "} and follow the instructions in the README.md file.
        </p>
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://github.com/checkly/nextjs-checkly-starter-template"
            target="_blank"
            rel="noopener noreferrer"
          >
            Go to the GitHub repo
          </Link>
        </div>
      </>
    )
  }

  const greeting = await fetchGreeting()
  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div>
          <Link href="https://checklyhq.com" target="_blank">
            <Image
              src="https://www.checklyhq.com/images/racoon_logo.svg"
              alt="Checkly logomark"
              width={40}
              height={40}
              className="mb-4"
            />
          </Link>

          {
            // Display greeting if available
            greeting && <Greeting greeting={greeting} />
          }

          <h1 className="text-4xl text-left sm:text-5xl font-bold">
            Next.js & Checkly starter template
          </h1>
        </div>

        {
          // Display success message if greeting is available
          greeting && <Success />
        }

        {
          // Warn if Vercel deployment does not have access to system environment variables
          // See: https://vercel.com/docs/environment-variables/system-environment-variables
          // Ignore if greeting is available regardless (exposing to deployments could be disabled, or user could be running locally)
          (process.env.NODE_ENV === "production" && !greeting && !process.env.VERCEL)
            && <SystemEnvVarsNotExposed />
        }

        {
          // Warn if Vercel Deployment Protection is enabled but no bypass is set
          // See: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
          // Ignore if greeting is available regardless (Vercel Deployment Protection could be disabled, or user could be running locally)
          (process.env.VERCEL && !greeting && !getBypass)
            && <NoProtectionBypass />
        }

      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <Link
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/checkly/nextjs-checkly-starter-template"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Repo
        </Link>
        <Link
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://checklyhq.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to checklyhq.com →
        </Link>
      </footer>
    </div>
  )
}
