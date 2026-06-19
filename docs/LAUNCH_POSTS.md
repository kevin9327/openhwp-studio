# Launch Posts

Use these posts to bring the first real users to OpenHWP Studio. The goal is not hype; the goal is to find Korean HWPX/HWP users who can try the demo, star the repo, and report compatibility gaps.

## Korean Short Post

```text
한컴 설치 없이 브라우저에서 HWPX/HWP 문서를 열고, 검사하고, 고치고, 변환하는 오픈소스 작업대 OpenHWP Studio를 공개했습니다.

- 로컬 우선: 문서를 서버로 올리지 않음
- HWPX 문단/표 셀 편집
- 패키지 닥터: manifest, media, section, repair plan 검사
- broken HWPX 샘플에서 안전한 자동 복구본 다운로드
- 공개 synthetic HWPX fixture 3개와 CI 검증

Demo: https://kevin9327.github.io/openhwp-studio/
GitHub: https://github.com/kevin9327/openhwp-studio

한국 HWPX 문서 도구가 필요하다고 느꼈다면 star로 신호를 주세요. 공개 가능한 샘플/호환성 리포트도 큰 도움이 됩니다.
```

## Korean Community Post

```text
제목: 한컴 설치 없이 HWPX 문서를 열고 검사/복구하는 로컬 우선 웹앱을 만들고 있습니다

OpenHWP Studio라는 오픈소스 HWPX/HWP 작업대를 공개했습니다.

아직 알파라 "한글 완전 대체" 같은 약속은 하지 않습니다. 대신 실제로 자주 필요한 흐름부터 잡고 있습니다.

1. 브라우저에서 로컬 HWPX 열기
2. 본문 문단과 기존 표 셀 텍스트 편집
3. 원본 HWPX ZIP 구조를 가능한 보존하며 저장
4. 저장 후 라운드트립 검증 리포트 생성
5. 패키지 닥터로 section/style/manifest/media/repair plan 확인
6. 누락된 mimetype 같은 안전한 케이스는 repaired HWPX 다운로드

공개 demo에 basic, media/BinData, broken-relationship 샘플을 넣어놨습니다.

Demo: https://kevin9327.github.io/openhwp-studio/
GitHub: https://github.com/kevin9327/openhwp-studio

HWPX/HWP 업무를 해본 분들이 실제 파일 구조, 호환성, 복구 케이스를 알려주면 큰 도움이 됩니다. 필요하다고 생각되면 repo에 star도 부탁드립니다.
```

## English Post

```text
I released OpenHWP Studio, an alpha local-first browser workbench for Korean HWPX/HWP documents.

It is not a full Hancom Office replacement. The current focus is inspectable, safe HWPX workflows:

- Open local HWPX packages in the browser
- Edit paragraph and existing table-cell text
- Preserve source package structure on export
- Verify round-trip text changes
- Inspect ZIP entries, manifest targets, media references, sections, tables, and repair plans
- Download a repaired HWPX for safe metadata-only fixes such as missing mimetype
- Test with public synthetic fixtures in CI

Demo: https://kevin9327.github.io/openhwp-studio/
GitHub: https://github.com/kevin9327/openhwp-studio

If you work with Korean HWPX/HWP documents, feedback and compatibility reports would help a lot.
```

## Hacker News / Reddit Title Ideas

```text
Show HN: OpenHWP Studio - local-first browser workbench for Korean HWPX/HWP documents
OpenHWP Studio: inspect, edit, repair, and export Korean HWPX files in the browser
I built a local-first browser tool for Korean HWPX document inspection and repair
```

## Direct Message To Potential Testers

```text
I am building OpenHWP Studio, an open-source local-first HWPX/HWP browser workbench.

It can open sample HWPX files, inspect package structure, edit paragraph/table-cell text, export with verification, and repair safe metadata issues.

Could you try the demo and tell me whether this direction would help your HWPX workflow?

Demo: https://kevin9327.github.io/openhwp-studio/
GitHub: https://github.com/kevin9327/openhwp-studio
```

## First-Hour Checklist

- Post the Korean short post to one developer community.
- Post the English post to one open-source or document-format community.
- Send the direct message to 5 people who have dealt with HWPX/HWP documents.
- Use the live demo's `Share` button when sending quick messages from a phone or browser.
- Ask testers to click the live demo first, then star the GitHub repo if the direction is useful.
- Ask for one compatibility report using a public or synthetic sample.

## Where To Post First

Use neutral, feedback-oriented language in public communities. Do not ask for upvotes. On Hacker News, submit the original source and let people vote naturally.

| Channel | URL | Suggested angle |
| --- | --- | --- |
| Hacker News Submit | https://news.ycombinator.com/submit | `Show HN: OpenHWP Studio - local-first browser workbench for Korean HWPX/HWP documents` |
| Reddit r/rust | https://www.reddit.com/r/rust/ | Mention the `rhwp`/WASM angle and ask for parser/workflow feedback. |
| Reddit r/korea | https://www.reddit.com/r/korea/ | Focus on the Korean HWP/HWPX document pain, not implementation details. |
| Korean developer groups list | https://github.com/ragingwind/awesome-korean-developer-groups | Pick one group where document tooling or web apps are on-topic. |
| Awesome Korean FOSS | https://github.com/darjeeling/awesome-kr-foss | Submit later, after a few external users confirm the demo works. |

## Posting Rules

- Ask for feedback, compatibility reports, and public/synthetic samples.
- Do not ask for upvotes in communities where that violates norms.
- Put the star ask on the project page and README, not as the main public-post call to action.
- Reply to comments manually and honestly. Do not paste generic AI replies.
