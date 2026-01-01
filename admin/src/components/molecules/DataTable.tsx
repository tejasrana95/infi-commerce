import { memo, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  Stack,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import PermissionGuard from '../atoms/PermissionGuard';
import { useConfirm } from '@/contexts/ConfirmContext';

export interface Column {
  id: string;
  label: string;
  render?: (row: unknown) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  editPath?: string;
  idField?: string;
  dense?: boolean;
}

const DataTable = memo(({
  columns,
  data = [],
  onEdit,
  onDelete,
  editPath,
  idField = '_id',
  dense = true
}: DataTableProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { confirm } = useConfirm();

  // Ensure data is always an array
  const safeData = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const handleEdit = (row: any) => {
    if (onEdit) {
      onEdit(row[idField]);
    }
  };

  const handleDelete = async (row: any) => {
    if (onDelete && await confirm({ title: 'Delete Item', message: 'Are you sure you want to delete this item?', severity: 'error' })) {
      onDelete(row[idField]);
    }
  };

  // Mobile card view
  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {safeData.map((row, index) => (
          <Card key={row[idField] || index} variant="outlined">
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              {columns.map((column) => (
                <Box key={column.id} mb={0.75}>
                  <Typography variant="caption" color="text.secondary" display="block" fontSize="0.688rem">
                    {column.label}
                  </Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    {column.render ? column.render(row) : row[column.id]}
                  </Typography>
                </Box>
              ))}
              <Box display="flex" gap={0.5} mt={1}>
                {(onEdit || editPath) && (
                  editPath ? (
                    <IconButton
                      component={Link}
                      href={`${editPath}/${row[idField]}`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(row)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )
                )}
                <PermissionGuard deniedRoles={['store_admin']}>
                  {onDelete && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(row)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </PermissionGuard>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  // Desktop table view - compact and dense
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderRadius: 2,
        '& .MuiTable-root': {
          minWidth: 650,
        }
      }}
    >
      <Table size={dense ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                width={column.width}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.813rem',
                  py: 1.5,
                }}
              >
                {column.label}
              </TableCell>
            ))}
            {(onEdit || onDelete || editPath) && (
              <TableCell
                align="right"
                width={100}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.813rem',
                  py: 1.5,
                }}
              >
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {safeData.map((row, index) => (
            <TableRow
              key={row[idField] || index}
              hover
              sx={{
                '&:last-child td': { borderBottom: 0 },
              }}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    fontSize: '0.875rem',
                    py: 1.25,
                  }}
                >
                  {column.render ? column.render(row) : row[column.id]}
                </TableCell>
              ))}
              {(onEdit || onDelete || editPath) && (
                <TableCell
                  align="right"
                  sx={{ py: 1 }}
                >
                  <Box display="flex" gap={0.5} justifyContent="flex-end">
                    {(onEdit || editPath) && (
                      editPath ? (
                        <Tooltip title="Edit">
                          <IconButton
                            component={Link}
                            href={`${editPath}/${row[idField]}`}
                            size="small"
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(row)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    )}
                    <PermissionGuard deniedRoles={['store_admin']}>
                      {onDelete && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(row)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </PermissionGuard>
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable;
