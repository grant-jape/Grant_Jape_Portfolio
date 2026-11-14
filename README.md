# Grant Jape: Data Scientist Portfolio

**Data Scientist** specializing in **Predictive Modeling, Data Visualization, and ETL Pipelines** to drive **Marketing and Product Strategy**.

**Portfolio site:** [grant-jape.github.io/Grant_Jape_Portfolio](https://grant-jape.github.io/Grant_Jape_Portfolio/) · [LinkedIn](https://www.linkedin.com/in/grantjamesjape/) · [Email](mailto:grantjape@gmail.com)

## Projects

| Project | What it shows | Stack |
|---|---|---|
| [🩺 Medical Insurance Cost Prediction](projects/claims-model/) | Gradient Boosting model explaining ~87% of variance in insurance charges (R² 0.874, MAE ≈ $2k) | Python · scikit-learn · Matplotlib |
| [🚲 Marketing Mix Model for Bike Sales](projects/bike-sales-mmm/) | Adstock + saturation MMM (R² 0.731) turned into budget-allocation recommendations | Python · statsmodels · pandas |
| [🧾 Revenue & Customer Integrity Audit](projects/revenue-integrity-audit/) | PostgreSQL ETL into an analytics schema; audit found 244 oversold SKUs (1,969-unit deficit) | SQL · PostgreSQL |
| [📊 Superstore Performance Dashboard](projects/superstore-dashboard/) | Interactive Tableau dashboard of KPIs and sales vs. profitability | Tableau |

Each project folder has its own README, data, charts and a `run_analysis.py`. A GitHub Actions workflow re-runs each analysis when its files change and commits the refreshed charts.

## Repository layout

```
index.html, work/, assets/   The portfolio website (plain HTML/CSS/JS, no build step)
projects/
  claims-model/              Medical insurance cost prediction
  bike-sales-mmm/            Marketing mix modeling
  revenue-integrity-audit/   SQL ETL and data-quality audit
  superstore-dashboard/      Tableau dashboard write-up
.github/workflows/           One workflow per Python project + the site deploy
```

To preview the site locally: `python -m http.server 8000`, then open http://localhost:8000.

## Education

* **International Master in Data Science and Machine Learning** | Rome Business School (2024 – 2025)
* **Master in Statistics and Analytics** | Azusa Pacific University (2019 – 2021), Summa Cum Laude, GPA 3.8+
* **Bachelor in Communication** | Azusa Pacific University (2013 – 2017)
