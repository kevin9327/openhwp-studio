# 한국어 런칭 노트

## 한 줄 소개

OpenHWP Studio는 한글 설치 없이 브라우저에서 HWPX/HWP 문서를 열고, 구조를 확인하고, 필요한 텍스트를 고치고, 다른 형식으로 내보내는 로컬 우선 오픈소스 작업대입니다.

## 핵심 메시지

한국의 학교, 공공기관, 법무/노무/행정 조직, 회사에는 아직 HWP와 HWPX 문서가 많습니다. 하지만 많은 도구가 읽기 전용 뷰어에 머물거나, 개발자 중심이거나, 문서를 외부 서비스에 올려야 합니다.

OpenHWP Studio는 "완벽한 한글 대체제"를 바로 약속하지 않습니다. 대신 지금 필요한 실제 문제에 집중합니다.

- HWPX 문서의 본문을 로컬에서 열고 수정합니다.
- 원본 HWPX 패키지 구조를 가능한 한 보존하며 저장합니다.
- HWP 파일은 `rhwp` 기반 미리보기/변환 경로로 다룹니다.
- 문서 개요, 통계, 찾기/바꾸기, 간단한 품질 점검을 제공합니다.
- Markdown, HTML, TXT, JSON, HWPX, HWP 내보내기 흐름을 제공합니다.

## 추천 GitHub 설명

```text
Local-first browser workbench for opening, inspecting, editing, and converting Korean HWPX/HWP documents.
```

## 추천 저장소 토픽

```text
hwp, hwpx, hancom, hangul, korean, document-editor, document-conversion, wasm, local-first, rhwp
```

## README 첫 화면에 보여주면 좋은 문장

```text
OpenHWP Studio is an alpha local-first HWPX/HWP workbench for Korean document workflows. It focuses on HWPX inspection, safe paragraph editing, export, preview, and compatibility reporting.
```

```text
Status: alpha. HWPX paragraph editing is the current strongest path. HWP binary files are handled mainly through preview/conversion paths powered by rhwp.
```

## 한국어 런칭 글 초안

제목:

```text
한글 설치 없이 HWPX 문서를 열고 고치는 로컬 작업대, OpenHWP Studio를 공개합니다
```

본문:

```text
OpenHWP Studio는 브라우저에서 HWPX/HWP 문서를 다루는 오픈소스 작업대입니다.

지금은 알파 버전이며, 가장 안정적인 흐름은 HWPX 문서를 열어 본문 문단을 수정하고 원본 패키지 구조를 최대한 보존해 다시 저장하는 것입니다. HWP 바이너리 문서는 rhwp 엔진을 통해 미리보기와 변환 가능성을 확인하는 방향으로 다룹니다.

이 프로젝트가 지향하는 방향은 단순 뷰어가 아닙니다. 공공기관, 학교, 회사에서 실제로 부딪히는 HWPX 점검, 복구, 변환, diff, 품질 점검 문제를 로컬 우선 방식으로 해결하는 것이 목표입니다.

민감한 문서를 외부 서버에 올리지 않고 작업할 수 있는 HWPX 도구가 필요했다면, 저장소에 별을 눌러주시고 호환성 리포트나 공개 가능한 샘플 문서로 기여해 주세요.
```

## 소셜 포스트 짧은 버전

```text
OpenHWP Studio를 공개했습니다.

브라우저에서 HWPX/HWP 문서를 로컬로 열고, 본문을 고치고, 미리보고, TXT/HTML/Markdown/JSON/HWPX/HWP로 내보내는 오픈소스 작업대입니다.

아직 알파지만 목표는 분명합니다. 한국 HWPX 문서 업무를 위한 로컬 우선 호환성/복구/diff 도구가 되는 것.
```

## 공개 전 체크리스트

- README 상단에 알파 상태와 제한 사항을 명확히 적는다.
- `docs/COMPATIBILITY.md`를 README에서 연결한다.
- 스크린샷 2장 이상을 추가한다: 빈 작업대, 실제 HWPX 열람/편집 화면.
- 공개 가능한 샘플 HWPX 파일 2~3개를 준비한다.
- 첫 이슈를 직접 연다: compatibility, repair, sample docs, browser support.
- GitHub topics를 설정한다.
- 보안 문서에서 민감 문서 업로드 금지를 강조한다.
- 첫 릴리스 태그는 `v0.1.0-alpha.0`처럼 정직하게 붙인다.

## 좋은 첫 이슈 후보

- Chrome/Edge/Firefox/Safari에서 동일 샘플 HWPX 열기 결과 비교.
- 표가 포함된 공개 HWPX 문서 호환성 리포트.
- 이미지가 포함된 공개 HWPX 문서 호환성 리포트.
- HWPX 패키지 내부 파일 목록을 보여주는 inspector 패널.
- CDN 의존성을 로컬 vendor 파일로 고정.
- HWPX 저장 후 원본과 수정본의 section XML diff 표시.

## 하지 말아야 할 약속

- "한글을 완전히 대체합니다."
- "모든 HWP/HWPX 파일을 완벽하게 편집합니다."
- "100% 레이아웃 호환입니다."
- "민감 문서를 올려도 안전합니다."

## 대신 해도 좋은 약속

- "로컬 우선으로 문서를 다룹니다."
- "HWPX 구조를 확인하고 안전하게 개선하는 작업대가 됩니다."
- "호환성은 공개 샘플과 리포트로 투명하게 관리합니다."
- "지원하지 않는 기능은 숨기지 않고 문서화합니다."
