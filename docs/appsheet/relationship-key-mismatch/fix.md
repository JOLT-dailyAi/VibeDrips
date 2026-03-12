# AppSheet Fix: Key vs. Reference Mismatch

This document explains the solution for when AppSheet relationships and de-references fail due to a mismatch between the **Primary Key** (stored in the parent) and the **Reference Value** (stored in the child).

## The Issue
In our `VibeDrips` app:
- **Parent Table (`Intake`)**: Primary Key is a unique string (`ID`) like `VD-260312-...`.
- **Child Table (`VibeDrips_Products`)**: Stores the **URL** (`link`) in the reference column instead of the `ID`.
- **Constraint**: The `ID` must remain the Primary Key, and the spreadsheet must keep the URLs.

### Why Standard Logic Failed
1. **`REF_ROWS`**: Expects the child table's column to contain the Parent's Key (`ID`). Since it contained a URL, the list was empty ("No items").
2. **De-referencing (`[Ref].[Column]`)**: Works by looking up the value in the `Ref` column against the Parent's PK. Since URL != ID, the lookup returned blank values.
3. **Type Mismatch**: AppSheet's `Url` type and `Text/Ref` types cannot be compared directly without conversion.

## The Solution: Formula-Based Linking
We bypassed the automatic "Ref" system by using manual search formulas that use the `URL` (common to both tables) to link the records.

### 1. Fix the "Related Products" List
In the **`Intake`** table, we replaced `REF_ROWS` with a `FILTER` formula that forces both sides to be treated as Text for comparison.

**Formula**:
```excel
FILTER("VibeDrips_Products", TEXT([Product Source Link]) = TEXT([_THISROW].[link]))
```

### 2. Fix the Empty Data Columns (De-references)
In the **`VibeDrips_Products`** table, we replaced `[Product Source Link].[Column]` style de-references with explicit `SELECT` lookups.

**Formula (for `caption`)**:
```excel
ANY(SELECT(Intake[caption], TEXT([link]) = TEXT([_THISROW].[Product Source Link])))
```

**Formula (for `original_content_owner`)**:
```excel
ANY(SELECT(Intake[original_content_owner], TEXT([link]) = TEXT([_THISROW].[Product Source Link])))
```

## Why this works
- **ANY(SELECT)**: Acts as a manual de-reference. It finds the specific row in the `Intake` table where the URLs match and pulls the requested column.
- **TEXT() conversion**: Ensures that the `Url` from the parent and the `Ref/Text` from the child are compared as standard strings, clearing the validation errors.
- **Constraint Respect**: This fix requires **zero changes** to your spreadsheet data or your table Keys.
