import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './PrivacyPage.css';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <header className="privacy-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Назад">
          <ArrowLeft size={24} />
        </button>
        <h1>Политика конфиденциальности</h1>
      </header>

      <main className="privacy-content">
        <section>
          <h2>1. Общие положения</h2>
          <p>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
            персональных данных пользователей приложения Health Club (далее — «Приложение»).
          </p>
        </section>

        <section>
          <h2>2. Какие данные мы собираем</h2>
          <ul>
            <li>Имя и контактные данные (номер WhatsApp)</li>
            <li>Возраст, пол, рост и вес</li>
            <li>Данные о здоровье (результаты опросника, загруженные анализы)</li>
            <li>Информация о питании и привычках</li>
          </ul>
        </section>

        <section>
          <h2>3. Как мы используем данные</h2>
          <p>Ваши данные используются для:</p>
          <ul>
            <li>Персонализированных рекомендаций по здоровью</li>
            <li>Анализа загруженных медицинских документов</li>
            <li>Связи с вами через WhatsApp</li>
            <li>Улучшения качества сервиса</li>
          </ul>
        </section>

        <section>
          <h2>4. Защита данных</h2>
          <p>
            Мы применяем современные методы защиты информации. Ваши данные хранятся 
            на защищённых серверах и не передаются третьим лицам без вашего согласия.
          </p>
        </section>

        <section>
          <h2>5. Ваши права</h2>
          <p>Вы имеете право:</p>
          <ul>
            <li>Запросить доступ к своим данным</li>
            <li>Потребовать исправления неточных данных</li>
            <li>Запросить удаление ваших данных</li>
            <li>Отозвать согласие на обработку данных</li>
          </ul>
        </section>

        <section>
          <h2>6. Контакты</h2>
          <p>
            По вопросам обработки персональных данных обращайтесь в WhatsApp: 
            <a href="https://wa.me/77472370208"> +7 747 237 02 08</a>
          </p>
        </section>

        <p className="privacy-date">Последнее обновление: Январь 2026</p>
      </main>
    </div>
  );
}
