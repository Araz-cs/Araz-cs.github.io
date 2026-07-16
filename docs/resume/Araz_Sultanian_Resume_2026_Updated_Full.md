# Araz Sultanian
**Seattle, WA** · US Citizen  
araz.sultanian@gmail.com · (818) 632-5657 · [github.com/Araz-cs](https://github.com/Araz-cs) · [linkedin.com/in/arazsultanian](https://linkedin.com/in/arazsultanian) · [Araz-tech.com](https://Araz-tech.com)

---

## Summary
Full-stack and platform engineer with 3+ years at AAA/ClubLabs building insurance bind modernization, travel digital products, and org-wide deployment infrastructure. Primary engineer on travel appointment scheduling (500+ commits), founding engineer on live-chat widget, co-architect of dual-region Safe Deploy adopted across insurance and travel. Strong in TypeScript/React frontends, AWS serverless backends, Salesforce/Mulesoft integrations, and CI/CD platform engineering.

---

## Technical Skills

| Category | Technologies |
|----------|-------------|
| **Languages** | TypeScript, JavaScript, Python, Java, C/C++ |
| **Frontend** | React 18, Vite, Module Federation, TanStack Query, Zustand, Redux, MUI, ACE Shared Component Library |
| **Backend & Cloud** | Node.js, AWS Lambda, CDK, Step Functions, API Gateway, CloudFront, Lambda@Edge, DynamoDB, MongoDB, S3, IAM |
| **Integrations** | Salesforce, Mulesoft, Meta Graph API, TikTok Lead Gen, Okta/OIDC |
| **DevOps & Platform** | GitHub Actions, Safe Deploy, blue/green, Docker, Terraform, CloudFormation, Helm, Kubernetes, Tekton |
| **Observability** | Splunk, LogCannon, Tealium, AWS X-Ray, CloudWatch |
| **Testing** | Playwright, Vitest, Jest, Mocha, JUnit, Mockito |

---

## Professional Experience

### **AAA (Auto Club Enterprises / ClubLabs)** — Software Engineer → Senior Software Engineer
**Irvine, CA · Jan 2023 – Present**

*Career arc: Insurance bind modernization (Online Bind 2.0) → Travel digital platform founding/primary engineer → Cross-org platform engineering (Safe Deploy)*

#### Travel Platform Engineering (Aug 2024 – Present)

**Travel Agent Appointment Scheduler** — Primary Engineer (#1 contributor, 500+ commits)
- Own the core booking funnel at `/travel/agent/scheduler`: destination search, agent selection, in-branch/virtual/phone appointments, modify/cancel/reschedule, email inquiry
- Built 9+ AWS Lambda APIs with CDK (createAppointment, modifyAppointment, getAgentsAndTimeslots, processEmailInquiry, etc.) integrated with Salesforce Service Cloud via Mulesoft
- Drove ad-proxy-v2 migration, UAT2 Salesforce environment support, Splunk/LogCannon/Tealium analytics tagging across appointment flows
- Implemented Safe Deploy pipelines for API (East→West CDK) and web (S3 standby→active) paths (TRVL-2455)

**Travel Help Icon / Travel Assistant** — Founding Engineer (repo creator, Aug 2024, 360+ commits)
- Created embeddable floating help widget with Salesforce Live Agent integration, SSE-based live chat, offline fallback (email/schedule), link preview cards
- Built agent availability APIs (`getAgentsAvailability`, `getPlaceInQueue`), CI/CD web distribution pipeline, Claude Playwright test harness
- Implemented originating-page URL handoff to scheduler, session timeout handling, utag.link analytics

**Travel Lead Generation** — Architect / Sole Builder (repo creator, Nov 2025, 150+ commits)
- Greenfield real-time lead capture: Meta (Facebook/Instagram) and TikTok ad webhooks → Step Functions → Salesforce via Mulesoft
- Lambdas: validateMetaWebhook, processMetaLeadGeneration, retrieveMetaLeadDetails, refreshMetaAccessToken, processTiktokLeadGeneration
- Authored comprehensive architecture documentation; resolved production Ad Proxy V2 IAM issue; travel-only product filtering
- **Metrics:** <5s form submission to Salesforce, 99.9% availability, ~$0.20/1M requests

**Travel Hub** — Architect / Sole Builder (repo creator, Feb 2026, 80+ commits)
- Module Federation micro-frontend remote loaded by Enterprise My Account at `/enterprise/travel`
- Built `getCustomerBooking` Lambda → Mulesoft via ingress-proxy; integrated into MA3 host with Vite Module Federation + post-Okta bookmark restoration

**Travel Advisor, Widget, Relevance Search** — Lead Contributor
- **Advisor:** Agent search Lambda, profile redesign, safe deploy infra, contact validation (phone+email required)
- **Widget v2:** Redesigned embeddable search widget (flights, cars, cruises, packages); bootstrapped CI/CD; shared URL helper infrastructure
- **Relevance Search:** Improved location ingest pipeline for "City, State, Country" queries; Splunk duplicate-detection logging

#### Platform & CloudOps Engineering (2025 – Present)

**Safe Deploy Platform (ENBL-574, ENBL-571)** — Co-Architect
- Co-authored `shared-safe-deploy-app-stack.yml` (~780 LOC): DynamoDB deploy-window ON → Deploy East → Health Check → Approval Gate → Deploy West → DDB OFF → Auto-rollback
- Built `deploy-window-dispatch.yml` with cross-region replica verification; documented Mermaid flow diagrams and failure-mode runbooks
- Configured deploy-window IAM roles and DynamoDB policies in routing accounts (`cloud-ops_admin`)
- Added custom CloudFront cache policy for `x-ace-deployment-phase` header passthrough (rush-escrow Lambda@Edge routing)
- First production adopter: rush-escrow insurance app; extended to travel advisor + scheduler

**Travel Infrastructure Onboarding**
- Registered 7 travel apps in shared CloudFront web distribution, API gateway paths, and admin workload prereqs
- Authored Safe Deploy gateway redeploy runbook for regional domain output management (TRVL-2455)

**Design System (ACE Shared Component Library)**
- Shipped 10+ travel category SVG icons (Auto, Cruise, Flight, Hotel, Insurance, Package, Activities) used across widget, hub, and advisor apps

#### Online Bind 2.0 — Insurance Quote/Bind Platform (Mar 2023 – Mar 2024)

*Contractor via Perficient → AAA California → ClubLabs*

- Led **PCF → AWS Lambda/CDK migration** for core quote/bind endpoints: `/loadQuote`, `/vincheck`, `/priorInsurance`, `/checkMembership` with API Gateway, UI integration, and pipeline automation
- Established **GitHub Actions CI** (build/lint/test) replacing legacy pipeline; upgraded Lambdas to Node 18 and AWS SDK v3
- Implemented MongoDB datasource/factory/mapper patterns for vehicle models; SOLID architecture (execution layer, brokers, factories, managers)
- Shipped **Guidewire Missouri expansion**: quote confirmation page, retrieve-via-contact flow, rideshare coverage UI rules, onboarding activation discount
- Migrated from Elasticsearch to MongoDB with Lambda endpoint connections and CI/CD wiring

**Stack:** React, Redux, TypeScript, Node.js, AWS Lambda, CDK, API Gateway, DynamoDB, MongoDB, Mulesoft, GitHub Actions, Jest, Mocha

---

### **Ford Motor Company** — Software Engineer
**Irvine, CA · Jan 2022 – Dec 2022**

*Autonomous Vehicles Orchestration UI/UX Backend — Ford Next*

- Developed and migrated Java microservices from AWS Lambda to GCP CloudRun using Spring Boot for real-time autonomous vehicle data processing
- Implemented async Pub/Sub, gRPC, and WebSocket communication between microservices
- Secured endpoints with OAuth, OpenID Connect, and JWT via Spring Security
- Integrated 42Crunch, SonarQube, and Fossa into Tekton pipeline for API security, code quality, and license compliance
- Optimized data transformation for 3 services: **95% latency reduction**, **20% system performance improvement**
- Automated deployment with OpenShift, Tekton, and Terraform: **40% faster deployments**, improved reliability

**Stack:** Java, Spring Boot, GCP CloudRun, Pub/Sub, AWS Lambda, SQS, SNS, PostgreSQL, Redis, Tekton, Kubernetes, Terraform

---

### **Freelance** — Software Engineer
**Irvine, CA · Mar 2021 – Dec 2021**

- Built React Native proof-of-concept app for business contact and media sharing with Firebase authentication (Facebook, Google sign-in)

---

## Projects

### **Fabflix** — Full-Stack Movie Platform (UC Irvine, Jun 2021)
- Full-stack web app for browsing/searching/purchasing from 21,000+ movies
- Query caching reduced search time 4s → 1s; full-text autocomplete; master-slave load balancing for 500+ users
- XML→CSV ETL reduced 200K movie insertion from 30 min → 5 sec

---

## Education

**University of California, Irvine**  
Bachelor of Science, Computer Science · GPA 3.3/4.0 · Sep 2019 – Jun 2021

---

## Languages
English (Fluent) · Armenian (Native) · Arabic (Native)
