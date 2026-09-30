# 방명록 글 저장소로 Neon Postgres 사용

방명록 글은 Neon 서버리스 Postgres(`@neondatabase/serverless`, `DATABASE_URL`)에 저장한다. 로컬 JSON/SQLite 파일은 설정이 더 간단하지만 서버리스 배포 환경에서는 파일 시스템이 휘발되어 글이 사라지기 때문에 택하지 않았다.
