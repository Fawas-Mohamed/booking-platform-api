export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/** Prisma skip/take derived from a validated page/limit pair. */
export function getPaginationOffsets({ page, limit }: PaginationParams): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * limit, take: limit };
}

/** Builds the standard { data, total, page, limit, totalPages } envelope. */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}
