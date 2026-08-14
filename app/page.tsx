"use client";

import { useState, type SyntheticEvent } from "react";
import type { ModeAEstimate } from "@/lib/claude";
import styles from "./page.module.css";
import { ArrowIcon, ClockIcon, IdleIllustration, LoadingIllustration, RefreshIcon, SearchIcon } from "./icons";

type FetchState =
  | { status: "idle" }
  | { status: "loading"; description: string }
  | { status: "error"; message: string }
  | { status: "success"; estimate: ModeAEstimate };


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
              {isLoading ? "Sketching your plan…" : "Create my plan"}
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
              <h3 className={styles.stateHeading}>Putting together your options…</h3>
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
                Here&apos;s the range from bare-bones to high-end.
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
