import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';

export interface Column {
  id: string;
  label: string;
  render?: (row: unknown) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  editPath?: string;
  idField?: string;
}

export default function DataTable({ 
  columns, 
  data = [], 
  onEdit, 
  onDelete,
  editPath,
  idField = '_id'
}: DataTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  const handleEdit = (row: any) => {
    if (onEdit) {
      onEdit(row[idField]);
    }
  };

  const handleDelete = (row: any) => {
    if (onDelete && confirm('Are you sure you want to delete this item?')) {
      onDelete(row[idField]);
    }
  };

  // Mobile card view
  if (isMobile) {
    return (
      <Stack spacing={2}>
        {safeData.map((row, index) => (
          <Card key={row[idField] || index}>
            <CardContent>
              {columns.map((column) => (
                <Box key={column.id} mb={1}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {column.label}
                  </Typography>
                  <Typography variant="body2">
                    {column.render ? column.render(row) : row[column.id]}
                  </Typography>
                </Box>
              ))}
              <Box display="flex" gap={1} mt={2}>
                {(onEdit || editPath) && (
                  editPath ? (
                    <Button
                      component={Link}
                      href={`${editPath}/${row[idField]}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(row)}
                    >
                      Edit
                    </Button>
                  )
                )}
                {onDelete && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(row)}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  // Desktop table view
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align || 'left'}>
                {column.label}
              </TableCell>
            ))}
            {(onEdit || onDelete || editPath) && (
              <TableCell align="right">Actions</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {safeData.map((row, index) => (
            <TableRow key={row[idField] || index} hover>
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align || 'left'}>
                  {column.render ? column.render(row) : row[column.id]}
                </TableCell>
              ))}
              {(onEdit || onDelete || editPath) && (
                <TableCell align="right">
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    {(onEdit || editPath) && (
                      editPath ? (
                        <Button
                          component={Link}
                          href={`${editPath}/${row[idField]}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<EditIcon />}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(row)}
                        >
                          Edit
                        </Button>
                      )
                    )}
                    {onDelete && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
