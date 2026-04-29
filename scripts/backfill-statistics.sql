-- Backfill members.statistics from points_ledger
-- Run this script using wrangler D1 execute:
-- Local: npx wrangler d1 execute YOUR_DB_NAME --local --file=scripts/backfill-statistics.sql
-- Staging/Prod: npx wrangler d1 execute YOUR_DB_NAME --remote --file=scripts/backfill-statistics.sql

WITH member_stats AS (
    SELECT 
        pl.member_id, 
        c.name AS category_name, 
        COUNT(*) AS stat_count
    FROM points_ledger pl
    JOIN entity_categories ec ON 
        (pl.activity_id = ec.entity_id AND ec.entity_type = 'activity') OR 
        (pl.product_id = ec.entity_id AND ec.entity_type = 'product')
    JOIN categories c ON ec.category_id = c.category_id
    WHERE pl.activity_id IS NOT NULL OR pl.product_id IS NOT NULL
    GROUP BY pl.member_id, c.category_id
),
json_stats AS (
    SELECT 
        member_id,
        json_group_object(category_name, stat_count) AS stats_json
    FROM member_stats
    GROUP BY member_id
)
UPDATE members
SET statistics = (
    SELECT stats_json 
    FROM json_stats 
    WHERE json_stats.member_id = members.member_id
)
WHERE EXISTS (
    SELECT 1 
    FROM json_stats 
    WHERE json_stats.member_id = members.member_id
);
