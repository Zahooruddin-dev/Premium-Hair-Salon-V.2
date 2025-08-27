import { useEffect, useMemo, useRef, useState } from "react";

// Hair Salon Online Booking – single-file React app (App.jsx)
// Requirements met:
// - No backend; uses localStorage and a free FX API for EUR→RON price helper
// - Simple calendar picker + dummy online payment
// - Multi-language (EN default, RO optional)
// - Accessible (labels, roles, aria-*, keyboard support)
// - Responsive (mobile-first) – styles expected in index.css as provided separately
// - Calendar integration: generates downloadable .ics + Google Calendar link

export default function App() {
  // ──────────────────────────────────────────────────────────────────────────────
  // i18n
  const locales = {
    en: {
      appTitle: "Salon Booking",
      pickService: "Choose a service",
      pickPro: "Choose a stylist (optional)",
      dateTime: "Pick date & time",
      today: "Today",
      monthNames: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      time: "Time",
      yourInfo: "Your details",
      name: "Full name",
      email: "Email",
      phone: "Phone (optional)",
      notes: "Notes (optional)",
      price: "Price",
      payNow: "Pay now",
      pay: "Pay",
      or: "or",
      confirmBooking: "Confirm booking",
      bookingSummary: "Booking summary",
      duration: "Duration",
      stylist: "Stylist",
      none: "None",
      successTitle: "You're booked!",
      successBody:
        "We emailed your receipt (demo). Add it to your calendar below.",
      addToGoogle: "Add to Google Calendar",
      downloadICS: "Download .ics",
      newBooking: "New booking",
      lang: "Language",
      currency: "Show prices in",
      eur: "EUR",
      ron: "RON",
      cardNumber: "Card number",
      expiry: "Expiry (MM/YY)",
      cvc: "CVC",
      demoOnly: "Demo checkout — use any data",
      total: "Total",
      required: "required",
      hour: "hour",
      hours: "hours",
      minute: "min",
      chooseTime: "Choose a time",
    },
    ro: {
      appTitle: "Programări Salon",
      pickService: "Alege un serviciu",
      pickPro: "Alege un stilist (opțional)",
      dateTime: "Alege data și ora",
      today: "Astăzi",
      monthNames: [
        "Ianuarie",
        "Februarie",
        "Martie",
        "Aprilie",
        "Mai",
        "Iunie",
        "Iulie",
        "August",
        "Septembrie",
        "Octombrie",
        "Noiembrie",
        "Decembrie",
      ],
      weekdaysShort: ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sâ"],
      time: "Ora",
      yourInfo: "Datele tale",
      name: "Nume complet",
      email: "Email",
      phone: "Telefon (opțional)",
      notes: "Note (opțional)",
      price: "Preț",
      payNow: "Plătește acum",
      pay: "Plătește",
      or: "sau",
      confirmBooking: "Confirmă programarea",
      bookingSummary: "Rezumat programare",
      duration: "Durată",
      stylist: "Stilist",
      none: "Fără",
      successTitle: "Programarea este făcută!",
      successBody:
        "Ți-am trimis chitanța (demo). Adaug-o în calendar mai jos.",
      addToGoogle: "Adaugă în Google Calendar",
      downloadICS: "Descarcă .ics",
      newBooking: "Programare nouă",
      lang: "Limbă",
      currency: "Afișează prețul în",
      eur: "EUR",
      ron: "RON",
      cardNumber: "Număr card",
      expiry: "Valabilitate (LL/AA)",
      cvc: "CVC",
      demoOnly: "Plată demo — poți folosi orice date",
      total: "Total",
      required: "obligatoriu",
      hour: "oră",
      hours: "ore",
      minute: "min",
      chooseTime: "Alege o oră",
    },
  };

  const [lang, setLang] = useState("en");
  const t = useMemo(() => locales[lang], [lang]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Catalog (could come from CMS later)
  const baseServices = [
    { id: "cut", name: { en: "Haircut", ro: "Tuns" }, mins: 45, eur: 25 },
    { id: "color", name: { en: "Color", ro: "Vopsit" }, mins: 90, eur: 55 },
    { id: "style", name: { en: "Blow-dry & Style", ro: "Coafat" }, mins: 40, eur: 20 },
    { id: "beard", name: { en: "Beard Trim", ro: "Aranjat barbă" }, mins: 20, eur: 12 },
  ];
  const stylists = [
    { id: "ana", name: "Ana Pop", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Ana" },
    { id: "ion", name: "Ion Ionescu", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Ion" },
    { id: "maria", name: "Maria Luca", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Maria" },
  ];

  const [currency, setCurrency] = useState("EUR");
  const [fx, setFx] = useState(4.97); // fallback EUR→RON
  useEffect(() => {
    // Free API: exchangerate.host (no key) to get EUR→RON
    fetch("https://api.exchangerate.host/latest?base=EUR&symbols=RON")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.rates && d.rates.RON) setFx(d.rates.RON);
      })
      .catch(() => {});
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // Selection state
  const [serviceId, setServiceId] = useState(baseServices[0].id);
  const [stylistId, setStylistId] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null); // date with time 00:00
  const [selectedTime, setSelectedTime] = useState("");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", notes: "" });
  const [payOpen, setPayOpen] = useState(false);
  const [paid, setPaid] = useState(false);
  const [receiptId, setReceiptId] = useState("");

  const service = baseServices.find((s) => s.id === serviceId);
  const stylist = stylists.find((s) => s.id === stylistId);

  const priceEur = service?.eur || 0;
  const priceRon = Math.round(priceEur * fx * 100) / 100;
  const price = currency === "EUR" ? priceEur : priceRon;

  // Generate time slots (10:00–19:00 every 20 mins, exclude lunch 13:00–14:00)
  const slots = useMemo(() => {
    const arr = [];
    for (let h = 10; h <= 19; h++) {
      for (let m of [0, 20, 40]) {
        if (h === 13) continue; // lunch break
        const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        arr.push(label);
      }
    }
    return arr;
  }, []);

  // Persist minimal history (demo)
  useEffect(() => {
    const key = "salon:last";
    const payload = { serviceId, stylistId, selectedDate, selectedTime, customer, currency, lang };
    localStorage.setItem(key, JSON.stringify(payload));
  }, [serviceId, stylistId, selectedDate, selectedTime, customer, currency, lang]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Calendar helpers
  function daysInMonth(dt) {
    return new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  }
  function startWeekday(dt) {
    return new Date(dt.getFullYear(), dt.getMonth(), 1).getDay(); // 0=Sun
  }
  function isSameDay(a, b) {
    return (
      a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  const today = new Date();

  const calendarCells = useMemo(() => {
    const total = daysInMonth(currentMonth);
    const lead = startWeekday(currentMonth);
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      cells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }
    return cells;
  }, [currentMonth]);

  const monthLabel = `${t.monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  // ──────────────────────────────────────────────────────────────────────────────
  // Payment (dummy)
  const cardRef = useRef(null);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  function handlePay(e) {
    e.preventDefault();
    // ultra simple validations just for demo
    if (!customer.name || !customer.email) return alert(`${t.name} & ${t.email} ${t.required}`);
    if (!selectedDate || !selectedTime) return alert(t.chooseTime);
    if (card.number.replace(/\s+/g, "").length < 12) return alert("Invalid card");
    if (!/^[0-9]{2}\/[0-9]{2}$/.test(card.expiry)) return alert("Invalid expiry");
    if (card.cvc.length < 3) return alert("Invalid CVC");

    const id = `rcpt_${Math.random().toString(36).slice(2, 10)}`;
    setReceiptId(id);
    setPaid(true);
    setPayOpen(false);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Calendar integration
  function buildEvent() {
    if (!selectedDate || !selectedTime || !service) return null;
    const [hh, mm] = selectedTime.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + service.mins * 60000);
    const title = `Salon: ${service.name[lang] || service.name.en}`;
    const details = `${t.stylist}: ${stylist ? stylist.name : t.none}. ${customer.notes || ""}`;
    const location = "Salon Downtown, Timișoara";

    return { start, end, title, details, location };
  }

  function formatICSDate(dt) {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      dt.getUTCFullYear().toString() +
      pad(dt.getUTCMonth() + 1) +
      pad(dt.getUTCDate()) +
      "T" +
      pad(dt.getUTCHours()) +
      pad(dt.getUTCMinutes()) +
      pad(dt.getUTCSeconds()) +
      "Z"
    );
  }

  function downloadICS() {
    const ev = buildEvent();
    if (!ev) return;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Salon Demo//EN",
      "BEGIN:VEVENT",
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(ev.start)}`,
      `DTEND:${formatICSDate(ev.end)}`,
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${ev.details.replace(/\n/g, "\\n")}`,
      `LOCATION:${ev.location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "booking.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function googleCalendarUrl() {
    const ev = buildEvent();
    if (!ev) return "#";
    const fmt = (d) =>
      `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
        d.getUTCDate()
      ).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}${String(
        d.getUTCMinutes()
      ).padStart(2, "0")}00Z`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: ev.title,
      details: ev.details,
      location: ev.location,
      dates: `${fmt(ev.start)}/${fmt(ev.end)}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Accessibility helpers
  function keyActivate(e, cb) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      cb();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="app" lang={lang}>
      <header className="app__header">
        <h1 className="visually-hidden">{t.appTitle}</h1>
        <div className="brand" role="img" aria-label="Logo">💇‍♀️</div>
        <div className="header__tools">
          <label className="sr-only" htmlFor="langSel">{t.lang}</label>
          <select
            id="langSel"
            aria-label={t.lang}
            className="select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en">English</option>
            <option value="ro">Română</option>
          </select>

          <label className="sr-only" htmlFor="curSel">{t.currency}</label>
          <select
            id="curSel"
            aria-label={t.currency}
            className="select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="EUR">{t.eur}</option>
            <option value="RON">{t.ron}</option>
          </select>
        </div>
      </header>

      <main className="grid" aria-live="polite">
        {/* Step 1 – Service */}
        <section className="card" aria-labelledby="svcTitle">
          <h2 id="svcTitle">{t.pickService}</h2>
          <ul className="list" role="listbox" aria-label={t.pickService}>
            {baseServices.map((s) => {
              const active = serviceId === s.id;
              const priceLabel =
                currency === "EUR" ? `${s.eur.toFixed(2)} €` : `${(s.eur * fx).toFixed(2)} RON`;
              return (
                <li key={s.id} className={`list__item ${active ? "is-active" : ""}`}>
                  <button
                    className="chip"
                    aria-pressed={active}
                    onClick={() => setServiceId(s.id)}
                    onKeyDown={(e) => keyActivate(e, () => setServiceId(s.id))}
                  >
                    <span className="chip__title">{s.name[lang] || s.name.en}</span>
                    <span className="chip__meta">
                      {s.mins} {t.minute} • {priceLabel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Step 2 – Stylist */}
        <section className="card" aria-labelledby="proTitle">
          <h2 id="proTitle">{t.pickPro}</h2>
          <div className="pro__grid" role="list">
            <button
              className={`pro ${!stylist ? "is-active" : ""}`}
              onClick={() => setStylistId("")}
              aria-pressed={!stylist}
            >
              <div className="pro__avatar" aria-hidden="true">✨</div>
              <div className="pro__name">{t.none}</div>
            </button>
            {stylists.map((p) => (
              <button
                key={p.id}
                className={`pro ${stylistId === p.id ? "is-active" : ""}`}
                onClick={() => setStylistId(p.id)}
                aria-pressed={stylistId === p.id}
              >
                <img src={p.avatar} alt="" className="pro__avatar" />
                <div className="pro__name">{p.name}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3 – Date & Time */}
        <section className="card" aria-labelledby="dtTitle">
          <h2 id="dtTitle">{t.dateTime}</h2>

          <div className="calendar" role="application" aria-label="Calendar picker">
            <div className="cal__header">
              <button
                className="btn btn--ghost"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                  )
                }
                aria-label="Previous month"
              >
                ←
              </button>
              <div className="cal__label" aria-live="polite">{monthLabel}</div>
              <button
                className="btn btn--ghost"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                  )
                }
                aria-label="Next month"
              >
                →
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
              >
                {t.today}
              </button>
            </div>

            <div className="cal__grid" role="grid" aria-label="Dates">
              {t.weekdaysShort.map((w, i) => (
                <div key={i} className="cal__dow" role="columnheader" aria-label={w}>
                  {w}
                </div>
              ))}
              {calendarCells.map((d, i) => {
                const disabled = !d || d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isSel = d && selectedDate && isSameDay(d, selectedDate);
                return (
                  <div key={i} role="gridcell" aria-selected={isSel || false}>
                    {d ? (
                      <button
                        className={`cal__day ${isSel ? "is-active" : ""}`}
                        disabled={disabled}
                        onClick={() => setSelectedDate(d)}
                        aria-label={`${d.toDateString()}`}
                      >
                        {d.getDate()}
                      </button>
                    ) : (
                      <span className="cal__filler" aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="times" role="listbox" aria-label={t.time}>
            {slots.map((s) => {
              const active = selectedTime === s;
              const disabled = !selectedDate;
              return (
                <button
                  key={s}
                  className={`time ${active ? "is-active" : ""}`}
                  disabled={disabled}
                  onClick={() => setSelectedTime(s)}
                  aria-pressed={active}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 4 – Customer */}
        <section className="card" aria-labelledby="infoTitle">
          <h2 id="infoTitle">{t.yourInfo}</h2>
          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <label className="label">
              {t.name}
              <input
                className="input"
                type="text"
                name="name"
                autoComplete="name"
                required
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
            </label>
            <label className="label">
              {t.email}
              <input
                className="input"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </label>
            <label className="label">
              {t.phone}
              <input
                className="input"
                type="tel"
                name="phone"
                autoComplete="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </label>
            <label className="label">
              {t.notes}
              <textarea
                className="textarea"
                rows={3}
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              />
            </label>
          </form>
        </section>

        {/* Step 5 – Summary & Pay */}
        <section className="card" aria-labelledby="sumTitle">
          <h2 id="sumTitle">{t.bookingSummary}</h2>
          <div className="summary">
            <div className="summary__row">
              <span>{t.pickService}</span>
              <strong>{service?.name[lang] || service?.name.en}</strong>
            </div>
            <div className="summary__row">
              <span>{t.duration}</span>
              <strong>
                {service?.mins} {t.minute}
              </strong>
            </div>
            <div className="summary__row">
              <span>{t.stylist}</span>
              <strong>{stylist ? stylist.name : t.none}</strong>
            </div>
            <div className="summary__row">
              <span>Date</span>
              <strong>
                {selectedDate
                  ? selectedDate.toLocaleDateString(lang === "ro" ? "ro-RO" : "en-GB")
                  : "—"}
                {selectedTime ? ` • ${selectedTime}` : ""}
              </strong>
            </div>
            <div className="summary__total" aria-live="polite">
              <span>{t.total}</span>
              <strong>
                {currency === "EUR" ? `${price.toFixed(2)} €` : `${price.toFixed(2)} RON`}
              </strong>
            </div>
            <div className="summary__actions">
              <button
                className="btn btn--primary"
                disabled={!customer.name || !customer.email || !selectedDate || !selectedTime}
                onClick={() => setPayOpen(true)}
              >
                {t.payNow}
              </button>
            </div>
          </div>
        </section>

        {/* Payment Modal */}
        {payOpen && (
          <div className="modal" role="dialog" aria-modal="true" aria-label="Checkout">
            <div className="modal__card">
              <div className="modal__head">
                <h3>{t.pay}</h3>
                <button className="btn btn--ghost" onClick={() => setPayOpen(false)} aria-label="Close">
                  ✕
                </button>
              </div>
              <p className="muted">{t.demoOnly}</p>
              <form className="form" onSubmit={handlePay}>
                <label className="label">
                  {t.cardNumber}
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    ref={cardRef}
                    required
                    aria-required
                  />
                </label>
                <div className="row">
                  <label className="label">
                    {t.expiry}
                    <input
                      className="input"
                      placeholder="05/28"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                      required
                    />
                  </label>
                  <label className="label">
                    {t.cvc}
                    <input
                      className="input"
                      placeholder="123"
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <button className="btn btn--primary" type="submit">
                  {t.pay} {currency === "EUR" ? `${price.toFixed(2)} €` : `${price.toFixed(2)} RON`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Success */}
        {paid && (
          <section className="card success" aria-live="polite">
            <h2>{t.successTitle}</h2>
            <p>
              {t.successBody} <strong>#{receiptId}</strong>
            </p>
            <div className="summary__actions">
              <a className="btn" href={googleCalendarUrl()} target="_blank" rel="noreferrer">
                {t.addToGoogle}
              </a>
              <button className="btn" onClick={downloadICS}>
                {t.downloadICS}
              </button>
              <button className="btn btn--ghost" onClick={() => window.location.reload()}>
                {t.newBooking}
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer" role="contentinfo">
        <p>
          © {new Date().getFullYear()} Salon Demo • FX via exchangerate.host • Built with React —
          {" "}
          <span className="muted">no backend</span>
        </p>
      </footer>
    </div>
  );
}
