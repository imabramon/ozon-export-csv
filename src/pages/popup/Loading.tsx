import "./Loading.css";

export default function Loading() {
  return (
    <div className="loading">
      <div className="loading__card">
        <div className="loading__content">
          <div className="loading__spinner" aria-hidden />
          <p className="loading__text">Загрузка...</p>
        </div>
      </div>
    </div>
  );
}
