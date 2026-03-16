import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  // 1. old_faqs 데이터 확인
  const oldFaqs = await client.execute('SELECT * FROM old_faqs');
  console.log(`old_faqs: ${oldFaqs.rows.length}건`);

  const oldNotices = await client.execute('SELECT * FROM old_notices');
  console.log(`old_notices: ${oldNotices.rows.length}건`);

  // 2. 기존 faqs 테이블 데이터 확인
  const existingFaqs = await client.execute('SELECT * FROM faqs');
  console.log(`faqs (기존): ${existingFaqs.rows.length}건`);

  const existingNotices = await client.execute('SELECT * FROM notices');
  console.log(`notices (기존): ${existingNotices.rows.length}건`);

  // 3. old_faqs → faqs 마이그레이션
  for (const row of oldFaqs.rows) {
    // TEXT timestamp → unixepoch INTEGER 변환
    const createdAtUnix = row.created_at
      ? Math.floor(new Date(row.created_at + 'Z').getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const updatedAtUnix = row.updated_at
      ? Math.floor(new Date(row.updated_at + 'Z').getTime() / 1000)
      : createdAtUnix;

    await client.execute({
      sql: `INSERT INTO faqs (question, answer, sort_order, author_id, author_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.question || '',
        row.answer || '',
        row.sort_order ?? 0,
        String(row.created_by ?? 'unknown'),
        'migrated_user',
        createdAtUnix,
        updatedAtUnix,
      ],
    });
    console.log(`  FAQ migrated: "${String(row.question).substring(0, 40)}..."`);
  }

  // 4. old_notices → notices 마이그레이션 (0건이지만 코드 준비)
  for (const row of oldNotices.rows) {
    const createdAtUnix = row.created_at
      ? Math.floor(new Date(row.created_at + 'Z').getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const updatedAtUnix = row.updated_at
      ? Math.floor(new Date(row.updated_at + 'Z').getTime() / 1000)
      : createdAtUnix;

    await client.execute({
      sql: `INSERT INTO notices (org_id, title, content, is_pinned, author_id, author_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'migrated',
        row.title || '',
        row.content || '',
        row.is_pinned ? 1 : 0,
        String(row.created_by ?? 'unknown'),
        'migrated_user',
        createdAtUnix,
        updatedAtUnix,
      ],
    });
    console.log(`  Notice migrated: "${String(row.title).substring(0, 40)}..."`);
  }

  // 5. 마이그레이션 결과 확인
  const newFaqsCount = await client.execute('SELECT COUNT(*) as cnt FROM faqs');
  console.log(`\nfaqs 최종: ${newFaqsCount.rows[0].cnt}건`);
  const newNoticesCount = await client.execute('SELECT COUNT(*) as cnt FROM notices');
  console.log(`notices 최종: ${newNoticesCount.rows[0].cnt}건`);

  // 6. old 테이블 삭제
  await client.execute('DROP TABLE old_faqs');
  console.log('old_faqs 테이블 삭제 완료');

  await client.execute('DROP TABLE old_notices');
  console.log('old_notices 테이블 삭제 완료');

  // 7. 삭제 확인
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\n남은 테이블:', tables.rows.map(r => r.name));

  console.log('\n마이그레이션 완료!');
}

main().catch(console.error);
