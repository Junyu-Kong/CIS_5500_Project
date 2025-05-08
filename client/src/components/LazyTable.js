// src/components/LazyTable.js
import { useEffect, useState, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow
} from '@mui/material';

export default function LazyTable({
  route,
  columns,
  defaultPageSize,
  rowsPerPageOptions
}) {
  const [data, setData] = useState([]);

  const [page, setPage] = useState(1); // 1‐indexed
  const [pageSize, setPageSize] = useState(defaultPageSize ?? 10);

  // cache entire blocks of 10 pages each
  const cacheRef = useRef({});

  useEffect(() => {
    cacheRef.current = {};
    setPage(1);
  }, [route]);

  useEffect(() => {
    const CHUNK = 10;
    const chunkSize    = pageSize * CHUNK;
    const chunkIndex   = Math.floor((page - 1) / CHUNK);
    const chunkPage    = chunkIndex + 1; // for back‐end paging
    const cacheKey     = `${route}|${chunkSize}|${chunkPage}`;

    // if block is cached, slice out current page
    if (cacheRef.current[cacheKey]) {
      const block = cacheRef.current[cacheKey];
      const start = ((page - 1) % CHUNK) * pageSize;
      setData(block.slice(start, start + pageSize));
      return;
    }

    // not cached: fetch the entire chunk at once
    (async () => {
      const sep      = route.includes('?') ? '&' : '?';
      const fetchUrl = `${route}${sep}page=${chunkPage}&page_size=${chunkSize}`;
      try {
        const res = await fetch(fetchUrl);
        const json = await res.json();
        // store block
        cacheRef.current[cacheKey] = Array.isArray(json) ? json : [];
        // slice out current page
        const block = cacheRef.current[cacheKey];
        const start = ((page - 1) % CHUNK) * pageSize;
        setData(block.slice(start, start + pageSize));
      } catch (err) {
        console.error('LazyTable chunk fetch error:', err);
      }
    })();
  }, [route, page, pageSize]);

  const handleChangePage = (_, newPage) => {
    if (newPage + 1 < page || data.length === pageSize) {
      setPage(newPage + 1);
    }
  };

  const handleChangePageSize = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setPage(1);
  };

  const defaultRenderCell = (col, row) => <div>{row[col.field]}</div>;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col.headerName}>
                {col.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map(col => (
                <TableCell key={col.headerName}>
                  {col.renderCell
                    ? col.renderCell(row)
                    : defaultRenderCell(col, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions ?? [5, 10, 25]}
          count={-1}
          rowsPerPage={pageSize}
          page={page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangePageSize}
        />
      </Table>
    </TableContainer>
  );
}
