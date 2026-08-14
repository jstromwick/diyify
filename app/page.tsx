"use client";

import { useState, type SyntheticEvent } from "react";
import type { EstimateWithTiers, RealisticEstimate, UnrealisticEstimate } from "@/lib/claude";
import styles from "./page.module.css";
import { ArrowIcon, ClockIcon, IdleIllustration, LoadingIllustration, RefreshIcon, SearchIcon } from "./icons";

type Estimate = EstimateWithTiers | RealisticEstimate | UnrealisticEstimate;

type FetchState =
  | { status: "idle" }
  | { status: "loading"; description: string }
  | { status: "error"; message: string }
  | { status: "success"; estimate: Estimate };


function trim(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function TiersResult({ estimate }: { estimate: EstimateWithTiers }) {
  return (
    <div className={styles.result}>
      <h2 className={styles.resultHeading}>Three ways to do it</h2>
      <p className={`text-muted ${styles.resultSubtitle}`}>
        Here&apos;s the range from bare-bones to high-end.
      </p>
      <div className={styles.tiers}>
        {estimate.tiers.map((tier) => (
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
              {tier.materialsWithBudget.map((material) => (
                <li key={material.item} className={styles.materialItem}>
                  <span>{material.item}</span>
                  <span className={styles.materialCost}>{material.estimatedCost}</span>
                </li>
              ))}
            </ul>

            <div className={styles.sectionLabel}>Plan</div>
            <ol className={styles.plan}>
              {tier.plan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            {tier.safety_notes && <p className={styles.safetyNote}>{tier.safety_notes}</p>}

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
  );
}

function RealisticResult({ estimate }: { estimate: RealisticEstimate }) {
  return (
    <div className={styles.result}>
      <h2 className={styles.resultHeading}>Here&apos;s the plan for ${estimate.budget}</h2>
      <p className={`text-muted ${styles.resultSubtitle}`}>
        The best build that fits your budget, plus room to flex either direction.
      </p>

      <article className={`card elev-md ${styles.tierCard} ${styles.budgetPrimary}`}>
        <div className="card-kicker">within budget</div>
        <div className={styles.costRange}>{estimate.withinBudget.cost_range}</div>
        <p className="card-body" style={{ marginBottom: "var(--space-2)" }}>
          {estimate.withinBudget.trade_offs}
        </p>

        <div className={styles.sectionLabel}>Materials</div>
        <ul className={styles.materials}>
          {estimate.withinBudget.materialsWithBudget.map((material) => (
            <li key={material.item} className={styles.materialItem}>
              <span>{material.item}</span>
              <span className={styles.materialCost}>{material.estimatedCost}</span>
            </li>
          ))}
        </ul>

        <div className={styles.sectionLabel}>Plan</div>
        <ol className={styles.plan}>
          {estimate.withinBudget.plan.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {estimate.withinBudget.safety_notes && (
          <p className={styles.safetyNote}>{estimate.withinBudget.safety_notes}</p>
        )}

        <div className={styles.sectionLabel}>Watch &amp; learn</div>
        <div className={styles.queries}>
          {estimate.withinBudget.video_search_queries.map((query) => (
            <span key={query} className={`tag tag-outline ${styles.queryTag}`}>
              <SearchIcon />
              {query}
            </span>
          ))}
        </div>
      </article>

      <div className={styles.tiers}>
        <article className={`card elev-sm ${styles.tierCard}`}>
          <div className="card-kicker">stretch (+20%)</div>
          <div className={styles.costRange}>{estimate.stretchOption.cost_range}</div>
          <p className="card-body" style={{ margin: 0 }}>
            {estimate.stretchOption.what_you_gain}
          </p>
        </article>
        <article className={`card elev-sm ${styles.tierCard}`}>
          <div className="card-kicker">savings (-20%)</div>
          <div className={styles.costRange}>{estimate.savingsOption.cost_range}</div>
          <p className="card-body" style={{ margin: 0 }}>
            {estimate.savingsOption.what_you_cut}
          </p>
        </article>
      </div>
    </div>
  );
}

function UnrealisticResult({ estimate }: { estimate: UnrealisticEstimate }) {
  return (
    <div className={styles.result}>
      <h2 className={styles.resultHeading}>${estimate.budget} won&apos;t quite cover it</h2>
      <p className={`text-muted ${styles.resultSubtitle}`}>{estimate.reason}</p>

      <article className={`card elev-md ${styles.tierCard}`}>
        <div className="card-kicker">realistic minimum</div>
        <div className={styles.costRange}>${estimate.minRealisticBudget}+</div>

        <div className={styles.sectionLabel}>Materials</div>
        <ul className={styles.materials}>
          {estimate.whatThatGetsYou.materialsWithBudget.map((material) => (
            <li key={material.item} className={styles.materialItem}>
              <span>{material.item}</span>
              <span className={styles.materialCost}>{material.estimatedCost}</span>
            </li>
          ))}
        </ul>

        <div className={styles.sectionLabel}>Plan</div>
        <ol className={styles.plan}>
          {estimate.whatThatGetsYou.plan.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {estimate.whatThatGetsYou.safety_notes && (
          <p className={styles.safetyNote}>{estimate.whatThatGetsYou.safety_notes}</p>
        )}

        <div className={styles.sectionLabel}>Watch &amp; learn</div>
        <div className={styles.queries}>
          {estimate.whatThatGetsYou.video_search_queries.map((query) => (
            <span key={query} className={`tag tag-outline ${styles.queryTag}`}>
              <SearchIcon />
              {query}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [state, setState] = useState<FetchState>({ status: "idle" });

  const trimmedBudget = budgetInput.trim();
  const budgetValue = trimmedBudget === "" ? undefined : Number(trimmedBudget);
  const budgetInvalid = trimmedBudget !== "" && (!Number.isFinite(budgetValue) || (budgetValue as number) <= 0);

  const isLoading = state.status === "loading";
  const canSubmit = description.trim().length > 0 && !budgetInvalid && !isLoading;
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
        body: JSON.stringify({
          description: trimmedDescription,
          ...(budgetValue !== undefined ? { budget: budgetValue } : {}),
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: typeof body.error === "string" ? body.error : "Something went wrong.",
        });
        return;
      }

      setState({ status: "success", estimate: body as Estimate });
    } catch {
      setState({ status: "error", message: "Couldn't reach the server. Try again." });
    }
  }

  function handleReset() {
    setDescription("");
    setBudgetInput("");
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
            <div className={`field ${styles.field}`}>
              <label htmlFor="budget">Budget in $ (optional)</label>
              <input
                id="budget"
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                className="input"
                placeholder="e.g. 400"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
              {budgetInvalid && <p className={styles.error}>Enter a positive number.</p>}
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

          {state.status === "success" && "tiers" in state.estimate && (
            <TiersResult estimate={state.estimate} />
          )}
          {state.status === "success" &&
            "realistic" in state.estimate &&
            (state.estimate.realistic ? (
              <RealisticResult estimate={state.estimate} />
            ) : (
              <UnrealisticResult estimate={state.estimate} />
            ))}
        </div>
      </main>
    </div>
  );
}
