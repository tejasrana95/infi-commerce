import { memo } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

type SearchFieldProps = Omit<TextFieldProps, 'variant'> & {
    variant?: 'outlined' | 'filled' | 'standard';
};

const SearchField = memo((props: SearchFieldProps) => {
    return (
        <TextField
            {...props}
            variant={props.variant || 'outlined'}
            size="small"
            placeholder={props.placeholder || 'Search...'}
            sx={{
                minWidth: { xs: '100%', sm: 250 },
                '& .MuiOutlinedInput-root': {
                    height: 36,
                },
                ...props.sx,
            }}
        />
    );
});

SearchField.displayName = 'SearchField';

export default SearchField;
