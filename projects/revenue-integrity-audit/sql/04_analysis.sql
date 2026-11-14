-- Task 1: month-over-month revenue and % change
WITH monthly_revenue AS (
    SELECT
        DATE_TRUNC('month', orderdate) AS revenue_month,
        SUM(total_revenue)             AS current_month_revenue
    FROM analytics.sales
    GROUP BY 1
)
SELECT
    TO_CHAR(revenue_month, 'YYYY-MM') AS revenue_month,
    ROUND(current_month_revenue, 2)   AS revenue,
    ROUND(LAG(current_month_revenue) OVER (ORDER BY revenue_month), 2) AS prev_month_revenue,
    ROUND(
        (current_month_revenue - LAG(current_month_revenue) OVER (ORDER BY revenue_month))
        / NULLIF(LAG(current_month_revenue) OVER (ORDER BY revenue_month), 0) * 100,
        2
    ) AS mom_percentage_change
FROM monthly_revenue
ORDER BY revenue_month ASC;

-- Task 2: top 1% of customers by lifetime spend, with their favorite category
WITH customer_spend AS (
    SELECT customerid, SUM(total_revenue) AS lifetime_value
    FROM analytics.sales
    GROUP BY 1
),
category_preferences AS (
    SELECT
        s.customerid,
        p.categoryname,
        SUM(s.quantity) AS units_bought,
        ROW_NUMBER() OVER (PARTITION BY s.customerid ORDER BY SUM(s.quantity) DESC) AS category_rank
    FROM analytics.sales s
    JOIN analytics.products p ON s.prod_id = p.prod_id
    GROUP BY 1, 2
),
top_customers AS (
    SELECT
        cs.customerid,
        cs.lifetime_value,
        PERCENT_RANK() OVER (ORDER BY cs.lifetime_value DESC) AS spend_percentile
    FROM customer_spend cs
)
SELECT
    tc.customerid,
    c.first_name,
    c.last_name,
    ROUND(tc.lifetime_value::numeric, 2) AS total_spent,
    cp.categoryname AS favorite_category
FROM top_customers tc
JOIN analytics.customers c       ON tc.customerid = c.customerid
JOIN category_preferences cp     ON tc.customerid = cp.customerid
WHERE tc.spend_percentile <= 0.01
  AND cp.category_rank = 1
ORDER BY tc.lifetime_value DESC;

-- Task 3: the 5 states with the highest average order value (min. 10 orders)
SELECT
    c.state,
    ROUND(SUM(s.total_revenue)::numeric, 2) AS total_state_revenue,
    COUNT(DISTINCT s.orderid)               AS total_orders,
    ROUND((SUM(s.total_revenue) / COUNT(DISTINCT s.orderid))::numeric, 2) AS average_order_value
FROM analytics.sales s
JOIN analytics.customers c ON s.customerid = c.customerid
GROUP BY 1
HAVING COUNT(DISTINCT s.orderid) > 10
ORDER BY average_order_value DESC
LIMIT 5;
