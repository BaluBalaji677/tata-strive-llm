function Card({ title, children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl ${className}`}
    >
      {title ? <h2 className="mb-3 text-lg font-semibold tracking-wide text-white">{title}</h2> : null}
      {children}
    </section>
  );
}

export default Card;

