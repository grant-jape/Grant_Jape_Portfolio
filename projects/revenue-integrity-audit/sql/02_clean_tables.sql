-- customers: fix nulls, standardize geography, handle casing
CREATE TABLE analytics.customers AS
SELECT
    customerid,
    INITCAP(firstname) AS first_name,
    INITCAP(lastname)  AS last_name,
    UPPER(state)       AS state,
    COALESCE(phone, 'N/A') AS phone_number,
    CASE WHEN age BETWEEN 12 AND 110 THEN age ELSE NULL END AS age,
    income,
    gender
FROM public.customers;

-- products + categories: denormalize for easier reporting
CREATE TABLE analytics.products AS
SELECT
    p.prod_id,
    p.title,
    p.price,
    c.categoryname
FROM public.products p
LEFT JOIN public.categories c ON p.category = c.category;

-- orders + orderlines: a single source of truth for revenue (one row per order line)
CREATE TABLE analytics.sales AS
SELECT
    ol.orderlineid,
    o.orderid,
    o.orderdate,
    o.customerid,
    ol.prod_id,
    ol.quantity,
    p.price AS unit_price,
    (ol.quantity * p.price) AS total_revenue
FROM public.orderlines ol
JOIN public.orders   o ON ol.orderid = o.orderid
JOIN public.products p ON ol.prod_id = p.prod_id;
