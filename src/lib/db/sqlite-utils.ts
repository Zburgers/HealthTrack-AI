/**
 * SQLite query building utilities
 */

/**
 * Build WHERE clause for SQLite queries from MongoDB-like filter objects
 
export function buildWhereClause(filter: any): { whereClause: string; values: any[] } {
  if (!filter || Object.keys(filter).length === 0) {
    return { whereClause: '', values: [] };
  }

  const conditions: string[] = [];
  const values: any[] = [];

  for (const key in filter) {
    const value = filter[key];
    if (key === '$or') {
      const orConditions = value.map((orFilter: any) => {
        const { whereClause } = buildWhereClause(orFilter);
        // remove "WHERE" from sub-clause
        return `(${whereClause.replace(/^WHERE\s/, '')})`;
      }).join(' OR ');
      conditions.push(`(${orConditions})`);
    } else if (typeof value === 'object' && value !== null) {
      if (value.$ne !== undefined) {
        conditions.push(`${key} != ?`);
        values.push(value.$ne);
      } else if (value.$exists !== undefined) {
        if (value.$exists) {
          conditions.push(`${key} IS NOT NULL`);
        } else {
          conditions.push(`${key} IS NULL`);
        }
      } else if (value.$in) {
        const placeholders = value.$in.map(() => '?').join(',');
        conditions.push(`${key} IN (${placeholders})`);
        values.push(...value.$in);
      }
    } else {
      conditions.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

*/