"use client";

import { useState } from "react";
import {
  CURRENCIES,
  CURRENCY_LABEL,
  EVENT_KINDS,
  KIND_META,
  SETTINGS,
  SETTING_LABEL,
  VIBES,
  VIBE_LABEL,
  categoriesFor,
  type Currency,
  type EventKind,
  type Setting,
  type Vibe,
} from "@/lib/catalog";
import { addDays, todayISO } from "@/lib/dates";
import { validateBrief, type BriefFieldErrors } from "@/lib/schema";
import type { EventBrief } from "@/lib/types";
import styles from "./brief-form.module.css";

interface BriefFormProps {
  busy: boolean;
  fieldErrors: BriefFieldErrors;
  onClearError: () => void;
  onSubmit: (brief: EventBrief) => void;
}

const MAX_PRIORITIES = 3;

export function BriefForm({ busy, fieldErrors, onClearError, onSubmit }: BriefFormProps) {
  const [kind, setKind] = useState<EventKind>("wedding");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(addDays(todayISO(), 90));
  const [guests, setGuests] = useState(String(KIND_META.wedding.defaultGuests));
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [location, setLocation] = useState("");
  const [setting, setSetting] = useState<Setting>("indoor");
  const [vibe, setVibe] = useState<Vibe>("relaxed");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<BriefFieldErrors>({});
  const [guestsTouched, setGuestsTouched] = useState(false);

  const meta = KIND_META[kind];
  const options = categoriesFor(kind).filter((category) => category.key !== "contingency");
  const shownErrors = { ...errors, ...fieldErrors };

  function changeKind(next: EventKind) {
    setKind(next);
    setPriorities((current) =>
      current.filter((key) => categoriesFor(next).some((category) => category.key === key && key !== "contingency")),
    );
    if (!guestsTouched) setGuests(String(KIND_META[next].defaultGuests));
    onClearError();
  }

  function togglePriority(key: string) {
    setPriorities((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (current.length >= MAX_PRIORITIES) return current;
      return [...current, key];
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onClearError();

    const candidate = {
      kind,
      title,
      date,
      guests: guests === "" ? 0 : Number(guests),
      budget: budget === "" ? 0 : Number(budget),
      currency,
      location,
      setting,
      vibe,
      priorities,
      notes,
    };

    const result = validateBrief(candidate);
    if (!result.ok || !result.data) {
      setErrors(result.errors);
      const first = Object.keys(result.errors)[0];
      if (first) document.getElementById(`brief-${first}`)?.focus();
      return;
    }

    setErrors({});
    onSubmit(result.data);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={busy}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>What are you planning?</legend>
        <div className={styles.segmented}>
          {EVENT_KINDS.map((option) => (
            <label key={option} className={styles.segment}>
              <input
                type="radio"
                name="kind"
                value={option}
                checked={kind === option}
                onChange={() => changeKind(option)}
                className={styles.hiddenControl}
              />
              <span>{KIND_META[option].label}</span>
            </label>
          ))}
        </div>
        <p className={styles.hint}>{meta.blurb}</p>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="brief-title">Name this event</label>
        <input
          id="brief-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          autoComplete="off"
          placeholder="Name this event"
          aria-invalid={Boolean(shownErrors.title)}
          aria-describedby={shownErrors.title ? "brief-title-error" : undefined}
        />
        {shownErrors.title ? (
          <p className={styles.error} id="brief-title-error">
            {shownErrors.title}
          </p>
        ) : null}
      </div>

      <div className={styles.pair}>
        <div className={styles.field}>
          <label htmlFor="brief-date">Date</label>
          <input
            id="brief-date"
            name="date"
            type="date"
            value={date}
            min={todayISO()}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={Boolean(shownErrors.date)}
            aria-describedby={shownErrors.date ? "brief-date-error" : undefined}
          />
          {shownErrors.date ? (
            <p className={styles.error} id="brief-date-error">
              {shownErrors.date}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="brief-guests">Guests</label>
          <input
            id="brief-guests"
            name="guests"
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            value={guests}
            placeholder={String(meta.defaultGuests)}
            onChange={(event) => {
              setGuests(event.target.value);
              setGuestsTouched(true);
            }}
            aria-invalid={Boolean(shownErrors.guests)}
            aria-describedby={shownErrors.guests ? "brief-guests-error" : undefined}
          />
          {shownErrors.guests ? (
            <p className={styles.error} id="brief-guests-error">
              {shownErrors.guests}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.pair}>
        <div className={styles.field}>
          <label htmlFor="brief-budget">Total budget</label>
          <input
            id="brief-budget"
            name="budget"
            type="number"
            inputMode="decimal"
            min={1}
            step="any"
            value={budget}
            placeholder="0"
            onChange={(event) => setBudget(event.target.value)}
            aria-invalid={Boolean(shownErrors.budget)}
            aria-describedby={shownErrors.budget ? "brief-budget-error" : undefined}
          />
          {shownErrors.budget ? (
            <p className={styles.error} id="brief-budget-error">
              {shownErrors.budget}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="brief-currency">Currency</label>
          <select
            id="brief-currency"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code} title={CURRENCY_LABEL[code]}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="brief-location">Where</label>
        <input
          id="brief-location"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          maxLength={80}
          autoComplete="off"
          placeholder="City or venue"
          aria-invalid={Boolean(shownErrors.location)}
          aria-describedby={shownErrors.location ? "brief-location-error" : undefined}
        />
        {shownErrors.location ? (
          <p className={styles.error} id="brief-location-error">
            {shownErrors.location}
          </p>
        ) : null}
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Indoors or out?</legend>
        <div className={styles.segmented}>
          {SETTINGS.map((option) => (
            <label key={option} className={styles.segment}>
              <input
                type="radio"
                name="setting"
                value={option}
                checked={setting === option}
                onChange={() => setSetting(option)}
                className={styles.hiddenControl}
              />
              <span>{SETTING_LABEL[option]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="brief-vibe">The room you want</label>
        <select id="brief-vibe" name="vibe" value={vibe} onChange={(event) => setVibe(event.target.value as Vibe)}>
          {VIBES.map((option) => (
            <option key={option} value={option}>
              {VIBE_LABEL[option]}
            </option>
          ))}
        </select>
      </div>

      <fieldset
        className={styles.fieldset}
        id="brief-priorities"
        tabIndex={-1}
        aria-describedby={shownErrors.priorities ? "brief-priorities-error" : undefined}
      >
        <legend className={styles.legend}>Where should the money go?</legend>
        <p className={styles.hint} id="priorities-hint">
          Choose up to {MAX_PRIORITIES}. The ledger shifts weight toward these.
        </p>
        <div className={styles.chips} aria-describedby="priorities-hint">
          {options.map((option) => {
            const checked = priorities.includes(option.key);
            const disabled = !checked && priorities.length >= MAX_PRIORITIES;
            return (
              <label key={option.key} className={styles.chip} data-disabled={disabled}>
                <input
                  type="checkbox"
                  name="priorities"
                  value={option.key}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => togglePriority(option.key)}
                  className={styles.hiddenControl}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        {shownErrors.priorities ? (
          <p className={styles.error} id="brief-priorities-error">
            {shownErrors.priorities}
          </p>
        ) : null}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="brief-notes">Notes for the planner</label>
        <textarea
          id="brief-notes"
          name="notes"
          rows={3}
          maxLength={600}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Dietary needs, access needs, the one thing that cannot go wrong."
          aria-describedby="notes-count"
        />
        <p className={styles.hint} id="notes-count">
          {notes.length} of 600 characters. Plain notes work best.
        </p>
      </div>

      <button type="submit" className={styles.submit} disabled={busy}>
        {busy ? "Drafting your plan" : "Draft the plan"}
      </button>
      <p className={styles.footnote}>
        Nothing is sent anywhere until you press this. Plans stay in this browser.
      </p>
    </form>
  );
}
