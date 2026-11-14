# Revenue & Customer Integrity Audit

The "CEO" of a digital media store needs to understand why revenue is fluctuating. The data is siloed across seven messy PostgreSQL tables with missing customer info, inconsistent formatting, and no clear view of revenue per customer.

**Case study:** [grantjape.com/work/revenue-integrity-audit.html](https://grantjape.com/work/revenue-integrity-audit.html)

## What's here

| File | What it does |
|---|---|
| `sql/01_schema.sql` | Creates an `analytics` schema, separate from the raw `public` tables |
| `sql/02_clean_tables.sql` | Builds clean `customers`, `products` and `sales` tables (casing, nulls, invalid ages, denormalized categories) |
| `sql/03_audit_checks.sql` | Data-quality audits: orphaned sales, negative revenue, inventory sync |
| `sql/04_analysis.sql` | Month-over-month revenue, top-1% customers with favorite category, top states by average order value |

Run the files in order against the source database.

## Key finding

Orphan and negative-revenue checks came back clean. The inventory reconciliation found **244 SKUs where units sold exceeded stock**, a combined deficit of **1,969 units**: the sales system allows overselling.

**Recommendation:** a two-tier control. (1) Flag low stock automatically when inventory falls below 10% of average weekly sales. (2) Block "Add to cart" when the inventory buffer can't cover the order, showing "Out of stock" or "Pre-order" instead.
