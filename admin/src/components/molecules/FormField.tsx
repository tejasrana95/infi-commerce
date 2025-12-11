import { TextField, TextFieldProps } from '@mui/material';

type FormFieldProps = TextFieldProps;

export default function FormField(props: FormFieldProps) {
  return (
    <TextField
      fullWidth
      variant="outlined"
      {...props}
    />
  );
}
