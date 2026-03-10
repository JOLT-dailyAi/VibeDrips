# VibeDrips Data Pipeline Analysis Summary

This document summarizes the research and findings from the analysis of the product data processing pipeline.

## 1. Source Data: `products.csv`
- **Structure**: High-density CSV with numerous columns including Amazon-specific data (asin, Title, price, images, ratings).
- **Key Columns**:
    - `asin`: Primary identifier.
    - `Amazon marketplace domain`: Current source of false-positive errors.
    - `Product Source Link`: URL for video/social content.
    - `Amazon SiteStripe (Short)`: Affiliate links.
    - `Reference Media`: Multiple URLs (YT/TikTok) for regional/similar product mapping.

## 2. Processing Logic: `convert-csv.js`
- **Pass 1**: Identifies candidate categories by analyzing `Generic Name`, `Category`, and `itemTypeName` with a minimum frequency threshold of 2.
- **Pass 2**: 
    - **Validation**: Uses `validation-config.js` to cross-check price, original price, and discounts.
    - **Structuring**: Aggregates product details (Weight, Dimensions, etc.) into a structured `productDetails` array.
    - **Regional Mapping**: Uses shared `referenceMedia` URLs to link products across different currencies (e.g., AUD variant linked to INR variant).
    - **Drop Signals**: Computes tags like `creator-picks`, `global-drops`, and `viral-reels` based on influencer presence and media counts.

## 3. Validation Findings
- **100% Error Rate**: Most products are flagged with `Amazon marketplace domain` errors because the column name is not in the `METADATA_PATTERNS` whitelist, causing it to be processed as a generic field where the value "amazon" triggers a "metadata leak" warning.
- **Duplicate ASINs**: The CSV contains both `asin` and `ASIN` columns, causing redundancy warnings.
- **Discount Logic**: `validation-config.js` correctly flags mismatches between scraped discount percentages and computed values.

## 4. Frontend Integration
- **`product-loader.js`**:
    - Manage `DATA_VERSION` for cache busting.
    - Normalizes pricing display and category filtering.
- **`currency-loader.js`**:
    - Performs pre-flight checks (HEAD requests) to see which currency-specific JSON files exist before populating the UI.

## 5. Generated Manifests
- `currencies.json`: Summary of available markets and price ranges.
- `drops.json`: Curated categorization of products for the home feed.
- `influencers.json`: Aggregated stats and product lists per creator.
- `categories.json` / `brands.json`: Index files for filter navigation.
- `errors.json`: Quality gate report for identifying broken data.

---
*Findings generated on 2026-02-01*
