import "./WelcomePage.css";

interface WelcomePageProps {
  url: string;
}

export default function WelcomePage({ url }: WelcomePageProps) {
  return (
    <div className="welcomePage">
      <div className="welcomePage__card">
        <header className="welcomePage__header">
          <h1 className="welcomePage__title">
            Это расширение для выгрузки выписки из Ozon банка
          </h1>
          <p className="welcomePage__subtitle">
            Для его работы нужно перейти на страницу банка и залогиниться
          </p>
        </header>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={url}
          className="welcomePage__link"
        >
          Перейти в Ozon банк
        </a>
      </div>
    </div>
  );
}
