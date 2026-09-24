"use client";

import { useRef, useState } from "react";
import styles from "./RaceParticipation.module.css";

const questions = [
  {
    question: "A candidate promises more transparency. What is that?",
    options: ["A campaign position", "A verified result in office"],
    answer: 0,
    explanation: "A promise tells you what a candidate says they will do. Records show what they have done.",
    href: "#issues",
    link: "Compare the published positions",
  },
  {
    question: "Can this community poll predict the election winner?",
    options: ["Yes, once enough people respond", "No, it only reflects participants"],
    answer: 1,
    explanation: "People choose whether to participate. Even with signed-in accounts, this is not a representative election survey.",
    href: "#community-poll",
    link: "Read the community poll",
  },
  {
    question: "A performance grade says NR. What does it mean here?",
    options: ["Not enough verified evidence to rate", "A failing performance grade"],
    answer: 0,
    explanation: "NR means not rated. Missing evidence does not become a score, and popularity does not set the grade.",
    href: "#method",
    link: "See how the grade works",
  },
] as const;

export default function RaceParticipation() {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = questions[step];
  const finished = step === questions.length;

  function advance() {
    setStep((current) => current + 1);
    setChoice(null);
    heading.current?.focus();
  }

  return (
    <section className={styles.panel} aria-labelledby="participate-heading">
      <p className={styles.eyebrow}>Your county. Your questions.</p>
      <h2 id="participate-heading">Make yourself part of the conversation.</h2>
      <p className={styles.intro}>Start with the facts. Pick a path, then bring your perspective.</p>
      <div className={styles.paths}>
        <a href="#issues"><span aria-hidden="true">01 ↗</span><strong>Compare the issues</strong><small>Both candidates, one guide.</small></a>
        <a href="#community-poll"><span aria-hidden="true">02 ↗</span><strong>Have your say</strong><small>A free profile makes your response count.</small></a>
        <a href="#discussion"><span aria-hidden="true">03 ↗</span><strong>Join the discussion</strong><small>Ask a question. Bring a source.</small></a>
      </div>
      <details className={styles.challenge}>
        <summary>Try the 60-second record check <span>3 questions · no sign-in</span></summary>
        <div className={styles.game}>
          <p className={styles.eyebrow}>{finished ? "Record check complete" : `Question ${step + 1} of ${questions.length}`}</p>
          <h3 ref={heading} tabIndex={-1}>{finished ? `${score} of ${questions.length} correct. Keep asking good questions.` : question.question}</h3>
          {!finished ? <>
            <div className={styles.answers} role="group" aria-label={question.question}>
              {question.options.map((option, index) => (
                <button key={`${step}-${index}`} type="button" disabled={choice !== null} aria-pressed={choice === index}
                  onClick={() => { setChoice(index); if (index === question.answer) setScore((current) => current + 1); }}>
                  {option}
                </button>
              ))}
            </div>
            <div role="status" aria-live="polite">
              {choice !== null ? <div className={styles.feedback}>
                <strong>{choice === question.answer ? "That’s right." : "Here’s the distinction."}</strong>
                <p>{question.explanation}</p>
                <a href={question.href}>{question.link} ↗</a>
              </div> : null}
            </div>
            {choice !== null ? <button className={styles.next} type="button" onClick={advance}>{step === questions.length - 1 ? "See my result" : "Next question →"}</button> : null}
          </> : <>
            <p>You’ve checked the difference between a promise, a poll and a performance grade. Now explore the records for yourself.</p>
            <div className={styles.answers}>
              <a className={styles.next} href="#sources">Explore the sources ↗</a>
              <button type="button" onClick={() => { setStep(0); setChoice(null); setScore(0); heading.current?.focus(); }}>Play again</button>
            </div>
          </>}
          <p className={styles.privacy}>Just for learning. Answers stay on this page and reset when you reload. This is separate from the community poll.</p>
        </div>
      </details>
    </section>
  );
}
