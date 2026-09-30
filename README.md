# 방명록

이름, 메시지, 작성 시각이 쌓이는 미니 방명록. 회원가입·로그인 없이, 글을 쓸 때 정한 글 비밀번호로 자기 글만 수정·삭제한다.

- 스펙: [docs/specs/0001-guestbook.md](docs/specs/0001-guestbook.md)
- 용어: [GLOSSARY.md](GLOSSARY.md)
- 결정 기록: [docs/adr/](docs/adr/)

## 준비

`.env.local`에 Neon 연결 문자열을 둔다.

```
DATABASE_URL=postgres://...          # 앱이 쓰는 DB
TEST_DATABASE_URL=postgres://...     # E2E 테스트 전용 Neon 브랜치 (DATABASE_URL과 달라야 함)
```

```bash
npm install
npm run db:setup   # 스키마 적용 (여러 번 실행해도 안전)
npm run dev        # http://localhost:3000
```

## E2E 테스트

실제 브라우저(설치된 Chrome)로 방명록 페이지를 조작해 작성·조회·수정·삭제와 입력 규칙을 검증한다. 테스트는 DB에 실제로 쓰므로 `TEST_DATABASE_URL`을 대상으로 돌며, 스키마 적용과 앱 실행(포트 3123)까지 알아서 한다.

```bash
npm run test:e2e
```

- `TEST_DATABASE_URL`이 없거나 `DATABASE_URL`과 같으면 실행을 거부한다.
- 부득이하게 운영 DB로 돌려야 할 때만, 그 실행에 한해 `E2E_ALLOW_PRODUCTION_DB=1`을 설정한다(PowerShell: `$env:E2E_ALLOW_PRODUCTION_DB=1; npm run test:e2e`). 테스트는 고유 태그가 붙은 자기 글만 만들고 끝나면 UI로 지운다.
- Chrome 대신 Playwright 번들 브라우저를 쓰려면 `npx playwright install chromium` 후 설정의 `channel`을 지운다.
