import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

interface QueryFilter {
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  context: { params: { collection: string } }
) {
  /* ────────────────── fix: unwrap async params ────────────────── */
  const { collection: collectionName } = await context.params;

  try {
    /* ─────────── headers & meta ─────────── */
    const domain =
      request.headers.get("x-domain") ?? "localhost:3000";
    logger.info(
      `Fetching dropdown options from collection ${collectionName}`,
      { domain }
    );

    /* ─────────── query-string helpers ─────────── */
    const searchParams = request.nextUrl.searchParams;
    const labelField  = searchParams.get("labelField")  ?? "_id";
    const labelField2 = searchParams.get("labelField2");
    const labelField3 = searchParams.get("labelField3");
    const valueField  = searchParams.get("valueField")  ?? "_id";
    const filterQuery = searchParams.get("filterQuery");
    const sortField   = searchParams.get("sortField");
    const sortOrder   = searchParams.get("sortOrder");
    const limit       = searchParams.get("limit");
    const customLabel = searchParams.get("customLabel");
    const searchQuery = searchParams.get("query");

    const connectionString = searchParams.get("connectionString");
    const connectionDomain = connectionString ? connectionString : domain;

    try {
      /* ─────────── DB connection ─────────── */
      const db = await connectToDatabase(connectionDomain);
      const collection = db.collection(collectionName);
      logger.info(
        `Connected to collection ${collectionName}`,
        { domain: connectionDomain }
      );

      /* ─────────── build Mongo query ─────────── */
      let query: QueryFilter = {};
      if (filterQuery) {
        try {
          const parsed = JSON.parse(filterQuery) as Record<string, unknown>;
          query = Object.entries(parsed).reduce((acc, [k, v]) => {
            acc[`data.${k}`] = v;
            return acc;
          }, {} as QueryFilter);
          logger.debug("Applied filter query", { query, domain: connectionDomain });
        } catch (e) {
          logger.error("Failed to parse filter query", { error: e, domain: connectionDomain });
          return NextResponse.json(
            { error: "Invalid filter query format", details: e instanceof Error ? e.message : String(e) },
            { status: 400 }
          );
        }
      }

      /* optional text search */
      if (searchQuery?.trim()) {
        const regex = new RegExp(
          searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
          "i"
        );
        const or: QueryFilter[] = [
          { [`data.${labelField}`]: regex },
          ...(labelField2 ? [{ [`data.${labelField2}`]: regex }] : []),
          ...(labelField3 ? [{ [`data.${labelField3}`]: regex }] : []),
        ];
        or.length > 1
          ? ((query as any).$or = or)
          : (query[`data.${labelField}`] = regex);

        logger.debug(`Added text search for "${searchQuery}"`, {
          searchFields: [labelField, labelField2, labelField3].filter(Boolean),
          domain: connectionDomain,
        });
      }

      /* sort, projection, limit */
      const sort: Record<string, 1 | -1> = {};
      if (sortField) sort[`data.${sortField}`] = sortOrder === "desc" ? -1 : 1;

      const projection: Record<string, 1> = { _id: 1 };
      const fields = new Set<string>();

      if (customLabel) {
        const matches = customLabel.match(/\{([^}]+)\}/g) ?? [];
        matches.forEach((m) => fields.add(m.slice(1, -1)));
      } else {
        [labelField, labelField2, labelField3].filter(Boolean).forEach((f) => fields.add(f!));
      }
      fields.add(valueField);
      fields.forEach((f) => {
        if (f !== "_id") projection[`data.${f}`] = 1;
      });

      const limitNum = limit ? parseInt(limit) : 100;

      /* ─────────── query MongoDB ─────────── */
      let documents;
      try {
        documents = await collection
          .find(query)
          .project(projection)
          .sort(sort)
          .limit(limitNum)
          .toArray();

        logger.info(
          `Found ${documents.length} documents in ${collectionName}`,
          { domain: connectionDomain }
        );
      } catch (e) {
        logger.error("Database query failed", { error: e, domain: connectionDomain });
        return NextResponse.json(
          { error: "Failed to fetch data from database", details: e instanceof Error ? e.message : String(e) },
          { status: 500 }
        );
      }

      /* ─────────── transform to dropdown options ─────────── */
      try {
        const options = documents.map((doc) => {
          const getValue = (field: string): string => {
            if (field === "_id") return String(doc._id);
            const data = doc.data;
            if (!data) return "";
            const v = data instanceof Map ? data.get(field) : (data as any)[field];
            return v !== undefined ? String(v) : "";
          };

          const buildLabel = (): string => {
            if (customLabel) {
              return customLabel.replace(/\{([^}]+)\}/g, (_, f) => getValue(f));
            }
            let l = getValue(labelField);
            if (labelField2) l = `${l} - ${getValue(labelField2)}`;
            if (labelField3) l = `${l} - ${getValue(labelField3)}`;
            return l;
          };

          return { label: buildLabel(), value: getValue(valueField) };
        });

        logger.info(
          `Transformed ${options.length} options from ${collectionName}`,
          { domain: connectionDomain }
        );
        return NextResponse.json(options);
      } catch (e) {
        logger.error("Failed to transform documents to options", { error: e, domain: connectionDomain });
        return NextResponse.json(
          { error: "Failed to process database results", details: e instanceof Error ? e.message : String(e) },
          { status: 500 }
        );
      }
    } catch (dbError) {
      logger.error("Database connection or query error", { error: dbError, domain: connectionDomain });
      return NextResponse.json(
        { error: "Failed to connect to database", details: dbError instanceof Error ? dbError.message : String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Unexpected error in dropdown options route", { error });
    return NextResponse.json(
      {
        error: "Failed to fetch dropdown options",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
