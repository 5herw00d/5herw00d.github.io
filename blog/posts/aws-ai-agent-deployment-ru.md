# Как ИИ-агент настроил AWS, домен, SSL и CDN за 10 минут

Недавно я разместил новый проект на AWS с помощью ИИ-агента.

Первые пять минут ушли на хостинг. Агент задал несколько вопросов, уточнил требования и бюджет, а затем предложил подходящие варианты размещения.

Ещё пять минут заняли подключение домена и выпуск SSL-сертификата. Параллельно агент настроил CDN.

Обычно такая задача занимает у меня от 30 минут. Особенно если нет готовых шаблонов и приходится разбираться с незнакомой конфигурацией хостинга: читать документацию, сравнивать сервисы, настраивать DNS и проверять HTTPS.

В этот раз весь запуск занял около 10 минут. Проект уже работает и готов к продвижению.

ИИ-агент начинает напоминать системного администратора, доступного 24/7. Но результат всё равно нужно проверять: агент ускоряет работу, а ответственность за расходы, доступы и безопасность остаётся у владельца проекта.

## промпты для разных моделей

Замените значения в квадратных скобках своими данными. Если у модели нет доступа к терминалу или AWS, попросите её подготовить команды и сопровождать вас по шагам.

### ChatGPT

```text
Act as my DevOps assistant and help me deploy a web project to AWS.

Project:
- Stack: [STACK]
- Build command: [COMMAND]
- Domain: [DOMAIN]
- Preferred region: [REGION]
- Monthly budget: [BUDGET]
- Expected traffic: [TRAFFIC]

First, ask up to five questions to clarify missing requirements. Then suggest 2–3 hosting options and compare their estimated cost, setup complexity, maintenance, and scalability.

Do not make changes until I choose an option. If you have terminal access, work in small steps and verify each result. Ask for confirmation before paid, destructive, or DNS-related actions.

Configure hosting, the domain, HTTPS, an SSL certificate, a CDN, and HTTP-to-HTTPS redirects.

Never expose secrets or commit credentials to Git. Finish with a report covering created resources, checks performed, estimated monthly cost, and rollback steps.
```

### Claude

```text
Help me safely deploy a web project to AWS.

Context:
- Stack: [STACK]
- Build command: [COMMAND]
- Domain: [DOMAIN]
- Region: [REGION]
- Monthly budget: [BUDGET]
- Expected traffic: [TRAFFIC]

Work in phases.

Phase 1: Inspect the project without changing anything. Identify build, runtime, and environment requirements.

Phase 2: Propose several AWS architectures. Explain the cost, benefits, limitations, maintenance, and security implications of each.

Phase 3: After I approve one option, create a deployment plan covering hosting, DNS, SSL, HTTPS redirects, and CDN configuration.

Phase 4: Execute one step at a time and verify each result. Stop for confirmation before changing DNS, creating paid resources, or deleting data.

Never print secrets or store credentials in the repository. Finish with security, availability, cost, and rollback checks.
```

### GLM

```text
Deploy my web project to AWS and configure its domain, SSL certificate, and CDN.

Before planning, request any missing information:
1. Project stack
2. Build command
3. Domain
4. AWS region
5. Monthly budget
6. Expected traffic

Return the plan in this format:

A. Hosting options
Create a table with estimated cost, complexity, scalability, maintenance, and limitations.

B. Recommendation
Choose one option and explain why.

C. Deployment plan
Provide numbered steps for AWS hosting, DNS, SSL, HTTPS redirects, and CDN.

D. Risks
List paid operations, DNS changes, required permissions, security risks, and rollback steps.

Do not make changes until I reply with “CONFIRMED.” Then work sequentially and verify every step.

Never place passwords, tokens, or access keys in code, logs, commands, or Git. Finish by checking DNS, HTTPS, CDN behavior, site availability, and estimated monthly cost.
```

### Gemini

```text
Act as a cloud infrastructure engineer. Help me deploy a web project to AWS and configure its domain, SSL certificate, HTTPS, and CDN.

Project details:
- Stack: [STACK]
- Build command: [COMMAND]
- Domain: [DOMAIN]
- Region: [REGION]
- Monthly budget: [BUDGET]
- Expected traffic: [TRAFFIC]

Ask for missing information instead of making assumptions.

Suggest three hosting options and compare their estimated cost, setup time, maintenance, scalability, and best use cases.

After I select an option:
1. Create a step-by-step deployment plan.
2. Identify tasks that can run in parallel.
3. Request confirmation before paid, destructive, or DNS-related operations.
4. Configure or explain the hosting, DNS, SSL, HTTPS redirects, and CDN setup.
5. Verify the final result.

Never expose secrets or commit credentials to Git. End with a report of created resources, completed checks, estimated costs, remaining risks, and rollback steps.
```

## что проверить после запуска

- Сайт открывается по основному домену.
- HTTP перенаправляется на HTTPS.
- SSL-сертификат действителен.
- CDN отдаёт актуальную версию сайта.
- Ключи и другие секреты не попали в репозиторий.
- В AWS настроены лимиты расходов и уведомления.

Название модели здесь не самое важное. Хороший результат начинается с правильного процесса: сначала вопросы и сравнение вариантов, затем подтверждение, настройка и финальная проверка.
