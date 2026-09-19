# Easy-Link

> 복잡한 공공서비스 웹페이지를, 시니어를 위한 쉬운 안내문으로.

![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-2E7D32?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB?style=flat-square)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933?style=flat-square)
![AI](https://img.shields.io/badge/AI-OpenRouter%20API-6E56CF?style=flat-square)

## Overview

정부 및 민간 서비스의 온라인 전환이 가속화되면서, 시니어 계층은 오히려 정보 접근에서 소외되고 있습니다. 공공서비스 웹페이지는 복잡한 행정 용어와 다단계 절차로 구성되어 있어, 디지털 기기에 익숙하지 않은 고령 사용자가 혼자 힘으로 이해하고 이용하기 어렵습니다.

기존 범용 LLM 서비스(ChatGPT 등)는 이 문제를 부분적으로 해결할 수 있지만, 사용자가 직접 웹페이지 내용을 복사해 붙여넣어야 하는 번거로움이 있어 시니어 사용자에게는 여전히 진입 장벽이 높습니다.

**Easy-Link**는 이 격차를 해소하기 위한 완결형 웹 서비스입니다. 사용자가 링크(URL)만 입력하면, 서비스가 페이지 내용을 자동으로 수집·분석하여 이해하기 쉬운 단계별 안내문으로 변환해 줍니다. 이를 통해 사회적 약자의 디지털 정보 격차를 실질적으로 줄이고, 시니어 계층이 공공서비스에 동등하게 접근할 수 있는 기반을 마련하는 것을 목표로 합니다.

## Key Features

### 1. URL 기반 자동 파싱
사용자가 공공서비스 웹페이지의 링크를 입력하면, 백엔드가 해당 페이지에 접속해 불필요한 광고·내비게이션·스크립트를 제외한 핵심 안내 텍스트만 자동으로 추출합니다. 사용자는 복사·붙여넣기 없이 링크 하나만 입력하면 됩니다.

### 2. AI 기반 맞춤형 가이드 생성
추출된 텍스트는 OpenRouter API를 통해 LLM에 전달되어, 행정 용어와 복잡한 문장을 시니어가 이해하기 쉬운 일상어로 변환됩니다. 결과는 항상 **[1단계 → 2단계 → 3단계 행동 지침]** 형태로 재구조화되어, "무엇을, 어떻게, 어디서" 해야 하는지가 명확하게 전달됩니다.

### 3. 접근성 최적화 UI/UX
모든 화면은 고대비(high-contrast) 배색과 큰 폰트를 기본값으로 사용하여 시각적 피로도를 최소화합니다. 버튼과 입력 요소는 충분한 클릭 영역과 직관적인 레이블을 갖추어, 마우스/터치 조작이 서툰 사용자도 어려움 없이 이용할 수 있도록 설계합니다.

### 4. 음성 지원 연동 (TTS)
브라우저 내장 Web Speech API를 활용하여, 생성된 안내문을 음성으로 읽어주는 오디오 인터페이스를 제공합니다. 시각적으로 텍스트를 읽기 어려운 사용자도 안내 내용을 귀로 듣고 이해할 수 있습니다.

## Architecture & Tech Stack

Easy-Link는 프론트엔드와 백엔드가 분리된 구조로, 크롤링·AI 연동 등 무거운 처리는 백엔드가 전담하고 프론트엔드는 접근성 높은 UI 렌더링과 TTS 재생에 집중합니다.

```
[ 사용자 브라우저 ]
       │  1. 공공서비스 URL 입력
       ▼
[ Frontend: React + Vite + TypeScript ]
       │  2. POST /api/guide { url }
       ▼
[ Backend: Node.js + Express + TypeScript ]
       │  3. 웹페이지 크롤링 & 본문 텍스트 추출 (axios + cheerio)
       │  4. 구조화된 프롬프트로 OpenRouter API 호출
       ▼
[ OpenRouter API (LLM) ]
       │  5. 쉬운 말 + 1/2/3단계 JSON 응답
       ▼
[ Backend ] → [ Frontend ] → 고대비 UI 렌더링 + TTS(Web Speech API) 음성 안내
```

| 영역 | 기술 | 비고 |
| --- | --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS | 고대비/큰 폰트 디자인 시스템 |
| Backend | Node.js, Express, TypeScript | REST API 서버 |
| 크롤링 | axios, cheerio | 본문 텍스트 추출, 예외 처리 |
| AI 연동 | OpenRouter API | 모델 교체 용이, 통합 과금 |
| 음성 안내 | Web Speech API (브라우저 내장) | 별도 TTS 서버 불필요 |

## Getting Started

### 1. 저장소 클론
```bash
git clone https://github.com/rinni0628-spec/EasyLink.git
cd EasyLink
```

### 2. 백엔드 설정 및 실행
```bash
cd backend
npm install
cp .env.example .env   # OPENROUTER_API_KEY 등 값 입력
npm run dev             # http://localhost:4000
```

### 3. 프론트엔드 설정 및 실행
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

프론트엔드 개발 서버는 `/api` 요청을 백엔드(`http://localhost:4000`)로 프록시하도록 설정되어 있습니다. 브라우저에서 `http://localhost:5173`에 접속해 URL을 입력하면 바로 테스트할 수 있습니다.

### 4. (선택) 프론트엔드 + 백엔드 동시 실행
매번 터미널 두 개를 여는 대신, 저장소 루트에서 한 번에 띄울 수도 있습니다.
```bash
npm install              # 루트 devDependency(concurrently) 설치 (최초 1회)
npm run dev               # backend(:4000) + frontend(:5173)을 동시에 실행
```
백엔드가 응답하지 않으면 프론트엔드는 "안내문을 만드는 중 문제가 발생했어요"와 같은 일반 오류만 보여주므로, URL을 입력했는데 원인 모를 오류가 뜬다면 먼저 `http://localhost:4000/health`가 `{"status":"ok"}`를 반환하는지, `backend/.env`에 유효한 `OPENROUTER_API_KEY`가 들어 있는지부터 확인하세요.

## Expected Impact

- **사회적 가치 창출**: 디지털 소외계층인 시니어 계층의 공공서비스 접근성을 실질적으로 개선하여, 정보 격차 해소에 기여합니다.
- **재사용 가능한 접근성 패턴 확립**: 고대비 디자인, 단계형 안내 구조, TTS 연동 등 이 프로젝트에서 정립한 패턴은 이후 다른 시니어 대상 서비스에도 적용할 수 있는 참고 사례가 됩니다.
- **개발 역량 강화**: 웹 크롤링, LLM API 연동, 접근성(WCAG) 준수 UI 설계를 하나의 완결된 서비스로 구현하며 풀스택 개발 및 실전 문제 해결 역량을 키울 수 있습니다.
