# AGENTS.md

## Supabase Database & Table Security Rules

앞으로 Supabase 데이터베이스 테이블을 생성하거나 수정하고, API를 통해 해당 테이블에 접근할 때는 아래 규칙을 **항상** 적용한다.

### 1. PostgREST Role 권한 부여 (`GRANT` SQL 필수)
- `anon`과 `authenticated` 역할(Role)이 PostgREST API를 통해 테이블에 접근할 수 있도록 명시적인 `GRANT` SQL 문을 반드시 포함한다. (`SELECT`, `INSERT`, `UPDATE`, `DELETE` 등 필요한 권한 명시)
- 시퀀스나 스키마 사용 권한이 필요한 경우 함께 부여한다.

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO anon, authenticated;
```

### 2. Row Level Security (RLS) 활성화 및 Policy 작성
- 테이블 생성 시 반드시 `ENABLE ROW LEVEL SECURITY`를 활성화한다.
- 기본적으로 인증된 유저(`authenticated`)만 데이터를 읽고 쓸 수 있도록 RLS Policy를 함께 작성한다.
- 유저 소유 데이터(예: `user_id = auth.uid()`)인 경우 `USING` / `WITH CHECK` 조건으로 본인 데이터 접근 제한까지 명시한다.

```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- 인증된 유저(authenticated)만 조회/생성/수정/삭제 가능
CREATE POLICY "Authenticated users can select"
  ON public.<table_name>
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert"
  ON public.<table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update"
  ON public.<table_name>
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete"
  ON public.<table_name>
  FOR DELETE
  TO authenticated
  USING (true);
```

> 참고: 사용자별 격리가 필요한 테이블(`user_id uuid REFERENCES auth.users(id)`)은 `USING (auth.uid() = user_id)` 및 `WITH CHECK (auth.uid() = user_id)`를 적용한다.
