import { memo, useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Chip,
    IconButton,
    Tooltip,
    Paper,
    InputAdornment,
    SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useDebounce } from '@/hooks';
import StoreAutocomplete from './StoreAutocomplete';
import CategoryAutocomplete from './CategoryAutocomplete';

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterConfig {
    id: string;
    label: string;
    type: 'select' | 'multiselect';
    options: FilterOption[];
}

export interface SortOption {
    value: string;
    label: string;
}

interface SearchFilterBarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange: (value: string) => void;
    filters?: FilterConfig[];
    activeFilters?: Record<string, string | string[]>;
    onFilterChange?: (filters: Record<string, string | string[]>) => void;
    sortOptions?: SortOption[];
    sortValue?: string;
    onSortChange?: (sort: string) => void;
    onExport?: () => void;
    showExport?: boolean;
    // Custom filter options
    showStoreFilter?: boolean;
    storeFilterValue?: string;
    onStoreFilterChange?: (value: string) => void;
    showCategoryFilter?: boolean;
    categoryFilterValue?: string;
    categoryFilterStoreId?: string;
    onCategoryFilterChange?: (value: string) => void;
}

const SearchFilterBar = memo(({
    searchPlaceholder = 'Search...',
    searchValue = '',
    onSearchChange,
    filters = [],
    activeFilters = {},
    onFilterChange,
    sortOptions = [],
    sortValue = '',
    onSortChange,
    onExport,
    showExport = false,
    showStoreFilter = false,
    storeFilterValue = '',
    onStoreFilterChange,
    showCategoryFilter = false,
    categoryFilterValue = '',
    categoryFilterStoreId = '',
    onCategoryFilterChange,
}: SearchFilterBarProps) => {
    const [localSearch, setLocalSearch] = useState(searchValue);
    const debouncedSearch = useDebounce(localSearch, 300);

    // Trigger search callback when debounced value changes
    useEffect(() => {
        if (debouncedSearch !== searchValue) {
            onSearchChange(debouncedSearch);
        }
    }, [debouncedSearch, searchValue, onSearchChange]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearch(e.target.value);
    };

    const handleFilterChange = (filterId: string, value: string | string[]) => {
        if (onFilterChange) {
            onFilterChange({
                ...activeFilters,
                [filterId]: value,
            });
        }
    };

    const handleClearFilter = (filterId: string) => {
        if (onFilterChange) {
            const newFilters = { ...activeFilters };
            delete newFilters[filterId];
            onFilterChange(newFilters);
        }
    };

    const handleClearAll = () => {
        setLocalSearch('');
        onSearchChange('');
        if (onFilterChange) {
            onFilterChange({});
        }
        // Clear custom filters
        if (onStoreFilterChange) {
            onStoreFilterChange('');
        }
        if (onCategoryFilterChange) {
            onCategoryFilterChange('');
        }
    };

    const hasActiveFilters = Object.keys(activeFilters).length > 0 || localSearch || storeFilterValue || categoryFilterValue;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                mb: 2,
            }}
        >
            {/* Top Row - Search and Actions */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: filters.length > 0 ? 2 : 0,
                    flexWrap: 'wrap',
                }}
            >
                {/* Search */}
                <TextField
                    size="small"
                    placeholder={searchPlaceholder}
                    value={localSearch}
                    onChange={handleSearchChange}
                    sx={{
                        flex: { xs: '1 1 100%', sm: '1 1 300px' },
                        maxWidth: { sm: 400 },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: localSearch && (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setLocalSearch('');
                                        onSearchChange('');
                                    }}
                                >
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Sort */}
                {sortOptions.length > 0 && onSortChange && (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Sort by</InputLabel>
                        <Select
                            value={sortValue}
                            label="Sort by"
                            onChange={(e: SelectChangeEvent) => onSortChange(e.target.value)}
                        >
                            {sortOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* Export */}
                {showExport && onExport && (
                    <Tooltip title="Export">
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FileDownloadOutlinedIcon />}
                            onClick={onExport}
                        >
                            Export
                        </Button>
                    </Tooltip>
                )}

                {/* Clear All */}
                {hasActiveFilters && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={handleClearAll}
                        color="error"
                    >
                        Clear All
                    </Button>
                )}


                {/* Bottom Row - Filters */}
                {(filters.length > 0 || showStoreFilter || showCategoryFilter) && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        {(filters.length > 0 || showStoreFilter || showCategoryFilter) && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <FilterListIcon fontSize="small" color="action" />
                                <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                    Filters:
                                </Box>
                            </Box>
                        )}

                        {/* Standard select filters */}
                        {filters.map((filter) => (
                            <FormControl key={filter.id} size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>{filter.label}</InputLabel>
                                <Select
                                    multiple={filter.type === 'multiselect'}
                                    value={activeFilters[filter.id] || (filter.type === 'multiselect' ? [] : '')}
                                    label={filter.label}
                                    onChange={(e: SelectChangeEvent<string | string[]>) =>
                                        handleFilterChange(filter.id, e.target.value)
                                    }
                                >
                                    <MenuItem value="">
                                        <em>All</em>
                                    </MenuItem>
                                    {filter.options.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ))}

                        {/* Store filter */}
                        {showStoreFilter && onStoreFilterChange && (
                            <Box sx={{ minWidth: 200 }}>
                                <StoreAutocomplete
                                    value={storeFilterValue || null}
                                    onChange={(value) => onStoreFilterChange(typeof value === 'string' ? value : '')}
                                    label="Filter by Store"
                                    minimal
                                />
                            </Box>
                        )}

                        {/* Category filter */}
                        {showCategoryFilter && onCategoryFilterChange && (
                            <Tooltip title={!categoryFilterStoreId ? 'Select a store first' : ''}>
                                <Box sx={{ minWidth: 200 }}>
                                    <CategoryAutocomplete
                                        value={categoryFilterValue || null}
                                        onChange={(value) => onCategoryFilterChange(value || '')}
                                        storeId={categoryFilterStoreId}
                                        label="Filter by Parent"
                                        minimal
                                    />
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                )}
            </Box>
            {/* Active Filter Chips */}
            {Object.keys(activeFilters).length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                    {Object.entries(activeFilters).map(([filterId, value]) => {
                        const filter = filters.find((f) => f.id === filterId);
                        if (!filter || !value) return null;

                        const option = filter.options.find((o) => o.value === value);
                        if (!option) return null;

                        return (
                            <Chip
                                key={filterId}
                                label={`${filter.label}: ${option.label}`}
                                size="small"
                                onDelete={() => handleClearFilter(filterId)}
                                sx={{ fontSize: '0.75rem' }}
                            />
                        );
                    })}
                </Box>
            )}
        </Paper>
    );
});

SearchFilterBar.displayName = 'SearchFilterBar';

export default SearchFilterBar;
