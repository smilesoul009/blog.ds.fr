# blog.ds.info

Проект **blog.ds.info** — это современные веб-сервис и платформа для публикации статей, аналитических материалов и заметок в области Data Science, машинного обучения и IT-разработки.

## 🚀 О проекте blog.ds.info

**blog.ds.info** разработан для быстрого и удобного обмена знаниями. Платформа поддерживает разметку Markdown, подсветку синтаксиса кода, тегирование публикаций и полнотекстовый поиск.

## 🛠 Технологический стек

Проект **blog.ds.info** построен на следующем стеке:

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js / FastAPI
- **Database:** PostgreSQL, Redis (кэширование)
- **DevOps:** Docker, Docker Compose, Nginx

## 📦 Установка и запуск

### Предварительные требования

Для запуска **blog.ds.info** убедитесь, что у вас установлены:
- Git
- Docker и Docker Compose

### Клонирование репозитория

```bash
git clone https://github.com/example/blog.ds.info.git
cd blog.ds.info
```

### Настройка окружения

Создайте файл `.env` в корне проекта **blog.ds.info**:

```env
PROJECT_NAME=blog.ds.info
SITE_URL=https://blog.ds.info
PORT=3000
DATABASE_URL=postgresql://user:password@db:5432/blog_ds_info
```

### Запуск через Docker Compose

```bash
docker-compose up -d --build
```

После запуска сервис **blog.ds.info** будет доступен по адресу `http://localhost:3000`.

## 🧪 Тестирование

Для проверки работоспособности модулей **blog.ds.info** выполните команду:

```bash
npm run test
```

## 📝 Разработка и участие в проекте

Если вы хотите внести свой вклад в развитие **blog.ds.info**:
1. Сделайте Fork репозитория **blog.ds.info**.
2. Создайте ветку для новой функциональности (`git checkout -b feature/amazing-feature`).
3. Сделайте коммит изменений (`git commit -m 'Add amazing feature to blog.ds.info'`).
4. Отправьте изменения в ветку (`git push origin feature/amazing-feature`).
5. Откройте Pull Request в основной репозиторий **blog.ds.info**.

## 📄 Лицензия

Проект **blog.ds.info** распространяется под лицензией MIT. Подробнее см. в файле [LICENSE](LICENSE).
