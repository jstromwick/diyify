"use client";

import { useState, type SyntheticEvent } from "react";
import type { ModeAEstimate } from "@/lib/claude";
import styles from "./page.module.css";

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; estimate: ModeAEstimate };

export default function Home() {
  const [description, setDescription] = useState("");
  const [state, setState] = useState<FetchState>({ status: "idle" });

  const isLoading = state.status === "loading";
  const canSubmit = description.trim().length > 0 && !isLoading;

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setState({ status: "loading" });

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>DIY Project Estimator</h1>
        <p className={styles.subtitle}>
          Describe a project and get low/medium/high cost tiers with materials,
          time estimates, and video tutorial search queries.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="description">
            Project description
          </label>
          <textarea
            id="description"
            className={styles.textarea}
            placeholder="e.g. Build a deck railing"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <button className={styles.submitButton} type="submit" disabled={!canSubmit}>
            {isLoading ? "Generating..." : "Get estimate"}
          </button>
        </form>

        {state.status === "error" && <p className={styles.error}>{state.message}</p>}

        {state.status === "success" && (
          <div className={styles.tiers}>
            {state.estimate.tiers.map((tier) => (
              <article key={tier.tier} className={styles.tierCard}>
                <h2 className={styles.tierName}>{tier.tier}</h2>
                <p className={styles.costRange}>{tier.cost_range}</p>
                <p className={styles.timeEstimate}>{tier.time_estimate}</p>

                <h3 className={styles.sectionLabel}>Materials</h3>
                <ul className={styles.materials}>
                  {tier.materials.map((material) => (
                    <li key={material}>{material}</li>
                  ))}
                </ul>

                {tier.safety_notes && (
                  <p className={styles.safetyNote}>{tier.safety_notes}</p>
                )}

                <h3 className={styles.sectionLabel}>Search on YouTube</h3>
                <ul className={styles.queries}>
                  {tier.video_search_queries.map((query) => (
                    <li key={query} className={styles.queryChip}>
                      {query}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
