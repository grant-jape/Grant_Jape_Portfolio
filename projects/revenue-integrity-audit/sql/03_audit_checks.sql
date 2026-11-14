-- 1. Orphans: sales whose customer doesn't exist
SELECT *
FROM analytics.sales
WHERE customerid NOT IN (SELECT customerid FROM analytics.customers);

-- 2. Negative revenue
SELECT *
FROM analytics.sales
WHERE total_revenue < 0;

-- 3. Inventory sync: products that sold more units than are in stock
WITH sales_summary AS (
    SELECT
        prod_id,
        SUM(quantity) AS total_units_sold
    FROM analytics.sales
    GROUP BY prod_id
)
SELECT
    p.prod_id,
    p.title,
    i.quan_in_stock AS current_inventory,
    s.total_units_sold,
    (i.quan_in_stock - s.total_units_sold) AS inventory_buffer
FROM analytics.products p
JOIN public.inventory i ON p.prod_id = i.prod_id
LEFT JOIN sales_summary s ON p.prod_id = s.prod_id
WHERE (i.quan_in_stock - s.total_units_sold) < 0
ORDER BY inventory_buffer ASC;
-- Result: 244 SKUs with a negative buffer, a combined deficit of 1,969 units.
