# Мануал: как добавить новую статью на сайт CARGO 575

Этот мануал сделан **конкретно для текущего проекта** с рабочим источником просмотров:

- `https://cdn.jsdelivr.net/gh/divangames/cargo575_blog@main/views.json`

Он описывает полный цикл: карточка в блоге -> страница статьи в LP Motor -> добавление пути в `articles.json` -> обновление `views.json` -> проверка на сайте.

---

## 1) Что уже настроено в проекте

В проекте уже подключены:

- Блоговый блок в `Blog.html` читает просмотры из  
  `data-views-json="https://cdn.jsdelivr.net/gh/divangames/cargo575_blog@main/views.json"`.
- Виджет страницы статьи (`ArticleViewsWidget.html` и `views-kit/ArticleViewsWidget.html`) уже:
  - со шрифтом `Manrope`;
  - с иконками Phosphor;
  - с поддержкой просмотров через тот же `views.json`;
  - с отправкой `hit` в Яндекс Метрику через `data-yandex-counter-id="102098359"`.
- Workflow для обновления просмотров: `.github/workflows/update-views.yml`.

Значит при добавлении новой статьи вам обычно нужно менять только:

- карточку в `Blog.html`;
- путь в `views-kit/articles.json`;
- контент страницы статьи в LP Motor (и вставить виджет).

---

## 2) Перед началом: придумайте URL статьи

Выберите URL (slug) в формате:

- `/korotkoe-ponyatnoe-nazvanie-stati`

Пример:

- `/kak-vybrat-konteyner-dlya-dostavki-iz-kitaya`

Важно:

- только путь, **без домена**;
- одинаково во всех местах;
- без случайного хвостового `/` в разных вариантах.

---

## 3) Добавьте карточку статьи в `Blog.html`

Откройте `Blog.html` и скопируйте существующую карточку целиком (блок `<a class="cargo-article-card ...">...</a>`), затем адаптируйте:

1. `href` карточки -> ваш новый путь.
2. `data-cargo-tag` -> тег темы.
3. Текст заголовка и описания.
4. Картинку и `alt`.
5. Дату.

В мета-строке карточки обязательно оставьте блок просмотров в таком виде:

```html
<i class="ph ph-eye"></i>
<span class="lpm-blog-views"><span class="lpm-blog-views-value">—</span></span>
```

Если убрать `lpm-blog-views-value`, число просмотров в карточке не подставится.

---

## 4) Создайте страницу статьи в LP Motor

В LP Motor:

1. Создайте новую страницу статьи.
2. Присвойте ей **точно такой же URL**, как в `href` карточки.
3. Разместите контент статьи.

После этого вставьте виджет мета-информации статьи:

- берите код из `views-kit/ArticleViewsWidget.html` (или `ArticleViewsWidget.html` в корне).

Проверьте атрибуты у корневого блока виджета:

- `data-views-json="https://cdn.jsdelivr.net/gh/divangames/cargo575_blog@main/views.json"`
- `data-article-date="..."` -> дата публикации для отображения
- `data-article-path=""` -> обычно оставить пустым (возьмется текущий URL автоматически)
- `data-yandex-counter-id="102098359"`

Если у страницы нестандартный роутинг, можно принудительно задать путь:

- `data-article-path="/vash-slug"`

---

## 5) Добавьте путь статьи в `views-kit/articles.json`

Откройте `views-kit/articles.json` и добавьте новый путь в массив `articles`.

Пример:

```json
{
  "articles": [
    "/7-oshibok-pri-rabote-s-dostavkoy-iz-kitaya",
    "/cargo-dostavka-s-podvohom-kak-ne-otdat-dengi-moshennikam",
    "/kak-vybrat-konteyner-dlya-dostavki-iz-kitaya"
  ]
}
```

Правило совпадения:

- `href` в `Blog.html` = путь в `articles.json` = URL статьи в LP Motor.

---

## 6) Закоммитьте и отправьте изменения в GitHub

Минимально должны уйти изменения:

- `Blog.html` (если добавляли карточку),
- `views-kit/articles.json`,
- при необходимости шаблон/текст виджета.

Далее:

1. `git add ...`
2. `git commit -m "add new blog article: <slug>"`
3. `git push`

---

## 7) Обновите `views.json` через GitHub Actions

Откройте репозиторий `divangames/cargo575_blog` -> вкладка **Actions** -> workflow:

- `Update views.json from Yandex Metrika`

Запуск:

1. Нажмите **Run workflow**.
2. Дождитесь успешного завершения.

Что делает workflow:

- берет статистику из Яндекс Метрики (счетчик `102098359`);
- обновляет `views.json`;
- коммитит изменения в репозиторий.

---

## 8) Проверьте публикацию

### На странице блога

1. Откройте страницу блога.
2. Сделайте жесткое обновление (Ctrl+F5).
3. У новой карточки вместо `—` должно появиться число.

### На странице статьи

1. Откройте страницу статьи.
2. Проверьте, что в строке мета:
   - отображается дата;
   - отображаются просмотры;
   - иконки календаря/глаза видны.

---

## 9) Если просмотры не появились

Проверьте по порядку:

1. Совпадает ли путь в 3 местах:
   - `href` карточки,
   - `views-kit/articles.json`,
   - фактический URL статьи.
2. Успешно ли прошел workflow в Actions.
3. Появился ли новый ключ в:
   - `https://cdn.jsdelivr.net/gh/divangames/cargo575_blog@main/views.json`
4. Есть ли код виджета на странице статьи целиком (включая `<script>`).
5. Не кэшируется ли старая версия страницы (Ctrl+F5 / инкогнито).

---

## 10) Быстрый чеклист (коротко)

1. Придумал slug.
2. Добавил карточку в `Blog.html`.
3. Создал страницу статьи в LP Motor с тем же URL.
4. Вставил виджет статьи.
5. Добавил slug в `views-kit/articles.json`.
6. Commit + Push.
7. Run workflow `Update views.json from Yandex Metrika`.
8. Проверил блог и страницу статьи.

---

## Примечание по первой статистике

Если статья совсем новая, в Метрике число может появиться не мгновенно.  
В таком случае:

- подождите немного,
- снова запустите workflow,
- обновите страницы.
