# Classsheet Collection Indexes

## Overview

This document describes the recommended indexes for the `classsheet` collection in the `harati` database to optimize query performance.

**Collection Stats:**
- Total Documents: ~47,820
- Storage Size: ~17.46 MB
- Current Indexes: Only `_id_` (default)

## Query Patterns Analysis

Based on the `PresenceReport` component and `/api/presence/route.ts`, the following query patterns are commonly used:

1. **Filter by School + Class + Date**: Main presence report queries
2. **Filter by School + Teacher + Date**: Teacher-specific reports
3. **Filter by School + Student + Date**: Student-specific reports
4. **Filter by School + Course + Date**: Course-specific reports
5. **Filter by School + Multiple Classes**: Multi-class selection feature
6. **Filter by School + Presence Status**: Finding absent/late students
7. **Date Range Queries**: Reporting across date ranges

## Recommended Indexes

### 1. Primary Compound Index (Most Important)
```javascript
{ schoolCode: 1, classCode: 1, date: 1 }
```
**Purpose**: Optimizes the most common query pattern - fetching presence data for specific classes on specific dates
**Name**: `schoolCode_classCode_date_idx`
**Used By**: Daily presence reports, filtered by class and date

### 2. School + Class Index
```javascript
{ schoolCode: 1, classCode: 1 }
```
**Purpose**: Base index for class filtering without date specificity
**Name**: `schoolCode_classCode_idx`
**Used By**: Class-based queries, multi-class selection

### 3. Teacher Index
```javascript
{ schoolCode: 1, teacherCode: 1, date: 1 }
```
**Purpose**: Optimizes teacher-specific reports
**Name**: `schoolCode_teacherCode_date_idx`
**Used By**: Teacher dashboard, class reports filtered by teacher

### 4. Student Index
```javascript
{ schoolCode: 1, studentCode: 1, date: 1 }
```
**Purpose**: Optimizes student-specific queries
**Name**: `schoolCode_studentCode_date_idx`
**Used By**: Individual student reports, attendance history

### 5. Course Index
```javascript
{ schoolCode: 1, courseCode: 1, date: 1 }
```
**Purpose**: Optimizes course-specific reports
**Name**: `schoolCode_courseCode_date_idx`
**Used By**: Course-based attendance analysis

### 6. Date Range Index
```javascript
{ schoolCode: 1, date: 1 }
```
**Purpose**: Optimizes date range queries
**Name**: `schoolCode_date_idx`
**Used By**: Date range filters, monthly reports

### 7. Class + Date Index (For Multi-Class)
```javascript
{ classCode: 1, date: 1 }
```
**Purpose**: Optimizes the new multi-class selection feature
**Name**: `classCode_date_idx`
**Used By**: Multi-class queries with date filtering

### 8. Presence Status Index
```javascript
{ schoolCode: 1, presenceStatus: 1 }
```
**Purpose**: Quickly find absent/late students
**Name**: `schoolCode_presenceStatus_idx`
**Used By**: Absence reports, late student lists

### 9. Updated At Index
```javascript
{ updatedAt: -1 }
```
**Purpose**: Track recent changes, sort by modification time
**Name**: `updatedAt_desc_idx`
**Used By**: Change tracking, audit logs

### 10. Created At Index
```javascript
{ createdAt: -1 }
```
**Purpose**: Sort by creation time
**Name**: `createdAt_desc_idx`
**Used By**: Reporting, data analysis

## How to Apply These Indexes

### Method 1: Using the API Route (Recommended)

I've created an API route that will automatically create all these indexes:

```bash
# Make a GET request to the createIndex endpoint
# Replace 'harati' with your actual domain or use the x-domain header

curl -H "x-domain: harati" http://localhost:3000/api/classsheet/createIndex
```

Or visit in your browser (make sure you're authenticated):
```
http://localhost:3000/api/classsheet/createIndex?domain=harati
```

### Method 2: Using MongoDB Shell

Connect to your MongoDB instance and run:

```javascript
// Switch to the harati database
use harati

// Create each index
db.classsheet.createIndex({ schoolCode: 1, classCode: 1 }, { name: 'schoolCode_classCode_idx' })
db.classsheet.createIndex({ schoolCode: 1, classCode: 1, date: 1 }, { name: 'schoolCode_classCode_date_idx' })
db.classsheet.createIndex({ schoolCode: 1, teacherCode: 1, date: 1 }, { name: 'schoolCode_teacherCode_date_idx' })
db.classsheet.createIndex({ schoolCode: 1, studentCode: 1, date: 1 }, { name: 'schoolCode_studentCode_date_idx' })
db.classsheet.createIndex({ schoolCode: 1, courseCode: 1, date: 1 }, { name: 'schoolCode_courseCode_date_idx' })
db.classsheet.createIndex({ schoolCode: 1, date: 1 }, { name: 'schoolCode_date_idx' })
db.classsheet.createIndex({ updatedAt: -1 }, { name: 'updatedAt_desc_idx' })
db.classsheet.createIndex({ createdAt: -1 }, { name: 'createdAt_desc_idx' })
db.classsheet.createIndex({ schoolCode: 1, presenceStatus: 1 }, { name: 'schoolCode_presenceStatus_idx' })
db.classsheet.createIndex({ classCode: 1, date: 1 }, { name: 'classCode_date_idx' })

// Verify indexes were created
db.classsheet.getIndexes()
```

### Method 3: Using MongoDB Compass

1. Connect to your MongoDB instance
2. Navigate to the `harati` database
3. Select the `classsheet` collection
4. Go to the "Indexes" tab
5. Click "Create Index"
6. For each index above, enter the fields and click "Create"

## Expected Performance Improvements

**Before Indexing:**
- Queries: Full collection scan (47,820 documents examined)
- Query time: ~500-2000ms depending on query complexity

**After Indexing:**
- Queries: Index-only scans (10-100 documents examined)
- Query time: ~5-50ms for most queries

**Estimated Improvement**: 10-100x faster queries

## Index Maintenance

### Monitoring Index Usage

Check which indexes are being used:

```javascript
db.classsheet.aggregate([
  { $indexStats: {} }
])
```

### Dropping Unused Indexes

If an index is not being used, you can drop it to save space:

```javascript
db.classsheet.dropIndex('index_name')
```

### Rebuilding Indexes

If indexes become fragmented:

```javascript
db.classsheet.reIndex()
```

## Storage Impact

**Estimated Index Size**: ~5-10 MB (30-50% of collection size)
**Total Storage**: ~22-27 MB (collection + indexes)
**Impact**: Minimal - indexes will significantly improve query performance

## Notes

- All compound indexes follow the MongoDB best practice: start with equality fields, then add range/sort fields
- The `schoolCode` field is included in most indexes since it's always required for queries
- Index creation can take a few seconds on this collection size
- Indexes are automatically maintained as data is inserted/updated

## Verification

After creating indexes, verify they work by checking the query execution plan:

```javascript
db.classsheet.find({ 
  schoolCode: "95121357", 
  classCode: "2", 
  date: { $regex: "^2025-09-10" } 
}).explain("executionStats")
```

Look for `"stage" : "IXSCAN"` which indicates the index is being used.



