import { useState } from "react";
import "./Contact.css";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: replace with real API call / EmailJS
    const mailto = `mailto:support@CashXWin.example?subject=${encodeURIComponent(
      form.subject || "New message from CashXWin"
    )}&body=${encodeURIComponent(
      `From: ${form.name} <${form.email}>\n\n${form.message}`
    )}`;

    window.location.href = mailto;
    setStatus("Message ready to send from your email client.");
  };

  return (
    <section className="page page-contact">
      <header className="page-heading">
        <span className="page-kicker">Get in touch</span>
        <h1>Contact the CashXWin Team</h1>
        <p>
          Questions about games, odds or integrations? Send us a message and we
          will get back with ideas and feedback.
        </p>
      </header>

      <div className="contact-grid">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Alex Player"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Feedback about the roulette table"
            />
          </div>

          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us what you like, what feels unfair, or which game you want next."
              required
            />
          </div>

          <button type="submit" className="btn btn-primary contact-submit">
            Send message
          </button>

          {status && <p className="contact-status">{status}</p>}
        </form>

        <aside className="contact-panel">
          <h2>Casino support style</h2>
          <p>
            In a real casino lobby, support teams help with account limits,
            verification, bonuses and game rules. For CashXWin, we focus on
            UX feedback and feature requests.
          </p>
          <ul>
            <li>Report animation bugs or layout issues.</li>
            <li>Suggest new game modes or lobby flows.</li>
            <li>Ask about integrating real‑time data or payments.</li>
          </ul>
          <div className="contact-chip-row">
            <span className="contact-chip">UI & UX</span>
            <span className="contact-chip">Game logic</span>
            <span className="contact-chip">Integrations</span>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Contact;
