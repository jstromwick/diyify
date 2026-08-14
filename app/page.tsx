"use client";

import { useState, type SyntheticEvent } from "react";
import type { ModeAEstimate } from "@/lib/claude";
import styles from "./page.module.css";

type FetchState =
  | { status: "idle" }
  | { status: "loading"; description: string }
  | { status: "error"; message: string }
  | { status: "success"; estimate: ModeAEstimate };

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 2.64-6.36"></path>
      <path d="M3 4v5h5"></path>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7v5l3 2"></path>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  );
}

function PencilGroup() {
  return (
    <g transform="translate(78,54) rotate(38)">
      <rect x="-8" y="-46" width="16" height="70" rx="4" fill="var(--color-accent-300)"></rect>
      <rect x="-8" y="-46" width="16" height="12" rx="3" fill="var(--color-accent-700)"></rect>
      <polygon points="-8,24 8,24 0,40" fill="var(--color-neutral-700)"></polygon>
      <polygon points="-3,32 3,32 0,40" fill="var(--color-neutral-900)"></polygon>
    </g>
  );
}

function IdleIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
      <PencilGroup />
      <path
        d="M14,96 q12,-22 26,0 t26,0 t26,0 t26,0"
        stroke="var(--color-accent-700)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      ></path>
    </svg>
  );
}

function LoadingIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
      <g style={{ animation: "bob 1.1s ease-in-out infinite", transformOrigin: "70px 60px" }}>
        <PencilGroup />
      </g>
      <path
        d="M16,98 q12,-24 26,0 t26,0 t26,0 t26,0"
        stroke="var(--color-accent-700)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="220"
        strokeDashoffset="220"
        style={{ animation: "draw-line 1.6s ease-in-out infinite" }}
      ></path>
      <g style={{ animation: "shaving-spin 5s linear infinite", transformOrigin: "34px 30px" }}>
        <path
          d="M14,50 C14,30 46,30 46,14 C46,0 24,-4 18,8 C13,19 34,23 38,11"
          stroke="var(--color-accent-2-600)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        ></path>
      </g>
      <circle
        cx="100"
        cy="70"
        r="3"
        fill="var(--color-accent-500)"
        style={{ animation: "speck-float 1.8s ease-in infinite" }}
      ></circle>
      <circle
        cx="112"
        cy="66"
        r="2.4"
        fill="var(--color-accent-2-500)"
        style={{ animation: "speck-float 1.8s ease-in infinite 0.4s" }}
      ></circle>
      <circle
        cx="106"
        cy="78"
        r="2"
        fill="var(--color-accent-400)"
        style={{ animation: "speck-float 1.8s ease-in infinite 0.9s" }}
      ></circle>
    </svg>
  );
}

function trim(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [state, setState] = useState<FetchState>({ status: "idle" });

  const isLoading = state.status === "loading";
  const canSubmit = description.trim().length > 0 && !isLoading;
  const showRestart = state.status !== "idle";

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    const trimmedDescription = description.trim();
    setState({ status: "loading", description: trimmedDescription });

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmedDescription }),
      });

      const body = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: typeof body.error === "string" ? body.error : "Something went wrong.",
        });
        return;
      }

      setState({ status: "success", estimate: body as ModeAEstimate });
    } catch {
      setState({ status: "error", message: "Couldn't reach the server. Try again." });
    }
  }

  function handleReset() {
    setDescription("");
    setState({ status: "idle" });
  }

  return (
    <div className={styles.page}>
      <nav className={`nav ${styles.navBar}`}>
        <span className="nav-brand">DIYify</span>
        {showRestart && (
          <button type="button" className="btn btn-ghost" onClick={handleReset}>
            <RefreshIcon />
            Start over
          </button>
        )}
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Plan your next <span className={styles.accent}>DIY project</span>
        </h1>
        <p className={`text-muted ${styles.subtitle}`}>
          Describe what you want to build or fix. We&apos;ll sketch out cost tiers, materials, and
          where to watch a tutorial.
        </p>

        <div className={`card elev-md ${styles.formCard}`}>
          <form onSubmit={handleSubmit}>
            <div className={`field ${styles.field}`}>
              <label htmlFor="description">What are you working on?</label>
              <textarea
                id="description"
                className={`input ${styles.textarea}`}
                placeholder="e.g. Build a deck railing, retile the bathroom floor, add an outdoor outlet"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={!canSubmit}>
              {isLoading ? "Sketching your plan…" : "Get my plan"}
              <ArrowIcon />
            </button>
          </form>
        </div>

        <div className={styles.states}>
          {state.status === "idle" && (
            <div className={`${styles.stateCenter} ${styles.stateIdle}`}>
              <IdleIllustration />
              <h3 className={styles.stateHeading}>Your sketchpad&apos;s empty</h3>
              <p className={`text-muted ${styles.stateSub}`}>
                Tell us what you&apos;re building above and we&apos;ll pencil in a plan.
              </p>
            </div>
          )}

          {state.status === "loading" && (
            <div className={styles.stateCenter}>
              <LoadingIllustration />
              <h3 className={styles.stateHeading}>Sketching your options…</h3>
              <p className="text-muted" style={{ margin: 0 }}>
                Shaving down the details on &ldquo;{trim(state.description, 46)}&rdquo;
              </p>
            </div>
          )}

          {state.status === "error" && <p className={styles.error}>{state.message}</p>}

          {state.status === "success" && (
            <div className={styles.result}>
              <h2 className={styles.resultHeading}>Three ways to do it</h2>
              <p className={`text-muted ${styles.resultSubtitle}`}>
                Here&apos;s the range from bare-bones to done-right.
              </p>
              <div className={styles.tiers}>
                {state.estimate.tiers.map((tier) => (
                  <article key={tier.tier} className={`card elev-sm ${styles.tierCard}`}>
                    <div className="card-kicker">{tier.tier}</div>
                    <div className="card-title">{tier.name}</div>
                    <div className={styles.costRange}>{tier.cost_range}</div>
                    <p className="card-body" style={{ marginBottom: "var(--space-2)" }}>
                      {tier.description}
                    </p>
                    <div className={styles.timeEstimate}>
                      <ClockIcon />
                      {tier.time_estimate}
                    </div>

                    <div className={styles.sectionLabel}>Materials</div>
                    <ul className={styles.materials}>
                      {tier.materials.map((material) => (
                        <li key={material}>{material}</li>
                      ))}
                    </ul>

                    {tier.safety_notes && (
                      <p className={styles.safetyNote}>{tier.safety_notes}</p>
                    )}

                    <div className={styles.sectionLabel}>Watch &amp; learn</div>
                    <div className={styles.queries}>
                      {tier.video_search_queries.map((query) => (
                        <span key={query} className={`tag tag-outline ${styles.queryTag}`}>
                          <SearchIcon />
                          {query}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
