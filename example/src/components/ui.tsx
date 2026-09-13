import type { ReactNode } from "react";

export function Corners() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}

export function Card(props: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2>{props.title}</h2>
      {props.description && <p className="card-desc">{props.description}</p>}
      {props.children}
    </section>
  );
}

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      {props.children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
  },
) {
  const { variant = "primary", className, ...rest } = props;
  return <button className={["btn", variant, className].filter(Boolean).join(" ")} {...rest} />;
}

export function Badge(props: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "pending" }) {
  return <span className={`badge ${props.tone ?? "neutral"}`}>{props.children}</span>;
}

export function Chip(props: { children: ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" className={`chip ${props.active ? "active" : ""}`} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

export function Empty(props: { children: ReactNode }) {
  return <div className="empty">{props.children}</div>;
}
