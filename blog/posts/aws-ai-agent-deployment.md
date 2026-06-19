# How an AI Agent Configured AWS, a Domain, SSL, and CDN in 10 Minutes

I recently deployed a new project to AWS with the help of an AI agent.

The hosting itself took about five minutes. The agent asked several questions, clarified my requirements and budget, and suggested suitable deployment options.

Connecting the domain and issuing an SSL certificate took another five minutes. At the same time, the agent configured the CDN.

This kind of task would normally take me at least 30 minutes. Without prepared templates, I would need to read documentation, compare services, configure DNS, and verify HTTPS manually.

This time, the entire launch took about 10 minutes. The project is already online and ready for promotion.

An AI agent is starting to feel like a system administrator available 24/7. The result still needs to be reviewed: the agent makes the work faster, but the project owner remains responsible for costs, access, and security.

## prompts for different models

Replace the values in brackets with your project details. If the model cannot access your terminal or AWS account, ask it to prepare the commands and guide you through each step.

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

## post-deployment checklist

- The website opens on the primary domain.
- HTTP redirects to HTTPS.
- The SSL certificate is valid.
- The CDN serves the latest version.
- No credentials or secrets were committed to the repository.
- AWS spending limits and alerts are configured.

The model name is not the most important part. A good result starts with the right process: clarify the requirements, compare the options, approve the plan, deploy, and verify everything.
